package {

import com.acme.A;
import com.acme.B;
import com.acme.I;
import com.acme.sub.IOther;
import com.acme.sub.ISub;

//noinspection JSUnusedGlobalSymbols
public class HelloWorld {

  //noinspection JSUnusedGlobalSymbols
  public function HelloWorld() {
    trace(B.now);
    trace(B.nowPlusOne());

    var b:B = new B('hello ');
    trace("b = new B('hello '):", b);
    trace("b.foo(3):", b.foo(3));
    trace("b.baz():", b.baz());
    trace("b is A:", b is A);
    trace("b is B:", b is B);
    trace("b is I:", b is I);
    trace("b is ISub:", b is ISub);
    trace("b is IOther:", b is IOther);

    var a:A = new A('123');
    trace("a = new A('123'):", a);
    trace("a is A:", a is A);
    trace("a is B:", a is B);
    trace("a is I:", a is I);
    trace("a is ISub:", a is ISub);
    trace("a is IOther:", a is IOther);
  }
}
}