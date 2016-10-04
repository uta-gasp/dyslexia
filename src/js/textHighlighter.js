(function (app) { 'use strict';

    // Text highlighting propagation routine
    // Constructor arguments:
    //      options: {
    //          root:         - selector for the element that contains text for reading
    //          minReadingDuration  - minimum fixation duration to consider the word has been read (ms)
    //      }
    function TextHighlighter(options) {

        this.root = options.root || document.documentElement;
        this.minReadingDuration = options.minReadingDuration || 200;
        this.split();

        this._timer = null;
        this._currentWordMinReadingDuration = this.minReadingDuration;
        this._canPropagate = true;
    }

    // Splits the text nodes into words, each in its own span.word element
    TextHighlighter.prototype.split = function () {

        var re = /[^\s]+/gi;

        var nodeIterator = document.createNodeIterator(
            document.querySelector( this.root ),
            NodeFilter.SHOW_TEXT,
            { acceptNode: function(node) {
                if ( ! /^\s*$/.test(node.data) ) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            }}
        );

        // Show the content of every non-empty text node that is a child of root
        var node;
        var docFrags = [];

        while ((node = nodeIterator.nextNode())) {

            var word;
            var index = 0;
            var docFrag = document.createDocumentFragment();
            
            while ((word = re.exec( node.textContent )) !== null) {

                if (index < word.index) {
                    var space = document.createTextNode( node.textContent.substring( index, word.index ) );
                    docFrag.appendChild( space );
                }

                var span = document.createElement( 'span' );
                span.classList.add( 'word' );
                span.textContent = word[ 0 ];
                docFrag.appendChild( span );

                index = re.lastIndex;
            }

            docFrags.push( { 
                node: node,
                docFrag: docFrag 
            });
        }

        docFrags.forEach( function (item) {
            item.node.parentNode.replaceChild( item.docFrag, item.node );
        });
    };

    // Resets the highlighting 
    TextHighlighter.prototype.reset = function () {

        var currentWord = document.querySelector( '.currentWord' );
        if (currentWord) {
            currentWord.classList.remove( 'currentWord' );
        }
    };

    // Sets the first word highlighted 
    TextHighlighter.prototype.init = function () {

        this.reset();

        var firstWord = document.querySelector( '.word:first-child' );
        if (firstWord) {
            firstWord.classList.add( 'currentWord' );
            this._currentWordMinReadingDuration = getWordMinReadingDuration( firstWord, this.minReadingDuration);
        }

        this._canPropagate = false;
    };

    // Propagates the highlighing if the focused word is the next after the current
    // Arguments:
    //        word:         - the focused word 
    TextHighlighter.prototype.checkFocusedWord = function (word) {

        var currentWord;

        if (this._canPropagate) {
            var nextWord = document.querySelector( '.currentWord + span' );
            if (nextWord === word) {
                currentWord = document.querySelector( '.currentWord' );
                currentWord.classList.remove( 'currentWord' );
                word.classList.add( 'currentWord' );

                this._currentWordMinReadingDuration = getWordMinReadingDuration( word, this.minReadingDuration);
                startReadingCurrentWord( this );
            }
        }
        else {
            currentWord = document.querySelector( '.currentWord' );
            if (currentWord === word) {
                startReadingCurrentWord( this );
            }
        }
    };

    // Catches events when the current word was left not being read long enough
    // Arguments:
    //        word:         - the word left by gaze
    TextHighlighter.prototype.checkLeftWord = function (word) {

        if (!this._canPropagate) {
            var currentWord = document.querySelector( '.currentWord' );
            if (currentWord === word) {
                if (this._timer) {
                    clearTimeout( this._timer );
                    this._timer = null;
                }
            }
        }
    };

    // private

    // word min reading duration estimation parameters
    var wordLengthFactor = 0.15;
    var power = 3;
    var pausePerChar = 50;

    function startReadingCurrentWord ( self ) {

        self._canPropagate = false;
        self._timer = setTimeout( function () {
            self._timer = null;
            self._canPropagate = true;
        }, self._currentWordMinReadingDuration);
    }

    function getWordMinReadingDuration( word, minReadingDuration) {

        var length = word.textContent.length;
        var duration = Math.pow( wordLengthFactor * length, power) * pausePerChar;
        return duration;
    }

    app.TextHighlighter = TextHighlighter;
    
})( Dyslexia || window );
