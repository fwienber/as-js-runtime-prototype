
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

define("runtime/almond", function(){});

eval("// As a polyfill plugin, this breaks normal modularity by altering globals for sake of enabling standards on non-supporting browsers\r\ndefine(\'runtime/es5-polyfills\',[],function () {\r\n  \"use strict\";\r\n  //----------------------------------------------------------------------\r\n  //\r\n  // ECMAScript 5 Polyfills\r\n  //\r\n  //----------------------------------------------------------------------\r\n\r\n  if (!Array.prototype.every) {\r\n    Array.prototype.every = function every(fun /*, thisp */) {\r\n      var t, len, i, thisp;\r\n      if (this == null) {\r\n        throw new TypeError();\r\n      }\r\n      t = Object(this);\r\n      len = t.length >>> 0;\r\n      if (typeof fun != \"function\") {\r\n        throw new TypeError();\r\n      }\r\n\r\n      thisp = arguments[1];\r\n      for (i = 0; i < len; i++) {\r\n        if (i in t && !fun.call(thisp, t[i], i, t)) {\r\n          return false;\r\n        }\r\n      }\r\n      return true;\r\n    };\r\n  }\r\n  if (!Array.prototype.forEach) {\r\n    Array.prototype.forEach = function forEach(callback, thisArg) {\r\n      \"use strict\";\r\n      var T, k, O, len, kValue;\r\n\r\n      if (this == null) {\r\n        throw new TypeError(\"this is null or not defined\");\r\n      }\r\n\r\n      // 1. Let O be the result of calling ToObject passing the |this| value as the argument.\r\n      O = Object(this);\r\n\r\n      // 2. Let lenValue be the result of calling the Get internal method of O with the argument \"length\".\r\n      // 3. Let len be ToUint32(lenValue).\r\n      len = O.length >>> 0; // Hack to convert O.length to a UInt32\r\n\r\n      // 4. If IsCallable(callback) is false, throw a TypeError exception.\r\n      // See: http://es5.github.com/#x9.11\r\n      if (Object.prototype.toString.call(callback) !== \"[object Function]\") {\r\n        throw new TypeError(callback + \" is not a function\");\r\n      }\r\n\r\n      // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.\r\n      if (thisArg) {\r\n        T = thisArg;\r\n      }\r\n\r\n      // 6. Let k be 0\r\n      k = 0;\r\n\r\n      // 7. Repeat, while k < len\r\n      while (k < len) {\r\n\r\n        // a. Let Pk be ToString(k).\r\n        //   This is implicit for LHS operands of the in operator\r\n        // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.\r\n        //   This step can be combined with c\r\n        // c. If kPresent is true, then\r\n        if (Object.prototype.hasOwnProperty.call(O, k)) {\r\n\r\n          // i. Let kValue be the result of calling the Get internal method of O with argument Pk.\r\n          kValue = O[ k ];\r\n\r\n          // ii. Call the Call internal method of callback with T as the this value and\r\n          // argument list containing kValue, k, and O.\r\n          callback.call(T, kValue, k, O);\r\n        }\r\n        // d. Increase k by 1.\r\n        k++;\r\n      }\r\n      // 8. return undefined\r\n    };\r\n  }\r\n  if (!Array.prototype.map) {\r\n    Array.prototype.map = function map(callback, thisArg) {\r\n      \"use strict\";\r\n      var T, A, k, kValue, mappedValue, O, len;\r\n      if (this === null || typeof this === \'undefined\') {\r\n        throw new TypeError(\" this is null or not defined\");\r\n      }\r\n      O = Object(this);\r\n      len = O.length >>> 0;\r\n\r\n      if (Object.prototype.toString.call(callback) !== \"[object Function]\") {\r\n        throw new TypeError(callback + \" is not a function\");\r\n      }\r\n      if (thisArg) {\r\n        T = thisArg;\r\n      }\r\n\r\n      A = new Array(len);\r\n      k = 0;\r\n      while (k < len) {\r\n        if (k in O) {\r\n          kValue = O[ k ];\r\n          mappedValue = callback.call(T, kValue, k, O);\r\n          A[ k ] = mappedValue;\r\n        }\r\n        k++;\r\n      }\r\n      return A;\r\n    };\r\n  }\r\n\r\n  //----------------------------------------------------------------------\r\n  // ES5 15.2 Object Objects\r\n  //----------------------------------------------------------------------\r\n\r\n  //\r\n  // ES5 15.2.3 Properties of the Object Constructor\r\n  //\r\n\r\n  if (!Object.create) {\r\n\r\n    // if Object.create is not defined, *always* also redefine Object.defineProperty and Object.defineProperties,\r\n    // as IE8 implements them only for DOM objects!\r\n\r\n    // ES5 15.2.3.5 Object.create ( O [, Properties] )\r\n    Object.create = function (prototype, properties) {\r\n      if (prototype !== Object(prototype)) { throw new TypeError(); }\r\n      /** @constructor */\r\n      function Ctor() {}\r\n      Ctor.prototype = prototype;\r\n      var o = new Ctor();\r\n      o.constructor = Ctor;\r\n      if (arguments.length > 1) {\r\n        if (properties !== Object(properties)) { throw new TypeError(); }\r\n        Object.defineProperties(o, properties);\r\n      }\r\n      return o;\r\n    };\r\n\r\n    // ES 15.2.3.6 Object.defineProperty ( O, P, Attributes )\r\n    // Partial support for most common case - getters, setters, and values\r\n    var orig = Object.defineProperty;\r\n    Object.defineProperty = function (o, prop, desc) {\r\n      // In IE8 try built-in implementation for defining properties on DOM prototypes.\r\n      if (orig) { try { return orig(o, prop, desc); } catch (e) {} }\r\n\r\n      if (o !== Object(o)) { throw new TypeError(\"Object.defineProperty called on non-object\"); }\r\n      if ((\'get\' in desc)) {\r\n        if (Object.prototype.__defineGetter__) {\r\n          Object.prototype.__defineGetter__.call(o, prop, desc.get);\r\n        } else {\r\n          o[\"get$\" + prop] = desc.get;\r\n        }\r\n      }\r\n      if ((\'set\' in desc)) {\r\n        if (Object.prototype.__defineSetter__) {\r\n          Object.prototype.__defineSetter__.call(o, prop, desc.set);\r\n        } else {\r\n          o[\"set$\" + prop] = desc.set;\r\n        }\r\n      }\r\n      if (\'value\' in desc) {\r\n        o[prop] = desc.value;\r\n      }\r\n      return o;\r\n    };\r\n\r\n    // ES 15.2.3.7 Object.defineProperties ( O, Properties )\r\n    Object.defineProperties = function (o, properties) {\r\n      if (o !== Object(o)) {\r\n        throw new TypeError(\"Object.defineProperties called on non-object\");\r\n      }\r\n      var name;\r\n      for (name in properties) {\r\n        if (Object.prototype.hasOwnProperty.call(properties, name)) {\r\n          Object.defineProperty(o, name, properties[name]);\r\n        }\r\n      }\r\n      return o;\r\n    };\r\n  }\r\n\r\n  //----------------------------------------------------------------------\r\n  // ES5 15.3 Function Objects\r\n  //----------------------------------------------------------------------\r\n\r\n  // ES5 15.3.4.5 Function.prototype.bind ( thisArg [, arg1 [, arg2, ... ]] )\r\n  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind\r\n  if (!Function.prototype.bind) {\r\n    Function.prototype.bind = function bind (o) {\r\n      if (typeof this !== \'function\') { throw new TypeError(\"Bind must be called on a function\"); }\r\n      var slice = [].slice,\r\n              args = slice.call(arguments, 1),\r\n              self = this,\r\n              bound = function () {\r\n                return self.apply(this instanceof nop ? this : (o || {}),\r\n                        args.concat(slice.call(arguments)));\r\n              };\r\n\r\n      /** @constructor */\r\n      function nop() {}\r\n      nop.prototype = self.prototype;\r\n\r\n      bound.prototype = new nop();\r\n\r\n      return bound;\r\n    };\r\n  }\r\n});\r\n\n//@ sourceURL=/runtime/es5-polyfills.js");

