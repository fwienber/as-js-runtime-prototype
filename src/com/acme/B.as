package com.acme {
import com.acme.sub.IOther;
import com.acme.sub.ISub;

public class B extends A implements IOther, ISub {

  public static function nowPlusOne() {
    return new Date(B.now.getTime() + 60*60*1000);
  }

  public function B(msg, count) {
    super(msg);
    this.count = count;
    trace("now: " + B.now);
  }

  public var count = 0;

  public var barfoo = A.bar(3);

  public override function foo(x) {
    return super.foo(x + 2) + "-sub";
  }

  public static var now = new Date();

}
}
