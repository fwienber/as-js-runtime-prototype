define(["shims!Object!create", "shim!Function.prototype.bind"], function() {
  "use strict";
  return function(object, method, boundMethodName) {
    var boundMethod = object[boundMethodName];
    if (!boundMethod) {
      boundMethod = method.bind(object);
      Object.defineProperty(object, boundMethodName, { value: boundMethod });
    }
    return boundMethod;
  };
});