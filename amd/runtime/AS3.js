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
        if (propertyDescriptor.get) {
          result["get$" + name] = { value: propertyDescriptor.get };
        }
        if (propertyDescriptor.set) {
          result["set$" + name] = { value: propertyDescriptor.set };
        }
      }
    }
    return result;
  }
  function defineClass(exports, definingCode) {
    Object.defineProperty(exports, "_", {
      configurable: true,
      get: function() {
        var config = definingCode();
        var members = convertShortcuts(config.members);
        var clazz = members.constructor.value;
        Object.defineProperty(this, "_", { value: clazz });
        var extends_ = config.extends_ || Object; // super class
        var implements_ = config.implements_ ? typeof config.implements_ === "function" ? [config.implements_] : config.implements_ : [];
        var staticMembers = convertShortcuts(config.staticMembers);
        // create set of all interfaces implemented by this class
        var $implements = extends_.$implements ? Object.create(extends_.$implements) : {};
        implements_.forEach(function(i) { i($implements); });
        staticMembers.$implements = { value: $implements };

        staticMembers.toString = { value: toString }; // add Class#toString()
        Object.defineProperties(clazz, staticMembers);   // add static members
        clazz.prototype = Object.create(extends_.prototype, members); // establish inheritance prototype chain and add instance members

        var staticCode = config.staticCode;
        // execute static initializers and code:
        staticCode && staticCode();
        return clazz;
      }
    });
  }

  function defineInterface(fullyQualifiedName, extends_) {
    function Interface($implements) {
      extends_.forEach(function(i) { i($implements); });
      $implements[fullyQualifiedName] = true;
      return $implements;
    }
    Interface.isInstance = function(object) {
      return object !== null && typeof object === "object" &&
              !!object.constructor.$implements &&
              fullyQualifiedName in object.constructor.$implements;
    };
    Interface.toString = function toString() {
      return "[Interface " + fullyQualifiedName + "]";
    };
    return Interface;
  }

  function bind(object, method, boundMethodName) {
    if (object.hasOwnProperty(boundMethodName)) {
      return object[boundMethodName];
    }
    var boundMethod = method.bind(object);
    Object.defineProperty(object, boundMethodName, { value: boundMethod });
    return boundMethod;
  }

  function is(object, type) {
    return !!type && object !== undefined && object !== null &&
      // instanceof returns false negatives in some browsers, so check constructor property, too:
      (object instanceof type || object.constructor === type ||
      // "type" may be an interface:
      typeof type.isInstance === "function" && type.isInstance(object));
  }

  function as(object, type) {
    return is(object, type) ? object : null;
  }

  function cast(type, object) {
    if (object === undefined || object === null) {
      return null;
    }
    if (object instanceof type || object.constructor === type ||
      // "type" may be an interface:
      typeof type.isInstance === "function" && type.isInstance(object)) {
      return object;
    }
    throw new TypeError("'" + object + "' cannot be cast to " + type + ".");
  }

  return {
    class_: defineClass,
    interface_: defineInterface,
    as: as,
    cast: cast,
    is: is,
    bind: bind
  }
});
