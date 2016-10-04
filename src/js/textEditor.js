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
