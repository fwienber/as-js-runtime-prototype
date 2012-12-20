/*globals define*/
// Should only be used with shims against standard behavior as normal modules should not set globals
define(function() {
  var w = (function() { return this; })(); // get global object, only works in non-strict mode.
  return {
    load: function (name, req, load, config) {
        'use strict';
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