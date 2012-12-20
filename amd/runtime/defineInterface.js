define(["shim!Array.prototype.forEach"], function() {
  "use strict";
  return function(fullyQualifiedName, extends_) {
    function Interface($implements) {
      extends_.forEach(function(i) { i($implements); });
      $implements[fullyQualifiedName] = true;
      return $implements;
    }
    Interface.$interface = fullyQualifiedName;
    return Interface;
  };
});
