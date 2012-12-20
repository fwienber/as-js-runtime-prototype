define(["as3/is"], function(is_) {
  "use strict";
  return function as(object, type) {
    return is_(object, type) ? object : null;
  };
});
