define(["runtime/AS3", "./I", "classes/trace"],
        function(AS3,     I,           trace) {
  "use strict";

  return AS3.class_(function() {
    // constructor / class:
    function A(msg/*:String*/) {
/* 5*/    this.set$msg(msg); // rewritten property set access; in ES5 environments, this.msg = msg works, too.
    }

    // private method:
    function secret(n) {
/*21*/    return this.get$msg() + n; // complemented "this." and rewritten property get access; in ES5 environments, this.msg works, too.
    }

    return {
      implements_: I,
      members: {
        constructor: A,
        // define private field (renamed!) with typed default value:
        _msg$1: { value: 0, writable: true },

        // property defined through public getter/setter:
        msg: {
          // public getter:
          get: function get$msg()/*:String*/ {
/*11*/      return String(this._msg$1); // rewritten private field access
          },
          // public setter
          set: function set$msg(value/*:String*/)/*:void*/ {
/*17*/      this._msg$1 = parseInt(value, 10) >> 0; // rewritten private field access + int coercion
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
/*34*/    return x + 1;
        }
      },

      staticCode: function() {
/*14*/  trace("Class A is initialized!");
      }
    };
  });
});
