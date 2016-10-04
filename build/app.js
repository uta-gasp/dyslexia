// Project namespace

var Dyslexia = Dyslexia || {};


(function (app) { 'use strict';

    // Initializes and sets callbacks for the GazeTargets global object
    // Constructor arguments:
    //      callbacks: {
    //          trackingStarted ()      - triggers when the tracking starts
    //          trackingStopped ()      - triggers when the tracking ends
    //          wordFocused (word)      - triggers when a word becomes focused
    //                  word: the word DOM object 
    //          wordLeft (word)         - triggers when gaze leaves a word
    //                  word: the word DOM object 
    //      }
    function GazeTargetsManager(callbacks) {

        GazeTargets.init({
            panel: {
               show: true
            },
            pointer: {
                show: true
            },
            targets: [
                {
                    selector: '.word',
                    selection: {
                        type: GazeTargets.selection.types.none
                    },
                    mapping: {
                        className: ''
                    }
                }
            ],
            mapping: {
                type: GazeTargets.mapping.types.expanded,  
                source: GazeTargets.mapping.sources.fixations,
                model: GazeTargets.mapping.models.reading,
                expansion: 30,
                reading: {
                    maxSaccadeLength: 250,      // maximum progressing saccade length, in pixels
                    maxSaccadeAngleRatio: 0.7   // |sacc.y| / sacc.dx
                }
            }
        }, {
            state: function (state) {
                if (state.isTracking) {
                    if (callbacks.trackingStarted)
                        callbacks.trackingStarted();
                }
                else if (state.isStopped) {
                    if (callbacks.trackingStopped)
                        callbacks.trackingStopped();
                }
            },

            target: function (event, target) {
                if (event === 'focused') {
                    if (callbacks.wordFocused)
                        callbacks.wordFocused( target );
                }
                else if (event === 'left') {
                    if (callbacks.wordLeft)
                        callbacks.wordLeft( target );
                }
            }
        });
    }

    app.GazeTargetsManager = GazeTargetsManager;
    
})( Dyslexia || window );

(function (app) { 'use strict';

    // Controller for the text options side-slider
    // Constructor arguments:
    //        options: {
    //            root:         - slideout element ID
    //            text:         - ID of the element that stores the text to edit
    //        }
    function Options(options) {

        this.root = options.root || '#options';
        this.text = options.text || '#textContainer';
        
        this._slideout = document.querySelector( this.root );

        var colors = [
            { selector: '.dyslexiaText', id: 'text' },
            { selector: '.dyslexiaText .currentWord', id: 'currentWord' },
            { selector: '.dyslexiaText .currentWord + span', id: 'nextWord' }
        ];

        this._style = document.createElement( 'style' );
        document.body.appendChild( this._style );

        var self = this;
        
        var apply = document.querySelector( this.root + ' .save' );
        apply.addEventListener( 'click', function () {
            getColorsFromEditors( self._style, colors );
            self._slideout.classList.remove( 'expanded' );
        });

        var close = document.querySelector( this.root + ' .close' );
        close.addEventListener( 'click', function () {
            self._slideout.classList.remove( 'expanded' );
        });

        var slideoutTitle = document.querySelector( this.root + ' .title');
        slideoutTitle.addEventListener( 'click', function (e) {
            self._slideout.classList.toggle( 'expanded' );
            setColorsToEditors( colors );
        });

        window.addEventListener( 'load', function () {
            obtainInitialColors( colors );
            bindColorsToEditors( colors, self.root + ' #' );
        });
    }

    // Disables editing
    Options.prototype.lock = function () {

        this._slideout.classList.add( 'locked' );
    };

    // Enables editing
    Options.prototype.unlock = function () {
        
        this._slideout.classList.remove( 'locked' );
    };

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return '#' + componentToHex( r ) + componentToHex( g ) + componentToHex( b );
    }

    function cssColorToHex(cssColor) {
        
        var colorRegex = /^\D+(\d+)\D+(\d+)\D+(\d+)\D+$/gim;
        var colorComps = colorRegex.exec( cssColor );

        return rgbToHex( 
            parseInt( colorComps[ 1 ] ),
            parseInt( colorComps[ 2 ] ),
            parseInt( colorComps[ 3 ] ) );
    }

    function obtainInitialColors( colors ) {

        for (var s = 0; s < document.styleSheets.length; s++) {
            var sheet = document.styleSheets[ s ];
            for (var r = 0; r < sheet.cssRules.length; r++) {
                var rule = sheet.cssRules[ r ];
                for (var c = 0; c < colors.length; c++) {
                    var color = colors[ c ];
                    if (rule.selectorText === color.selector) {
                        color.initial = cssColorToHex( rule.style.color );
                        color.value = color.initial;
                    }
                }
            }
        }
    }

    function bindColorsToEditors( colors, idBase ) {

        for (var i = 0; i < colors.length; i++) {
            var color = colors[ i ];
            color.editor = document.querySelector( idBase + color.id );
            color.editor.color.fromString( color.initial );
        }
    }


    function getColorsFromEditors( style, colors ) {

        var styleText = '';
        for (var i = 0; i < colors.length; i++) {
            var color = colors[ i ];
            color.value = '#' + color.editor.color;
            styleText += color.selector + ' { color: ' + color.value + ' !important; } ';
        }
        style.innerHTML = styleText;
    }

    function setColorsToEditors( colors ) {

        for (var i = 0; i < colors.length; i++) {
            var color = colors[ i ];
            color.editor.color.fromString( color.value );
        }
    }

    app.Options = Options;
    
})( Dyslexia || window );

(function (app) { 'use strict';

    // Controller for the text editing side-slider
    // Constructor arguments:
    //        options: {
    //            root:         - slideout element ID
    //            text:         - ID of the element that stores the text to edit
    //        }
    //        callbacks: {
    //            splitText ()        - request to split the updated text
    //        }
    function TextEditor(options, callbacks) {

        this.root = options.root || '#textEditor';
        this.text = options.text || '#textContainer';
        
        this._slideout = document.querySelector( this.root );

        var pageText = document.querySelector( this.text );
        var editorText = document.querySelector( this.root + ' .text' );
        editorText.value = pageText.textContent;

        var apply = document.querySelector( this.root + ' .apply' );
        apply.addEventListener( 'click', function () {
            pageText.textContent = editorText.value;
            if (callbacks.splitText)
                callbacks.splitText();
        });
    }

    // Disables editing
    TextEditor.prototype.lock = function () {

        this._slideout.classList.add( 'locked' );
    };

    // Enables editing
    TextEditor.prototype.unlock = function () {
        
        this._slideout.classList.remove( 'locked' );
    };

    app.TextEditor = TextEditor;
    
})( Dyslexia || window );

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
