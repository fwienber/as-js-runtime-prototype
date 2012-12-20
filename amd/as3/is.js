define(function() {
  "use strict";
  return function is(object, type) {
    return !!type && object !== undefined && object !== null &&
      // constructor or instanceof may return false negatives:
      (object instanceof type || object.constructor === type ||
      // only Objects may implement an interface:
      !!type.$interface && typeof object === "object" &&
      !!object.constructor.$implements && type.$interface in object.constructor.$implements);
  };
});
