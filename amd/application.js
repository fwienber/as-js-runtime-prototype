require.config({
  paths: {
    "classes/trace": "classes/trace-console"
  }
});
require(["classes/HelloWorld"], function(HelloWorld_) {
  new (HelloWorld_._ || HelloWorld_._$get())();
});
