define(["runtime/es5-polyfills"], function() {
  "use strict";
  try {
    console.log("This is FlexJS.");
  } catch (e) {
    // no global "console" object?
    return function() {}; // use empty trace() function
  }
  return function trace() {
    var msg = Array.prototype.map.call(arguments, String).join(" ");
    console.log(msg);
  };
});
