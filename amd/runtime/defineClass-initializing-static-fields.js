define(["shims!Object!create", "shim!Array.prototype.forEach"], function() {
  "use strict";
  function initializingGetter(name) {
    return function() { this.$$ && this.$$(); return this[name]; };
  }
  function initializingSetter(name) {
    return function(value) { this.$$ && this.$$(); this[name] = value; };
  }
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
    var staticMembersWithInitializer = {};
    Object.defineProperty(clazz, "$$", {
      value: function() {
        delete clazz.$$;   // self-destruct to execute only once
        Object.defineProperties(clazz, staticMembersWithInitializer); // restore static members with initializer
        extends_.$$ && extends_.$$();   // ensure super class is initialized
        // then, execute static initializers:
        for (var name in staticMembersWithInitializer) {
          var staticInitializer = staticInitializers[name];
          Object.defineProperty(clazz, name, {
            value: staticInitializer(),
            writable: !!staticMembersWithInitializer[name].writable,
            configurable: false  // not anymore...
          });
        }
        // then, execute static code:
        staticCode && staticCode();
      },
      configurable: true  // so we can delete it
    });
    // wrap static fields with initializer in initializing getter / setter:
    for (var name in staticInitializers) {
      var initializer = staticInitializers[name];
      var staticMember = staticMembers[name];
      // back-up property definition to restore property in $$:
      staticMembersWithInitializer[name] = staticMember;
      staticMember.configurable = true; // so we can overwrite it
      // replace static field by initializing getter / setter:
      staticMembers[name] = {
        get: initializingGetter(name),
        configurable: true // so we can overwrite it
      };
      if (staticMember.writable) {
        staticMembers[name].set = initializingSetter(name);
      }
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
