define(function() {
  "use strict";
  return function cast(type, object) {
    if (object === undefined || object === null) {
      return null;
    }
    if (object instanceof type || object.constructor === type ||
      // only Objects may implement an interface:
      !!type.$interface && typeof object === "object" &&
      !!object.constructor.$implements && type.$interface in object.constructor.$implements) {
      return object;
    }
    throw new TypeError("'" + object + "' cannot be cast to " + type + ".");
  };
});
