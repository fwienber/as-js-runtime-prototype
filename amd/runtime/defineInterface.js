define(["./es5-polyfills"], function() {
  "use strict";
  return function(fullyQualifiedName, extends_) {
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
  };
});
