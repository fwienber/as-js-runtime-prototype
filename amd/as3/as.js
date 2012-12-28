define(["./is"], function(is_) {
  "use strict";
  return function as(object, type) {
    return is_(object, type) ? object : null;
  };
});
