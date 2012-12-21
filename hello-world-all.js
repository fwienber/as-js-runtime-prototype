
/*globals define*/
// Should only be used with shims against standard behavior as normal modules should not set globals
define('shim',[],function() {
  var w = (function() { return this; })(); // get global object, only works in non-strict mode.
  return {
    load: function (name, req, load, config) {
        
        if (config.isBuild) {
          load();
          return;
        }
        var i, prop, ref = w,
            alias = name.split('@'),
            variable = alias[0],
            props = variable.split('.'),
            pl = props.length;

        try {
            for (i = 0; i < pl; i++) {
                ref = ref[props[i]];
            }
            if (ref) {
                load(true);
                return;
            }
        }
        catch(e) {
        }

        for (i = 0, pl--, ref = w; i < pl; i++) {
            prop = props[i];
            if (!ref[prop]) {
                ref[prop] = {};
            }
            ref = ref[prop];
        }

        req([alias[1] || variable], function (value) {
            ref[props[i]] = value;
            load(false);
        });
    }
}});
define('as3/trace',["shim!Array.prototype.map"], function() {
  
  return function trace() {
    var msg = Array.prototype.map.call(arguments, String).join(" ");
    var logWindow = document.createElement("div");
    logWindow.appendChild(document.createTextNode(msg));
    document.body.appendChild(logWindow);
  }
});

define('as3/is',[],function() {
  
  return function is(object, type) {
    return !!type && object !== undefined && object !== null &&
      // constructor or instanceof may return false negatives:
      (object instanceof type || object.constructor === type ||
      // only Objects may implement an interface:
      !!type.$interface && typeof object === "object" &&
      !!object.constructor.$implements && type.$interface in object.constructor.$implements);
  };
});

/*globals define*/
// Should only be used with shims against standard behavior as normal modules should not set globals
define('shims',['shim!Array', 'shim!Array.prototype.every'], function() {
  var w = (function() { return this; })(); // get global object, only works in non-strict mode.
  return {
    load: function (name, req, load, config) {
        
        var i, prop, avoidLoad, ref = w,
            cfg = config.config,
            detect = cfg && cfg.detect,
            args = name.split('!'),
            alias = args[0].split('@'),
            variable = alias[0],
            props = variable.split('.'),
            pl = props.length,
            methodChecks = args.slice(1),
            ml = methodChecks.length,
            typeCheck = function (detect, ref) {
                var ret, detectType = typeof detect;
                switch (detectType) {
                    case 'boolean':
                        return detect;
                    case 'string':
                        return ref[detect];
                    case 'function':
                        return detect(ref);
                    case 'object':
                        return detect && (Array.isArray(detect) ?
                            (detect.every(function (method) {
                                return ref[method];
                            })) :
                            (detect.detect ? typeCheck(detect.detect, ref) : false)
                        );
                    default:
                        return false;
                }
            };

        if (ml || detect) {
            try {
                for (i = 0; i < pl; i++) {
                    try {
                        detect = detect[props[i]];
                    }
                    catch (e2) {
                        detect = false;
                    }
                    ref = ref[props[i]];
                }

                for (i = 0, avoidLoad = true; i < ml; i++) { // Allow style "shim!Array!slice"
                    avoidLoad &= !!ref[methodChecks[i]];
                }
                if (!ml && detect) { // Give a chance for config to handle
                    avoidLoad = typeCheck(detect, ref);
                }

                if (avoidLoad) {
                    load(true);
                    return;
                }
            }
            catch(e) {
            }
        }

        for (i = 0, ref = w; i < pl; i++) {
            prop = props[i];
            if (!ref[prop]) {
                ref[prop] = {};
            }
            ref = ref[prop];
        }

        req([alias[1] || variable], function (obj) {
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    ref[prop] = obj[prop];
                }
            }
            load(false);
        });
    }
}});
define('runtime/defineClass',["shims!Object!create", "shim!Array.prototype.forEach"], function() {
  
  function toString() {
    return "[Class " + this.name + "]";
  }
  function convertShortcuts(propertyDescriptors) {
    var result = {};
    if (propertyDescriptors) {
      for (var name in propertyDescriptors) {
        var propertyDescriptor = propertyDescriptors[name];
        result[name] = propertyDescriptor !== null && typeof propertyDescriptor === "object" ? propertyDescriptor
          // anything *not* an object is a shortcut for a property descriptor with that value (non-writable, non-enumerable, non-configurable):
                : { value: propertyDescriptor };
      }
    }
    return result;
  }
  return function(clazz, config) {
    var extends_ = config.extends_ || Object;
    var implements_ = config.implements_ ? typeof config.implements_ === "function" ? [config.implements_] : config.implements_ : [];
    var members = convertShortcuts(config.members);
    var staticMembers = convertShortcuts(config.staticMembers);
    var staticInitializers = config.staticInitializers || {};
    var staticCode = config.staticCode;
    staticMembers.$$ = {
      value: function() {
        delete clazz.$$;   // self-destruct to execute only once
        extends_.$$ && extends_.$$();   // ensure super class is initialized
        // then, execute static initializers:
        for (var name in staticInitializers) {
          var staticInitializer = staticInitializers[name];
          Object.defineProperty(clazz, name, {
            value: staticInitializer(),
            writable: !!staticMembers[name].writable,
            configurable: false  // not anymore...
          });
        }
        // then, execute static code:
        staticCode && staticCode();
      },
      configurable: true  // so we can delete it
    };
    // make all static fields with initializer configurable, so we can redefine them:
    for (var name in staticInitializers) {
      staticMembers[name].configurable = true; // so we can overwrite it
    }
    // create set of all interfaces implemented by this class
    var $implements = extends_.$implements ? Object.create(extends_.$implements) : {};
    implements_.forEach(function(i) { i($implements); });
    staticMembers.$implements = { value: $implements };

    staticMembers.toString = { value: toString }; // add Class#toString()
    Object.defineProperties(clazz, staticMembers);   // add static members
    members.constructor = { value: clazz }; // correct constructor property
    clazz.prototype = Object.create(extends_.prototype, members); // establish inheritance prototype chain and add instance members
    return clazz;
  }
});

