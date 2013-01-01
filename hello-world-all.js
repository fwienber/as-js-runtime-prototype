
/**
 * almond 0.2.3 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

// As a polyfill plugin, this breaks normal modularity by altering globals for sake of enabling standards on non-supporting browsers
define('runtime/es5-polyfills',[],function () {
  
  //----------------------------------------------------------------------
  //
  // ECMAScript 5 Polyfills
  //
  //----------------------------------------------------------------------

  if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
      var t, len, i, thisp;
      if (this == null) {
        throw new TypeError();
      }
      t = Object(this);
      len = t.length >>> 0;
      if (typeof fun != "function") {
        throw new TypeError();
      }

      thisp = arguments[1];
      for (i = 0; i < len; i++) {
        if (i in t && !fun.call(thisp, t[i], i, t)) {
          return false;
        }
      }
      return true;
    };
  }
  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(callback, thisArg) {
      
      var T, k, O, len, kValue;

      if (this == null) {
        throw new TypeError("this is null or not defined");
      }

      // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
      O = Object(this);

      // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      len = O.length >>> 0; // Hack to convert O.length to a UInt32

      // 4. If IsCallable(callback) is false, throw a TypeError exception.
      // See: http://es5.github.com/#x9.11
      if (Object.prototype.toString.call(callback) !== "[object Function]") {
        throw new TypeError(callback + " is not a function");
      }

      // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
      if (thisArg) {
        T = thisArg;
      }

      // 6. Let k be 0
      k = 0;

      // 7. Repeat, while k < len
      while (k < len) {

        // a. Let Pk be ToString(k).
        //   This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
        //   This step can be combined with c
        // c. If kPresent is true, then
        if (Object.prototype.hasOwnProperty.call(O, k)) {

          // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
          kValue = O[ k ];

          // ii. Call the Call internal method of callback with T as the this value and
          // argument list containing kValue, k, and O.
          callback.call(T, kValue, k, O);
        }
        // d. Increase k by 1.
        k++;
      }
      // 8. return undefined
    };
  }
  if (!Array.prototype.map) {
    Array.prototype.map = function map(callback, thisArg) {
      
      var T, A, k, kValue, mappedValue, O, len;
      if (this === null || typeof this === 'undefined') {
        throw new TypeError(" this is null or not defined");
      }
      O = Object(this);
      len = O.length >>> 0;

      if (Object.prototype.toString.call(callback) !== "[object Function]") {
        throw new TypeError(callback + " is not a function");
      }
      if (thisArg) {
        T = thisArg;
      }

      A = new Array(len);
      k = 0;
      while (k < len) {
        if (k in O) {
          kValue = O[ k ];
          mappedValue = callback.call(T, kValue, k, O);
          A[ k ] = mappedValue;
        }
        k++;
      }
      return A;
    };
  }

  //----------------------------------------------------------------------
  // ES5 15.2 Object Objects
  //----------------------------------------------------------------------

  //
  // ES5 15.2.3 Properties of the Object Constructor
  //

  if (!Object.create) {

    // if Object.create is not defined, *always* also redefine Object.defineProperty and Object.defineProperties,
    // as IE8 implements them only for DOM objects!

    // ES5 15.2.3.5 Object.create ( O [, Properties] )
    Object.create = function (prototype, properties) {
      if (prototype !== Object(prototype)) { throw new TypeError(); }
      /** @constructor */
      function Ctor() {}
      Ctor.prototype = prototype;
      var o = new Ctor();
      o.constructor = Ctor;
      if (arguments.length > 1) {
        if (properties !== Object(properties)) { throw new TypeError(); }
        Object.defineProperties(o, properties);
      }
      return o;
    };

    // ES 15.2.3.6 Object.defineProperty ( O, P, Attributes )
    // Partial support for most common case - getters, setters, and values
    var orig = Object.defineProperty;
    Object.defineProperty = function (o, prop, desc) {
      // In IE8 try built-in implementation for defining properties on DOM prototypes.
      if (orig) { try { return orig(o, prop, desc); } catch (e) {} }

      if (o !== Object(o)) { throw new TypeError("Object.defineProperty called on non-object"); }
      if (('get' in desc)) {
        if (Object.prototype.__defineGetter__) {
          Object.prototype.__defineGetter__.call(o, prop, desc.get);
        } else {
          o["get$" + prop] = desc.get;
        }
      }
      if (('set' in desc)) {
        if (Object.prototype.__defineSetter__) {
          Object.prototype.__defineSetter__.call(o, prop, desc.set);
        } else {
          o["set$" + prop] = desc.set;
        }
      }
      if ('value' in desc) {
        o[prop] = desc.value;
      }
      return o;
    };

    // ES 15.2.3.7 Object.defineProperties ( O, Properties )
    Object.defineProperties = function (o, properties) {
      if (o !== Object(o)) {
        throw new TypeError("Object.defineProperties called on non-object");
      }
      var name;
      for (name in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, name)) {
          Object.defineProperty(o, name, properties[name]);
        }
      }
      return o;
    };
  }

  //----------------------------------------------------------------------
  // ES5 15.3 Function Objects
  //----------------------------------------------------------------------

  // ES5 15.3.4.5 Function.prototype.bind ( thisArg [, arg1 [, arg2, ... ]] )
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
  if (!Function.prototype.bind) {
    Function.prototype.bind = function bind (o) {
      if (typeof this !== 'function') { throw new TypeError("Bind must be called on a function"); }
      var slice = [].slice,
              args = slice.call(arguments, 1),
              self = this,
              bound = function () {
                return self.apply(this instanceof nop ? this : (o || {}),
                        args.concat(slice.call(arguments)));
              };

      /** @constructor */
      function nop() {}
      nop.prototype = self.prototype;

      bound.prototype = new nop();

      return bound;
    };
  }
});

