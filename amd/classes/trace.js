define(["native!Array.prototype.map@runtime/es5-polyfills"], function() {
  "use strict";
  return function trace() {
    var msg = Array.prototype.map.call(arguments, String).join(" ");
    var logWindow = document.createElement("div");
    logWindow.appendChild(document.createTextNode(msg));
    document.body.appendChild(logWindow);
  }
});
