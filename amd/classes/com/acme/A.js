define(["runtime/AS3", "./I", "classes/trace"],
        function(AS3,     I,           trace) {
  "use strict";

  // constructor / class:
  function A(msg/*:String*/) {
          A.$$ && A.$$(); // execute static code once on first usage
/* 5*/    this.msg = msg;
  }

  // private method:
  function secret(n) {
/*21*/    return this.msg + n; // complemented "this."
  }

  return AS3.class_(A, { implements_: I,
    members: {
      // define private field (renamed!) with typed default value:
      _msg$1: { value: null, writable: true },

      // property defined through public getter/setter:
      msg: {
        // public getter:
        get: function get_msg()/*:String*/ {
/*11*/    return this._msg$1; // rewritten private field access
        },
        // public setter
        set: function set_msg(value/*:String*/)/*:void*/ {
/*17*/    this._msg$1 = value; // rewritten private field access
        }
      },

      // public method:
      foo: function foo(x) {
/*25*/    return secret.call(this, A.bar(x)); // rewritten private method call
      },

      // public method:
      baz: function baz() {
/*29*/    var tmp = AS3.bind(this, secret, "secret$1"); // rewritten method access w/o invocation
/*30*/    return tmp("-bound");
      }
    },

    staticMembers: {
      // public static method:
      bar: function bar(x) {
          A.$$ && A.$$(); // execute static code once on first usage
/*34*/    return x + 1;
      }
    },

    staticCode: function() {
/*14*/  trace("Class A is initialized!");
    }
  });
});
