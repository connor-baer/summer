/*!
 * smooth-scroll v9.4.3: Animate scrolling to anchor links
 * (c) 2016 Chris Ferdinandi
 * MIT License
 * https://github.com/cferdinandi/smooth-scroll
 */

( function ( root, factory ) {
  if ( typeof define === 'function' && define.amd ) {
    define( [], factory( root ) );
  } else if ( typeof exports === 'object' ) {
    module.exports = factory( root );
  } else {
    root.smoothScroll = factory( root );
  }
} )( typeof global !== 'undefined' ? global : this.window || this.global, function ( root ) {

  'use strict';

  //
  // Variables
  //

  var smoothScroll = {}; // Object for public APIs
  var supports = 'querySelector' in document && 'addEventListener' in root; // Feature test
  var settings, eventTimeout, fixedHeader, headerHeight, animationInterval;

  // Default settings
  var defaults = {
    selector: '[data-scroll]',
    selectorHeader: '[data-scroll-header]',
    speed: 500,
    easing: 'easeInOutCubic',
    offset: 0,
    updateURL: true,
    callback: function () {}
  };


  //
  // Methods
  //

  /**
   * Merge two or more objects. Returns a new object.
   * @private
   * @param {Boolean}  deep     If true, do a deep (or recursive) merge [optional]
   * @param {Object}   objects  The objects to merge together
   * @returns {Object}          Merged values of defaults and options
   */
  var extend = function () {

    // Variables
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;

    // Check if a deep merge
    if ( Object.prototype.toString.call( arguments[ 0 ] ) === '[object Boolean]' ) {
      deep = arguments[ 0 ];
      i++;
    }

    // Merge the object into the extended object
    var merge = function ( obj ) {
      for ( var prop in obj ) {
        if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
          // If deep merge and property is an object, merge properties
          if ( deep && Object.prototype.toString.call( obj[ prop ] ) === '[object Object]' ) {
            extended[ prop ] = extend( true, extended[ prop ], obj[ prop ] );
          } else {
            extended[ prop ] = obj[ prop ];
          }
        }
      }
    };

    // Loop through each object and conduct a merge
    for ( ; i < length; i++ ) {
      var obj = arguments[ i ];
      merge( obj );
    }

    return extended;

  };

  /**
   * Get the height of an element.
   * @private
   * @param  {Node} elem The element to get the height of
   * @return {Number}    The element's height in pixels
   */
  var getHeight = function ( elem ) {
    return Math.max( elem.scrollHeight, elem.offsetHeight, elem.clientHeight );
  };

  /**
   * Get the closest matching element up the DOM tree.
   * @private
   * @param  {Element} elem     Starting element
   * @param  {String}  selector Selector to match against (class, ID, data attribute, or tag)
   * @return {Boolean|Element}  Returns null if not match found
   */
  var getClosest = function ( elem, selector ) {

    // Variables
    var firstChar = selector.charAt( 0 );
    var supports = 'classList' in document.documentElement;
    var attribute, value;

    // If selector is a data attribute, split attribute from value
    if ( firstChar === '[' ) {
      selector = selector.substr( 1, selector.length - 2 );
      attribute = selector.split( '=' );

      if ( attribute.length > 1 ) {
        value = true;
        attribute[ 1 ] = attribute[ 1 ].replace( /"/g, '' ).replace( /'/g, '' );
      }
    }

    // Get closest match
    for ( ; elem && elem !== document && elem.nodeType === 1; elem = elem.parentNode ) {

      // If selector is a class
      if ( firstChar === '.' ) {
        if ( supports ) {
          if ( elem.classList.contains( selector.substr( 1 ) ) ) {
            return elem;
          }
        } else {
          if ( new RegExp( '(^|\\s)' + selector.substr( 1 ) + '(\\s|$)' ).test( elem.className ) ) {
            return elem;
          }
        }
      }

      // If selector is an ID
      if ( firstChar === '#' ) {
        if ( elem.id === selector.substr( 1 ) ) {
          return elem;
        }
      }

      // If selector is a data attribute
      if ( firstChar === '[' ) {
        if ( elem.hasAttribute( attribute[ 0 ] ) ) {
          if ( value ) {
            if ( elem.getAttribute( attribute[ 0 ] ) === attribute[ 1 ] ) {
              return elem;
            }
          } else {
            return elem;
          }
        }
      }

      // If selector is a tag
      if ( elem.tagName.toLowerCase() === selector ) {
        return elem;
      }

    }

    return null;

  };

  /**
   * Escape special characters for use with querySelector
   * @public
   * @param {String} id The anchor ID to escape
   * @author Mathias Bynens
   * @link https://github.com/mathiasbynens/CSS.escape
   */
  smoothScroll.escapeCharacters = function ( id ) {

    // Remove leading hash
    if ( id.charAt( 0 ) === '#' ) {
      id = id.substr( 1 );
    }

    var string = String( id );
    var length = string.length;
    var index = -1;
    var codeUnit;
    var result = '';
    var firstCodeUnit = string.charCodeAt( 0 );
    while ( ++index < length ) {
      codeUnit = string.charCodeAt( index );
      // Note: there’s no need to special-case astral symbols, surrogate
      // pairs, or lone surrogates.

      // If the character is NULL (U+0000), then throw an
      // `InvalidCharacterError` exception and terminate these steps.
      if ( codeUnit === 0x0000 ) {
        throw new InvalidCharacterError(
          'Invalid character: the input contains U+0000.'
        );
      }

      if (
        // If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
        // U+007F, […]
        ( codeUnit >= 0x0001 && codeUnit <= 0x001F ) || codeUnit == 0x007F ||
        // If the character is the first character and is in the range [0-9]
        // (U+0030 to U+0039), […]
        ( index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039 ) ||
        // If the character is the second character and is in the range [0-9]
        // (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
        (
          index === 1 &&
          codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
          firstCodeUnit === 0x002D
        )
      ) {
        // http://dev.w3.org/csswg/cssom/#escape-a-character-as-code-point
        result += '\\' + codeUnit.toString( 16 ) + ' ';
        continue;
      }

      // If the character is not handled by one of the above rules and is
      // greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
      // is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
      // U+005A), or [a-z] (U+0061 to U+007A), […]
      if (
        codeUnit >= 0x0080 ||
        codeUnit === 0x002D ||
        codeUnit === 0x005F ||
        codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
        codeUnit >= 0x0041 && codeUnit <= 0x005A ||
        codeUnit >= 0x0061 && codeUnit <= 0x007A
      ) {
        // the character itself
        result += string.charAt( index );
        continue;
      }

      // Otherwise, the escaped character.
      // http://dev.w3.org/csswg/cssom/#escape-a-character
      result += '\\' + string.charAt( index );

    }

    return '#' + result;

  };

  /**
   * Calculate the easing pattern
   * @private
   * @link https://gist.github.com/gre/1650294
   * @param {String} type Easing pattern
   * @param {Number} time Time animation should take to complete
   * @returns {Number}
   */
  var easingPattern = function ( type, time ) {
    var pattern;
    if ( type === 'easeInQuad' ) pattern = time * time; // accelerating from zero velocity
    if ( type === 'easeOutQuad' ) pattern = time * ( 2 - time ); // decelerating to zero velocity
    if ( type === 'easeInOutQuad' ) pattern = time < 0.5 ? 2 * time * time : -1 + ( 4 - 2 * time ) * time; // acceleration until halfway, then deceleration
    if ( type === 'easeInCubic' ) pattern = time * time * time; // accelerating from zero velocity
    if ( type === 'easeOutCubic' ) pattern = ( --time ) * time * time + 1; // decelerating to zero velocity
    if ( type === 'easeInOutCubic' ) pattern = time < 0.5 ? 4 * time * time * time : ( time - 1 ) * ( 2 * time - 2 ) * ( 2 * time - 2 ) + 1; // acceleration until halfway, then deceleration
    if ( type === 'easeInQuart' ) pattern = time * time * time * time; // accelerating from zero velocity
    if ( type === 'easeOutQuart' ) pattern = 1 - ( --time ) * time * time * time; // decelerating to zero velocity
    if ( type === 'easeInOutQuart' ) pattern = time < 0.5 ? 8 * time * time * time * time : 1 - 8 * ( --time ) * time * time * time; // acceleration until halfway, then deceleration
    if ( type === 'easeInQuint' ) pattern = time * time * time * time * time; // accelerating from zero velocity
    if ( type === 'easeOutQuint' ) pattern = 1 + ( --time ) * time * time * time * time; // decelerating to zero velocity
    if ( type === 'easeInOutQuint' ) pattern = time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * ( --time ) * time * time * time * time; // acceleration until halfway, then deceleration
    return pattern || time; // no easing, no acceleration
  };

  /**
   * Calculate how far to scroll
   * @private
   * @param {Element} anchor The anchor element to scroll to
   * @param {Number} headerHeight Height of a fixed header, if any
   * @param {Number} offset Number of pixels by which to offset scroll
   * @returns {Number}
   */
  var getEndLocation = function ( anchor, headerHeight, offset ) {
    var location = 0;
    if ( anchor.offsetParent ) {
      do {
        location += anchor.offsetTop;
        anchor = anchor.offsetParent;
      } while ( anchor );
    }
    location = Math.max( location - headerHeight - offset, 0 );
    return Math.min( location, getDocumentHeight() - getViewportHeight() );
  };

  /**
   * Determine the viewport's height
   * @private
   * @returns {Number}
   */
  var getViewportHeight = function () {
    return Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
  };

  /**
   * Determine the document's height
   * @private
   * @returns {Number}
   */
  var getDocumentHeight = function () {
    return Math.max(
      root.document.body.scrollHeight, root.document.documentElement.scrollHeight,
      root.document.body.offsetHeight, root.document.documentElement.offsetHeight,
      root.document.body.clientHeight, root.document.documentElement.clientHeight
    );
  };

  /**
   * Convert data-options attribute into an object of key/value pairs
   * @private
   * @param {String} options Link-specific options as a data attribute string
   * @returns {Object}
   */
  var getDataOptions = function ( options ) {
    return !options || !( typeof JSON === 'object' && typeof JSON.parse === 'function' ) ? {} : JSON.parse( options );
  };

  /**
   * Update the URL
   * @private
   * @param {Element} anchor The element to scroll to
   * @param {Boolean} url Whether or not to update the URL history
   */
  var updateUrl = function ( anchor, url ) {
    if ( root.history.pushState && ( url || url === 'true' ) && root.location.protocol !== 'file:' ) {
      root.history.pushState( null, null, [ root.location.protocol, '//', root.location.host, root.location.pathname, root.location.search, anchor ].join( '' ) );
    }
  };

  var getHeaderHeight = function ( header ) {
    return header === null ? 0 : ( getHeight( header ) + header.offsetTop );
  };

  /**
   * Start/stop the scrolling animation
   * @public
   * @param {Element} anchor The element to scroll to
   * @param {Element} toggle The element that toggled the scroll event
   * @param {Object} options
   */
  smoothScroll.animateScroll = function ( anchor, toggle, options ) {

    // Options and overrides
    var overrides = getDataOptions( toggle ? toggle.getAttribute( 'data-options' ) : null );
    var animateSettings = extend( settings || defaults, options || {}, overrides ); // Merge user options with defaults

    // Selectors and variables
    var isNum = Object.prototype.toString.call( anchor ) === '[object Number]' ? true : false;
    var hash = isNum ? null : smoothScroll.escapeCharacters( anchor );
    var anchorElem = isNum ? null : ( hash === '#' ? root.document.documentElement : root.document.querySelector( hash ) );
    if ( !isNum && !anchorElem ) return;
    var startLocation = root.pageYOffset; // Current location on the page
    if ( !fixedHeader ) {
      fixedHeader = root.document.querySelector( animateSettings.selectorHeader );
    } // Get the fixed header if not already set
    if ( !headerHeight ) {
      headerHeight = getHeaderHeight( fixedHeader );
    } // Get the height of a fixed header if one exists and not already set
    var endLocation = isNum ? anchor : getEndLocation( anchorElem, headerHeight, parseInt( animateSettings.offset, 10 ) ); // Location to scroll to
    var distance = endLocation - startLocation; // distance to travel
    var documentHeight = getDocumentHeight();
    var timeLapsed = 0;
    var percentage, position;

    // Update URL
    if ( !isNum ) {
      updateUrl( anchor, animateSettings.updateURL );
    }

    /**
     * Stop the scroll animation when it reaches its target (or the bottom/top of page)
     * @private
     * @param {Number} position Current position on the page
     * @param {Number} endLocation Scroll to location
     * @param {Number} animationInterval How much to scroll on this loop
     */
    var stopAnimateScroll = function ( position, endLocation, animationInterval ) {
      var currentLocation = root.pageYOffset;
      if ( position == endLocation || currentLocation == endLocation || ( ( root.innerHeight + currentLocation ) >=

          documentHeight ) ) {
        clearInterval( animationInterval );

        // If scroll target is an anchor, bring it into focus
        if ( !isNum ) {
          anchorElem.focus();
          if ( document.activeElement.id !== anchorElem.id ) {
            anchorElem.setAttribute( 'tabindex', '-1' );
            anchorElem.focus();
            anchorElem.style.outline = 'none';
          }
        }
        root.scrollTo( 0, endLocation );

        animateSettings.callback( anchor, toggle ); // Run callbacks after animation complete
      }
    };

    /**
     * Loop scrolling animation
     * @private
     */
    var loopAnimateScroll = function () {
      timeLapsed += 16;
      percentage = ( timeLapsed / parseInt( animateSettings.speed, 10 ) );
      percentage = ( percentage > 1 ) ? 1 : percentage;
      position = startLocation + ( distance * easingPattern( animateSettings.easing, percentage ) );
      root.scrollTo( 0, Math.floor( position ) );
      stopAnimateScroll( position, endLocation, animationInterval );
    };

    /**
     * Set interval timer
     * @private
     */
    var startAnimateScroll = function () {
      clearInterval( animationInterval );
      animationInterval = setInterval( loopAnimateScroll, 16 );
    };

    /**
     * Reset position to fix weird iOS bug
     * @link https://github.com/cferdinandi/smooth-scroll/issues/45
     */
    if ( root.pageYOffset === 0 ) {
      root.scrollTo( 0, 0 );
    }

    // Start scrolling animation
    startAnimateScroll();

  };

  /**
   * If smooth scroll element clicked, animate scroll
   * @private
   */
  var eventHandler = function ( event ) {

    // Don't run if right-click or command/control + click
    if ( event.button !== 0 || event.metaKey || event.ctrlKey ) return;

    // If a smooth scroll link, animate it
    var toggle = getClosest( event.target, settings.selector );
    if ( toggle && toggle.tagName.toLowerCase() === 'a' ) {

      // Check that link is an anchor and points to current page
      if ( toggle.hostname !== root.location.hostname || toggle.pathname !== root.location.pathname || !/#/.test( toggle.href ) ) return;

      event.preventDefault(); // Prevent default click event
      smoothScroll.animateScroll( toggle.hash, toggle, settings ); // Animate scroll

    }

  };

  /**
   * On window scroll and resize, only run events at a rate of 15fps for better performance
   * @private
   * @param  {Function} eventTimeout Timeout function
   * @param  {Object} settings
   */
  var eventThrottler = function ( event ) {
    if ( !eventTimeout ) {
      eventTimeout = setTimeout( function () {
        eventTimeout = null; // Reset timeout
        headerHeight = getHeaderHeight( fixedHeader ); // Get the height of a fixed header if one exists
      }, 66 );
    }
  };

  /**
   * Destroy the current initialization.
   * @public
   */
  smoothScroll.destroy = function () {

    // If plugin isn't already initialized, stop
    if ( !settings ) return;

    // Remove event listeners
    root.document.removeEventListener( 'click', eventHandler, false );
    root.removeEventListener( 'resize', eventThrottler, false );

    // Reset varaibles
    settings = null;
    eventTimeout = null;
    fixedHeader = null;
    headerHeight = null;
    animationInterval = null;
  };

  /**
   * Initialize Smooth Scroll
   * @public
   * @param {Object} options User settings
   */
  smoothScroll.init = function ( options ) {

    // feature test
    if ( !supports ) return;

    // Destroy any existing initializations
    smoothScroll.destroy();

    // Selectors and variables
    settings = extend( defaults, options || {} ); // Merge user options with defaults
    fixedHeader = root.document.querySelector( settings.selectorHeader ); // Get the fixed header
    headerHeight = getHeaderHeight( fixedHeader );

    // When a toggle is clicked, run the click handler
    root.document.addEventListener( 'click', eventHandler, false );
    if ( fixedHeader ) {
      root.addEventListener( 'resize', eventThrottler, false );
    }

  };


  //
  // Public APIs
  //

  return smoothScroll;

} );
/*
Turbolinks 5.0.0
Copyright © 2016 Basecamp, LLC
 */
( function () {
  ( function () {
    ( function () {
      this.Turbolinks = {
        supported: function () {
          return null != window.history.pushState && null != window.requestAnimationFrame
        }(),
        visit: function ( e, r ) {
          return t.controller.visit( e, r )
        },
        clearCache: function () {
          return t.controller.clearCache()
        }
      }
    } ).call( this )
  } ).call( this );
  var t = this.Turbolinks;
  ( function () {
    ( function () {
      var e, r;
      t.copyObject = function ( t ) {
        var e, r, n;
        r = {};
        for ( e in t ) n = t[ e ], r[ e ] = n;
        return r
      }, t.closest = function ( t, r ) {
        return e.call( t, r )
      }, e = function () {
        var t, e;
        return t = document.documentElement, null != ( e = t.closest ) ? e : function ( t ) {
          var e;
          for ( e = this; e; ) {
            if ( e.nodeType === Node.ELEMENT_NODE && r.call( e, t ) ) return e;
            e = e.parentNode
          }
        }
      }(), t.defer = function ( t ) {
        return setTimeout( t, 1 )
      }, t.dispatch = function ( t, e ) {
        var r, n, o, i, s;
        return i = null != e ? e : {}, s = i.target, r = i.cancelable, n = i.data, o = document.createEvent( "Events" ), o.initEvent( t, !0, r === !0 ), o.data = null != n ? n : {}, ( null != s ? s : document ).dispatchEvent( o ), o
      }, t.match = function ( t, e ) {
        return r.call( t, e )
      }, r = function () {
        var t, e, r, n;
        return t = document.documentElement, null != ( e = null != ( r = null != ( n = t.matchesSelector ) ? n : t.webkitMatchesSelector ) ? r : t.msMatchesSelector ) ? e : t.mozMatchesSelector
      }(), t.uuid = function () {
        var t, e, r;
        for ( r = "", t = e = 1; 36 >= e; t = ++e ) r += 9 === t || 14 === t || 19 === t || 24 === t ? "-" : 15 === t ? "4" : 20 === t ? ( Math.floor( 4 * Math.random() ) + 8 ).toString( 16 ) : Math.floor( 15 * Math.random() ).toString( 16 );
        return r
      }
    } ).call( this ),
      function () {
        t.Location = function () {
          function t( t ) {
            var e, r;
            null == t && ( t = "" ), r = document.createElement( "a" ), r.href = t.toString(), this.absoluteURL = r.href, e = r.hash.length, 2 > e ? this.requestURL = this.absoluteURL : ( this.requestURL = this.absoluteURL.slice( 0, -e ), this.anchor = r.hash.slice( 1 ) )
          }
          var e, r, n, o;
          return t.wrap = function ( t ) {
            return t instanceof this ? t : new this( t )
          }, t.prototype.getOrigin = function () {
            return this.absoluteURL.split( "/", 3 ).join( "/" )
          }, t.prototype.getPath = function () {
            var t, e;
            return null != ( t = null != ( e = this.absoluteURL.match( /\/\/[^\/]*(\/[^?;]*)/ ) ) ? e[ 1 ] : void 0 ) ? t : "/"
          }, t.prototype.getPathComponents = function () {
            return this.getPath().split( "/" ).slice( 1 )
          }, t.prototype.getLastPathComponent = function () {
            return this.getPathComponents().slice( -1 )[ 0 ]
          }, t.prototype.getExtension = function () {
            var t, e;
            return null != ( t = null != ( e = this.getLastPathComponent().match( /\.[^.]*$/ ) ) ? e[ 0 ] : void 0 ) ? t : ""
          }, t.prototype.isHTML = function () {
            return this.getExtension().match( /^(?:|\.(?:htm|html|xhtml))$/ )
          }, t.prototype.isPrefixedBy = function ( t ) {
            var e;
            return e = r( t ), this.isEqualTo( t ) || o( this.absoluteURL, e )
          }, t.prototype.isEqualTo = function ( t ) {
            return this.absoluteURL === ( null != t ? t.absoluteURL : void 0 )
          }, t.prototype.toCacheKey = function () {
            return this.requestURL
          }, t.prototype.toJSON = function () {
            return this.absoluteURL
          }, t.prototype.toString = function () {
            return this.absoluteURL
          }, t.prototype.valueOf = function () {
            return this.absoluteURL
          }, r = function ( t ) {
            return e( t.getOrigin() + t.getPath() )
          }, e = function ( t ) {
            return n( t, "/" ) ? t : t + "/"
          }, o = function ( t, e ) {
            return t.slice( 0, e.length ) === e
          }, n = function ( t, e ) {
            return t.slice( -e.length ) === e
          }, t
        }()
      }.call( this ),
      function () {
        var e = function ( t, e ) {
          return function () {
            return t.apply( e, arguments )
          }
        };
        t.HttpRequest = function () {
          function r( r, n, o ) {
            this.delegate = r, this.requestCanceled = e( this.requestCanceled, this ), this.requestTimedOut = e( this.requestTimedOut, this ), this.requestFailed = e( this.requestFailed, this ), this.requestLoaded = e( this.requestLoaded, this ), this.requestProgressed = e( this.requestProgressed, this ), this.url = t.Location.wrap( n ).requestURL, this.referrer = t.Location.wrap( o ).absoluteURL, this.createXHR()
          }
          return r.NETWORK_FAILURE = 0, r.TIMEOUT_FAILURE = -1, r.timeout = 60, r.prototype.send = function () {
            var t;
            return this.xhr && !this.sent ? ( this.notifyApplicationBeforeRequestStart(), this.setProgress( 0 ), this.xhr.send(), this.sent = !0, "function" == typeof ( t = this.delegate ).requestStarted ? t.requestStarted() : void 0 ) : void 0
          }, r.prototype.cancel = function () {
            return this.xhr && this.sent ? this.xhr.abort() : void 0
          }, r.prototype.requestProgressed = function ( t ) {
            return t.lengthComputable ? this.setProgress( t.loaded / t.total ) : void 0
          }, r.prototype.requestLoaded = function () {
            return this.endRequest( function ( t ) {
              return function () {
                var e;
                return 200 <= ( e = t.xhr.status ) && 300 > e ? t.delegate.requestCompletedWithResponse( t.xhr.responseText, t.xhr.getResponseHeader( "Turbolinks-Location" ) ) : ( t.failed = !0, t.delegate.requestFailedWithStatusCode( t.xhr.status, t.xhr.responseText ) )
              }
            }( this ) )
          }, r.prototype.requestFailed = function () {
            return this.endRequest( function ( t ) {
              return function () {
                return t.failed = !0, t.delegate.requestFailedWithStatusCode( t.constructor.NETWORK_FAILURE )
              }
            }( this ) )
          }, r.prototype.requestTimedOut = function () {
            return this.endRequest( function ( t ) {
              return function () {
                return t.failed = !0, t.delegate.requestFailedWithStatusCode( t.constructor.TIMEOUT_FAILURE )
              }
            }( this ) )
          }, r.prototype.requestCanceled = function () {
            return this.endRequest()
          }, r.prototype.notifyApplicationBeforeRequestStart = function () {
            return t.dispatch( "turbolinks:request-start", {
              data: {
                url: this.url,
                xhr: this.xhr
              }
            } )
          }, r.prototype.notifyApplicationAfterRequestEnd = function () {
            return t.dispatch( "turbolinks:request-end", {
              data: {
                url: this.url,
                xhr: this.xhr
              }
            } )
          }, r.prototype.createXHR = function () {
            return this.xhr = new XMLHttpRequest, this.xhr.open( "GET", this.url, !0 ), this.xhr.timeout = 1e3 * this.constructor.timeout, this.xhr.setRequestHeader( "Accept", "text/html, application/xhtml+xml" ), this.xhr.setRequestHeader( "Turbolinks-Referrer", this.referrer ), this.xhr.onprogress = this.requestProgressed, this.xhr.onload = this.requestLoaded, this.xhr.onerror = this.requestFailed, this.xhr.ontimeout = this.requestTimedOut, this.xhr.onabort = this.requestCanceled
          }, r.prototype.endRequest = function ( t ) {
            return this.xhr ? ( this.notifyApplicationAfterRequestEnd(), null != t && t.call( this ), this.destroy() ) : void 0
          }, r.prototype.setProgress = function ( t ) {
            var e;
            return this.progress = t, "function" == typeof ( e = this.delegate ).requestProgressed ? e.requestProgressed( this.progress ) : void 0
          }, r.prototype.destroy = function () {
            var t;
            return this.setProgress( 1 ), "function" == typeof ( t = this.delegate ).requestFinished && t.requestFinished(), this.delegate = null, this.xhr = null
          }, r
        }()
      }.call( this ),
      function () {
        var e = function ( t, e ) {
          return function () {
            return t.apply( e, arguments )
          }
        };
        t.ProgressBar = function () {
          function t() {
            this.trickle = e( this.trickle, this ), this.stylesheetElement = this.createStylesheetElement(), this.progressElement = this.createProgressElement()
          }
          var r;
          return r = 300, t.defaultCSS = ".turbolinks-progress-bar {\n  position: fixed;\n  display: block;\n  top: 0;\n  left: 0;\n  height: 3px;\n  background: #0076ff;\n  z-index: 9999;\n  transition: width " + r + "ms ease-out, opacity " + r / 2 + "ms " + r / 2 + "ms ease-in;\n  transform: translate3d(0, 0, 0);\n}", t.prototype.show = function () {
            return this.visible ? void 0 : ( this.visible = !0, this.installStylesheetElement(), this.installProgressElement(), this.startTrickling() )
          }, t.prototype.hide = function () {
            return this.visible && !this.hiding ? ( this.hiding = !0, this.fadeProgressElement( function ( t ) {
              return function () {
                return t.uninstallProgressElement(), t.stopTrickling(), t.visible = !1, t.hiding = !1
              }
            }( this ) ) ) : void 0
          }, t.prototype.setValue = function ( t ) {
            return this.value = t, this.refresh()
          }, t.prototype.installStylesheetElement = function () {
            return document.head.insertBefore( this.stylesheetElement, document.head.firstChild )
          }, t.prototype.installProgressElement = function () {
            return this.progressElement.style.width = 0, this.progressElement.style.opacity = 1, document.documentElement.insertBefore( this.progressElement, document.body ), this.refresh()
          }, t.prototype.fadeProgressElement = function ( t ) {
            return this.progressElement.style.opacity = 0, setTimeout( t, 1.5 * r )
          }, t.prototype.uninstallProgressElement = function () {
            return this.progressElement.parentNode ? document.documentElement.removeChild( this.progressElement ) : void 0
          }, t.prototype.startTrickling = function () {
            return null != this.trickleInterval ? this.trickleInterval : this.trickleInterval = setInterval( this.trickle, r )
          }, t.prototype.stopTrickling = function () {
            return clearInterval( this.trickleInterval ), this.trickleInterval = null
          }, t.prototype.trickle = function () {
            return this.setValue( this.value + Math.random() / 100 )
          }, t.prototype.refresh = function () {
            return requestAnimationFrame( function ( t ) {
              return function () {
                return t.progressElement.style.width = 10 + 90 * t.value + "%"
              }
            }( this ) )
          }, t.prototype.createStylesheetElement = function () {
            var t;
            return t = document.createElement( "style" ), t.type = "text/css", t.textContent = this.constructor.defaultCSS, t
          }, t.prototype.createProgressElement = function () {
            var t;
            return t = document.createElement( "div" ), t.className = "turbolinks-progress-bar", t
          }, t
        }()
      }.call( this ),
      function () {
        var e = function ( t, e ) {
          return function () {
            return t.apply( e, arguments )
          }
        };
        t.BrowserAdapter = function () {
          function r( r ) {
            this.controller = r, this.showProgressBar = e( this.showProgressBar, this ), this.progressBar = new t.ProgressBar
          }
          var n, o, i, s;
          return s = t.HttpRequest, n = s.NETWORK_FAILURE, i = s.TIMEOUT_FAILURE, o = 500, r.prototype.visitProposedToLocationWithAction = function ( t, e ) {
            return this.controller.startVisitToLocationWithAction( t, e )
          }, r.prototype.visitStarted = function ( t ) {
            return t.issueRequest(), t.changeHistory(), t.loadCachedSnapshot()
          }, r.prototype.visitRequestStarted = function ( t ) {
            return this.progressBar.setValue( 0 ), t.hasCachedSnapshot() || "restore" !== t.action ? this.showProgressBarAfterDelay() : this.showProgressBar()
          }, r.prototype.visitRequestProgressed = function ( t ) {
            return this.progressBar.setValue( t.progress )
          }, r.prototype.visitRequestCompleted = function ( t ) {
            return t.loadResponse()
          }, r.prototype.visitRequestFailedWithStatusCode = function ( t, e ) {
            switch ( e ) {
            case n:
            case i:
              return this.reload();
            default:
              return t.loadResponse()
            }
          }, r.prototype.visitRequestFinished = function ( t ) {
            return this.hideProgressBar()
          }, r.prototype.visitCompleted = function ( t ) {
            return t.followRedirect()
          }, r.prototype.pageInvalidated = function () {
            return this.reload()
          }, r.prototype.showProgressBarAfterDelay = function () {
            return this.progressBarTimeout = setTimeout( this.showProgressBar, o )
          }, r.prototype.showProgressBar = function () {
            return this.progressBar.show()
          }, r.prototype.hideProgressBar = function () {
            return this.progressBar.hide(), clearTimeout( this.progressBarTimeout )
          }, r.prototype.reload = function () {
            return window.location.reload()
          }, r
        }()
      }.call( this ),
      function () {
        var e, r = function ( t, e ) {
          return function () {
            return t.apply( e, arguments )
          }
        };
        e = !1, addEventListener( "load", function () {
          return t.defer( function () {
            return e = !0
          } )
        }, !1 ), t.History = function () {
          function n( t ) {
            this.delegate = t, this.onPopState = r( this.onPopState, this )
          }
          return n.prototype.start = function () {
            return this.started ? void 0 : ( addEventListener( "popstate", this.onPopState, !1 ), this.started = !0 )
          }, n.prototype.stop = function () {
            return this.started ? ( removeEventListener( "popstate", this.onPopState, !1 ), this.started = !1 ) : void 0
          }, n.prototype.push = function ( e, r ) {
            return e = t.Location.wrap( e ), this.update( "push", e, r )
          }, n.prototype.replace = function ( e, r ) {
            return e = t.Location.wrap( e ), this.update( "replace", e, r )
          }, n.prototype.onPopState = function ( e ) {
            var r, n, o, i;
            return this.shouldHandlePopState() && ( i = null != ( n = e.state ) ? n.turbolinks : void 0 ) ? ( r = t.Location.wrap( window.location ), o = i.restorationIdentifier, this.delegate.historyPoppedToLocationWithRestorationIdentifier( r, o ) ) : void 0
          }, n.prototype.shouldHandlePopState = function () {
            return e === !0
          }, n.prototype.update = function ( t, e, r ) {
            var n;
            return n = {
              turbolinks: {
                restorationIdentifier: r
              }
            }, history[ t + "State" ]( n, null, e )
          }, n
        }()
      }.call( this ),
      function () {
        t.Snapshot = function () {
          function e( t ) {
            var e, r;
            r = t.head, e = t.body, this.head = null != r ? r : document.createElement( "head" ), this.body = null != e ? e : document.createElement( "body" )
          }
          return e.wrap = function ( t ) {
            return t instanceof this ? t : this.fromHTML( t )
          }, e.fromHTML = function ( t ) {
            var e;
            return e = document.createElement( "html" ), e.innerHTML = t, this.fromElement( e )
          }, e.fromElement = function ( t ) {
            return new this( {
              head: t.querySelector( "head" ),
              body: t.querySelector( "body" )
            } )
          }, e.prototype.clone = function () {
            return new e( {
              head: this.head.cloneNode( !0 ),
              body: this.body.cloneNode( !0 )
            } )
          }, e.prototype.getRootLocation = function () {
            var e, r;
            return r = null != ( e = this.getSetting( "root" ) ) ? e : "/", new t.Location( r )
          }, e.prototype.getCacheControlValue = function () {
            return this.getSetting( "cache-control" )
          }, e.prototype.hasAnchor = function ( t ) {
            try {
              return null != this.body.querySelector( "[id='" + t + "']" )
            } catch ( e ) {}
          }, e.prototype.isPreviewable = function () {
            return "no-preview" !== this.getCacheControlValue()
          }, e.prototype.isCacheable = function () {
            return "no-cache" !== this.getCacheControlValue()
          }, e.prototype.getSetting = function ( t ) {
            var e, r;
            return r = this.head.querySelectorAll( "meta[name='turbolinks-" + t + "']" ), e = r[ r.length - 1 ], null != e ? e.getAttribute( "content" ) : void 0
          }, e
        }()
      }.call( this ),
      function () {
        var e = [].slice;
        t.Renderer = function () {
          function t() {}
          var r;
          return t.render = function () {
            var t, r, n, o;
            return n = arguments[ 0 ], r = arguments[ 1 ], t = 3 <= arguments.length ? e.call( arguments, 2 ) : [], o = function ( t, e, r ) {
              r.prototype = t.prototype;
              var n = new r,
                o = t.apply( n, e );
              return Object( o ) === o ? o : n
            }( this, t, function () {} ), o.delegate = n, o.render( r ), o
          }, t.prototype.renderView = function ( t ) {
            return this.delegate.viewWillRender( this.newBody ), t(), this.delegate.viewRendered( this.newBody )
          }, t.prototype.invalidateView = function () {
            return this.delegate.viewInvalidated()
          }, t.prototype.createScriptElement = function ( t ) {
            var e;
            return "false" === t.getAttribute( "data-turbolinks-eval" ) ? t : ( e = document.createElement( "script" ), e.textContent = t.textContent, r( e, t ), e )
          }, r = function ( t, e ) {
            var r, n, o, i, s, a, u;
            for ( i = e.attributes, a = [], r = 0, n = i.length; n > r; r++ ) s = i[ r ], o = s.name, u = s.value, a.push( t.setAttribute( o, u ) );
            return a
          }, t
        }()
      }.call( this ),
      function () {
        t.HeadDetails = function () {
          function t( t ) {
            var e, r, i, s, a, u, c;
            for ( this.element = t, this.elements = {}, c = this.element.childNodes, s = 0, u = c.length; u > s; s++ ) i = c[ s ], i.nodeType === Node.ELEMENT_NODE && ( a = i.outerHTML, r = null != ( e = this.elements )[ a ] ? e[ a ] : e[ a ] = {
              type: o( i ),
              tracked: n( i ),
              elements: []
            }, r.elements.push( i ) )
          }
          var e, r, n, o;
          return t.prototype.hasElementWithKey = function ( t ) {
            return t in this.elements
          }, t.prototype.getTrackedElementSignature = function () {
            var t, e;
            return function () {
              var r, n;
              r = this.elements, n = [];
              for ( t in r ) e = r[ t ].tracked, e && n.push( t );
              return n
            }.call( this ).join( "" )
          }, t.prototype.getScriptElementsNotInDetails = function ( t ) {
            return this.getElementsMatchingTypeNotInDetails( "script", t )
          }, t.prototype.getStylesheetElementsNotInDetails = function ( t ) {
            return this.getElementsMatchingTypeNotInDetails( "stylesheet", t )
          }, t.prototype.getElementsMatchingTypeNotInDetails = function ( t, e ) {
            var r, n, o, i, s, a;
            o = this.elements, s = [];
            for ( n in o ) i = o[ n ], a = i.type, r = i.elements, a !== t || e.hasElementWithKey( n ) || s.push( r[ 0 ] );
            return s
          }, t.prototype.getProvisionalElements = function () {
            var t, e, r, n, o, i, s;
            r = [], n = this.elements;
            for ( e in n ) o = n[ e ], s = o.type, i = o.tracked, t = o.elements, null != s || i ? t.length > 1 && r.push.apply( r, t.slice( 1 ) ) : r.push.apply( r, t );
            return r
          }, o = function ( t ) {
            return e( t ) ? "script" : r( t ) ? "stylesheet" : void 0
          }, n = function ( t ) {
            return "reload" === t.getAttribute( "data-turbolinks-track" )
          }, e = function ( t ) {
            var e;
            return e = t.tagName.toLowerCase(), "script" === e
          }, r = function ( t ) {
            var e;
            return e = t.tagName.toLowerCase(), "style" === e || "link" === e && "stylesheet" === t.getAttribute( "rel" )
          }, t
        }()
      }.call( this ),
      function () {
        var e = function ( t, e ) {
            function n() {
              this.constructor = t
            }
            for ( var o in e ) r.call( e, o ) && ( t[ o ] = e[ o ] );
            return n.prototype = e.prototype, t.prototype = new n, t.__super__ = e.prototype, t
          },
          r = {}.hasOwnProperty;
        t.SnapshotRenderer = function ( r ) {
          function n( e, r ) {
            this.currentSnapshot = e, this.newSnapshot = r, this.currentHeadDetails = new t.HeadDetails( this.currentSnapshot.head ), this.newHeadDetails = new t.HeadDetails( this.newSnapshot.head ), this.newBody = this.newSnapshot.body
          }
          return e( n, r ), n.prototype.render = function ( t ) {
            return this.trackedElementsAreIdentical() ? ( this.mergeHead(), this.renderView( function ( e ) {
              return function () {
                return e.replaceBody(), e.focusFirstAutofocusableElement(), t()
              }
            }( this ) ) ) : this.invalidateView()
          }, n.prototype.mergeHead = function () {
            return this.copyNewHeadStylesheetElements(), this.copyNewHeadScriptElements(), this.removeCurrentHeadProvisionalElements(), this.copyNewHeadProvisionalElements()
          }, n.prototype.replaceBody = function () {
            return this.activateBodyScriptElements(), this.importBodyPermanentElements(), this.assignNewBody()
          }, n.prototype.trackedElementsAreIdentical = function () {
            return this.currentHeadDetails.getTrackedElementSignature() === this.newHeadDetails.getTrackedElementSignature()
          }, n.prototype.copyNewHeadStylesheetElements = function () {
            var t, e, r, n, o;
            for ( n = this.getNewHeadStylesheetElements(), o = [], e = 0, r = n.length; r > e; e++ ) t = n[ e ], o.push( document.head.appendChild( t ) );
            return o
          }, n.prototype.copyNewHeadScriptElements = function () {
            var t, e, r, n, o;
            for ( n = this.getNewHeadScriptElements(), o = [], e = 0, r = n.length; r > e; e++ ) t = n[ e ], o.push( document.head.appendChild( this.createScriptElement( t ) ) );
            return o
          }, n.prototype.removeCurrentHeadProvisionalElements = function () {
            var t, e, r, n, o;
            for ( n = this.getCurrentHeadProvisionalElements(), o = [], e = 0, r = n.length; r > e; e++ ) t = n[ e ], o.push( document.head.removeChild( t ) );
            return o
          }, n.prototype.copyNewHeadProvisionalElements = function () {
            var t, e, r, n, o;
            for ( n = this.getNewHeadProvisionalElements(), o = [], e = 0, r = n.length; r > e; e++ ) t = n[ e ], o.push( document.head.appendChild( t ) );
            return o
          }, n.prototype.importBodyPermanentElements = function () {
            var t, e, r, n, o, i;
            for ( n = this.getNewBodyPermanentElements(), i = [], e = 0, r = n.length; r > e; e++ ) o = n[ e ], ( t = this.findCurrentBodyPermanentElement( o ) ) ? i.push( o.parentNode.replaceChild( t, o ) ) : i.push( void 0 );
            return i
          }, n.prototype.activateBodyScriptElements = function () {
            var t, e, r, n, o, i;
            for ( n = this.getNewBodyScriptElements(), i = [], e = 0, r = n.length; r > e; e++ ) o = n[ e ], t = this.createScriptElement( o ), i.push( o.parentNode.replaceChild( t, o ) );
            return i
          }, n.prototype.assignNewBody = function () {
            return document.body = this.newBody
          }, n.prototype.focusFirstAutofocusableElement = function () {
            var t;
            return null != ( t = this.findFirstAutofocusableElement() ) ? t.focus() : void 0
          }, n.prototype.getNewHeadStylesheetElements = function () {
            return this.newHeadDetails.getStylesheetElementsNotInDetails( this.currentHeadDetails )
          }, n.prototype.getNewHeadScriptElements = function () {
            return this.newHeadDetails.getScriptElementsNotInDetails( this.currentHeadDetails )
          }, n.prototype.getCurrentHeadProvisionalElements = function () {
            return this.currentHeadDetails.getProvisionalElements()
          }, n.prototype.getNewHeadProvisionalElements = function () {
            return this.newHeadDetails.getProvisionalElements()
          }, n.prototype.getNewBodyPermanentElements = function () {
            return this.newBody.querySelectorAll( "[id][data-turbolinks-permanent]" )
          }, n.prototype.findCurrentBodyPermanentElement = function ( t ) {
            return document.body.querySelector( "#" + t.id + "[data-turbolinks-permanent]" )
          }, n.prototype.getNewBodyScriptElements = function () {
            return this.newBody.querySelectorAll( "script" )
          }, n.prototype.findFirstAutofocusableElement = function () {
            return document.body.querySelector( "[autofocus]" )
          }, n
        }( t.Renderer )
      }.call( this ),
      function () {
        var e = function ( t, e ) {
            function n() {
              this.constructor = t
            }
            for ( var o in e ) r.call( e, o ) && ( t[ o ] = e[ o ] );
            return n.prototype = e.prototype, t.prototype = new n, t.__super__ = e.prototype, t
          },
          r = {}.hasOwnProperty;
        t.ErrorRenderer = function ( t ) {
          function r( t ) {
            this.html = t
          }
          return e( r, t ), r.prototype.render = function ( t ) {
            return this.renderView( function ( e ) {
              return function () {
                return e.replaceDocumentHTML(), e.activateBodyScriptElements(), t()
              }
            }( this ) )
          }, r.prototype.replaceDocumentHTML = function () {
            return document.documentElement.innerHTML = this.html
          }, r.prototype.activateBodyScriptElements = function () {
            var t, e, r, n, o, i;
            for ( n = this.getScriptElements(), i = [], e = 0, r = n.length; r > e; e++ ) o = n[ e ], t = this.createScriptElement( o ), i.push( o.parentNode.replaceChild( t, o ) );
            return i
          }, r.prototype.getScriptElements = function () {
            return document.documentElement.querySelectorAll( "script" )
          }, r
        }( t.Renderer )
      }.call( this ),
      function () {
        t.View = function () {
          function e( t ) {
            this.delegate = t, this.element = document.documentElement
          }
          return e.prototype.getRootLocation = function () {
            return this.getSnapshot().getRootLocation()
          }, e.prototype.getSnapshot = function () {
            return t.Snapshot.fromElement( this.element )
          }, e.prototype.render = function ( t, e ) {
            var r, n, o;
            return o = t.snapshot, r = t.error, n = t.isPreview, this.markAsPreview( n ), null != o ? this.renderSnapshot( o, e ) : this.renderError( r, e )
          }, e.prototype.markAsPreview = function ( t ) {
            return t ? this.element.setAttribute( "data-turbolinks-preview", "" ) : this.element.removeAttribute( "data-turbolinks-preview" )
          }, e.prototype.renderSnapshot = function ( e, r ) {
            return t.SnapshotRenderer.render( this.delegate, r, this.getSnapshot(), t.Snapshot.wrap( e ) )
          }, e.prototype.renderError = function ( e, r ) {
            return t.ErrorRenderer.render( this.delegate, r, e )
          }, e
        }()
      }.call( this ),
      function () {
        var e = function ( t, e ) {
          return function () {
            return t.apply( e, arguments )
          }
        };
        t.ScrollManager = function () {
          function t( t ) {
            this.delegate = t, this.onScroll = e( this.onScroll, this )
          }
          return t.prototype.start = function () {
            return this.started ? void 0 : ( addEventListener( "scroll", this.onScroll, !1 ), this.onScroll(), this.started = !0 )
          }, t.prototype.stop = function () {
            return this.started ? ( removeEventListener( "scroll", this.onScroll, !1 ), this.started = !1 ) : void 0
          }, t.prototype.scrollToElement = function ( t ) {
            return t.scrollIntoView()
          }, t.prototype.scrollToPosition = function ( t ) {
            var e, r;
            return e = t.x, r = t.y, window.scrollTo( e, r )
          }, t.prototype.onScroll = function ( t ) {
            return this.updatePosition( {
              x: window.pageXOffset,
              y: window.pageYOffset
            } )
          }, t.prototype.updatePosition = function ( t ) {
            var e;
            return this.position = t, null != ( e = this.delegate ) ? e.scrollPositionChanged( this.position ) : void 0
          }, t
        }()
      }.call( this ),
      function () {
        t.SnapshotCache = function () {
          function e( t ) {
            this.size = t, this.keys = [], this.snapshots = {}
          }
          var r;
          return e.prototype.has = function ( t ) {
            var e;
            return e = r( t ), e in this.snapshots
          }, e.prototype.get = function ( t ) {
            var e;
            if ( this.has( t ) ) return e = this.read( t ), this.touch( t ), e
          }, e.prototype.put = function ( t, e ) {
            return this.write( t, e ), this.touch( t ), e
          }, e.prototype.read = function ( t ) {
            var e;
            return e = r( t ), this.snapshots[ e ]
          }, e.prototype.write = function ( t, e ) {
            var n;
            return n = r( t ), this.snapshots[ n ] = e
          }, e.prototype.touch = function ( t ) {
            var e, n;
            return n = r( t ), e = this.keys.indexOf( n ), e > -1 && this.keys.splice( e, 1 ), this.keys.unshift( n ), this.trim()
          }, e.prototype.trim = function () {
            var t, e, r, n, o;
            for ( n = this.keys.splice( this.size ), o = [], t = 0, r = n.length; r > t; t++ ) e = n[ t ], o.push( delete this.snapshots[ e ] );
            return o
          }, r = function ( e ) {
            return t.Location.wrap( e ).toCacheKey()
          }, e
        }()
      }.call( this ),
      function () {
        var e = function ( t, e ) {
          return function () {
            return t.apply( e, arguments )
          }
        };
        t.Visit = function () {
          function r( r, n, o ) {
            this.controller = r, this.action = o, this.performScroll = e( this.performScroll, this ), this.identifier = t.uuid(), this.location = t.Location.wrap( n ), this.adapter = this.controller.adapter, this.state = "initialized", this.timingMetrics = {}
          }
          var n;
          return r.prototype.start = function () {
            return "initialized" === this.state ? ( this.recordTimingMetric( "visitStart" ), this.state = "started", this.adapter.visitStarted( this ) ) : void 0
          }, r.prototype.cancel = function () {
            var t;
            return "started" === this.state ? ( null != ( t = this.request ) && t.cancel(), this.cancelRender(), this.state = "canceled" ) : void 0
          }, r.prototype.complete = function () {
            var t;
            return "started" === this.state ? ( this.recordTimingMetric( "visitEnd" ), this.state = "completed", "function" == typeof ( t = this.adapter ).visitCompleted && t.visitCompleted( this ), this.controller.visitCompleted( this ) ) : void 0
          }, r.prototype.fail = function () {
            var t;
            return "started" === this.state ? ( this.state = "failed", "function" == typeof ( t = this.adapter ).visitFailed ? t.visitFailed( this ) : void 0 ) : void 0
          }, r.prototype.changeHistory = function () {
            var t, e;
            return this.historyChanged ? void 0 : ( t = this.location.isEqualTo( this.referrer ) ? "replace" : this.action, e = n( t ), this.controller[ e ]( this.location, this.restorationIdentifier ), this.historyChanged = !0 )
          }, r.prototype.issueRequest = function () {
            return this.shouldIssueRequest() && null == this.request ? ( this.progress = 0, this.request = new t.HttpRequest( this, this.location, this.referrer ), this.request.send() ) : void 0
          }, r.prototype.getCachedSnapshot = function () {
            var t;
            return !( t = this.controller.getCachedSnapshotForLocation( this.location ) ) || null != this.location.anchor && !t.hasAnchor( this.location.anchor ) || "restore" !== this.action && !t.isPreviewable() ? void 0 : t
          }, r.prototype.hasCachedSnapshot = function () {
            return null != this.getCachedSnapshot()
          }, r.prototype.loadCachedSnapshot = function () {
            var t, e;
            return ( e = this.getCachedSnapshot() ) ? ( t = this.shouldIssueRequest(), this.render( function () {
              var r;
              return this.cacheSnapshot(), this.controller.render( {
                snapshot: e,
                isPreview: t
              }, this.performScroll ), "function" == typeof ( r = this.adapter ).visitRendered && r.visitRendered( this ), t ? void 0 : this.complete()
            } ) ) : void 0
          }, r.prototype.loadResponse = function () {
            return null != this.response ? this.render( function () {
              var t, e;
              return this.cacheSnapshot(), this.request.failed ? ( this.controller.render( {
                error: this.response
              }, this.performScroll ), "function" == typeof ( t = this.adapter ).visitRendered && t.visitRendered( this ), this.fail() ) : ( this.controller.render( {
                snapshot: this.response
              }, this.performScroll ), "function" == typeof ( e = this.adapter ).visitRendered && e.visitRendered( this ), this.complete() )
            } ) : void 0
          }, r.prototype.followRedirect = function () {
            return this.redirectedToLocation && !this.followedRedirect ? ( this.location = this.redirectedToLocation, this.controller.replaceHistoryWithLocationAndRestorationIdentifier( this.redirectedToLocation, this.restorationIdentifier ), this.followedRedirect = !0 ) : void 0
          }, r.prototype.requestStarted = function () {
            var t;
            return this.recordTimingMetric( "requestStart" ), "function" == typeof ( t = this.adapter ).visitRequestStarted ? t.visitRequestStarted( this ) : void 0
          }, r.prototype.requestProgressed = function ( t ) {
            var e;
            return this.progress = t, "function" == typeof ( e = this.adapter ).visitRequestProgressed ? e.visitRequestProgressed( this ) : void 0
          }, r.prototype.requestCompletedWithResponse = function ( e, r ) {
            return this.response = e, null != r && ( this.redirectedToLocation = t.Location.wrap( r ) ), this.adapter.visitRequestCompleted( this )
          }, r.prototype.requestFailedWithStatusCode = function ( t, e ) {
            return this.response = e, this.adapter.visitRequestFailedWithStatusCode( this, t )
          }, r.prototype.requestFinished = function () {
            var t;
            return this.recordTimingMetric( "requestEnd" ), "function" == typeof ( t = this.adapter ).visitRequestFinished ? t.visitRequestFinished( this ) : void 0
          }, r.prototype.performScroll = function () {
            return this.scrolled ? void 0 : ( "restore" === this.action ? this.scrollToRestoredPosition() || this.scrollToTop() : this.scrollToAnchor() || this.scrollToTop(), this.scrolled = !0 )
          }, r.prototype.scrollToRestoredPosition = function () {
            var t, e;
            return t = null != ( e = this.restorationData ) ? e.scrollPosition : void 0, null != t ? ( this.controller.scrollToPosition( t ), !0 ) : void 0
          }, r.prototype.scrollToAnchor = function () {
            return null != this.location.anchor ? ( this.controller.scrollToAnchor( this.location.anchor ), !0 ) : void 0
          }, r.prototype.scrollToTop = function () {
            return this.controller.scrollToPosition( {
              x: 0,
              y: 0
            } )
          }, r.prototype.recordTimingMetric = function ( t ) {
            var e;
            return null != ( e = this.timingMetrics )[ t ] ? e[ t ] : e[ t ] = ( new Date ).getTime()
          }, r.prototype.getTimingMetrics = function () {
            return t.copyObject( this.timingMetrics )
          }, n = function ( t ) {
            switch ( t ) {
            case "replace":
              return "replaceHistoryWithLocationAndRestorationIdentifier";
            case "advance":
            case "restore":
              return "pushHistoryWithLocationAndRestorationIdentifier"
            }
          }, r.prototype.shouldIssueRequest = function () {
            return "restore" === this.action ? !this.hasCachedSnapshot() : !0
          }, r.prototype.cacheSnapshot = function () {
            return this.snapshotCached ? void 0 : ( this.controller.cacheSnapshot(), this.snapshotCached = !0 )
          }, r.prototype.render = function ( t ) {
            return this.cancelRender(), this.frame = requestAnimationFrame( function ( e ) {
              return function () {
                return e.frame = null, t.call( e )
              }
            }( this ) )
          }, r.prototype.cancelRender = function () {
            return this.frame ? cancelAnimationFrame( this.frame ) : void 0
          }, r
        }()
      }.call( this ),
      function () {
        var e = function ( t, e ) {
          return function () {
            return t.apply( e, arguments )
          }
        };
        t.Controller = function () {
          function r() {
            this.clickBubbled = e( this.clickBubbled, this ), this.clickCaptured = e( this.clickCaptured, this ), this.pageLoaded = e( this.pageLoaded, this ), this.history = new t.History( this ), this.view = new t.View( this ), this.scrollManager = new t.ScrollManager( this ), this.restorationData = {}, this.clearCache()
          }
          return r.prototype.start = function () {
            return t.supported && !this.started ? ( addEventListener( "click", this.clickCaptured, !0 ), addEventListener( "DOMContentLoaded", this.pageLoaded, !1 ), this.scrollManager.start(), this.startHistory(), this.started = !0, this.enabled = !0 ) : void 0
          }, r.prototype.disable = function () {
            return this.enabled = !1
          }, r.prototype.stop = function () {
            return this.started ? ( removeEventListener( "click", this.clickCaptured, !0 ), removeEventListener( "DOMContentLoaded", this.pageLoaded, !1 ), this.scrollManager.stop(), this.stopHistory(), this.started = !1 ) : void 0
          }, r.prototype.clearCache = function () {
            return this.cache = new t.SnapshotCache( 10 )
          }, r.prototype.visit = function ( e, r ) {
            var n, o;
            return null == r && ( r = {} ), e = t.Location.wrap( e ), this.applicationAllowsVisitingLocation( e ) ? this.locationIsVisitable( e ) ? ( n = null != ( o = r.action ) ? o : "advance", this.adapter.visitProposedToLocationWithAction( e, n ) ) : window.location = e : void 0
          }, r.prototype.startVisitToLocationWithAction = function ( e, r, n ) {
            var o;
            return t.supported ? ( o = this.getRestorationDataForIdentifier( n ), this.startVisit( e, r, {
              restorationData: o
            } ) ) : window.location = e
          }, r.prototype.startHistory = function () {
            return this.location = t.Location.wrap( window.location ), this.restorationIdentifier = t.uuid(), this.history.start(), this.history.replace( this.location, this.restorationIdentifier )
          }, r.prototype.stopHistory = function () {
            return this.history.stop()
          }, r.prototype.pushHistoryWithLocationAndRestorationIdentifier = function ( e, r ) {
            return this.restorationIdentifier = r, this.location = t.Location.wrap( e ), this.history.push( this.location, this.restorationIdentifier )
          }, r.prototype.replaceHistoryWithLocationAndRestorationIdentifier = function ( e, r ) {
            return this.restorationIdentifier = r, this.location = t.Location.wrap( e ), this.history.replace( this.location, this.restorationIdentifier )
          }, r.prototype.historyPoppedToLocationWithRestorationIdentifier = function ( e, r ) {
            var n;
            return this.restorationIdentifier = r, this.enabled ? ( n = this.getRestorationDataForIdentifier( this.restorationIdentifier ), this.startVisit( e, "restore", {
              restorationIdentifier: this.restorationIdentifier,
              restorationData: n,
              historyChanged: !0
            } ), this.location = t.Location.wrap( e ) ) : this.adapter.pageInvalidated()
          }, r.prototype.getCachedSnapshotForLocation = function ( t ) {
            var e;
            return e = this.cache.get( t ), e ? e.clone() : void 0
          }, r.prototype.shouldCacheSnapshot = function () {
            return this.view.getSnapshot().isCacheable()
          }, r.prototype.cacheSnapshot = function () {
            var t;
            return this.shouldCacheSnapshot() ? ( this.notifyApplicationBeforeCachingSnapshot(), t = this.view.getSnapshot(), this.cache.put( this.lastRenderedLocation, t.clone() ) ) : void 0
          }, r.prototype.scrollToAnchor = function ( t ) {
            var e;
            return ( e = document.getElementById( t ) ) ? this.scrollToElement( e ) : this.scrollToPosition( {
              x: 0,
              y: 0
            } )
          }, r.prototype.scrollToElement = function ( t ) {
            return this.scrollManager.scrollToElement( t )
          }, r.prototype.scrollToPosition = function ( t ) {
            return this.scrollManager.scrollToPosition( t )
          }, r.prototype.scrollPositionChanged = function ( t ) {
            var e;
            return e = this.getCurrentRestorationData(), e.scrollPosition = t
          }, r.prototype.render = function ( t, e ) {
            return this.view.render( t, e )
          }, r.prototype.viewInvalidated = function () {
            return this.adapter.pageInvalidated()
          }, r.prototype.viewWillRender = function ( t ) {
            return this.notifyApplicationBeforeRender( t )
          }, r.prototype.viewRendered = function () {
            return this.lastRenderedLocation = this.currentVisit.location, this.notifyApplicationAfterRender()
          }, r.prototype.pageLoaded = function () {
            return this.lastRenderedLocation = this.location, this.notifyApplicationAfterPageLoad()
          }, r.prototype.clickCaptured = function () {
            return removeEventListener( "click", this.clickBubbled, !1 ), addEventListener( "click", this.clickBubbled, !1 )
          }, r.prototype.clickBubbled = function ( t ) {
            var e, r, n;
            return this.enabled && this.clickEventIsSignificant( t ) && ( r = this.getVisitableLinkForNode( t.target ) ) && ( n = this.getVisitableLocationForLink( r ) ) && this.applicationAllowsFollowingLinkToLocation( r, n ) ? ( t.preventDefault(), e = this.getActionForLink( r ), this.visit( n, {
              action: e
            } ) ) : void 0
          }, r.prototype.applicationAllowsFollowingLinkToLocation = function ( t, e ) {
            var r;
            return r = this.notifyApplicationAfterClickingLinkToLocation( t, e ), !r.defaultPrevented
          }, r.prototype.applicationAllowsVisitingLocation = function ( t ) {
            var e;
            return e = this.notifyApplicationBeforeVisitingLocation( t ), !e.defaultPrevented
          }, r.prototype.notifyApplicationAfterClickingLinkToLocation = function ( e, r ) {
            return t.dispatch( "turbolinks:click", {
              target: e,
              data: {
                url: r.absoluteURL
              },
              cancelable: !0
            } )
          }, r.prototype.notifyApplicationBeforeVisitingLocation = function ( e ) {
            return t.dispatch( "turbolinks:before-visit", {
              data: {
                url: e.absoluteURL
              },
              cancelable: !0
            } )
          }, r.prototype.notifyApplicationAfterVisitingLocation = function ( e ) {
            return t.dispatch( "turbolinks:visit", {
              data: {
                url: e.absoluteURL
              }
            } )
          }, r.prototype.notifyApplicationBeforeCachingSnapshot = function () {
            return t.dispatch( "turbolinks:before-cache" )
          }, r.prototype.notifyApplicationBeforeRender = function ( e ) {
            return t.dispatch( "turbolinks:before-render", {
              data: {
                newBody: e
              }
            } )
          }, r.prototype.notifyApplicationAfterRender = function () {
            return t.dispatch( "turbolinks:render" )
          }, r.prototype.notifyApplicationAfterPageLoad = function ( e ) {
            return null == e && ( e = {} ), t.dispatch( "turbolinks:load", {
              data: {
                url: this.location.absoluteURL,
                timing: e
              }
            } )
          }, r.prototype.startVisit = function ( t, e, r ) {
            var n;
            return null != ( n = this.currentVisit ) && n.cancel(), this.currentVisit = this.createVisit( t, e, r ), this.currentVisit.start(), this.notifyApplicationAfterVisitingLocation( t )
          }, r.prototype.createVisit = function ( e, r, n ) {
            var o, i, s, a, u;
            return i = null != n ? n : {}, a = i.restorationIdentifier, s = i.restorationData, o = i.historyChanged, u = new t.Visit( this, e, r ), u.restorationIdentifier = null != a ? a : t.uuid(), u.restorationData = t.copyObject( s ), u.historyChanged = o, u.referrer = this.location, u
          }, r.prototype.visitCompleted = function ( t ) {
            return this.notifyApplicationAfterPageLoad( t.getTimingMetrics() )
          }, r.prototype.clickEventIsSignificant = function ( t ) {
            return !( t.defaultPrevented || t.target.isContentEditable || t.which > 1 || t.altKey || t.ctrlKey || t.metaKey || t.shiftKey )
          }, r.prototype.getVisitableLinkForNode = function ( e ) {
            return this.nodeIsVisitable( e ) ? t.closest( e, "a[href]:not([target])" ) : void 0
          }, r.prototype.getVisitableLocationForLink = function ( e ) {
            var r;
            return r = new t.Location( e.getAttribute( "href" ) ), this.locationIsVisitable( r ) ? r : void 0
          }, r.prototype.getActionForLink = function ( t ) {
            var e;
            return null != ( e = t.getAttribute( "data-turbolinks-action" ) ) ? e : "advance"
          }, r.prototype.nodeIsVisitable = function ( e ) {
            var r;
            return ( r = t.closest( e, "[data-turbolinks]" ) ) ? "false" !== r.getAttribute( "data-turbolinks" ) : !0
          }, r.prototype.locationIsVisitable = function ( t ) {
            return t.isPrefixedBy( this.view.getRootLocation() ) && t.isHTML()
          }, r.prototype.getCurrentRestorationData = function () {
            return this.getRestorationDataForIdentifier( this.restorationIdentifier )
          }, r.prototype.getRestorationDataForIdentifier = function ( t ) {
            var e;
            return null != ( e = this.restorationData )[ t ] ? e[ t ] : e[ t ] = {}
          }, r
        }()
      }.call( this ),
      function () {
        var e, r, n;
        t.start = function () {
          return r() ? ( null == t.controller && ( t.controller = e() ), t.controller.start() ) : void 0
        }, r = function () {
          return null == window.Turbolinks && ( window.Turbolinks = t ), n()
        }, e = function () {
          var e;
          return e = new t.Controller, e.adapter = new t.BrowserAdapter( e ), e
        }, n = function () {
          return window.Turbolinks === t
        }, n() && t.start()
      }.call( this )
  } ).call( this ), "object" == typeof module && module.exports ? module.exports = t : "function" == typeof define && define.amd && define( t )
} ).call( this );
/*! List.js v1.5.0 (http://listjs.com) by Jonny Strömberg (http://javve.com) */
var List = function ( t ) {
  function e( n ) {
    if ( r[ n ] ) return r[ n ].exports;
    var i = r[ n ] = {
      i: n,
      l: !1,
      exports: {}
    };
    return t[ n ].call( i.exports, i, i.exports, e ), i.l = !0, i.exports
  }
  var r = {};
  return e.m = t, e.c = r, e.i = function ( t ) {
    return t
  }, e.d = function ( t, r, n ) {
    e.o( t, r ) || Object.defineProperty( t, r, {
      configurable: !1,
      enumerable: !0,
      get: n
    } )
  }, e.n = function ( t ) {
    var r = t && t.__esModule ? function () {
      return t.default
    } : function () {
      return t
    };
    return e.d( r, "a", r ), r
  }, e.o = function ( t, e ) {
    return Object.prototype.hasOwnProperty.call( t, e )
  }, e.p = "", e( e.s = 11 )
}( [ function ( t, e, r ) {
  function n( t ) {
    if ( !t || !t.nodeType ) throw new Error( "A DOM element reference is required" );
    this.el = t, this.list = t.classList
  }
  var i = r( 4 ),
    s = /\s+/;
  Object.prototype.toString;
  t.exports = function ( t ) {
    return new n( t )
  }, n.prototype.add = function ( t ) {
    if ( this.list ) return this.list.add( t ), this;
    var e = this.array(),
      r = i( e, t );
    return ~r || e.push( t ), this.el.className = e.join( " " ), this
  }, n.prototype.remove = function ( t ) {
    if ( this.list ) return this.list.remove( t ), this;
    var e = this.array(),
      r = i( e, t );
    return ~r && e.splice( r, 1 ), this.el.className = e.join( " " ), this
  }, n.prototype.toggle = function ( t, e ) {
    return this.list ? ( "undefined" != typeof e ? e !== this.list.toggle( t, e ) && this.list.toggle( t ) : this.list.toggle( t ), this ) : ( "undefined" != typeof e ? e ? this.add( t ) : this.remove( t ) : this.has( t ) ? this.remove( t ) : this.add( t ), this )
  }, n.prototype.array = function () {
    var t = this.el.getAttribute( "class" ) || "",
      e = t.replace( /^\s+|\s+$/g, "" ),
      r = e.split( s );
    return "" === r[ 0 ] && r.shift(), r
  }, n.prototype.has = n.prototype.contains = function ( t ) {
    return this.list ? this.list.contains( t ) : !!~i( this.array(), t )
  }
}, function ( t, e, r ) {
  var n = window.addEventListener ? "addEventListener" : "attachEvent",
    i = window.removeEventListener ? "removeEventListener" : "detachEvent",
    s = "addEventListener" !== n ? "on" : "",
    a = r( 5 );
  e.bind = function ( t, e, r, i ) {
    t = a( t );
    for ( var o = 0; o < t.length; o++ ) t[ o ][ n ]( s + e, r, i || !1 )
  }, e.unbind = function ( t, e, r, n ) {
    t = a( t );
    for ( var o = 0; o < t.length; o++ ) t[ o ][ i ]( s + e, r, n || !1 )
  }
}, function ( t, e ) {
  t.exports = function ( t ) {
    return function ( e, r, n ) {
      var i = this;
      this._values = {}, this.found = !1, this.filtered = !1;
      var s = function ( e, r, n ) {
        if ( void 0 === r ) n ? i.values( e, n ) : i.values( e );
        else {
          i.elm = r;
          var s = t.templater.get( i, e );
          i.values( s )
        }
      };
      this.values = function ( e, r ) {
        if ( void 0 === e ) return i._values;
        for ( var n in e ) i._values[ n ] = e[ n ];
        r !== !0 && t.templater.set( i, i.values() )
      }, this.show = function () {
        t.templater.show( i )
      }, this.hide = function () {
        t.templater.hide( i )
      }, this.matching = function () {
        return t.filtered && t.searched && i.found && i.filtered || t.filtered && !t.searched && i.filtered || !t.filtered && t.searched && i.found || !t.filtered && !t.searched
      }, this.visible = function () {
        return !( !i.elm || i.elm.parentNode != t.list )
      }, s( e, r, n )
    }
  }
}, function ( t, e ) {
  var r = function ( t, e, r ) {
      return r ? t.getElementsByClassName( e )[ 0 ] : t.getElementsByClassName( e )
    },
    n = function ( t, e, r ) {
      return e = "." + e, r ? t.querySelector( e ) : t.querySelectorAll( e )
    },
    i = function ( t, e, r ) {
      for ( var n = [], i = "*", s = t.getElementsByTagName( i ), a = s.length, o = new RegExp( "(^|\\s)" + e + "(\\s|$)" ), l = 0, u = 0; l < a; l++ )
        if ( o.test( s[ l ].className ) ) {
          if ( r ) return s[ l ];
          n[ u ] = s[ l ], u++
        }
      return n
    };
  t.exports = function () {
    return function ( t, e, s, a ) {
      return a = a || {}, a.test && a.getElementsByClassName || !a.test && document.getElementsByClassName ? r( t, e, s ) : a.test && a.querySelector || !a.test && document.querySelector ? n( t, e, s ) : i( t, e, s )
    }
  }()
}, function ( t, e ) {
  var r = [].indexOf;
  t.exports = function ( t, e ) {
    if ( r ) return t.indexOf( e );
    for ( var n = 0; n < t.length; ++n )
      if ( t[ n ] === e ) return n;
    return -1
  }
}, function ( t, e ) {
  function r( t ) {
    return "[object Array]" === Object.prototype.toString.call( t )
  }
  t.exports = function ( t ) {
    if ( "undefined" == typeof t ) return [];
    if ( null === t ) return [ null ];
    if ( t === window ) return [ window ];
    if ( "string" == typeof t ) return [ t ];
    if ( r( t ) ) return t;
    if ( "number" != typeof t.length ) return [ t ];
    if ( "function" == typeof t && t instanceof Function ) return [ t ];
    for ( var e = [], n = 0; n < t.length; n++ )( Object.prototype.hasOwnProperty.call( t, n ) || n in t ) && e.push( t[ n ] );
    return e.length ? e : []
  }
}, function ( t, e ) {
  t.exports = function ( t ) {
    return t = void 0 === t ? "" : t, t = null === t ? "" : t, t = t.toString()
  }
}, function ( t, e ) {
  t.exports = function ( t ) {
    for ( var e, r = Array.prototype.slice.call( arguments, 1 ), n = 0; e = r[ n ]; n++ )
      if ( e )
        for ( var i in e ) t[ i ] = e[ i ];
    return t
  }
}, function ( t, e ) {
  t.exports = function ( t ) {
    var e = function ( r, n, i ) {
      var s = r.splice( 0, 50 );
      i = i || [], i = i.concat( t.add( s ) ), r.length > 0 ? setTimeout( function () {
        e( r, n, i )
      }, 1 ) : ( t.update(), n( i ) )
    };
    return e
  }
}, function ( t, e ) {
  t.exports = function ( t ) {
    return t.handlers.filterStart = t.handlers.filterStart || [], t.handlers.filterComplete = t.handlers.filterComplete || [],
      function ( e ) {
        if ( t.trigger( "filterStart" ), t.i = 1, t.reset.filter(), void 0 === e ) t.filtered = !1;
        else {
          t.filtered = !0;
          for ( var r = t.items, n = 0, i = r.length; n < i; n++ ) {
            var s = r[ n ];
            e( s ) ? s.filtered = !0 : s.filtered = !1
          }
        }
        return t.update(), t.trigger( "filterComplete" ), t.visibleItems
      }
  }
}, function ( t, e, r ) {
  var n = ( r( 0 ), r( 1 ) ),
    i = r( 7 ),
    s = r( 6 ),
    a = r( 3 ),
    o = r( 19 );
  t.exports = function ( t, e ) {
    e = e || {}, e = i( {
      location: 0,
      distance: 100,
      threshold: .4,
      multiSearch: !0,
      searchClass: "fuzzy-search"
    }, e );
    var r = {
      search: function ( n, i ) {
        for ( var s = e.multiSearch ? n.replace( / +$/, "" ).split( / +/ ) : [ n ], a = 0, o = t.items.length; a < o; a++ ) r.item( t.items[ a ], i, s )
      },
      item: function ( t, e, n ) {
        for ( var i = !0, s = 0; s < n.length; s++ ) {
          for ( var a = !1, o = 0, l = e.length; o < l; o++ ) r.values( t.values(), e[ o ], n[ s ] ) && ( a = !0 );
          a || ( i = !1 )
        }
        t.found = i
      },
      values: function ( t, r, n ) {
        if ( t.hasOwnProperty( r ) ) {
          var i = s( t[ r ] ).toLowerCase();
          if ( o( i, n, e ) ) return !0
        }
        return !1
      }
    };
    return n.bind( a( t.listContainer, e.searchClass ), "keyup", function ( e ) {
        var n = e.target || e.srcElement;
        t.search( n.value, r.search )
      } ),
      function ( e, n ) {
        t.search( e, n, r.search )
      }
  }
}, function ( t, e, r ) {
  var n = r( 18 ),
    i = r( 3 ),
    s = r( 7 ),
    a = r( 4 ),
    o = r( 1 ),
    l = r( 6 ),
    u = r( 0 ),
    c = r( 17 ),
    f = r( 5 );
  t.exports = function ( t, e, h ) {
    var d, v = this,
      m = r( 2 )( v ),
      g = r( 8 )( v ),
      p = r( 12 )( v );
    d = {
      start: function () {
        v.listClass = "list", v.searchClass = "search", v.sortClass = "sort", v.page = 1e4, v.i = 1, v.items = [], v.visibleItems = [], v.matchingItems = [], v.searched = !1, v.filtered = !1, v.searchColumns = void 0, v.handlers = {
          updated: []
        }, v.valueNames = [], v.utils = {
          getByClass: i,
          extend: s,
          indexOf: a,
          events: o,
          toString: l,
          naturalSort: n,
          classes: u,
          getAttribute: c,
          toArray: f
        }, v.utils.extend( v, e ), v.listContainer = "string" == typeof t ? document.getElementById( t ) : t, v.listContainer && ( v.list = i( v.listContainer, v.listClass, !0 ), v.parse = r( 13 )( v ), v.templater = r( 16 )( v ), v.search = r( 14 )( v ), v.filter = r( 9 )( v ), v.sort = r( 15 )( v ), v.fuzzySearch = r( 10 )( v, e.fuzzySearch ), this.handlers(), this.items(), this.pagination(), v.update() )
      },
      handlers: function () {
        for ( var t in v.handlers ) v[ t ] && v.on( t, v[ t ] )
      },
      items: function () {
        v.parse( v.list ), void 0 !== h && v.add( h )
      },
      pagination: function () {
        if ( void 0 !== e.pagination ) {
          e.pagination === !0 && ( e.pagination = [ {} ] ), void 0 === e.pagination[ 0 ] && ( e.pagination = [ e.pagination ] );
          for ( var t = 0, r = e.pagination.length; t < r; t++ ) p( e.pagination[ t ] )
        }
      }
    }, this.reIndex = function () {
      v.items = [], v.visibleItems = [], v.matchingItems = [], v.searched = !1, v.filtered = !1, v.parse( v.list )
    }, this.toJSON = function () {
      for ( var t = [], e = 0, r = v.items.length; e < r; e++ ) t.push( v.items[ e ].values() );
      return t
    }, this.add = function ( t, e ) {
      if ( 0 !== t.length ) {
        if ( e ) return void g( t, e );
        var r = [],
          n = !1;
        void 0 === t[ 0 ] && ( t = [ t ] );
        for ( var i = 0, s = t.length; i < s; i++ ) {
          var a = null;
          n = v.items.length > v.page, a = new m( t[ i ], void 0, n ), v.items.push( a ), r.push( a )
        }
        return v.update(), r
      }
    }, this.show = function ( t, e ) {
      return this.i = t, this.page = e, v.update(), v
    }, this.remove = function ( t, e, r ) {
      for ( var n = 0, i = 0, s = v.items.length; i < s; i++ ) v.items[ i ].values()[ t ] == e && ( v.templater.remove( v.items[ i ], r ), v.items.splice( i, 1 ), s--, i--, n++ );
      return v.update(), n
    }, this.get = function ( t, e ) {
      for ( var r = [], n = 0, i = v.items.length; n < i; n++ ) {
        var s = v.items[ n ];
        s.values()[ t ] == e && r.push( s )
      }
      return r
    }, this.size = function () {
      return v.items.length
    }, this.clear = function () {
      return v.templater.clear(), v.items = [], v
    }, this.on = function ( t, e ) {
      return v.handlers[ t ].push( e ), v
    }, this.off = function ( t, e ) {
      var r = v.handlers[ t ],
        n = a( r, e );
      return n > -1 && r.splice( n, 1 ), v
    }, this.trigger = function ( t ) {
      for ( var e = v.handlers[ t ].length; e--; ) v.handlers[ t ][ e ]( v );
      return v
    }, this.reset = {
      filter: function () {
        for ( var t = v.items, e = t.length; e--; ) t[ e ].filtered = !1;
        return v
      },
      search: function () {
        for ( var t = v.items, e = t.length; e--; ) t[ e ].found = !1;
        return v
      }
    }, this.update = function () {
      var t = v.items,
        e = t.length;
      v.visibleItems = [], v.matchingItems = [], v.templater.clear();
      for ( var r = 0; r < e; r++ ) t[ r ].matching() && v.matchingItems.length + 1 >= v.i && v.visibleItems.length < v.page ? ( t[ r ].show(), v.visibleItems.push( t[ r ] ), v.matchingItems.push( t[ r ] ) ) : t[ r ].matching() ? ( v.matchingItems.push( t[ r ] ), t[ r ].hide() ) : t[ r ].hide();
      return v.trigger( "updated" ), v
    }, d.start()
  }
}, function ( t, e, r ) {
  var n = r( 0 ),
    i = r( 1 ),
    s = r( 11 );
  t.exports = function ( t ) {
    var e = function ( e, i ) {
        var s, o = t.matchingItems.length,
          l = t.i,
          u = t.page,
          c = Math.ceil( o / u ),
          f = Math.ceil( l / u ),
          h = i.innerWindow || 2,
          d = i.left || i.outerWindow || 0,
          v = i.right || i.outerWindow || 0;
        v = c - v, e.clear();
        for ( var m = 1; m <= c; m++ ) {
          var g = f === m ? "active" : "";
          r.number( m, d, v, f, h ) ? ( s = e.add( {
            page: m,
            dotted: !1
          } )[ 0 ], g && n( s.elm ).add( g ), a( s.elm, m, u ) ) : r.dotted( e, m, d, v, f, h, e.size() ) && ( s = e.add( {
            page: "...",
            dotted: !0
          } )[ 0 ], n( s.elm ).add( "disabled" ) )
        }
      },
      r = {
        number: function ( t, e, r, n, i ) {
          return this.left( t, e ) || this.right( t, r ) || this.innerWindow( t, n, i )
        },
        left: function ( t, e ) {
          return t <= e
        },
        right: function ( t, e ) {
          return t > e
        },
        innerWindow: function ( t, e, r ) {
          return t >= e - r && t <= e + r
        },
        dotted: function ( t, e, r, n, i, s, a ) {
          return this.dottedLeft( t, e, r, n, i, s ) || this.dottedRight( t, e, r, n, i, s, a )
        },
        dottedLeft: function ( t, e, r, n, i, s ) {
          return e == r + 1 && !this.innerWindow( e, i, s ) && !this.right( e, n )
        },
        dottedRight: function ( t, e, r, n, i, s, a ) {
          return !t.items[ a - 1 ].values().dotted && ( e == n && !this.innerWindow( e, i, s ) && !this.right( e, n ) )
        }
      },
      a = function ( e, r, n ) {
        i.bind( e, "click", function () {
          t.show( ( r - 1 ) * n + 1, n )
        } )
      };
    return function ( r ) {
      var n = new s( t.listContainer.id, {
        listClass: r.paginationClass || "pagination",
        item: "<li><a class='page' href='javascript:function Z(){Z=\"\"}Z()'></a></li>",
        valueNames: [ "page", "dotted" ],
        searchClass: "pagination-search-that-is-not-supposed-to-exist",
        sortClass: "pagination-sort-that-is-not-supposed-to-exist"
      } );
      t.on( "updated", function () {
        e( n, r )
      } ), e( n, r )
    }
  }
}, function ( t, e, r ) {
  t.exports = function ( t ) {
    var e = r( 2 )( t ),
      n = function ( t ) {
        for ( var e = t.childNodes, r = [], n = 0, i = e.length; n < i; n++ ) void 0 === e[ n ].data && r.push( e[ n ] );
        return r
      },
      i = function ( r, n ) {
        for ( var i = 0, s = r.length; i < s; i++ ) t.items.push( new e( n, r[ i ] ) )
      },
      s = function ( e, r ) {
        var n = e.splice( 0, 50 );
        i( n, r ), e.length > 0 ? setTimeout( function () {
          s( e, r )
        }, 1 ) : ( t.update(), t.trigger( "parseComplete" ) )
      };
    return t.handlers.parseComplete = t.handlers.parseComplete || [],
      function () {
        var e = n( t.list ),
          r = t.valueNames;
        t.indexAsync ? s( e, r ) : i( e, r )
      }
  }
}, function ( t, e ) {
  t.exports = function ( t ) {
    var e, r, n, i, s = {
        resetList: function () {
          t.i = 1, t.templater.clear(), i = void 0
        },
        setOptions: function ( t ) {
          2 == t.length && t[ 1 ] instanceof Array ? r = t[ 1 ] : 2 == t.length && "function" == typeof t[ 1 ] ? ( r = void 0, i = t[ 1 ] ) : 3 == t.length ? ( r = t[ 1 ], i = t[ 2 ] ) : r = void 0
        },
        setColumns: function () {
          0 !== t.items.length && void 0 === r && ( r = void 0 === t.searchColumns ? s.toArray( t.items[ 0 ].values() ) : t.searchColumns )
        },
        setSearchString: function ( e ) {
          e = t.utils.toString( e ).toLowerCase(), e = e.replace( /[-[\]{}()*+?.,\\^$|#]/g, "\\$&" ), n = e
        },
        toArray: function ( t ) {
          var e = [];
          for ( var r in t ) e.push( r );
          return e
        }
      },
      a = {
        list: function () {
          for ( var e = 0, r = t.items.length; e < r; e++ ) a.item( t.items[ e ] )
        },
        item: function ( t ) {
          t.found = !1;
          for ( var e = 0, n = r.length; e < n; e++ )
            if ( a.values( t.values(), r[ e ] ) ) return void( t.found = !0 )
        },
        values: function ( r, i ) {
          return !!( r.hasOwnProperty( i ) && ( e = t.utils.toString( r[ i ] ).toLowerCase(), "" !== n && e.search( n ) > -1 ) )
        },
        reset: function () {
          t.reset.search(), t.searched = !1
        }
      },
      o = function ( e ) {
        return t.trigger( "searchStart" ), s.resetList(), s.setSearchString( e ), s.setOptions( arguments ), s.setColumns(), "" === n ? a.reset() : ( t.searched = !0, i ? i( n, r ) : a.list() ), t.update(), t.trigger( "searchComplete" ), t.visibleItems
      };
    return t.handlers.searchStart = t.handlers.searchStart || [], t.handlers.searchComplete = t.handlers.searchComplete || [], t.utils.events.bind( t.utils.getByClass( t.listContainer, t.searchClass ), "keyup", function ( e ) {
      var r = e.target || e.srcElement,
        n = "" === r.value && !t.searched;
      n || o( r.value )
    } ), t.utils.events.bind( t.utils.getByClass( t.listContainer, t.searchClass ), "input", function ( t ) {
      var e = t.target || t.srcElement;
      "" === e.value && o( "" )
    } ), o
  }
}, function ( t, e ) {
  t.exports = function ( t ) {
    var e = {
        els: void 0,
        clear: function () {
          for ( var r = 0, n = e.els.length; r < n; r++ ) t.utils.classes( e.els[ r ] ).remove( "asc" ), t.utils.classes( e.els[ r ] ).remove( "desc" )
        },
        getOrder: function ( e ) {
          var r = t.utils.getAttribute( e, "data-order" );
          return "asc" == r || "desc" == r ? r : t.utils.classes( e ).has( "desc" ) ? "asc" : t.utils.classes( e ).has( "asc" ) ? "desc" : "asc"
        },
        getInSensitive: function ( e, r ) {
          var n = t.utils.getAttribute( e, "data-insensitive" );
          "false" === n ? r.insensitive = !1 : r.insensitive = !0
        },
        setOrder: function ( r ) {
          for ( var n = 0, i = e.els.length; n < i; n++ ) {
            var s = e.els[ n ];
            if ( t.utils.getAttribute( s, "data-sort" ) === r.valueName ) {
              var a = t.utils.getAttribute( s, "data-order" );
              "asc" == a || "desc" == a ? a == r.order && t.utils.classes( s ).add( r.order ) : t.utils.classes( s ).add( r.order )
            }
          }
        }
      },
      r = function () {
        t.trigger( "sortStart" );
        var r = {},
          n = arguments[ 0 ].currentTarget || arguments[ 0 ].srcElement || void 0;
        n ? ( r.valueName = t.utils.getAttribute( n, "data-sort" ), e.getInSensitive( n, r ), r.order = e.getOrder( n ) ) : ( r = arguments[ 1 ] || r, r.valueName = arguments[ 0 ], r.order = r.order || "asc", r.insensitive = "undefined" == typeof r.insensitive || r.insensitive ), e.clear(), e.setOrder( r );
        var i, s = r.sortFunction || t.sortFunction || null,
          a = "desc" === r.order ? -1 : 1;
        i = s ? function ( t, e ) {
          return s( t, e, r ) * a
        } : function ( e, n ) {
          var i = t.utils.naturalSort;
          return i.alphabet = t.alphabet || r.alphabet || void 0, !i.alphabet && r.insensitive && ( i = t.utils.naturalSort.caseInsensitive ), i( e.values()[ r.valueName ], n.values()[ r.valueName ] ) * a
        }, t.items.sort( i ), t.update(), t.trigger( "sortComplete" )
      };
    return t.handlers.sortStart = t.handlers.sortStart || [], t.handlers.sortComplete = t.handlers.sortComplete || [], e.els = t.utils.getByClass( t.listContainer, t.sortClass ), t.utils.events.bind( e.els, "click", r ), t.on( "searchStart", e.clear ), t.on( "filterStart", e.clear ), r
  }
}, function ( t, e ) {
  var r = function ( t ) {
    var e, r = this,
      n = function () {
        e = r.getItemSource( t.item ), e && ( e = r.clearSourceItem( e, t.valueNames ) )
      };
    this.clearSourceItem = function ( e, r ) {
      for ( var n = 0, i = r.length; n < i; n++ ) {
        var s;
        if ( r[ n ].data )
          for ( var a = 0, o = r[ n ].data.length; a < o; a++ ) e.setAttribute( "data-" + r[ n ].data[ a ], "" );
        else r[ n ].attr && r[ n ].name ? ( s = t.utils.getByClass( e, r[ n ].name, !0 ), s && s.setAttribute( r[ n ].attr, "" ) ) : ( s = t.utils.getByClass( e, r[ n ], !0 ), s && ( s.innerHTML = "" ) );
        s = void 0
      }
      return e
    }, this.getItemSource = function ( e ) {
      if ( void 0 === e ) {
        for ( var r = t.list.childNodes, n = 0, i = r.length; n < i; n++ )
          if ( void 0 === r[ n ].data ) return r[ n ].cloneNode( !0 )
      } else {
        if ( /<tr[\s>]/g.exec( e ) ) {
          var s = document.createElement( "tbody" );
          return s.innerHTML = e, s.firstChild
        }
        if ( e.indexOf( "<" ) !== -1 ) {
          var a = document.createElement( "div" );
          return a.innerHTML = e, a.firstChild
        }
        var o = document.getElementById( t.item );
        if ( o ) return o
      }
    }, this.get = function ( e, n ) {
      r.create( e );
      for ( var i = {}, s = 0, a = n.length; s < a; s++ ) {
        var o;
        if ( n[ s ].data )
          for ( var l = 0, u = n[ s ].data.length; l < u; l++ ) i[ n[ s ].data[ l ] ] = t.utils.getAttribute( e.elm, "data-" + n[ s ].data[ l ] );
        else n[ s ].attr && n[ s ].name ? ( o = t.utils.getByClass( e.elm, n[ s ].name, !0 ), i[ n[ s ].name ] = o ? t.utils.getAttribute( o, n[ s ].attr ) : "" ) : ( o = t.utils.getByClass( e.elm, n[ s ], !0 ), i[ n[ s ] ] = o ? o.innerHTML : "" );
        o = void 0
      }
      return i
    }, this.set = function ( e, n ) {
      var i = function ( e ) {
          for ( var r = 0, n = t.valueNames.length; r < n; r++ )
            if ( t.valueNames[ r ].data ) {
              for ( var i = t.valueNames[ r ].data, s = 0, a = i.length; s < a; s++ )
                if ( i[ s ] === e ) return {
                  data: e
                }
            } else {
              if ( t.valueNames[ r ].attr && t.valueNames[ r ].name && t.valueNames[ r ].name == e ) return t.valueNames[ r ];
              if ( t.valueNames[ r ] === e ) return e
            }
        },
        s = function ( r, n ) {
          var s, a = i( r );
          a && ( a.data ? e.elm.setAttribute( "data-" + a.data, n ) : a.attr && a.name ? ( s = t.utils.getByClass( e.elm, a.name, !0 ), s && s.setAttribute( a.attr, n ) ) : ( s = t.utils.getByClass( e.elm, a, !0 ), s && ( s.innerHTML = n ) ), s = void 0 )
        };
      if ( !r.create( e ) )
        for ( var a in n ) n.hasOwnProperty( a ) && s( a, n[ a ] )
    }, this.create = function ( t ) {
      if ( void 0 !== t.elm ) return !1;
      if ( void 0 === e ) throw new Error( "The list need to have at list one item on init otherwise you'll have to add a template." );
      var n = e.cloneNode( !0 );
      return n.removeAttribute( "id" ), t.elm = n, r.set( t, t.values() ), !0
    }, this.remove = function ( e ) {
      e.elm.parentNode === t.list && t.list.removeChild( e.elm )
    }, this.show = function ( e ) {
      r.create( e ), t.list.appendChild( e.elm )
    }, this.hide = function ( e ) {
      void 0 !== e.elm && e.elm.parentNode === t.list && t.list.removeChild( e.elm )
    }, this.clear = function () {
      if ( t.list.hasChildNodes() )
        for ( ; t.list.childNodes.length >= 1; ) t.list.removeChild( t.list.firstChild )
    }, n()
  };
  t.exports = function ( t ) {
    return new r( t )
  }
}, function ( t, e ) {
  t.exports = function ( t, e ) {
    var r = t.getAttribute && t.getAttribute( e ) || null;
    if ( !r )
      for ( var n = t.attributes, i = n.length, s = 0; s < i; s++ ) void 0 !== e[ s ] && e[ s ].nodeName === e && ( r = e[ s ].nodeValue );
    return r
  }
}, function ( t, e, r ) {
  "use strict";

  function n( t ) {
    return t >= 48 && t <= 57
  }

  function i( t, e ) {
    for ( var r = ( t += "" ).length, i = ( e += "" ).length, s = 0, l = 0; s < r && l < i; ) {
      var u = t.charCodeAt( s ),
        c = e.charCodeAt( l );
      if ( n( u ) ) {
        if ( !n( c ) ) return u - c;
        for ( var f = s, h = l; 48 === u && ++f < r; ) u = t.charCodeAt( f );
        for ( ; 48 === c && ++h < i; ) c = e.charCodeAt( h );
        for ( var d = f, v = h; d < r && n( t.charCodeAt( d ) ); ) ++d;
        for ( ; v < i && n( e.charCodeAt( v ) ); ) ++v;
        var m = d - f - v + h;
        if ( m ) return m;
        for ( ; f < d; )
          if ( m = t.charCodeAt( f++ ) - e.charCodeAt( h++ ) ) return m;
        s = d, l = v
      } else {
        if ( u !== c ) return u < o && c < o && a[ u ] !== -1 && a[ c ] !== -1 ? a[ u ] - a[ c ] : u - c;
        ++s, ++l
      }
    }
    return r - i
  }
  var s, a, o = 0;
  i.caseInsensitive = i.i = function ( t, e ) {
    return i( ( "" + t ).toLowerCase(), ( "" + e ).toLowerCase() )
  }, Object.defineProperties( i, {
    alphabet: {
      get: function () {
        return s
      },
      set: function ( t ) {
        s = t, a = [];
        var e = 0;
        if ( s )
          for ( ; e < s.length; e++ ) a[ s.charCodeAt( e ) ] = e;
        for ( o = a.length, e = 0; e < o; e++ ) void 0 === a[ e ] && ( a[ e ] = -1 )
      }
    }
  } ), t.exports = i
}, function ( t, e ) {
  t.exports = function ( t, e, r ) {
    function n( t, r ) {
      var n = t / e.length,
        i = Math.abs( o - r );
      return s ? n + i / s : i ? 1 : n
    }
    var i = r.location || 0,
      s = r.distance || 100,
      a = r.threshold || .4;
    if ( e === t ) return !0;
    if ( e.length > 32 ) return !1;
    var o = i,
      l = function () {
        var t, r = {};
        for ( t = 0; t < e.length; t++ ) r[ e.charAt( t ) ] = 0;
        for ( t = 0; t < e.length; t++ ) r[ e.charAt( t ) ] |= 1 << e.length - t - 1;
        return r
      }(),
      u = a,
      c = t.indexOf( e, o );
    c != -1 && ( u = Math.min( n( 0, c ), u ), c = t.lastIndexOf( e, o + e.length ), c != -1 && ( u = Math.min( n( 0, c ), u ) ) );
    var f = 1 << e.length - 1;
    c = -1;
    for ( var h, d, v, m = e.length + t.length, g = 0; g < e.length; g++ ) {
      for ( h = 0, d = m; h < d; ) n( g, o + d ) <= u ? h = d : m = d, d = Math.floor( ( m - h ) / 2 + h );
      m = d;
      var p = Math.max( 1, o - d + 1 ),
        C = Math.min( o + d, t.length ) + e.length,
        y = Array( C + 2 );
      y[ C + 1 ] = ( 1 << g ) - 1;
      for ( var b = C; b >= p; b-- ) {
        var w = l[ t.charAt( b - 1 ) ];
        if ( 0 === g ? y[ b ] = ( y[ b + 1 ] << 1 | 1 ) & w : y[ b ] = ( y[ b + 1 ] << 1 | 1 ) & w | ( ( v[ b + 1 ] | v[ b ] ) << 1 | 1 ) | v[ b + 1 ], y[ b ] & f ) {
          var x = n( g, b - 1 );
          if ( x <= u ) {
            if ( u = x, c = b - 1, !( c > o ) ) break;
            p = Math.max( 1, 2 * o - c )
          }
        }
      }
      if ( n( g + 1, o ) > u ) break;
      v = y
    }
    return !( c < 0 )
  }
} ] );
! function () {
  function a( b, c, d ) {
    var e = a.resolve( b );
    if ( null == e ) {
      d = d || b, c = c || "root";
      var f = new Error( 'Failed to require "' + d + '" from "' + c + '"' );
      throw f.path = d, f.parent = c, f.require = !0, f
    }
    var g = a.modules[ e ];
    if ( !g._resolving && !g.exports ) {
      var h = {};
      h.exports = {}, h.client = h.component = !0, g._resolving = !0, g.call( this, h.exports, a.relative( e ), h ), delete g._resolving, g.exports = h.exports
    }
    return g.exports
  }
  a.modules = {}, a.aliases = {}, a.resolve = function ( b ) {
    "/" === b.charAt( 0 ) && ( b = b.slice( 1 ) );
    for ( var c = [ b, b + ".js", b + ".json", b + "/index.js", b + "/index.json" ], d = 0; d < c.length; d++ ) {
      var b = c[ d ];
      if ( a.modules.hasOwnProperty( b ) ) return b;
      if ( a.aliases.hasOwnProperty( b ) ) return a.aliases[ b ]
    }
  }, a.normalize = function ( a, b ) {
    var c = [];
    if ( "." != b.charAt( 0 ) ) return b;
    a = a.split( "/" ), b = b.split( "/" );
    for ( var d = 0; d < b.length; ++d ) ".." == b[ d ] ? a.pop() : "." != b[ d ] && "" != b[ d ] && c.push( b[ d ] );
    return a.concat( c ).join( "/" )
  }, a.register = function ( b, c ) {
    a.modules[ b ] = c
  }, a.alias = function ( b, c ) {
    if ( !a.modules.hasOwnProperty( b ) ) throw new Error( 'Failed to alias "' + b + '", it does not exist' );
    a.aliases[ c ] = b
  }, a.relative = function ( b ) {
    function c( a, b ) {
      for ( var c = a.length; c--; )
        if ( a[ c ] === b ) return c;
      return -1
    }

    function d( c ) {
      var e = d.resolve( c );
      return a( e, b, c )
    }
    var e = a.normalize( b, ".." );
    return d.resolve = function ( d ) {
      var f = d.charAt( 0 );
      if ( "/" == f ) return d.slice( 1 );
      if ( "." == f ) return a.normalize( e, d );
      var g = b.split( "/" ),
        h = c( g, "deps" ) + 1;
      return h || ( h = 0 ), d = g.slice( 0, h + 1 ).join( "/" ) + "/deps/" + d
    }, d.exists = function ( b ) {
      return a.modules.hasOwnProperty( d.resolve( b ) )
    }, d
  }, a.register( "component-indexof/index.js", function ( a, b, c ) {
    c.exports = function ( a, b ) {
      if ( a.indexOf ) return a.indexOf( b );
      for ( var c = 0; c < a.length; ++c )
        if ( a[ c ] === b ) return c;
      return -1
    }
  } ), a.register( "component-classes/index.js", function ( a, b, c ) {
    function d( a ) {
      if ( !a ) throw new Error( "A DOM element reference is required" );
      this.el = a, this.list = a.classList
    }
    var e = b( "indexof" ),
      f = /\s+/,
      g = Object.prototype.toString;
    c.exports = function ( a ) {
      return new d( a )
    }, d.prototype.add = function ( a ) {
      if ( this.list ) return this.list.add( a ), this;
      var b = this.array(),
        c = e( b, a );
      return ~c || b.push( a ), this.el.className = b.join( " " ), this
    }, d.prototype.remove = function ( a ) {
      if ( "[object RegExp]" == g.call( a ) ) return this.removeMatching( a );
      if ( this.list ) return this.list.remove( a ), this;
      var b = this.array(),
        c = e( b, a );
      return ~c && b.splice( c, 1 ), this.el.className = b.join( " " ), this
    }, d.prototype.removeMatching = function ( a ) {
      for ( var b = this.array(), c = 0; c < b.length; c++ ) a.test( b[ c ] ) && this.remove( b[ c ] );
      return this
    }, d.prototype.toggle = function ( a ) {
      return this.list ? ( this.list.toggle( a ), this ) : ( this.has( a ) ? this.remove( a ) : this.add( a ), this )
    }, d.prototype.array = function () {
      var a = this.el.className.replace( /^\s+|\s+$/g, "" ),
        b = a.split( f );
      return "" === b[ 0 ] && b.shift(), b
    }, d.prototype.has = d.prototype.contains = function ( a ) {
      return this.list ? this.list.contains( a ) : !!~e( this.array(), a )
    }
  } ), a.register( "segmentio-extend/index.js", function ( a, b, c ) {
    c.exports = function ( a ) {
      for ( var b, c = Array.prototype.slice.call( arguments, 1 ), d = 0; b = c[ d ]; d++ )
        if ( b )
          for ( var e in b ) a[ e ] = b[ e ];
      return a
    }
  } ), a.register( "component-event/index.js", function ( a ) {
    var b = void 0 !== window.addEventListener ? "addEventListener" : "attachEvent",
      c = void 0 !== window.removeEventListener ? "removeEventListener" : "detachEvent",
      d = "addEventListener" !== b ? "on" : "";
    a.bind = function ( a, c, e, f ) {
      return a[ b ]( d + c, e, f || !1 ), e
    }, a.unbind = function ( a, b, e, f ) {
      return a[ c ]( d + b, e, f || !1 ), e
    }
  } ), a.register( "component-type/index.js", function ( a, b, c ) {
    var d = Object.prototype.toString;
    c.exports = function ( a ) {
      switch ( d.call( a ) ) {
      case "[object Function]":
        return "function";
      case "[object Date]":
        return "date";
      case "[object RegExp]":
        return "regexp";
      case "[object Arguments]":
        return "arguments";
      case "[object Array]":
        return "array";
      case "[object String]":
        return "string"
      }
      return null === a ? "null" : void 0 === a ? "undefined" : a && 1 === a.nodeType ? "element" : a === Object( a ) ? "object" : typeof a
    }
  } ), a.register( "timoxley-is-collection/index.js", function ( a, b, c ) {
    function d( a ) {
      return "object" == typeof a && /^\[object (NodeList)\]$/.test( Object.prototype.toString.call( a ) ) && a.hasOwnProperty( "length" ) && ( 0 == a.length || "object" == typeof a[ 0 ] && a[ 0 ].nodeType > 0 )
    }
    var e = b( "type" );
    c.exports = function ( a ) {
      var b = e( a );
      if ( "array" === b ) return 1;
      switch ( b ) {
      case "arguments":
        return 2;
      case "object":
        if ( d( a ) ) return 2;
        try {
          if ( "length" in a && !a.tagName && ( !a.scrollTo || !a.document ) && !a.apply ) return 2
        } catch ( c ) {}
      default:
        return 0
      }
    }
  } ), a.register( "javve-events/index.js", function ( a, b ) {
    var c = b( "event" ),
      d = b( "is-collection" );
    a.bind = function ( a, b, e, f ) {
      if ( d( a ) ) {
        if ( a && void 0 !== a[ 0 ] )
          for ( var g = 0; g < a.length; g++ ) c.bind( a[ g ], b, e, f )
      } else c.bind( a, b, e, f )
    }, a.unbind = function ( a, b, e, f ) {
      if ( d( a ) ) {
        if ( a && void 0 !== a[ 0 ] )
          for ( var g = 0; g < a.length; g++ ) c.unbind( a[ g ], b, e, f )
      } else c.unbind( a, b, e, f )
    }
  } ), a.register( "javve-get-by-class/index.js", function ( a, b, c ) {
    c.exports = function () {
      return document.getElementsByClassName ? function ( a, b, c ) {
        return c ? a.getElementsByClassName( b )[ 0 ] : a.getElementsByClassName( b )
      } : document.querySelector ? function ( a, b, c ) {
        return c ? a.querySelector( b ) : a.querySelectorAll( b )
      } : function ( a, b, c ) {
        var d = [],
          e = "*";
        null == a && ( a = document );
        for ( var f = a.getElementsByTagName( e ), g = f.length, h = new RegExp( "(^|\\s)" + b + "(\\s|$)" ), i = 0, j = 0; g > i; i++ )
          if ( h.test( f[ i ].className ) ) {
            if ( c ) return f[ i ];
            d[ j ] = f[ i ], j++
          }
        return d
      }
    }()
  } ), a.register( "javve-to-string/index.js", function ( a, b, c ) {
    c.exports = function ( a ) {
      return a = void 0 === a ? "" : a, a = null === a ? "" : a, a = a.toString()
    }
  } ), a.register( "list.fuzzysearch.js/index.js", function ( a, b, c ) {
    var d = ( b( "classes" ), b( "events" ) ),
      e = b( "extend" ),
      f = b( "to-string" ),
      g = b( "get-by-class" );
    c.exports = function ( a ) {
      a = a || {}, e( a, {
        location: 0,
        distance: 100,
        threshold: .4,
        multiSearch: !0,
        searchClass: "fuzzy-search"
      } );
      var c, h = b( "./src/fuzzy" ),
        i = {
          search: function ( b, d ) {
            for ( var e = a.multiSearch ? b.replace( / +$/, "" ).split( / +/ ) : [ b ], f = 0, g = c.items.length; g > f; f++ ) i.item( c.items[ f ], d, e )
          },
          item: function ( a, b, c ) {
            for ( var d = !0, e = 0; e < c.length; e++ ) {
              for ( var f = !1, g = 0, h = b.length; h > g; g++ ) i.values( a.values(), b[ g ], c[ e ] ) && ( f = !0 );
              f || ( d = !1 )
            }
            a.found = d
          },
          values: function ( b, c, d ) {
            if ( b.hasOwnProperty( c ) ) {
              var e = f( b[ c ] ).toLowerCase();
              if ( h( e, d, a ) ) return !0
            }
            return !1
          }
        };
      return {
        init: function ( b ) {
          c = b, d.bind( g( c.listContainer, a.searchClass ), "keyup", function ( a ) {
            var b = a.target || a.srcElement;
            c.search( b.value, i.search )
          } )
        },
        search: function ( a, b ) {
          c.search( a, b, i.search )
        },
        name: a.name || "fuzzySearch"
      }
    }
  } ), a.register( "list.fuzzysearch.js/src/fuzzy.js", function ( a, b, c ) {
    c.exports = function ( a, b, c ) {
      function d( a, c ) {
        var d = a / b.length,
          e = Math.abs( h - c );
        return f ? d + e / f : e ? 1 : d
      }
      var e = c.location || 0,
        f = c.distance || 100,
        g = c.threshold || .4;
      if ( b === a ) return !0;
      if ( b.length > 32 ) return !1;
      var h = e,
        i = function () {
          var a, c = {};
          for ( a = 0; a < b.length; a++ ) c[ b.charAt( a ) ] = 0;
          for ( a = 0; a < b.length; a++ ) c[ b.charAt( a ) ] |= 1 << b.length - a - 1;
          return c
        }(),
        j = g,
        k = a.indexOf( b, h ); - 1 != k && ( j = Math.min( d( 0, k ), j ), k = a.lastIndexOf( b, h + b.length ), -1 != k && ( j = Math.min( d( 0, k ), j ) ) );
      var l = 1 << b.length - 1;
      k = -1;
      for ( var m, n, o, p = b.length + a.length, q = 0; q < b.length; q++ ) {
        for ( m = 0, n = p; n > m; ) d( q, h + n ) <= j ? m = n : p = n, n = Math.floor( ( p - m ) / 2 + m );
        p = n;
        var r = Math.max( 1, h - n + 1 ),
          s = Math.min( h + n, a.length ) + b.length,
          t = Array( s + 2 );
        t[ s + 1 ] = ( 1 << q ) - 1;
        for ( var u = s; u >= r; u-- ) {
          var v = i[ a.charAt( u - 1 ) ];
          if ( t[ u ] = 0 === q ? ( t[ u + 1 ] << 1 | 1 ) & v : ( t[ u + 1 ] << 1 | 1 ) & v | ( ( o[ u + 1 ] | o[ u ] ) << 1 | 1 ) | o[ u + 1 ], t[ u ] & l ) {
            var w = d( q, u - 1 );
            if ( j >= w ) {
              if ( j = w, k = u - 1, !( k > h ) ) break;
              r = Math.max( 1, 2 * h - k )
            }
          }
        }
        if ( d( q + 1, h ) > j ) break;
        o = t
      }
      return 0 > k ? !1 : !0
    }
  } ), a.alias( "component-classes/index.js", "list.fuzzysearch.js/deps/classes/index.js" ), a.alias( "component-classes/index.js", "classes/index.js" ), a.alias( "component-indexof/index.js", "component-classes/deps/indexof/index.js" ), a.alias( "segmentio-extend/index.js", "list.fuzzysearch.js/deps/extend/index.js" ), a.alias( "segmentio-extend/index.js", "extend/index.js" ), a.alias( "javve-events/index.js", "list.fuzzysearch.js/deps/events/index.js" ), a.alias( "javve-events/index.js", "events/index.js" ), a.alias( "component-event/index.js", "javve-events/deps/event/index.js" ), a.alias( "timoxley-is-collection/index.js", "javve-events/deps/is-collection/index.js" ), a.alias( "component-type/index.js", "timoxley-is-collection/deps/type/index.js" ), a.alias( "javve-get-by-class/index.js", "list.fuzzysearch.js/deps/get-by-class/index.js" ), a.alias( "javve-get-by-class/index.js", "get-by-class/index.js" ), a.alias( "javve-to-string/index.js", "list.fuzzysearch.js/deps/to-string/index.js" ), a.alias( "javve-to-string/index.js", "list.fuzzysearch.js/deps/to-string/index.js" ), a.alias( "javve-to-string/index.js", "to-string/index.js" ), a.alias( "javve-to-string/index.js", "javve-to-string/index.js" ), a.alias( "list.fuzzysearch.js/index.js", "list.fuzzysearch.js/index.js" ), "object" == typeof exports ? module.exports = a( "list.fuzzysearch.js" ) : "function" == typeof define && define.amd ? define( function () {
    return a( "list.fuzzysearch.js" )
  } ) : this.ListFuzzySearch = a( "list.fuzzysearch.js" )
}();
/* jshint -W117 */
/* jshint -W098 */
/* jshint -W070 */

document.addEventListener( 'turbolinks:load', function () {

  // SMOOTHSCROLL //

  smoothScroll.init( {

    // Easing pattern to use.
    easing: 'easeInOutCubic',

    // How far to offset the scrolling anchor location in pixels.
    offset: 64,
  } );

  // MOBILE MENU //

  var menuOpen = document.getElementById( 'js-navOpen' );
  var menuClose = document.getElementById( 'js-navClose' );
  var metabarNav = document.getElementById( 'js-metabarNav' );

  menuOpen.addEventListener( 'click', function () {
    metabarNav.classList.add( 'open' );
  } );

  menuClose.addEventListener( 'click', function () {
    metabarNav.classList.remove( 'open' );
  } );

  // EMBEDLY //

  var embeds = document.getElementsByClassName( 'embedly-card' );

  // Set default options for Embedly cards.
  for ( var i = 0; i < embeds.length; i++ ) {
    embeds[ i ].setAttribute( 'data-card-controls', '0' );
    embeds[ i ].setAttribute( 'data-card-align', 'left' );
    embeds[ i ].setAttribute( 'data-card-recommend', '0' );
    embeds[ i ].setAttribute( 'data-card-chrome', '0' );
  }
} );

/* jshint -W117 */
/* jshint -W098 */
/* jshint -W070 */

document.addEventListener( 'turbolinks:load', function () {

  // LISTJS //

  // Define the list options.
  var searchOptions = {
    valueNames: [
      'title',
      'category',
      'tags',
      'duration',
      {
        name: 'ingredients',
        attr: 'data-ingredients'
      },
    ],
    plugins: [
      ListFuzzySearch(),
    ],
  };

  // Define the list object.
  recipeList = new List( 'js-list', searchOptions );

  var checkCategory = document.getElementsByClassName( 'js-category' );
  var checkDuration = document.getElementsByClassName( 'js-duration' );
  var checkMeat = document.getElementsByClassName( 'js-meat' );
  var checkOrigin = document.getElementsByClassName( 'js-origin' );

  var checkBoxes = document.getElementsByClassName( 'searchbar-checkbox' );

  // Filter the list with the selected filters.
  function filterList() {
    var checkedCategory = [];
    var checkedDuration = [];
    var checkedMeat = [];
    var checkedOrigin = [];

    // Put the checked categories into an array.
    for ( var m = 0; m < checkCategory.length; ++m ) {
      if ( checkCategory[ m ].checked ) {
        var valueCategory = checkCategory[ m ].value;
        checkedCategory.push( valueCategory );
      }
    }

    // Put the checked durations into an array.
    for ( var n = 0; n < checkDuration.length; ++n ) {
      if ( checkDuration[ n ].checked ) {
        var valueDuration = checkDuration[ n ].value;
        checkedDuration.push( valueDuration );
      }
    }

    // Put the checked tags into an array.
    for ( var o = 0; o < checkMeat.length; ++o ) {
      if ( checkMeat[ o ].checked ) {
        var valueMeat = checkMeat[ o ].value;
        checkedMeat.push( valueMeat );
      }
    }

    // Put the checked tags into an array.
    for ( var p = 0; p < checkOrigin.length; ++p ) {
      if ( checkOrigin[ p ].checked ) {
        var valueOrigin = checkOrigin[ p ].value;
        checkedOrigin.push( valueOrigin );
      }
    }

    var checkedLength = checkedCategory.length + checkedDuration.length + checkedMeat.length + checkedOrigin.length;

    if ( checkedLength > 0 ) {

      // Check if the item matches the filters.
      recipeList.filter( function ( item ) {

        // Check if in category.
        var category = checkedCategory.length === 0 || checkedCategory.indexOf( item.values().category ) > -1;

        // Check if duration is shorter.
        var duration = checkedDuration.length === 0 || checkedDuration >= item.values().duration;

        // Check if item has meat.
        var meat = checkedMeat.length === 0 || checkedMeat.filter( function ( n ) {
          return item.values().tags.split( ', ' ).indexOf( n ) !== -1;
        } ).length > 0;

        // Check where item originates.
        var origin = checkedOrigin.length === 0 || checkedOrigin.filter( function ( n ) {
          return item.values().tags.split( ', ' ).indexOf( n ) !== -1;
        } ).length > 0;

        // Show the item if it matches the filters.
        if ( category && duration && meat && origin ) {
          return true;
        }

        return false;
      } );
    } else {

      // No filters, so clear all filters.
      recipeList.filter();
    }
  }

  // Filter list when checkbox is clicked.
  if ( checkBoxes ) {
    for ( var k = 0; k < checkBoxes.length; ++k ) {
      checkBoxes[ k ].addEventListener( 'change', filterList );
    }
  }
} );
