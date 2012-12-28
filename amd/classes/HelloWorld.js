"use strict";
define(["runtime/defineClass", "as3/is","./trace","./com/acme/B","./com/acme/A","./com/acme/I","./com/acme/sub/IOther","./com/acme/sub/ISub"],
  function(      defineClass,       is_,   trace,             B,             A,             I,                 IOther,                 ISub) {
    "use strict";
    function HelloWorld() {
      trace((B.$$&&B.$$(),B).now);
      trace(B.nowPlusOne());

      var b = new B('hello ');
      trace("b = new B('hello '): " + b);
      trace("b.foo(3): " + b.foo(3));
      trace("b.baz(): " + b.baz());
      trace("b is A: " + is_(b, A));
      trace("b is B: " + is_(b, B));
      trace("b is I: " + is_(b, I));
      trace("b is ISub: " + is_(b, ISub));
      trace("b is IOther: " + is_(b, IOther));

      var a = new A('aha');
      trace("a = new A('aha'): " + a);
      trace("a is A: " + is_(a, A));
      trace("a is B: " + is_(a, B));
      trace("a is I: " + is_(a, I));
      trace("a is ISub: " + is_(a, ISub));
      trace("a is IOther: " + is_(a, IOther));
    }
    return defineClass(HelloWorld, {
      // no members etc.
    });
  });
