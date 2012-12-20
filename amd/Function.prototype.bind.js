//----------------------------------------------------------------------
//
// ECMAScript 5 Polyfills
//
//----------------------------------------------------------------------

//----------------------------------------------------------------------
// ES5 15.3 Function Objects
//----------------------------------------------------------------------

// ES5 15.3.4.5 Function.prototype.bind ( thisArg [, arg1 [, arg2, ... ]] )
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind

// As a shim plugin, this breaks normal modularity by altering globals for sake of enabling standards on non-supporting browsers
// Adapted from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/keys
define(function () {
  "use strict";
  if (Function.prototype.bind) { // Better to use shim plugin to detect presence, as reusable for other shims
    return Function.prototype.bind;
  }
  return function (o) {
    if (typeof this !== 'function') { throw new TypeError("Bind must be called on a function"); }
    var slice = [].slice,
            args = slice.call(arguments, 1),
            self = this,
            bound = function () {
              return self.apply(this instanceof nop ? this : (o || {}),
                      args.concat(slice.call(arguments)));
            };

    /** @constructor */
    function nop() {}
    nop.prototype = self.prototype;

    bound.prototype = new nop();

    return bound;
  };
});
