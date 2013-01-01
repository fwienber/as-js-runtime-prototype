define(["runtime/AS3", "classes/trace", "./A", "./sub/IOther", "./sub/ISub"],
        function(AS3,           trace,     A_,        IOther,         ISub) {
  "use strict";

  return AS3.class_(function() {
    var A = A_._ || A_.get$_(); // initialize super class. Only do this for super class, as there can be no cyclic dependencies!
    // constructor / class:
    function B(msg, count) {
/*19*/    this.barfoo = A.bar(3); // inlined field initializer
/*12*/    A.call(this, msg); // rewritten super call
/*13*/    this.count = count;
/*14*/    trace("now: " + B.now);
    }

    return { extends_: A, implements_: [IOther, ISub],
      members: {
        constructor: B,
        // public field with typed default value:
        count:  { value: 0, writable: true },

        // public method (overriding):
        foo: function foo(x) {
/*22*/    return A.prototype.foo.call(this, x + 2) + "-sub"; // rewritten super method call
        }
      },

      staticMembers: {
        // public static method:
        nowPlusOne: function nowPlusOne() {
/* 8*/    return new Date(B.now.getTime() + 60*60*1000);
        },

        // public static field:
        now: { value: null, writable: true }
      },

      staticCode: function() {
/*25*/    B.now = new Date();
      }
    };
  });
});