define('runtime/defineInterface',["shim!Array.prototype.forEach"], function() {
  
  return function(fullyQualifiedName, extends_) {
    function Interface($implements) {
      extends_.forEach(function(i) { i($implements); });
      $implements[fullyQualifiedName] = true;
      return $implements;
    }
    Interface.$interface = fullyQualifiedName;
    return Interface;
  };
});

define('classes/com/acme/I',["runtime/defineInterface"], function(defineInterface) {
  
  return defineInterface("com.acme.I", []);
});

define('as3/bind',["shims!Object!create", "shim!Function.prototype.bind"], function() {
  
  return function(object, method, boundMethodName) {
    var boundMethod = object[boundMethodName];
    if (!boundMethod) {
      boundMethod = method.bind(object);
      Object.defineProperty(object, boundMethodName, { value: boundMethod });
    }
    return boundMethod;
  };
});
define('classes/com/acme/A',["runtime/defineClass", "./I", "as3/trace", "as3/bind"],
        function(defineClass,     I,       trace,       bind_) {
  

  // constructor / class:
  function A(msg/*:String*/) {
          A.$$ && A.$$(); // execute static code once on first usage
/* 5*/    this.msg = msg;
  }

  // private method:
  function secret(n) {
/*21*/    return this.msg + n; // complemented "this."
  }

  return defineClass(A, { implements_: I,
    members: {
      // define private field (renamed!) with typed default value:
      _msg$1: { value: null, writable: true },

      // property defined through public getter/setter:
      msg: {
        // public getter:
        get: function get_msg()/*:String*/ {
/*11*/    return this._msg$1; // rewritten private field access
        },
        // public setter
        set: function set_msg(value/*:String*/)/*:void*/ {
/*17*/    this._msg$1 = value; // rewritten private field access
        }
      },

      // public method:
      foo: function foo(x) {
/*25*/    return secret.call(this, A.bar(x)); // rewritten private method call
      },

      // public method:
      baz: function baz() {
/*29*/    var tmp = bind_(this, secret, "secret$1"); // rewritten method access w/o invocation
/*30*/    return tmp("-bound");
      }
    },

    staticMembers: {
      // public static method:
      bar: function bar(x) {
          A.$$ && A.$$(); // execute static code once on first usage
/*34*/    return x + 1;
      }
    },

    staticCode: function() {
/*14*/  trace("Class A is initialized!");
    }
  });
});

define('classes/com/acme/sub/IOther',["runtime/defineInterface"], function(defineInterface) {
  
  return defineInterface("com.acme.sub.IOther", []);
});

define('classes/com/acme/sub/ISub',["runtime/defineInterface", "../I"], function(defineInterface, I) {
  
  return defineInterface("com.acme.sub.ISub", [I]);
});

define('classes/com/acme/B',["runtime/defineClass", "as3/trace", "./A", "./sub/IOther", "./sub/ISub"],
        function(defineClass,       trace,     A,         IOther,         ISub) {
  

  // constructor / class:
  function B(msg, count) {
          B.$$ && B.$$(); // ensure class is initialized
/*19*/    this.barfoo = A.bar(3); // inlined field initializer
/*12*/    A.call(this, msg); // rewritten super call
/*13*/    this.count = count;
/*14*/    trace("now: " + B.now);
  }

  return defineClass(B, { extends_: A, implements_: [IOther, ISub],
    members: {
      // public field with typed default value:
      count:  { value: 0, writable: true },

      // public method (overriding):
      foo: function foo(x) {
/*22*/    return A.prototype.foo.call(this, x + 2) + "-sub"; // rewritten super method call
      }
    },

    staticMembers: {
      // public static method:
      nowPlusOne: function nowPlusOne() {
          B.$$ && B.$$(); // ensure class is initialized
/* 8*/    return new Date(B.now.getTime() + 60*60*1000);
      },

      // public static field:
      now: { value: null, writable: true }
    },
      
    staticInitializers: {
      now: function() {
/*25*/    return new Date();
      }
    }
  });
});


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

define("hello-world", function(){});
