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