eval("define(\'runtime/AS3\',[\"./es5-polyfills\"], function() {\r\n  \"use strict\";\r\n  function toString() {\r\n    return \"[Class \" + this.name + \"]\";\r\n  }\r\n  function convertShortcuts(propertyDescriptors) {\r\n    var result = {};\r\n    if (propertyDescriptors) {\r\n      for (var name in propertyDescriptors) {\r\n        var propertyDescriptor = propertyDescriptors[name];\r\n        result[name] = propertyDescriptor !== null && typeof propertyDescriptor === \"object\" ? propertyDescriptor\r\n          // anything *not* an object is a shortcut for a property descriptor with that value (non-writable, non-enumerable, non-configurable):\r\n                : { value: propertyDescriptor };\r\n        if (propertyDescriptor.get) {\r\n          result[\"get$\" + name] = { value: propertyDescriptor.get };\r\n        }\r\n        if (propertyDescriptor.set) {\r\n          result[\"set$\" + name] = { value: propertyDescriptor.set };\r\n        }\r\n      }\r\n    }\r\n    return result;\r\n  }\r\n  function defineClass(exports, definingCode) {\r\n    Object.defineProperty(exports, \"_\", {\r\n      configurable: true,\r\n      get: function() {\r\n        var config = definingCode();\r\n        var members = convertShortcuts(config.members);\r\n        var clazz = members.constructor.value;\r\n        Object.defineProperty(this, \"_\", { value: clazz });\r\n        var extends_ = config.extends_ || Object; // super class\r\n        var implements_ = config.implements_ ? typeof config.implements_ === \"function\" ? [config.implements_] : config.implements_ : [];\r\n        var staticMembers = convertShortcuts(config.staticMembers);\r\n        // create set of all interfaces implemented by this class\r\n        var $implements = extends_.$implements ? Object.create(extends_.$implements) : {};\r\n        implements_.forEach(function(i) { i($implements); });\r\n        staticMembers.$implements = { value: $implements };\r\n\r\n        staticMembers.toString = { value: toString }; // add Class#toString()\r\n        Object.defineProperties(clazz, staticMembers);   // add static members\r\n        clazz.prototype = Object.create(extends_.prototype, members); // establish inheritance prototype chain and add instance members\r\n\r\n        var staticCode = config.staticCode;\r\n        // execute static initializers and code:\r\n        staticCode && staticCode();\r\n        return clazz;\r\n      }\r\n    });\r\n  }\r\n\r\n  function defineInterface(fullyQualifiedName, extends_) {\r\n    function Interface($implements) {\r\n      extends_.forEach(function(i) { i($implements); });\r\n      $implements[fullyQualifiedName] = true;\r\n      return $implements;\r\n    }\r\n    Interface.isInstance = function(object) {\r\n      return object !== null && typeof object === \"object\" &&\r\n              !!object.constructor.$implements &&\r\n              fullyQualifiedName in object.constructor.$implements;\r\n    };\r\n    Interface.toString = function toString() {\r\n      return \"[Interface \" + fullyQualifiedName + \"]\";\r\n    };\r\n    return Interface;\r\n  }\r\n\r\n  function bind(object, method, boundMethodName) {\r\n    if (object.hasOwnProperty(boundMethodName)) {\r\n      return object[boundMethodName];\r\n    }\r\n    var boundMethod = method.bind(object);\r\n    Object.defineProperty(object, boundMethodName, { value: boundMethod });\r\n    return boundMethod;\r\n  }\r\n\r\n  function is(object, type) {\r\n    return !!type && object !== undefined && object !== null &&\r\n      // instanceof returns false negatives in some browsers, so check constructor property, too:\r\n      (object instanceof type || object.constructor === type ||\r\n      // \"type\" may be an interface:\r\n      typeof type.isInstance === \"function\" && type.isInstance(object));\r\n  }\r\n\r\n  function as(object, type) {\r\n    return is(object, type) ? object : null;\r\n  }\r\n\r\n  function cast(type, object) {\r\n    if (object === undefined || object === null) {\r\n      return null;\r\n    }\r\n    if (object instanceof type || object.constructor === type ||\r\n      // \"type\" may be an interface:\r\n      typeof type.isInstance === \"function\" && type.isInstance(object)) {\r\n      return object;\r\n    }\r\n    throw new TypeError(\"\'\" + object + \"\' cannot be cast to \" + type + \".\");\r\n  }\r\n\r\n  return {\r\n    class_: defineClass,\r\n    interface_: defineInterface,\r\n    as: as,\r\n    cast: cast,\r\n    is: is,\r\n    bind: bind\r\n  }\r\n});\r\n\n//@ sourceURL=/runtime/AS3.js");

