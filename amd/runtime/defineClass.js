define(["shims!Object!create", "shim!Array.prototype.forEach"], function() {
  "use strict";
  function toString() {
    return "[Class " + this.name + "]";
  }
  return function(clazz, config) {
    var extends_ = config.extends_ || Object;
    var implements_ = config.implements_ ? typeof config.implements_ === "function" ? [config.implements_] : config.implements_ : [];
    var members = config.members || {};
    var staticMembers = config.staticMembers || {};
    var staticInitializers = config.staticInitializers || {};
    var staticCode = config.staticCode;
    Object.defineProperty(clazz, "$$", {
      value: function() {
        delete clazz.$$;   // self-destruct to execute only once
        extends_.$$ && extends_.$$();   // ensure super class is initialized
        // then, execute static initializers:
        for (var name in staticInitializers) {
          var staticInitializer = staticInitializers[name];
          Object.defineProperty(clazz, name, {
            value: staticInitializer(),
            writable: !!staticMembers[name].writable,
            configurable: false  // not anymore...
          });
        }
        // then, execute static code:
        staticCode && staticCode();
      },
      configurable: true  // so we can delete it
    });
    // make all static fields with initializer configurable, so we can redefine them:
    for (var name in staticInitializers) {
      var staticMember = staticMembers[name];
      staticMember.configurable = true; // so we can overwrite it
    }
    // create set of all interfaces implemented by this class
    var $implements = extends_.$implements ? Object.create(extends_.$implements) : {};
    implements_.forEach(function(i) { i($implements); });
    staticMembers.$implements = { value: $implements };

    Object.defineProperties(clazz, staticMembers);   // add static members
    Object.defineProperty(clazz, "toString", { value: toString }); // add Class#toString()
    clazz.prototype = Object.create(extends_.prototype); // establish inheritance prototype chain
    Object.defineProperty(clazz.prototype, "constructor", { value: clazz }); // correct constructor property
    Object.defineProperties(clazz.prototype, members); // add instance members
    return clazz;
  }
});
