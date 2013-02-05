define(["exports","runtime/AS3","classes/com/acme/A","classes/com/acme/sub/IOther","classes/com/acme/sub/ISub","native!Date","classes/trace"], function($exports,AS3,A,IOther,ISub,Date,trace) {
  "use strict";
  AS3.compilationUnit($exports, function($primaryDeclaration){
    function B(msg, count) {
      Super.call(this,msg);
      this.barfoo = (A._ || A._$get()).bar(3);
      this.count = count;
      trace("now: " + B.now);
    }
    var Super = (A._ || A._$get());
    var super$ = Super.prototype;
    $primaryDeclaration(AS3.class_({
      package_: "com.acme",
      class_: "B",
      extends_: Super,
      implements_: [
        IOther,
        ISub
      ],
      members: {
        constructor: B,
        count: {
          value: 0,
          writable: true
        },
        foo: function foo(x) {
          return this.foo$2(x + 2) + "-sub";
        },
        foo$2: super$.foo
      },
      staticMembers: {
        nowPlusOne: function nowPlusOne$static() {
          return new Date(B.now.getTime() + 60*60*1000);
        }
      }
    }));
    B.now=( new Date());
  });
});