eval("define(\'classes/trace\',[\"runtime/es5-polyfills\"], function() {\r\n  \"use strict\";\r\n  return function trace() {\r\n    var msg = Array.prototype.map.call(arguments, String).join(\" \");\r\n    var logWindow = document.createElement(\"div\");\r\n    logWindow.appendChild(document.createTextNode(msg));\r\n    document.body.appendChild(logWindow);\r\n  }\r\n});\r\n\n//@ sourceURL=/classes/trace.js");

eval("define(\'classes/com/acme/I\',[\"runtime/AS3\"], function(AS3) {\r\n  \"use strict\";\r\n  return AS3.interface_(\"com.acme.I\", []);\r\n});\r\n\n//@ sourceURL=/classes/com/acme/I.js");

eval("define(\'classes/com/acme/A\',[\"exports\", \"runtime/AS3\", \"./I\", \"classes/trace\"],\r\n        function($exports,  AS3,     I,           trace) {\r\n  \"use strict\";\r\n\r\n  AS3.class_($exports, function() {\r\n    // constructor / class:\r\n    function A(msg/*:String*/) {\r\n/* 5*/    this.set$msg(msg); // rewritten property set access; in ES5 environments, this.msg = msg works, too.\r\n    }\r\n\r\n    // private method:\r\n    function secret(n) {\r\n/*21*/    return this.get$msg() + n; // complemented \"this.\" and rewritten property get access; in ES5 environments, this.msg works, too.\r\n    }\r\n\r\n    return {\r\n      implements_: I,\r\n      members: {\r\n        constructor: A,\r\n        // define private field (renamed!) with typed default value:\r\n        _msg$1: { value: 0, writable: true },\r\n\r\n        // property defined through public getter/setter:\r\n        msg: {\r\n          // public getter:\r\n          get: function get$msg()/*:String*/ {\r\n/*11*/      return String(this._msg$1); // rewritten private field access\r\n          },\r\n          // public setter\r\n          set: function set$msg(value/*:String*/)/*:void*/ {\r\n/*17*/      this._msg$1 = parseInt(value, 10) >> 0; // rewritten private field access + int coercion\r\n          }\r\n        },\r\n\r\n        // public method:\r\n        foo: function foo(x) {\r\n/*25*/    return secret.call(this, A.bar(x)); // rewritten private method call\r\n        },\r\n\r\n        // public method:\r\n        baz: function baz() {\r\n/*29*/    var tmp = AS3.bind(this, secret, \"secret$1\"); // rewritten method access w/o invocation\r\n/*30*/    return tmp(\"-bound\");\r\n        }\r\n      },\r\n\r\n      staticMembers: {\r\n        // public static method:\r\n        bar: function bar(x) {\r\n/*34*/    return x + 1;\r\n        }\r\n      },\r\n\r\n      staticCode: function() {\r\n/*14*/  trace(\"Class A is initialized!\");\r\n      }\r\n    };\r\n  });\r\n});\r\n\n//@ sourceURL=/classes/com/acme/A.js");

