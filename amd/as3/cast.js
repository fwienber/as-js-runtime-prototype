define(function() {
  "use strict";
  return function cast(type, object) {
    if (object === undefined || object === null) {
      return null;
    }
    if (object instanceof type || object.constructor === type ||
        // "type" may be an interface:
        typeof type.isInstance === "function" && type.isInstance(object)) {
      return object;
    }
    throw new TypeError("'" + object + "' cannot be cast to " + type + ".");
  };
});
