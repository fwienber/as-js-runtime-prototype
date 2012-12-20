// As a shim plugin, this breaks normal modularity by altering globals for sake of enabling standards on non-supporting browsers
// Adapted from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/keys
define(function () {
  "use strict";
  //----------------------------------------------------------------------
  //
  // ECMAScript 5 Polyfills
  //
  //----------------------------------------------------------------------

  //----------------------------------------------------------------------
  // ES5 15.2 Object Objects
  //----------------------------------------------------------------------

  //
  // ES5 15.2.3 Properties of the Object Constructor
  //

  if (Object.create) { // Better to use shim plugin to detect presence, as reusable for other shims
    return;
  }
  // if Object.create is not defined, *always* also redefine Object.defineProperty and Object.defineProperties,
  // as IE8 implements them only for DOM objects!

  // ES5 15.2.3.5 Object.create ( O [, Properties] )
  Object.create = function (prototype, properties) {
    if (prototype !== Object(prototype)) { throw new TypeError(); }
    /** @constructor */
    function Ctor() {}
    Ctor.prototype = prototype;
    var o = new Ctor();
    o.constructor = Ctor;
    if (arguments.length > 1) {
      if (properties !== Object(properties)) { throw new TypeError(); }
      Object.defineProperties(o, properties);
    }
    return o;
  };

  // ES 15.2.3.6 Object.defineProperty ( O, P, Attributes )
  // Partial support for most common case - getters, setters, and values
  var orig = Object.defineProperty;
  Object.defineProperty = function (o, prop, desc) {
    "use strict";

    // In IE8 try built-in implementation for defining properties on DOM prototypes.
    if (orig) { try { return orig(o, prop, desc); } catch (e) {} }

    if (o !== Object(o)) { throw new TypeError("Object.defineProperty called on non-object"); }
    if (Object.prototype.__defineGetter__ && ('get' in desc)) {
      Object.prototype.__defineGetter__.call(o, prop, desc.get);
    }
    if (Object.prototype.__defineSetter__ && ('set' in desc)) {
      Object.prototype.__defineSetter__.call(o, prop, desc.set);
    }
    if ('value' in desc) {
      o[prop] = desc.value;
    }
    return o;
  };

  // ES 15.2.3.7 Object.defineProperties ( O, Properties )
  Object.defineProperties = function (o, properties) {
    "use strict";
    if (o !== Object(o)) { throw new TypeError("Object.defineProperties called on non-object"); }
    var name;
    for (name in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, name)) {
        Object.defineProperty(o, name, properties[name]);
      }
    }
    return o;
  };
});
