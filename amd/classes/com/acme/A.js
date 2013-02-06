define(["exports","runtime/AS3","classes/com/acme/I","classes/trace"], function($exports,AS3,I,trace) {
  "use strict";
  AS3.compilationUnit($exports, function($primaryDeclaration){
    function A(msg) {
      this.msg = msg;
    }
    $primaryDeclaration(AS3.class_({
      package_: "com.acme",
      class_: "A",
      implements_: [I],
      members: {
        constructor: A,
        _msg$1: {
          value: 0,
          writable: true
        },
        msg: {
          get: function msg$get() {
            return String(this._msg$1);
          },
          set: function msg$set(value) {
            this._msg$1 = parseInt(value, 10);
          }
        },
        secret$1: function secret(n) {
          return this.msg + n;
        },
        foo: function foo(x) {
          return this.secret$1(A.bar(x));
        },
        baz: function baz() {
          var tmp =AS3.bind( this,"secret$1");
          return tmp("-bound");
        }
      },
      staticMembers: {
        bar: function bar(x) {
          return x + 1;
        }
      }
    }));
    trace("Class A is initialized!");
  });
});