eval("define(\'classes/com/acme/sub/IOther\',[\"runtime/AS3\"], function(AS3) {\r\n  \"use strict\";\r\n  return AS3.interface_(\"com.acme.sub.IOther\", []);\r\n});\r\n\n//@ sourceURL=/classes/com/acme/sub/IOther.js");

eval("define(\'classes/com/acme/sub/ISub\',[\"runtime/AS3\", \"../I\"], function(AS3, I) {\r\n  \"use strict\";\r\n  return AS3.interface_(\"com.acme.sub.ISub\", [I]);\r\n});\r\n\n//@ sourceURL=/classes/com/acme/sub/ISub.js");

eval("define(\'classes/com/acme/B\',[\"exports\", \"runtime/AS3\", \"classes/trace\", \"./A\", \"./sub/IOther\", \"./sub/ISub\"],\r\n        function($exports,  AS3,           trace,     A_,        IOther,         ISub) {\r\n  \"use strict\";\r\n\r\n  AS3.class_($exports, function() {\r\n    var A = A_._ || A_.get$_(); // initialize super class. Only do this for super class, as there can be no cyclic dependencies!\r\n    // constructor / class:\r\n    function B(msg, count) {\r\n/*19*/    this.barfoo = A.bar(3); // inlined field initializer\r\n/*12*/    A.call(this, msg); // rewritten super call\r\n/*13*/    this.count = count;\r\n/*14*/    trace(\"now: \" + B.now);\r\n    }\r\n\r\n    return { extends_: A, implements_: [IOther, ISub],\r\n      members: {\r\n        constructor: B,\r\n        // public field with typed default value:\r\n        count:  { value: 0, writable: true },\r\n\r\n        // public method (overriding):\r\n        foo: function foo(x) {\r\n/*22*/    return A.prototype.foo.call(this, x + 2) + \"-sub\"; // rewritten super method call\r\n        }\r\n      },\r\n\r\n      staticMembers: {\r\n        // public static method:\r\n        nowPlusOne: function nowPlusOne() {\r\n/* 8*/    return new Date(B.now.getTime() + 60*60*1000);\r\n        },\r\n\r\n        // public static field:\r\n        now: { value: null, writable: true }\r\n      },\r\n\r\n      staticCode: function() {\r\n/*25*/    B.now = new Date();\r\n      }\r\n    };\r\n  });\r\n});\r\n\n//@ sourceURL=/classes/com/acme/B.js");