define('runtime/AS3',["./es5-polyfills"], function() {
  
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
        if (propertyDescriptor.get) {
          result["get$" + name] = { value: propertyDescriptor.get };
        }
        if (propertyDescriptor.set) {
          result["set$" + name] = { value: propertyDescriptor.set };
        }
      }
    }
    return result;
  }
  function defineClass(definingCode) {
    return Object.defineProperty({}, "_", {
      configurable: true,
      get: function() {
        var config = definingCode();
        var members = convertShortcuts(config.members);
        var clazz = members.constructor.value;
        Object.defineProperty(this, "_", { value: clazz });
        var extends_ = config.extends_ || Object; // super class
        var implements_ = config.implements_ ? typeof config.implements_ === "function" ? [config.implements_] : config.implements_ : [];
        var staticMembers = convertShortcuts(config.staticMembers);
        // create set of all interfaces implemented by this class
        var $implements = extends_.$implements ? Object.create(extends_.$implements) : {};
        implements_.forEach(function(i) { i($implements); });
        staticMembers.$implements = { value: $implements };

        staticMembers.toString = { value: toString }; // add Class#toString()
        Object.defineProperties(clazz, staticMembers);   // add static members
        clazz.prototype = Object.create(extends_.prototype, members); // establish inheritance prototype chain and add instance members

        var staticCode = config.staticCode;
        // execute static initializers and code:
        staticCode && staticCode();
        return clazz;
      }
    });
  }

  function defineInterface(fullyQualifiedName, extends_) {
    function Interface($implements) {
      extends_.forEach(function(i) { i($implements); });
      $implements[fullyQualifiedName] = true;
      return $implements;
    }
    Interface.isInstance = function(object) {
      return object !== null && typeof object === "object" &&
              !!object.constructor.$implements &&
              fullyQualifiedName in object.constructor.$implements;
    };
    Interface.toString = function toString() {
      return "[Interface " + fullyQualifiedName + "]";
    };
    return Interface;
  }

  function bind(object, method, boundMethodName) {
    var boundMethod = object[boundMethodName];
    if (!boundMethod) {
      boundMethod = method.bind(object);
      Object.defineProperty(object, boundMethodName, { value: boundMethod });
    }
    return boundMethod;
  }

  function is(object, type) {
    return !!type && object !== undefined && object !== null &&
      // instanceof returns false negatives in some browsers, so check constructor property, too:
      (object instanceof type || object.constructor === type ||
      // "type" may be an interface:
      typeof type.isInstance === "function" && type.isInstance(object));
  }

  function as(object, type) {
    return is(object, type) ? object : null;
  }

  function cast(type, object) {
    if (object === undefined || object === null) {
      return null;
    }
    if (object instanceof type || object.constructor === type ||
      // "type" may be an interface:
      typeof type.isInstance === "function" && type.isInstance(object)) {
      return object;
    }
    throw new TypeError("'" + object + "' cannot be cast to " + type + ".");
  }

  return {
    class_: defineClass,
    interface_: defineInterface,
    as: as,
    cast: cast,
    is: is,
    bind: bind
  }
});

