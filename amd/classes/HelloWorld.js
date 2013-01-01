"use strict";
define(["runtime/AS3", "./trace","./com/acme/B","./com/acme/A","./com/acme/I","./com/acme/sub/IOther","./com/acme/sub/ISub"],
  function(      AS3,     trace,             B_,            A_,            I,                 IOther,                 ISub) {
  "use strict";
  return AS3.class_(function() {
    var A, B;
    function HelloWorld() {
      trace((B = B_._ || B_.get$_()).now);
      trace(B.nowPlusOne());

      var b = new B('hello ');
      trace("b = new B('hello '): " + b);
      trace("b.foo(3): " + b.foo(3));
      trace("b.baz(): " + b.baz());
      trace("b is A: " + AS3.is(b, A = A_._ || A.get$_()));
      trace("b is B: " + AS3.is(b, B));
      trace("b is I: " + AS3.is(b, I));
      trace("b is ISub: " + AS3.is(b, ISub));
      trace("b is IOther: " + AS3.is(b, IOther));

      var a = new A_._('123');
      trace("a = new A('123'): " + a);
      trace("a is A: " + AS3.is(a, A));
      trace("a is B: " + AS3.is(a, B));
      trace("a is I: " + AS3.is(a, I));
      trace("a is ISub: " + AS3.is(a, ISub));
      trace("a is IOther: " + AS3.is(a, IOther));
    }
    return {
      members: {
        constructor: HelloWorld
      }
    };
  });
});
