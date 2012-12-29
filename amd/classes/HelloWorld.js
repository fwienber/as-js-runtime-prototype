"use strict";
define(["runtime/AS3", "./trace","./com/acme/B","./com/acme/A","./com/acme/I","./com/acme/sub/IOther","./com/acme/sub/ISub"],
  function(      AS3,     trace,             B,             A,             I,                 IOther,                 ISub) {
    "use strict";
    function HelloWorld() {
      trace((B.$$&&B.$$(),B).now);
      trace(B.nowPlusOne());

      var b = new B('hello ');
      trace("b = new B('hello '): " + b);
      trace("b.foo(3): " + b.foo(3));
      trace("b.baz(): " + b.baz());
      trace("b is A: " + AS3.is(b, A));
      trace("b is B: " + AS3.is(b, B));
      trace("b is I: " + AS3.is(b, I));
      trace("b is ISub: " + AS3.is(b, ISub));
      trace("b is IOther: " + AS3.is(b, IOther));

      var a = new A('aha');
      trace("a = new A('aha'): " + a);
      trace("a is A: " + AS3.is(a, A));
      trace("a is B: " + AS3.is(a, B));
      trace("a is I: " + AS3.is(a, I));
      trace("a is ISub: " + AS3.is(a, ISub));
      trace("a is IOther: " + AS3.is(a, IOther));
    }
    return AS3.class_(HelloWorld, {
      // no members etc.
    });
  });
