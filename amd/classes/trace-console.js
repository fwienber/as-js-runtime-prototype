define(["native!Array.prototype.map@runtime/es5-polyfills"], function() {
  "use strict";
  try {
    console.log("This is FlexJS.");
  } catch (e) {
    // no global "console" object? Use print()
    return function trace() {
      var msg = Array.prototype.map.call(arguments, String).join(" ");
      print(msg);
    };
  }
  return function trace() {
    var msg = Array.prototype.map.call(arguments, String).join(" ");
    console.log(msg);
  };
});
