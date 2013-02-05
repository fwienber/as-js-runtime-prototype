define(["exports","runtime/AS3","classes/trace","classes/com/acme/B","classes/com/acme/A","classes/com/acme/I","classes/com/acme/sub/ISub","classes/com/acme/sub/IOther"], function($exports,AS3,trace,B,A,I,ISub,IOther) {
  "use strict";
  AS3.compilationUnit($exports, function($primaryDeclaration){
    function HelloWorld() {
      trace((B._||B._$get()).now);
      trace((B._||B._$get()).nowPlusOne());

      var b = new (B._||B._$get())('hello ');
      trace("b = new B('hello '):", b);
      trace("b.foo(3):", b.foo(3));
      trace("b.baz():", b.baz());
      trace("b is A:",AS3.is( b,  (A._||A._$get())));
      trace("b is B:",AS3.is( b,  (B._||B._$get())));
      trace("b is I:",AS3.is( b,  I));
      trace("b is ISub:",AS3.is( b,  ISub));
      trace("b is IOther:",AS3.is( b,  IOther));

      var a = new (A._||A._$get())('123');
      trace("a = new A('123'):", a);
      trace("a is A:",AS3.is( a,  (A._||A._$get())));
      trace("a is B:",AS3.is( a,  (B._||B._$get())));
      trace("a is I:",AS3.is( a,  I));
      trace("a is ISub:",AS3.is( a,  ISub));
      trace("a is IOther:",AS3.is( a,  IOther));
    }
    $primaryDeclaration(AS3.class_({
      class_: "HelloWorld",
      members: {constructor: HelloWorld}
    }));
  });
});