define('classes/trace',["runtime/es5-polyfills"], function() {
  
  return function trace() {
    var msg = Array.prototype.map.call(arguments, String).join(" ");
    var logWindow = document.createElement("div");
    logWindow.appendChild(document.createTextNode(msg));
    document.body.appendChild(logWindow);
  }
});

define('classes/com/acme/I',["runtime/AS3"], function(AS3) {
  
  return AS3.interface_("com.acme.I", []);
});

define('classes/com/acme/A',["runtime/AS3", "./I", "classes/trace"],
        function(AS3,     I,           trace) {
  

  return AS3.class_(function() {
    // constructor / class:
    function A(msg/*:String*/) {
/* 5*/    this.set$msg(msg); // rewritten property set access
    }

    // private method:
    function secret(n) {
/*21*/    return this.get$msg() + n; // complemented "this." and rewritten property get access
    }

    return {
      implements_: I,
      members: {
        constructor: A,
        // define private field (renamed!) with typed default value:
        _msg$1: { value: 0, writable: true },

        // property defined through public getter/setter:
        msg: {
          // public getter:
          get: function get$msg()/*:String*/ {
/*11*/      return String(this._msg$1); // rewritten private field access
          },
          // public setter
          set: function set$msg(value/*:String*/)/*:void*/ {
/*17*/      this._msg$1 = parseInt(value, 10) >> 0; // rewritten private field access + int coercion
          }
        },

        // public method:
        foo: function foo(x) {
/*25*/    return secret.call(this, A.bar(x)); // rewritten private method call
        },

        // public method:
        baz: function baz() {
/*29*/    var tmp = AS3.bind(this, secret, "secret$1"); // rewritten method access w/o invocation
/*30*/    return tmp("-bound");
        }
      },

      staticMembers: {
        // public static method:
        bar: function bar(x) {
/*34*/    return x + 1;
        }
      },

      staticCode: function() {
/*14*/  trace("Class A is initialized!");
      }
    };
  });
});

define('classes/com/acme/sub/IOther',["runtime/AS3"], function(AS3) {
  
  return AS3.interface_("com.acme.sub.IOther", []);
});

define('classes/com/acme/sub/ISub',["runtime/AS3", "../I"], function(AS3, I) {
  
  return AS3.interface_("com.acme.sub.ISub", [I]);
});

define('classes/com/acme/B',["runtime/AS3", "classes/trace", "./A", "./sub/IOther", "./sub/ISub"],
        function(AS3,           trace,     A_,        IOther,         ISub) {
  

  return AS3.class_(function() {
    var A = A_._ || A_.get$_(); // initialize super class. Only do this for super class, as there can be no cyclic dependencies!
    // constructor / class:
    function B(msg, count) {
/*19*/    this.barfoo = A.bar(3); // inlined field initializer
/*12*/    A.call(this, msg); // rewritten super call
/*13*/    this.count = count;
/*14*/    trace("now: " + B.now);
    }

    return { extends_: A, implements_: [IOther, ISub],
      members: {
        constructor: B,
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
/* 8*/    return new Date(B.now.getTime() + 60*60*1000);
        },

        // public static field:
        now: { value: null, writable: true }
      },

      staticCode: function() {
/*25*/    B.now = new Date();
      }
    };
  });
});


define('classes/HelloWorld',["runtime/AS3", "./trace","./com/acme/B","./com/acme/A","./com/acme/I","./com/acme/sub/IOther","./com/acme/sub/ISub"],
  function(      AS3,     trace,             B_,            A_,            I,                 IOther,                 ISub) {
  
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

require(["classes/HelloWorld"], function(HelloWorld_) {
  new (HelloWorld_._ || HelloWorld_.get$_())();
});

define("application", function(){});
