define(function() {
  "use strict";
  return function is(object, type) {
    return !!type && object !== undefined && object !== null &&
      // instanceof returns false negatives in some browsers, so check constructor property, too:
      (object instanceof type || object.constructor === type ||
      // "type" may be an interface:
       typeof type.isInstance === "function" && type.isInstance(object));
  };
});
