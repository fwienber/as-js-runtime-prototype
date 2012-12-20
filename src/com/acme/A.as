package com.acme {
public class A implements I {
  
  public function A(msg:String) {
    this.msg = msg;
  }

  private var _msg:String;

  public function get msg():String {
    return this._msg;
  }

  trace("Class A is initialized!");

  public function set msg(value:String):void {
    this._msg = value;
  }

  private function secret(n) {
    return msg + n;
  }

  public function foo(x) {
    return this.secret(A.bar(x));
  }

  public function baz() {
    var tmp = this.secret;
    return tmp("-bound");
  }

  public static function bar(x) {
    return x + 1;
  }

}
}
