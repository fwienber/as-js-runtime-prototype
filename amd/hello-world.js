"use strict";
require(["as3/trace","as3/is","classes/com/acme/B","classes/com/acme/A","classes/com/acme/I","classes/com/acme/sub/IOther","classes/com/acme/sub/ISub"],
        function hello_world(trace, is_,        B,                   A,                   I,                       IOther,                                ISub) {
  // export classes for better debugging:
  window.A = A;
  window.B = B;

  trace((B.$$&&B.$$(),B).now);
  trace(B.nowPlusOne());

  window.b = new B('hello ');
  trace("b = new B('hello '): " + b);
  trace("b.foo(3): " + b.foo(3));
  trace("b.baz(): " + b.baz());
  trace("b is A: " + is_(b, A));
  trace("b is B: " + is_(b, B));
  trace("b is I: " + is_(b, I));
  trace("b is ISub: " + is_(b, ISub));
  trace("b is IOther: " + is_(b, IOther));

  window.a = new A('aha');
  trace("a = new A('aha'): " + a);
  trace("a is A: " + is_(a, A));
  trace("a is B: " + is_(a, B));
  trace("a is I: " + is_(a, I));
  trace("a is ISub: " + is_(a, ISub));
  trace("a is IOther: " + is_(a, IOther));
});
