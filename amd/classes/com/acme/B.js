define(["runtime/defineClass", "as3/trace", "./A", "./sub/IOther", "./sub/ISub"],
        function(defineClass,       trace,     A,         IOther,         ISub) {
  "use strict";

  // constructor / class:
  function B(msg, count) {
          B.$$ && B.$$(); // ensure class is initialized
/*19*/    this.barfoo = A.bar(3); // inlined field initializer
/*12*/    A.call(this, msg); // rewritten super call
/*13*/    this.count = count;
/*14*/    trace("now: " + B.now);
  }

  return defineClass(B, { extends_: A, implements_: [IOther, ISub],
    members: {
      // public field with typed default value:
      count:  { value: 0, writable: true },

      // public method (overriding):
      foo: { value: function foo(x) {
/*22*/    return A.prototype.foo.call(this, x + 2) + "-sub"; // rewritten super method call
      }}
    },

    staticMembers: {
      // public static method:
      nowPlusOne: { value: function nowPlusOne() {
          B.$$ && B.$$(); // ensure class is initialized
/* 8*/    return new Date(B.now.getTime() + 60*60*1000);
      }},

      // public static field:
      now: { value: null, writable: true }
    },
      
    staticInitializers: {
      now: function() {
/*25*/    return new Date();
      }
    }
  });
});
