define(["./es5-polyfills"], function() {
  "use strict";
  function toString() {
    return "[Class " + this.name + "]";
  }
  function convertShortcuts(propertyDescriptors) {
    var result = {};
    if (propertyDescriptors) {
      for (var name in propertyDescriptors) {
        var propertyDescriptor = propertyDescriptors[name];
        result[name] = propertyDescriptor !== null && typeof propertyDescriptor === "object" ? propertyDescriptor
          // anything *not* an object is a shortcut for a property descriptor with that value (non-writable, non-enumerable, non-configurable):
                : { value: propertyDescriptor };
      }
    }
    return result;
  }
  return function(clazz, config) {
    var extends_ = config.extends_ || Object;
    var implements_ = config.implements_ ? typeof config.implements_ === "function" ? [config.implements_] : config.implements_ : [];
    var members = convertShortcuts(config.members);
    var staticMembers = convertShortcuts(config.staticMembers);
    var staticInitializers = config.staticInitializers || {};
    var staticCode = config.staticCode;
    staticMembers.$$ = {
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
    };
    // make all static fields with initializer configurable, so we can redefine them:
    for (var name in staticInitializers) {
      staticMembers[name].configurable = true; // so we can overwrite it
    }
    // create set of all interfaces implemented by this class
    var $implements = extends_.$implements ? Object.create(extends_.$implements) : {};
    implements_.forEach(function(i) { i($implements); });
    staticMembers.$implements = { value: $implements };

    staticMembers.toString = { value: toString }; // add Class#toString()
    Object.defineProperties(clazz, staticMembers);   // add static members
    members.constructor = { value: clazz }; // correct constructor property
    clazz.prototype = Object.create(extends_.prototype, members); // establish inheritance prototype chain and add instance members
    return clazz;
  }
});
