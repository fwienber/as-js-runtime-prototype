"use strict";
define(["runtime/runtime", "./trace","./com/acme/B","./com/acme/A","./com/acme/I","./com/acme/sub/IOther","./com/acme/sub/ISub"],
  function(      $rt,         trace,             B,             A,             I,                 IOther,                 ISub) {
    "use strict";
    function HelloWorld() {
      trace((B.$$&&B.$$(),B).now);
      trace(B.nowPlusOne());

      var b = new B('hello ');
      trace("b = new B('hello '): " + b);
      trace("b.foo(3): " + b.foo(3));
      trace("b.baz(): " + b.baz());
      trace("b is A: " + $rt.is(b, A));
      trace("b is B: " + $rt.is(b, B));
      trace("b is I: " + $rt.is(b, I));
      trace("b is ISub: " + $rt.is(b, ISub));
      trace("b is IOther: " + $rt.is(b, IOther));

      var a = new A('aha');
      trace("a = new A('aha'): " + a);
      trace("a is A: " + $rt.is(a, A));
      trace("a is B: " + $rt.is(a, B));
      trace("a is I: " + $rt.is(a, I));
      trace("a is ISub: " + $rt.is(a, ISub));
      trace("a is IOther: " + $rt.is(a, IOther));
    }
    return $rt.class_(HelloWorld, {
      // no members etc.
    });
  });
