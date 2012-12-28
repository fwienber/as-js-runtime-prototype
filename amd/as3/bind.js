define(["runtime/es5-polyfills"], function() {
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