eval("\"use strict\";\r\ndefine(\'classes/HelloWorld\',[\"exports\", \"runtime/AS3\", \"./trace\",\"./com/acme/B\",\"./com/acme/A\",\"./com/acme/I\",\"./com/acme/sub/IOther\",\"./com/acme/sub/ISub\"],\r\n  function($exports,        AS3,     trace,             B_,            A_,            I,                 IOther,                 ISub) {\r\n  \"use strict\";\r\n  AS3.class_($exports, function() {\r\n    var A, B;\r\n    function HelloWorld() {\r\n      trace((B = B_._ || B_.get$_()).now);\r\n      trace(B.nowPlusOne());\r\n\r\n      var b = new B(\'hello \');\r\n      trace(\"b = new B(\'hello \'): \" + b);\r\n      trace(\"b.foo(3): \" + b.foo(3));\r\n      trace(\"b.baz(): \" + b.baz());\r\n      trace(\"b is A: \" + AS3.is(b, A = A_._ || A_.get$_()));\r\n      trace(\"b is B: \" + AS3.is(b, B));\r\n      trace(\"b is I: \" + AS3.is(b, I));\r\n      trace(\"b is ISub: \" + AS3.is(b, ISub));\r\n      trace(\"b is IOther: \" + AS3.is(b, IOther));\r\n\r\n      var a = new A(\'123\');\r\n      trace(\"a = new A(\'123\'): \" + a);\r\n      trace(\"a is A: \" + AS3.is(a, A));\r\n      trace(\"a is B: \" + AS3.is(a, B));\r\n      trace(\"a is I: \" + AS3.is(a, I));\r\n      trace(\"a is ISub: \" + AS3.is(a, ISub));\r\n      trace(\"a is IOther: \" + AS3.is(a, IOther));\r\n    }\r\n    return {\r\n      members: {\r\n        constructor: HelloWorld\r\n      }\r\n    };\r\n  });\r\n});\r\n\n//@ sourceURL=/classes/HelloWorld.js");

require(["classes/HelloWorld"], function(HelloWorld_) {
  new (HelloWorld_._ || HelloWorld_.get$_())();
});

define("application", function(){});
