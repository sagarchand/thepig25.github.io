;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("avetisk-defaults/index.js", function(exports, require, module){
'use strict';

/**
 * Merge default values.
 *
 * @param {Object} dest
 * @param {Object} defaults
 * @return {Object}
 * @api public
 */
var defaults = function (dest, src, recursive) {
  for (var prop in src) {
    if (recursive && dest[prop] instanceof Object && src[prop] instanceof Object) {
      dest[prop] = defaults(dest[prop], src[prop], true);
    } else if (! (prop in dest)) {
      dest[prop] = src[prop];
    }
  }

  return dest;
};

/**
 * Expose `defaults`.
 */
module.exports = defaults;

});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("component-clone/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var type;

try {
  type = require('type');
} catch(e){
  type = require('type-component');
}

/**
 * Module exports.
 */

module.exports = clone;

/**
 * Clones objects.
 *
 * @param {Mixed} any object
 * @api public
 */

function clone(obj){
  switch (type(obj)) {
    case 'object':
      var copy = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = clone(obj[key]);
        }
      }
      return copy;

    case 'array':
      var copy = new Array(obj.length);
      for (var i = 0, l = obj.length; i < l; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;

    case 'regexp':
      // from millermedeiros/amd-utils - MIT
      var flags = '';
      flags += obj.multiline ? 'm' : '';
      flags += obj.global ? 'g' : '';
      flags += obj.ignoreCase ? 'i' : '';
      return new RegExp(obj.source, flags);

    case 'date':
      return new Date(obj.getTime());

    default: // string, number, boolean, …
      return obj;
  }
}

});
require.register("component-cookie/index.js", function(exports, require, module){
/**
 * Encode.
 */

var encode = encodeURIComponent;

/**
 * Decode.
 */

var decode = decodeURIComponent;

/**
 * Set or get cookie `name` with `value` and `options` object.
 *
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @return {Mixed}
 * @api public
 */

module.exports = function(name, value, options){
  switch (arguments.length) {
    case 3:
    case 2:
      return set(name, value, options);
    case 1:
      return get(name);
    default:
      return all();
  }
};

/**
 * Set cookie `name` to `value`.
 *
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @api private
 */

function set(name, value, options) {
  options = options || {};
  var str = encode(name) + '=' + encode(value);

  if (null == value) options.maxage = -1;

  if (options.maxage) {
    options.expires = new Date(+new Date + options.maxage);
  }

  if (options.path) str += '; path=' + options.path;
  if (options.domain) str += '; domain=' + options.domain;
  if (options.expires) str += '; expires=' + options.expires.toGMTString();
  if (options.secure) str += '; secure';

  document.cookie = str;
}

/**
 * Return all cookies.
 *
 * @return {Object}
 * @api private
 */

function all() {
  return parse(document.cookie);
}

/**
 * Get cookie `name`.
 *
 * @param {String} name
 * @return {String}
 * @api private
 */

function get(name) {
  return all()[name];
}

/**
 * Parse cookie `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parse(str) {
  var obj = {};
  var pairs = str.split(/ *; */);
  var pair;
  if ('' == pairs[0]) return obj;
  for (var i = 0; i < pairs.length; ++i) {
    pair = pairs[i].split('=');
    obj[decode(pair[0])] = decode(pair[1]);
  }
  return obj;
}

});
require.register("component-each/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var type = require('type');

/**
 * HOP reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Iterate the given `obj` and invoke `fn(val, i)`.
 *
 * @param {String|Array|Object} obj
 * @param {Function} fn
 * @api public
 */

module.exports = function(obj, fn){
  switch (type(obj)) {
    case 'array':
      return array(obj, fn);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn);
      return object(obj, fn);
    case 'string':
      return string(obj, fn);
  }
};

/**
 * Iterate string chars.
 *
 * @param {String} obj
 * @param {Function} fn
 * @api private
 */

function string(obj, fn) {
  for (var i = 0; i < obj.length; ++i) {
    fn(obj.charAt(i), i);
  }
}

/**
 * Iterate object keys.
 *
 * @param {Object} obj
 * @param {Function} fn
 * @api private
 */

function object(obj, fn) {
  for (var key in obj) {
    if (has.call(obj, key)) {
      fn(key, obj[key]);
    }
  }
}

/**
 * Iterate array-ish.
 *
 * @param {Array|Object} obj
 * @param {Function} fn
 * @api private
 */

function array(obj, fn) {
  for (var i = 0; i < obj.length; ++i) {
    fn(obj[i], i);
  }
}
});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture || false);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture || false);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("component-object/index.js", function(exports, require, module){

/**
 * HOP ref.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Return own keys in `obj`.
 *
 * @param {Object} obj
 * @return {Array}
 * @api public
 */

exports.keys = Object.keys || function(obj){
  var keys = [];
  for (var key in obj) {
    if (has.call(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Return own values in `obj`.
 *
 * @param {Object} obj
 * @return {Array}
 * @api public
 */

exports.values = function(obj){
  var vals = [];
  for (var key in obj) {
    if (has.call(obj, key)) {
      vals.push(obj[key]);
    }
  }
  return vals;
};

/**
 * Merge `b` into `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api public
 */

exports.merge = function(a, b){
  for (var key in b) {
    if (has.call(b, key)) {
      a[key] = b[key];
    }
  }
  return a;
};

/**
 * Return length of `obj`.
 *
 * @param {Object} obj
 * @return {Number}
 * @api public
 */

exports.length = function(obj){
  return exports.keys(obj).length;
};

/**
 * Check if `obj` is empty.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api public
 */

exports.isEmpty = function(obj){
  return 0 == exports.length(obj);
};
});
require.register("component-trim/index.js", function(exports, require, module){

exports = module.exports = trim;

function trim(str){
  if (str.trim) return str.trim();
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  if (str.trimLeft) return str.trimLeft();
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  if (str.trimRight) return str.trimRight();
  return str.replace(/\s*$/, '');
};

});
require.register("component-querystring/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var trim = require('trim');

/**
 * Parse the given query `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if ('string' != typeof str) return {};

  str = trim(str);
  if ('' == str) return {};

  var obj = {};
  var pairs = str.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var parts = pairs[i].split('=');
    obj[parts[0]] = null == parts[1]
      ? ''
      : decodeURIComponent(parts[1]);
  }

  return obj;
};

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

exports.stringify = function(obj){
  if (!obj) return '';
  var pairs = [];
  for (var key in obj) {
    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
  }
  return pairs.join('&');
};

});
require.register("component-url/index.js", function(exports, require, module){

/**
 * Parse the given `url`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(url){
  var a = document.createElement('a');
  a.href = url;
  return {
    href: a.href,
    host: a.host,
    port: a.port,
    hash: a.hash,
    hostname: a.hostname,
    pathname: a.pathname,
    protocol: a.protocol,
    search: a.search,
    query: a.search.slice(1)
  }
};

/**
 * Check if `url` is absolute.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isAbsolute = function(url){
  if (0 == url.indexOf('//')) return true;
  if (~url.indexOf('://')) return true;
  return false;
};

/**
 * Check if `url` is relative.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isRelative = function(url){
  return ! exports.isAbsolute(url);
};

/**
 * Check if `url` is cross domain.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isCrossDomain = function(url){
  url = exports.parse(url);
  return url.hostname != location.hostname
    || url.port != location.port
    || url.protocol != location.protocol;
};
});
require.register("component-bind/index.js", function(exports, require, module){

/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = [].slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

});
require.register("segmentio-bind-all/index.js", function(exports, require, module){

try {
  var bind = require('bind');
  var type = require('type');
} catch (e) {
  var bind = require('bind-component');
  var type = require('type-component');
}

module.exports = function (obj) {
  for (var key in obj) {
    var val = obj[key];
    if (type(val) === 'function') obj[key] = bind(obj, obj[key]);
  }
  return obj;
};
});
require.register("ianstormtaylor-bind/index.js", function(exports, require, module){

var bind = require('bind')
  , bindAll = require('bind-all');


/**
 * Expose `bind`.
 */

module.exports = exports = bind;


/**
 * Expose `bindAll`.
 */

exports.all = bindAll;


/**
 * Expose `bindMethods`.
 */

exports.methods = bindMethods;


/**
 * Bind `methods` on `obj` to always be called with the `obj` as context.
 *
 * @param {Object} obj
 * @param {String} methods...
 */

function bindMethods (obj, methods) {
  methods = [].slice.call(arguments, 1);
  for (var i = 0, method; method = methods[i]; i++) {
    obj[method] = bind(obj, obj[method]);
  }
  return obj;
}
});
require.register("timoxley-next-tick/index.js", function(exports, require, module){
"use strict"

if (typeof setImmediate == 'function') {
  module.exports = function(f){ setImmediate(f) }
}
// legacy node.js
else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
  module.exports = process.nextTick
}
// fallback for other environments / postMessage behaves badly on IE8
else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
  module.exports = function(f){ setTimeout(f) };
} else {
  var q = [];

  window.addEventListener('message', function(){
    var i = 0;
    while (i < q.length) {
      try { q[i++](); }
      catch (e) {
        q = q.slice(i);
        window.postMessage('tic!', '*');
        throw e;
      }
    }
    q.length = 0;
  }, true);

  module.exports = function(fn){
    if (!q.length) window.postMessage('tic!', '*');
    q.push(fn);
  }
}

});
require.register("ianstormtaylor-callback/index.js", function(exports, require, module){
var next = require('next-tick');


/**
 * Expose `callback`.
 */

module.exports = callback;


/**
 * Call an `fn` back synchronously if it exists.
 *
 * @param {Function} fn
 */

function callback (fn) {
  if ('function' === typeof fn) fn();
}


/**
 * Call an `fn` back asynchronously if it exists. If `wait` is ommitted, the
 * `fn` will be called on next tick.
 *
 * @param {Function} fn
 * @param {Number} wait (optional)
 */

callback.async = function (fn, wait) {
  if ('function' !== typeof fn) return;
  if (!wait) return next(fn);
  setTimeout(fn, wait);
};


/**
 * Symmetry.
 */

callback.sync = callback;

});
require.register("ianstormtaylor-is-empty/index.js", function(exports, require, module){

/**
 * Expose `isEmpty`.
 */

module.exports = isEmpty;


/**
 * Has.
 */

var has = Object.prototype.hasOwnProperty;


/**
 * Test whether a value is "empty".
 *
 * @param {Mixed} val
 * @return {Boolean}
 */

function isEmpty (val) {
  if (null == val) return true;
  if ('number' == typeof val) return 0 === val;
  if (undefined !== val.length) return 0 === val.length;
  for (var key in val) if (has.call(val, key)) return false;
  return true;
}
});
require.register("ianstormtaylor-is/index.js", function(exports, require, module){

var isEmpty = require('is-empty')
  , typeOf = require('type');


/**
 * Types.
 */

var types = [
  'arguments',
  'array',
  'boolean',
  'date',
  'element',
  'function',
  'null',
  'number',
  'object',
  'regexp',
  'string',
  'undefined'
];


/**
 * Expose type checkers.
 *
 * @param {Mixed} value
 * @return {Boolean}
 */

for (var i = 0, type; type = types[i]; i++) exports[type] = generate(type);


/**
 * Add alias for `function` for old browsers.
 */

exports.fn = exports['function'];


/**
 * Expose `empty` check.
 */

exports.empty = isEmpty;


/**
 * Expose `nan` check.
 */

exports.nan = function (val) {
  return exports.number(val) && val != val;
};


/**
 * Generate a type checker.
 *
 * @param {String} type
 * @return {Function}
 */

function generate (type) {
  return function (value) {
    return type === typeOf(value);
  };
}
});
require.register("segmentio-after/index.js", function(exports, require, module){

module.exports = function after (times, func) {
  // After 0, really?
  if (times <= 0) return func();

  // That's more like it.
  return function() {
    if (--times < 1) {
      return func.apply(this, arguments);
    }
  };
};
});
require.register("yields-slug/index.js", function(exports, require, module){

/**
 * Generate a slug from the given `str`.
 *
 * example:
 *
 *        generate('foo bar');
 *        // > foo-bar
 *
 * @param {String} str
 * @param {Object} options
 * @config {String|RegExp} [replace] characters to replace, defaulted to `/[^a-z0-9]/g`
 * @config {String} [separator] separator to insert, defaulted to `-`
 * @return {String}
 */

module.exports = function (str, options) {
  options || (options = {});
  return str.toLowerCase()
    .replace(options.replace || /[^a-z0-9]/g, ' ')
    .replace(/^ +| +$/g, '')
    .replace(/ +/g, options.separator || '-')
};

});
require.register("segmentio-analytics.js-integration/lib/index.js", function(exports, require, module){

var bind = require('bind');
var callback = require('callback');
var clone = require('clone');
var debug = require('debug');
var defaults = require('defaults');
var protos = require('./protos');
var slug = require('slug');
var statics = require('./statics');


/**
 * Expose `createIntegration`.
 */

module.exports = createIntegration;


/**
 * Create a new Integration constructor.
 *
 * @param {String} name
 */

function createIntegration (name) {

  /**
   * Initialize a new `Integration`.
   *
   * @param {Object} options
   */

  function Integration (options) {
    this.debug = debug('analytics:integration:' + slug(name));
    this.options = defaults(clone(options) || {}, this.defaults);
    this._queue = [];
    this.once('ready', bind(this, this.flush));

    Integration.emit('construct', this);
    this._wrapInitialize();
    this._wrapLoad();
    this._wrapPage();
  }

  Integration.prototype.defaults = {};
  Integration.prototype.globals = [];
  Integration.prototype.name = name;
  for (var key in statics) Integration[key] = statics[key];
  for (var key in protos) Integration.prototype[key] = protos[key];
  return Integration;
}
});
require.register("segmentio-analytics.js-integration/lib/protos.js", function(exports, require, module){

var after = require('after');
var callback = require('callback');
var Emitter = require('emitter');
var tick = require('next-tick');


/**
 * Mixin emitter.
 */

Emitter(exports);


/**
 * Initialize.
 */

exports.initialize = function () {
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 * @api private
 */

exports.loaded = function () {
  return false;
};


/**
 * Load.
 *
 * @param {Function} cb
 */

exports.load = function (cb) {
  callback.async(cb);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

exports.page = function (category, name, properties, options) {};


/**
 * Invoke a `method` that may or may not exist on the prototype with `args`,
 * queueing or not depending on whether the integration is "ready". Don't
 * trust the method call, since it contains integration party code.
 *
 * @param {String} method
 * @param {Mixed} args...
 * @api private
 */

exports.invoke = function (method) {
  if (!this[method]) return;
  var args = [].slice.call(arguments, 1);
  if (!this._ready) return this.queue(method, args);

  try {
    this.debug('%s with %o', method, args);
    this[method].apply(this, args);
  } catch (e) {
    this.debug('error %o calling %s with %o', e, method, args);
  }
};


/**
 * Queue a `method` with `args`. If the integration assumes an initial
 * pageview, then let the first call to `page` pass through.
 *
 * @param {String} method
 * @param {Array} args
 * @api private
 */

exports.queue = function (method, args) {
  if ('page' == method && this._assumesPageview && !this._initialized) {
    return this.page.apply(this, args);
  }

  this._queue.push({ method: method, args: args });
};


/**
 * Flush the internal queue.
 *
 * @api private
 */

exports.flush = function () {
  this._ready = true;
  var call;
  while (call = this._queue.shift()) this[call.method].apply(this, call.args);
};


/**
 * Reset the integration, removing its global variables.
 *
 * @api private
 */

exports.reset = function () {
  for (var i = 0, key; key = this.globals[i]; i++) window[key] = undefined;
};


/**
 * Wrap the initialize method in an exists check, so we don't have to do it for
 * every single integration.
 *
 * @api private
 */

exports._wrapInitialize = function () {
  var initialize = this.initialize;
  this.initialize = function () {
    this.debug('initialize');
    this._initialized = true;
    initialize.apply(this, arguments);
    this.emit('initialize');

    var self = this;
    if (this._readyOnInitialize) {
      tick(function () {
        self.emit('ready');
      });
    }
  };

  if (this._assumesPageview) this.initialize = after(2, this.initialize);
};


/**
 * Wrap the load method in `debug` calls, so every integration gets them
 * automatically.
 *
 * @api private
 */

exports._wrapLoad = function () {
  var load = this.load;
  this.load = function (callback) {
    var self = this;
    this.debug('loading');

    if (this.loaded()) {
      this.debug('already loaded');
      if (self._readyOnLoad) {
        tick(function () {
          self.emit('ready');
          callback && callback();
        });
      }
      return;
    }

    load.call(this, function (err, e) {
      self.debug('loaded');
      self.emit('load');
      if (self._readyOnLoad) self.emit('ready');
      callback && callback(err, e);
    });
  };
};


/**
 * Wrap the page method to call `initialize` instead if the integration assumes
 * a pageview.
 *
 * @api private
 */

exports._wrapPage = function () {
  var page = this.page;
  this.page = function () {
    if (this._assumesPageview && !this._initialized) {
      return this.initialize({
        category: arguments[0],
        name: arguments[1],
        properties: arguments[2],
        options: arguments[3]
      });
    }
    page.apply(this, arguments);
  };
};
});
require.register("segmentio-analytics.js-integration/lib/statics.js", function(exports, require, module){

var after = require('after');
var Emitter = require('emitter');


/**
 * Mixin emitter.
 */

Emitter(exports);


/**
 * Add a new option to the integration by `key` with default `value`.
 *
 * @param {String} key
 * @param {Mixed} value
 * @return {Integration}
 */

exports.option = function (key, value) {
  this.prototype.defaults[key] = value;
  return this;
};


/**
 * Register a new global variable `key` owned by the integration, which will be
 * used to test whether the integration is already on the page.
 *
 * @param {String} global
 * @return {Integration}
 */

exports.global = function (key) {
  this.prototype.globals.push(key);
  return this;
};


/**
 * Mark the integration as assuming an initial pageview, so to defer loading
 * the script until the first `page` call, noop the first `initialize`.
 *
 * @return {Integration}
 */

exports.assumesPageview = function () {
  this.prototype._assumesPageview = true;
  return this;
};


/**
 * Mark the integration as being "ready" once `load` is called.
 *
 * @return {Integration}
 */

exports.readyOnLoad = function () {
  this.prototype._readyOnLoad = true;
  return this;
};


/**
 * Mark the integration as being "ready" once `load` is called.
 *
 * @return {Integration}
 */

exports.readyOnInitialize = function () {
  this.prototype._readyOnInitialize = true;
  return this;
};
});
require.register("component-domify/index.js", function(exports, require, module){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return document.createTextNode(html);
  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // Note: when moving children, don't rely on el.children
  // being 'live' to support Polymer's broken behaviour.
  // See: https://github.com/component/domify/pull/23
  if (1 == el.children.length) {
    return el.removeChild(el.children[0]);
  }

  var fragment = document.createDocumentFragment();
  while (el.children.length) {
    fragment.appendChild(el.removeChild(el.children[0]));
  }

  return fragment;
}

});
require.register("component-once/index.js", function(exports, require, module){

/**
 * Identifier.
 */

var n = 0;

/**
 * Global.
 */

var global = (function(){ return this })();

/**
 * Make `fn` callable only once.
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

module.exports = function(fn) {
  var id = n++;

  function once(){
    // no receiver
    if (this == global) {
      if (once.called) return;
      once.called = true;
      return fn.apply(this, arguments);
    }

    // receiver
    var key = '__called_' + id + '__';
    if (this[key]) return;
    this[key] = true;
    return fn.apply(this, arguments);
  }

  return once;
};

});
require.register("segmentio-alias/index.js", function(exports, require, module){

var type = require('type');

try {
  var clone = require('clone');
} catch (e) {
  var clone = require('clone-component');
}


/**
 * Expose `alias`.
 */

module.exports = alias;


/**
 * Alias an `object`.
 *
 * @param {Object} obj
 * @param {Mixed} method
 */

function alias (obj, method) {
  switch (type(method)) {
    case 'object': return aliasByDictionary(clone(obj), method);
    case 'function': return aliasByFunction(clone(obj), method);
  }
}


/**
 * Convert the keys in an `obj` using a dictionary of `aliases`.
 *
 * @param {Object} obj
 * @param {Object} aliases
 */

function aliasByDictionary (obj, aliases) {
  for (var key in aliases) {
    if (undefined === obj[key]) continue;
    obj[aliases[key]] = obj[key];
    delete obj[key];
  }
  return obj;
}


/**
 * Convert the keys in an `obj` using a `convert` function.
 *
 * @param {Object} obj
 * @param {Function} convert
 */

function aliasByFunction (obj, convert) {
  // have to create another object so that ie8 won't infinite loop on keys
  var output = {};
  for (var key in obj) output[convert(key)] = obj[key];
  return output;
}
});
require.register("segmentio-convert-dates/index.js", function(exports, require, module){

var is = require('is');

try {
  var clone = require('clone');
} catch (e) {
  var clone = require('clone-component');
}


/**
 * Expose `convertDates`.
 */

module.exports = convertDates;


/**
 * Recursively convert an `obj`'s dates to new values.
 *
 * @param {Object} obj
 * @param {Function} convert
 * @return {Object}
 */

function convertDates (obj, convert) {
  obj = clone(obj);
  for (var key in obj) {
    var val = obj[key];
    if (is.date(val)) obj[key] = convert(val);
    if (is.object(val)) obj[key] = convertDates(val, convert);
  }
  return obj;
}
});
require.register("segmentio-global-queue/index.js", function(exports, require, module){

/**
 * Expose `generate`.
 */

module.exports = generate;


/**
 * Generate a global queue pushing method with `name`.
 *
 * @param {String} name
 * @param {Object} options
 *   @property {Boolean} wrap
 * @return {Function}
 */

function generate (name, options) {
  options = options || {};

  return function (args) {
    args = [].slice.call(arguments);
    window[name] || (window[name] = []);
    options.wrap === false
      ? window[name].push.apply(window[name], args)
      : window[name].push(args);
  };
}
});
require.register("segmentio-load-date/index.js", function(exports, require, module){


/*
 * Load date.
 *
 * For reference: http://www.html5rocks.com/en/tutorials/webperformance/basics/
 */

var time = new Date()
  , perf = window.performance;

if (perf && perf.timing && perf.timing.responseEnd) {
  time = new Date(perf.timing.responseEnd);
}

module.exports = time;
});
require.register("segmentio-load-script/index.js", function(exports, require, module){
var type = require('type');


module.exports = function loadScript (options, callback) {
    if (!options) throw new Error('Cant load nothing...');

    // Allow for the simplest case, just passing a `src` string.
    if (type(options) === 'string') options = { src : options };

    var https = document.location.protocol === 'https:' ||
                document.location.protocol === 'chrome-extension:';

    // If you use protocol relative URLs, third-party scripts like Google
    // Analytics break when testing with `file:` so this fixes that.
    if (options.src && options.src.indexOf('//') === 0) {
        options.src = https ? 'https:' + options.src : 'http:' + options.src;
    }

    // Allow them to pass in different URLs depending on the protocol.
    if (https && options.https) options.src = options.https;
    else if (!https && options.http) options.src = options.http;

    // Make the `<script>` element and insert it before the first script on the
    // page, which is guaranteed to exist since this Javascript is running.
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = options.src;

    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);

    // If we have a callback, attach event handlers, even in IE. Based off of
    // the Third-Party Javascript script loading example:
    // https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html
    if (callback && type(callback) === 'function') {
        if (script.addEventListener) {
            script.addEventListener('load', function (event) {
                callback(null, event);
            }, false);
            script.addEventListener('error', function (event) {
                callback(new Error('Failed to load the script.'), event);
            }, false);
        } else if (script.attachEvent) {
            script.attachEvent('onreadystatechange', function (event) {
                if (/complete|loaded/.test(script.readyState)) {
                    callback(null, event);
                }
            });
        }
    }

    // Return the script element in case they want to do anything special, like
    // give it an ID or attributes.
    return script;
};

});
require.register("segmentio-on-body/index.js", function(exports, require, module){
var each = require('each');


/**
 * Cache whether `<body>` exists.
 */

var body = false;


/**
 * Callbacks to call when the body exists.
 */

var callbacks = [];


/**
 * Export a way to add handlers to be invoked once the body exists.
 *
 * @param {Function} callback  A function to call when the body exists.
 */

module.exports = function onBody (callback) {
  if (body) {
    call(callback);
  } else {
    callbacks.push(callback);
  }
};


/**
 * Set an interval to check for `document.body`.
 */

var interval = setInterval(function () {
  if (!document.body) return;
  body = true;
  each(callbacks, call);
  clearInterval(interval);
}, 5);


/**
 * Call a callback, passing it the body.
 *
 * @param {Function} callback  The callback to call.
 */

function call (callback) {
  callback(document.body);
}
});
require.register("segmentio-on-error/index.js", function(exports, require, module){

/**
 * Expose `onError`.
 */

module.exports = onError;


/**
 * Callbacks.
 */

var callbacks = [];


/**
 * Preserve existing handler.
 */

if ('function' == typeof window.onerror) callbacks.push(window.onerror);


/**
 * Bind to `window.onerror`.
 */

window.onerror = handler;


/**
 * Error handler.
 */

function handler () {
  for (var i = 0, fn; fn = callbacks[i]; i++) fn.apply(this, arguments);
}


/**
 * Call a `fn` on `window.onerror`.
 *
 * @param {Function} fn
 */

function onError (fn) {
  callbacks.push(fn);
  if (window.onerror != handler) {
    callbacks.push(window.onerror);
    window.onerror = handler;
  }
}
});
require.register("segmentio-to-unix-timestamp/index.js", function(exports, require, module){

/**
 * Expose `toUnixTimestamp`.
 */

module.exports = toUnixTimestamp;


/**
 * Convert a `date` into a Unix timestamp.
 *
 * @param {Date}
 * @return {Number}
 */

function toUnixTimestamp (date) {
  return Math.floor(date.getTime() / 1000);
}
});
require.register("segmentio-use-https/index.js", function(exports, require, module){

/**
 * Protocol.
 */

module.exports = function (url) {
  switch (arguments.length) {
    case 0: return check();
    case 1: return transform(url);
  }
};


/**
 * Transform a protocol-relative `url` to the use the proper protocol.
 *
 * @param {String} url
 * @return {String}
 */

function transform (url) {
  return check() ? 'https:' + url : 'http:' + url;
}


/**
 * Check whether `https:` be used for loading scripts.
 *
 * @return {Boolean}
 */

function check () {
  return (
    location.protocol == 'https:' ||
    location.protocol == 'chrome-extension:'
  );
}
});
require.register("visionmedia-batch/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

try {
  var EventEmitter = require('events').EventEmitter;
} catch (err) {
  var Emitter = require('emitter');
}

/**
 * Noop.
 */

function noop(){}

/**
 * Expose `Batch`.
 */

module.exports = Batch;

/**
 * Create a new Batch.
 */

function Batch() {
  if (!(this instanceof Batch)) return new Batch;
  this.fns = [];
  this.concurrency(Infinity);
  this.throws(true);
  for (var i = 0, len = arguments.length; i < len; ++i) {
    this.push(arguments[i]);
  }
}

/**
 * Inherit from `EventEmitter.prototype`.
 */

if (EventEmitter) {
  Batch.prototype.__proto__ = EventEmitter.prototype;
} else {
  Emitter(Batch.prototype);
}

/**
 * Set concurrency to `n`.
 *
 * @param {Number} n
 * @return {Batch}
 * @api public
 */

Batch.prototype.concurrency = function(n){
  this.n = n;
  return this;
};

/**
 * Queue a function.
 *
 * @param {Function} fn
 * @return {Batch}
 * @api public
 */

Batch.prototype.push = function(fn){
  this.fns.push(fn);
  return this;
};

/**
 * Set wether Batch will or will not throw up.
 *
 * @param  {Boolean} throws
 * @return {Batch}
 * @api public
 */
Batch.prototype.throws = function(throws) {
  this.e = !!throws;
  return this;
};

/**
 * Execute all queued functions in parallel,
 * executing `cb(err, results)`.
 *
 * @param {Function} cb
 * @return {Batch}
 * @api public
 */

Batch.prototype.end = function(cb){
  var self = this
    , total = this.fns.length
    , pending = total
    , results = []
    , errors = []
    , cb = cb || noop
    , fns = this.fns
    , max = this.n
    , throws = this.e
    , index = 0
    , done;

  // empty
  if (!fns.length) return cb(null, results);

  // process
  function next() {
    var i = index++;
    var fn = fns[i];
    if (!fn) return;
    var start = new Date;

    try {
      fn(callback);
    } catch (err) {
      callback(err);
    }

    function callback(err, res){
      if (done) return;
      if (err && throws) return done = true, cb(err);
      var complete = total - pending + 1;
      var end = new Date;

      results[i] = res;
      errors[i] = err;

      self.emit('progress', {
        index: i,
        value: res,
        error: err,
        pending: pending,
        total: total,
        complete: complete,
        percent: complete / total * 100 | 0,
        start: start,
        end: end,
        duration: end - start
      });

      if (--pending) next()
      else if(!throws) cb(errors, results);
      else cb(null, results);
    }
  }

  // concurrency
  for (var i = 0; i < fns.length; i++) {
    if (i == max) break;
    next();
  }

  return this;
};

});
require.register("segmentio-analytics.js-integrations/index.js", function(exports, require, module){

var each = require('each');


/**
 * A list all of our integration slugs.
 */

var integrations = [
  'adroll',
  'amplitude',
  'awesm',
  'awesomatic',
  'bugherd',
  'bugsnag',
  'chartbeat',
  'clicktale',
  'clicky',
  'comscore',
  'crazy-egg',
  'customerio',
  'drip',
  'evergage',
  'errorception',
  'foxmetrics',
  'gauges',
  'get-satisfaction',
  'google-analytics',
  'gosquared',
  'heap',
  'hittail',
  'hubspot',
  'improvely',
  'inspectlet',
  'intercom',
  'keen-io',
  'kissmetrics',
  'klaviyo',
  'leadlander',
  'livechat',
  'lucky-orange',
  'lytics',
  'mixpanel',
  'mousestats',
  'olark',
  'optimizely',
  'perfect-audience',
  'pingdom',
  'preact',
  'qualaroo',
  'quantcast',
  'rollbar',
  'sentry',
  'snapengage',
  'spinnakr',
  'tapstream',
  'trakio',
  'usercycle',
  'userfox',
  'uservoice',
  'vero',
  'visual-website-optimizer',
  'woopra',
  'yandex-metrica'
];


/**
 * Expose the integrations, using their own `name` from their `prototype`.
 */

each(integrations, function (slug) {
  var plugin = require('./lib/' + slug);
  var name = plugin.Integration.prototype.name;
  exports[name] = plugin;
});

});
require.register("segmentio-analytics.js-integrations/lib/adroll.js", function(exports, require, module){

var integration = require('integration');
var is = require('is');
var load = require('load-script');


/**
 * User reference.
 */

var user;


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(AdRoll);
  user = analytics.user(); // store for later
};


/**
 * Expose `AdRoll` integration.
 */

var AdRoll = exports.Integration = integration('AdRoll')
  .assumesPageview()
  .readyOnLoad()
  .global('__adroll_loaded')
  .global('adroll_adv_id')
  .global('adroll_pix_id')
  .global('adroll_custom_data')
  .option('advId', '')
  .option('pixId', '');


/**
 * Initialize.
 *
 * http://support.adroll.com/getting-started-in-4-easy-steps/#step-one
 * http://support.adroll.com/enhanced-conversion-tracking/
 *
 * @param {Object} page
 */

AdRoll.prototype.initialize = function (page) {
  window.adroll_adv_id = this.options.advId;
  window.adroll_pix_id = this.options.pixId;
  if (user.id()) window.adroll_custom_data = { USER_ID: user.id() };
  window.__adroll_loaded = true;
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

AdRoll.prototype.loaded = function () {
  return window.__adroll;
};


/**
 * Load the AdRoll library.
 *
 * @param {Function} callback
 */

AdRoll.prototype.load = function (callback) {
  load({
    http: 'http://a.adroll.com/j/roundtrip.js',
    https: 'https://s.adroll.com/j/roundtrip.js'
  }, callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/amplitude.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Amplitude);
};


/**
 * Expose `Amplitude` integration.
 */

var Amplitude = exports.Integration = integration('Amplitude')
  .assumesPageview()
  .readyOnInitialize()
  .global('amplitude')
  .option('apiKey', '')
  .option('trackAllPages', false)
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true);


/**
 * Initialize.
 *
 * https://github.com/amplitude/Amplitude-Javascript
 *
 * @param {Object} page
 */

Amplitude.prototype.initialize = function (page) {
  (function(e,t){var r=e.amplitude||{}; r._q=[];function i(e){r[e]=function(){r._q.push([e].concat(Array.prototype.slice.call(arguments,0)));};} var s=["init","logEvent","setUserId","setGlobalUserProperties","setVersionName"]; for(var c=0;c<s.length;c++){i(s[c]);}e.amplitude=r;})(window,document);
  window.amplitude.init(this.options.apiKey);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Amplitude.prototype.loaded = function () {
  return !! (window.amplitude && window.amplitude.options);
};


/**
 * Load the Amplitude library.
 *
 * @param {Function} callback
 */

Amplitude.prototype.load = function (callback) {
  load('https://d24n15hnbwhuhn.cloudfront.net/libs/amplitude-1.0-min.js', callback);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Amplitude.prototype.page = function (category, name, properties, options) {
  var opts = this.options;

  // all pages
  if (opts.trackAllPages) {
    this.track('Loaded a Page', properties);
  }

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track('Viewed ' + category + ' Page', properties);
  }

  // named pages
  if (name && opts.trackNamedPages) {
    if (name && category) name = category + ' ' + name;
    this.track('Viewed ' + name + ' Page', properties);
  }
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Amplitude.prototype.identify = function (id, traits, options) {
  if (id) window.amplitude.setUserId(id);
  if (traits) window.amplitude.setGlobalUserProperties(traits);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Amplitude.prototype.track = function (event, properties, options) {
  window.amplitude.logEvent(event, properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/awesm.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');


/**
 * User reference.
 */

var user;


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Awesm);
  user = analytics.user(); // store for later
};


/**
 * Expose `Awesm` integration.
 */

var Awesm = exports.Integration = integration('awe.sm')
  .assumesPageview()
  .readyOnLoad()
  .global('AWESM')
  .option('apiKey', '')
  .option('events', {});


/**
 * Initialize.
 *
 * http://developers.awe.sm/guides/javascript/
 *
 * @param {Object} page
 */

Awesm.prototype.initialize = function (page) {
  window.AWESM = { api_key: this.options.apiKey };
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Awesm.prototype.loaded = function () {
  return !! window.AWESM._exists;
};



/**
 * Load.
 *
 * @param {Function} callback
 */

Awesm.prototype.load = function (callback) {
  var key = this.options.apiKey;
  load('//widgets.awe.sm/v3/widgets.js?key=' + key + '&async=true', callback);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Awesm.prototype.track = function (event, properties, options) {
  var goal = this.options.events[event];
  if (!goal) return;
  var value = properties.value || 0;
  if (properties.revenue) value = properties.revenue * 100; // prefer revenue
  window.AWESM.convert(goal, value, null, user.id());
};
});
require.register("segmentio-analytics.js-integrations/lib/awesomatic.js", function(exports, require, module){

var integration = require('integration');
var is = require('is');
var load = require('load-script');
var noop = function(){};
var onBody = require('on-body');


/**
 * User reference.
 */

var user;


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Awesomatic);
  user = analytics.user(); // store for later
};


/**
 * Expose `Awesomatic` integration.
 */

var Awesomatic = exports.Integration = integration('Awesomatic')
  .assumesPageview()
  .global('Awesomatic')
  .global('AwesomaticSettings')
  .global('AwsmSetup')
  .global('AwsmTmp')
  .option('appId', '');


/**
 * Initialize.
 *
 * @param {Object} page
 */

Awesomatic.prototype.initialize = function (page) {
  var self = this;
  var id = user.id();
  var options = user.traits();

  options.appId = this.options.appId;
  if (id) options.user_id = id;

  this.load(function () {
    window.Awesomatic.initialize(options, function () {
      self.emit('ready'); // need to wait for initialize to callback
    });
  });
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Awesomatic.prototype.loaded = function () {
  return is.object(window.Awesomatic);
};


/**
 * Load the Awesomatic library.
 *
 * @param {Function} callback
 */

Awesomatic.prototype.load = function (callback) {
  var url = 'https://1c817b7a15b6941337c0-dff9b5f4adb7ba28259631e99c3f3691.ssl.cf2.rackcdn.com/gen/embed.js';
  load(url, callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/bugherd.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(BugHerd);
};


/**
 * Expose `BugHerd` integration.
 */

var BugHerd = exports.Integration = integration('BugHerd')
  .assumesPageview()
  .readyOnLoad()
  .global('BugHerdConfig')
  .global('_bugHerd')
  .option('apiKey', '')
  .option('showFeedbackTab', true);


/**
 * Initialize.
 *
 * http://support.bugherd.com/home
 *
 * @param {Object} page
 */

BugHerd.prototype.initialize = function (page) {
  window.BugHerdConfig = { feedback: { hide: !this.options.showFeedbackTab }};
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

BugHerd.prototype.loaded = function () {
  return !! window._bugHerd;
};


/**
 * Load the BugHerd library.
 *
 * @param {Function} callback
 */

BugHerd.prototype.load = function (callback) {
  load('//www.bugherd.com/sidebarv2.js?apikey=' + this.options.apiKey, callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/bugsnag.js", function(exports, require, module){

var integration = require('integration');
var is = require('is');
var extend = require('extend');
var load = require('load-script');
var onError = require('on-error');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Bugsnag);
};


/**
 * Expose `Bugsnag` integration.
 */

var Bugsnag = exports.Integration = integration('Bugsnag')
  .readyOnLoad()
  .global('Bugsnag')
  .option('apiKey', '');


/**
 * Initialize.
 *
 * https://bugsnag.com/docs/notifiers/js
 *
 * @param {Object} page
 */

Bugsnag.prototype.initialize = function (page) {
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Bugsnag.prototype.loaded = function () {
  return is.object(window.Bugsnag);
};


/**
 * Load.
 *
 * @param {Function} callback (optional)
 */

Bugsnag.prototype.load = function (callback) {
  var script = load('//d2wy8f7a9ursnm.cloudfront.net/bugsnag-1.0.9.min.js', callback);
  script.setAttribute('data-apikey', this.options.apiKey);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Bugsnag.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  window.Bugsnag.metaData = window.Bugsnag.metaData || {};
  if (id) traits.id = id;
  extend(window.Bugsnag.metaData, traits);
};
});
require.register("segmentio-analytics.js-integrations/lib/chartbeat.js", function(exports, require, module){

var integration = require('integration');
var onBody = require('on-body');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Chartbeat);
};


/**
 * Expose `Chartbeat` integration.
 */

var Chartbeat = exports.Integration = integration('Chartbeat')
  .assumesPageview()
  .readyOnLoad()
  .global('_sf_async_config')
  .global('_sf_endpt')
  .global('pSUPERFLY')
  .option('domain', '')
  .option('uid', null);


/**
 * Initialize.
 *
 * http://chartbeat.com/docs/configuration_variables/
 *
 * @param {Object} page
 */

Chartbeat.prototype.initialize = function (page) {
  window._sf_async_config = this.options;
  onBody(function () {
    window._sf_endpt = new Date().getTime();
  });
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Chartbeat.prototype.loaded = function () {
  return !! window.pSUPERFLY;
};


/**
 * Load the Chartbeat library.
 *
 * http://chartbeat.com/docs/adding_the_code/
 *
 * @param {Function} callback
 */

Chartbeat.prototype.load = function (callback) {
  load({
    https: 'https://a248.e.akamai.net/chartbeat.download.akamai.com/102508/js/chartbeat.js',
    http: 'http://static.chartbeat.com/js/chartbeat.js'
  }, callback);
};


/**
 * Page.
 *
 * http://chartbeat.com/docs/handling_virtual_page_changes/
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Chartbeat.prototype.page = function (category, name, properties, options) {
  properties = properties || {};
  if (category && name) name = category + ' ' + name;
  window.pSUPERFLY.virtualPage(properties.path, name || properties.title);
};
});
require.register("segmentio-analytics.js-integrations/lib/clicktale.js", function(exports, require, module){

var date = require('load-date');
var domify = require('domify');
var each = require('each');
var integration = require('integration');
var is = require('is');
var useHttps = require('use-https');
var load = require('load-script');
var onBody = require('on-body');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(ClickTale);
};


/**
 * Expose `ClickTale` integration.
 */

var ClickTale = exports.Integration = integration('ClickTale')
  .assumesPageview()
  .readyOnLoad()
  .global('WRInitTime')
  .global('ClickTale')
  .global('ClickTaleSetUID')
  .global('ClickTaleField')
  .global('ClickTaleEvent')
  .option('httpCdnUrl', 'http://s.clicktale.net/WRe0.js')
  .option('httpsCdnUrl', '')
  .option('projectId', '')
  .option('recordingRatio', 0.01)
  .option('partitionId', '');


/**
 * Initialize.
 *
 * http://wiki.clicktale.com/Article/JavaScript_API
 *
 * @param {Object} page
 */

ClickTale.prototype.initialize = function (page) {
  var options = this.options;
  window.WRInitTime = date.getTime();

  onBody(function (body) {
    body.appendChild(domify('<div id="ClickTaleDiv" style="display: none;">'));
  });

  this.load(function () {
    window.ClickTale(options.projectId, options.recordingRatio, options.partitionId);
  });
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

ClickTale.prototype.loaded = function () {
  return is.fn(window.ClickTale);
};


/**
 * Load the ClickTale library.
 *
 * @param {Function} callback
 */

ClickTale.prototype.load = function (callback) {
  var http = this.options.httpCdnUrl;
  var https = this.options.httpsCdnUrl;
  if (useHttps() && !https) return this.debug('https option required');
  load({ http: http, https: https }, callback);
};


/**
 * Identify.
 *
 * http://wiki.clicktale.com/Article/ClickTaleTag#ClickTaleSetUID
 * http://wiki.clicktale.com/Article/ClickTaleTag#ClickTaleField
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

ClickTale.prototype.identify = function (id, traits, options) {
  window.ClickTaleSetUID(id);
  each(traits, function (key, value) {
    window.ClickTaleField(key, value);
  });
};


/**
 * Track.
 *
 * http://wiki.clicktale.com/Article/ClickTaleTag#ClickTaleEvent
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

ClickTale.prototype.track = function (event, properties, options) {
  window.ClickTaleEvent(event);
};
});
require.register("segmentio-analytics.js-integrations/lib/clicky.js", function(exports, require, module){

var extend = require('extend');
var integration = require('integration');
var is = require('is');
var load = require('load-script');


/**
 * User reference.
 */

var user;


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Clicky);
  user = analytics.user(); // store for later
};


/**
 * Expose `Clicky` integration.
 */

var Clicky = exports.Integration = integration('Clicky')
  .assumesPageview()
  .readyOnLoad()
  .global('clicky')
  .global('clicky_site_ids')
  .global('clicky_custom')
  .option('siteId', null);


/**
 * Initialize.
 *
 * http://clicky.com/help/customization
 *
 * @param {Object} page
 */

Clicky.prototype.initialize = function (page) {
  window.clicky_site_ids = window.clicky_site_ids || [this.options.siteId];
  this.identify(user.id(), user.traits());
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Clicky.prototype.loaded = function () {
  return is.object(window.clicky);
};


/**
 * Load the Clicky library.
 *
 * @param {Function} callback
 */

Clicky.prototype.load = function (callback) {
  load('//static.getclicky.com/js', callback);
};


/**
 * Page.
 *
 * http://clicky.com/help/customization#/help/custom/manual
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Clicky.prototype.page = function (category, name, properties, options) {
  properties = properties || {};
  if (category && name) name = category + ' ' + name;
  window.clicky.log(properties.path, name || properties.title);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Clicky.prototype.identify = function (id, traits, options) {
  window.clicky_custom = window.clicky_custom || {};
  window.clicky_custom.session = window.clicky_custom.session || {};
  if (id) traits.id = id;
  extend(window.clicky_custom.session, traits);
};


/**
 * Track.
 *
 * http://clicky.com/help/customization#/help/custom/manual
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Clicky.prototype.track = function (event, properties, options) {
  window.clicky.goal(event, properties.revenue);
};
});
require.register("segmentio-analytics.js-integrations/lib/comscore.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Comscore);
};


/**
 * Expose `Comscore` integration.
 */

var Comscore = exports.Integration = integration('comScore')
  .assumesPageview()
  .readyOnLoad()
  .global('_comscore')
  .global('COMSCORE')
  .option('c1', '2')
  .option('c2', '');


/**
 * Initialize.
 *
 * @param {Object} page
 */

Comscore.prototype.initialize = function (page) {
  window._comscore = window._comscore || [this.options];
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Comscore.prototype.loaded = function () {
  return !! window.COMSCORE;
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Comscore.prototype.load = function (callback) {
  load({
    http: 'http://b.scorecardresearch.com/beacon.js',
    https: 'https://sb.scorecardresearch.com/beacon.js'
  }, callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/crazy-egg.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(CrazyEgg);
};


/**
 * Expose `CrazyEgg` integration.
 */

var CrazyEgg = exports.Integration = integration('Crazy Egg')
  .assumesPageview()
  .readyOnLoad()
  .global('CE2')
  .option('accountNumber', '');


/**
 * Initialize.
 *
 * @param {Object} page
 */

CrazyEgg.prototype.initialize = function (page) {
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

CrazyEgg.prototype.loaded = function () {
  return !! window.CE2;
};


/**
 * Load the Crazy Egg library.
 *
 * @param {Function} callback
 */

CrazyEgg.prototype.load = function (callback) {
  var number = this.options.accountNumber;
  var path = number.slice(0,4) + '/' + number.slice(4);
  var cache = Math.floor(new Date().getTime()/3600000);
  var url = '//dnn506yrbagrg.cloudfront.net/pages/scripts/' + path + '.js?' + cache;
  load(url, callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/customerio.js", function(exports, require, module){

var alias = require('alias');
var callback = require('callback');
var convertDates = require('convert-dates');
var integration = require('integration');
var load = require('load-script');


/**
 * User reference.
 */

var user;


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Customerio);
  user = analytics.user(); // store for later
};


/**
 * Expose `Customerio` integration.
 */

var Customerio = exports.Integration = integration('Customer.io')
  .assumesPageview()
  .readyOnInitialize()
  .global('_cio')
  .option('siteId', '');


/**
 * Initialize.
 *
 * http://customer.io/docs/api/javascript.html
 *
 * @param {Object} page
 */

Customerio.prototype.initialize = function (page) {
  window._cio = window._cio || [];
  (function() {var a,b,c; a = function (f) {return function () {window._cio.push([f].concat(Array.prototype.slice.call(arguments,0))); }; }; b = ['identify', 'track']; for (c = 0; c < b.length; c++) {window._cio[b[c]] = a(b[c]); } })();
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Customerio.prototype.loaded = function () {
  return !! (window._cio && window._cio.pageHasLoaded);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Customerio.prototype.load = function (callback) {
  var script = load('https://assets.customer.io/assets/track.js', callback);
  script.id = 'cio-tracker';
  script.setAttribute('data-site-id', this.options.siteId);
};


/**
 * Trait aliases.
 */

var traitAliases = {
  created: 'created_at'
};


/**
 * Identify.
 *
 * http://customer.io/docs/api/javascript.html#section-Identify_customers
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Customerio.prototype.identify = function (id, traits, options) {
  if (!id) return this.debug('user id required');
  traits.id = id;
  traits = convertDates(traits, convertDate);
  traits = alias(traits, traitAliases);
  window._cio.identify(traits);
};


/**
 * Group.
 *
 * @param {String} id (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Customerio.prototype.group = function (id, properties, options) {
  if (id) properties.id = id;
  properties = alias(properties, function (prop) {
    return 'Group ' + prop;
  });

  this.identify(user.id(), properties);
};


/**
 * Track.
 *
 * http://customer.io/docs/api/javascript.html#section-Track_a_custom_event
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Customerio.prototype.track = function (event, properties, options) {
  properties = convertDates(properties, convertDate);
  window._cio.track(event, properties);
};


/**
 * Convert a date to the format Customer.io supports.
 *
 * @param {Date} date
 * @return {Number}
 */

function convertDate (date) {
  return Math.floor(date.getTime() / 1000);
}
});
require.register("segmentio-analytics.js-integrations/lib/drip.js", function(exports, require, module){

var alias = require('alias');
var integration = require('integration');
var is = require('is');
var load = require('load-script');
var push = require('global-queue')('_dcq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Drip);
};


/**
 * Expose `Drip` integration.
 */

var Drip = exports.Integration = integration('Drip')
  .assumesPageview()
  .readyOnLoad()
  .global('dc')
  .global('_dcq')
  .global('_dcs')
  .option('account', '');


/**
 * Initialize.
 *
 * @param {Object} page
 */

Drip.prototype.initialize = function (page) {
  window._dcq = window._dcq || [];
  window._dcs = window._dcs || {};
  window._dcs.account = this.options.account;
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Drip.prototype.loaded = function () {
  return is.object(window.dc);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Drip.prototype.load = function (callback) {
  load('//tag.getdrip.com/' + this.options.account + '.js', callback);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Drip.prototype.track = function (event, properties, options) {
  properties = properties || {};
  properties.action = event;
  properties = alias(properties, { revenue: 'value' });
  if (properties.value) properties.value = cents(properties.value);
  push('track', properties);
};


/**
 * Helper to convert revenue into a cents integer.
 *
 * @param {Object} props
 */

function cents (val) {
  return Math.round(val * 100);
}
});
require.register("segmentio-analytics.js-integrations/lib/evergage.js", function(exports, require, module){

var alias = require('alias');
var each = require('each');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_aaq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Evergage);
};


/**
 * Expose `Evergage` integration.integration.
 */

var Evergage = exports.Integration = integration('Evergage')
  .assumesPageview()
  .readyOnInitialize()
  .global('_aaq')
  .option('account', '')
  .option('dataset', '');


/**
 * Initialize.
 *
 * @param {Object} page
 */

Evergage.prototype.initialize = function (page) {
  var account = this.options.account;
  var dataset = this.options.dataset;

  window._aaq = window._aaq || [];
  push('setEvergageAccount', account);
  push('setDataset', dataset);
  push('setUseSiteConfig', true);

  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Evergage.prototype.loaded = function () {
  return !! (window._aaq && window._aaq.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Evergage.prototype.load = function (callback) {
  var account = this.options.account;
  var dataset = this.options.dataset;
  var url = '//cdn.evergage.com/beacon/' + account + '/' + dataset + '/scripts/evergage.min.js';
  load(url, callback);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Evergage.prototype.page = function (category, name, properties, options) {
  if (name) push('namePage', name);

  properties = properties || {};
  each(properties, function(key, value) {
    push('setCustomField', key, value, 'page');
  });

  window.Evergage.init(true);
};

/**
 * Trait aliases.
 */

var traitAliases = {
  name: 'userName',
  email: 'userEmail'
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Evergage.prototype.identify = function (id, traits, options) {
  if (!id) return;
  push('setUser', id);

  traits = traits || {};
  traits = alias(traits, traitAliases);
  each(traits, function (key, value) {
    push('setUserField', key, value, 'page');
  });
};


/**
 * Group.
 *
 * @param {String} id
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Evergage.prototype.group = function (id, properties, options) {
  if (!id) return;
  push('setCompany', id);
  each(properties, function(key, value) {
    push('setAccountField', key, value, 'page');
  });
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Evergage.prototype.track = function (event, properties, options) {
  push('trackAction', event, properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/errorception.js", function(exports, require, module){

var callback = require('callback');
var extend = require('extend');
var integration = require('integration');
var load = require('load-script');
var onError = require('on-error');
var push = require('global-queue')('_errs', { wrap: false });


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Errorception);
};


/**
 * Expose `Errorception` integration.
 */

var Errorception = exports.Integration = integration('Errorception')
  .assumesPageview()
  .readyOnInitialize()
  .global('_errs')
  .option('projectId', '')
  .option('meta', true);


/**
 * Initialize.
 *
 * https://github.com/amplitude/Errorception-Javascript
 *
 * @param {Object} page
 */

Errorception.prototype.initialize = function (page) {
  window._errs = window._errs || [this.options.projectId];
  onError(push);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Errorception.prototype.loaded = function () {
  return !! (window._errs && window._errs.push !== Array.prototype.push);
};


/**
 * Load the Errorception library.
 *
 * @param {Function} callback
 */

Errorception.prototype.load = function (callback) {
  load('//beacon.errorception.com/' + this.options.projectId + '.js', callback);
};


/**
 * Identify.
 *
 * http://blog.errorception.com/2012/11/capture-custom-data-with-your-errors.html
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Errorception.prototype.identify = function (id, traits, options) {
  if (!this.options.meta) return;

  traits = traits || {};
  window._errs = window._errs || [];
  window._errs.meta = window._errs.meta || {};

  if (id) traits.id = id;
  extend(window._errs.meta, traits);
};
});
require.register("segmentio-analytics.js-integrations/lib/foxmetrics.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_fxm');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(FoxMetrics);
};


/**
 * Expose `FoxMetrics` integration.
 */

var FoxMetrics = exports.Integration = integration('FoxMetrics')
  .assumesPageview()
  .readyOnInitialize()
  .global('_fxm')
  .option('appId', '');


/**
 * Initialize.
 *
 * http://foxmetrics.com/documentation/apijavascript
 *
 * @param {Object} page
 */

FoxMetrics.prototype.initialize = function (page) {
  window._fxm = window._fxm || [];
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

FoxMetrics.prototype.loaded = function () {
  return !! (window._fxm && window._fxm.appId);
};


/**
 * Load the FoxMetrics library.
 *
 * @param {Function} callback
 */

FoxMetrics.prototype.load = function (callback) {
  var id = this.options.appId;
  load('//d35tca7vmefkrc.cloudfront.net/scripts/' + id + '.js', callback);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

FoxMetrics.prototype.page = function (category, name, properties, options) {
  properties = properties || {};
  this._category = category; // store for later

  push(
    '_fxm.pages.view',
    properties.title,   // title
    name,               // name
    category,           // category
    properties.url,     // url
    properties.referrer // referrer
  );
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

FoxMetrics.prototype.identify = function (id, traits, options) {
  if (!id) return; // foxmetrics requires an `id`

  // foxmetrics needs the first and last name separately
  // TODO: remove when we have facade
  traits = traits || {};
  var firstName = traits.firstName;
  var lastName = traits.lastName;
  if (!firstName && traits.name) firstName = traits.name.split(' ')[0];
  if (!lastName && traits.name) lastName = traits.name.split(' ')[1];

  push(
    '_fxm.visitor.profile',
    id,             // user id
    firstName,      // first name
    lastName,       // last name
    traits.email,   // email
    traits.address, // address
    undefined,      // social
    undefined,      // partners
    traits          // attributes
  );
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

FoxMetrics.prototype.track = function (event, properties, options) {
  properties = properties || {};
  push(
    event,                                 // event name
    this._category || properties.category, // category
    properties                             // properties
  );
};
});
require.register("segmentio-analytics.js-integrations/lib/gauges.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_gauges');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Gauges);
};


/**
 * Expose `Gauges` integration.
 */

var Gauges = exports.Integration = integration('Gauges')
  .assumesPageview()
  .readyOnInitialize()
  .global('_gauges')
  .option('siteId', '');


/**
 * Initialize Gauges.
 *
 * http://get.gaug.es/documentation/tracking/
 *
 * @param {Object} page
 */

Gauges.prototype.initialize = function (page) {
  window._gauges = window._gauges || [];
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Gauges.prototype.loaded = function () {
  return !! (window._gauges && window._gauges.push !== Array.prototype.push);
};


/**
 * Load the Gauges library.
 *
 * @param {Function} callback
 */

Gauges.prototype.load = function (callback) {
  var id = this.options.siteId;
  var script = load('//secure.gaug.es/track.js', callback);
  script.id = 'gauges-tracker';
  script.setAttribute('data-site-id', id);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Gauges.prototype.page = function (category, name, properties, options) {
  push('track');
};
});
require.register("segmentio-analytics.js-integrations/lib/get-satisfaction.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');
var onBody = require('on-body');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(GetSatisfaction);
};


/**
 * Expose `GetSatisfaction` integration.
 */

var GetSatisfaction = exports.Integration = integration('Get Satisfaction')
  .assumesPageview()
  .readyOnLoad()
  .global('GSFN')
  .option('widgetId', '');


/**
 * Initialize.
 *
 * https://console.getsatisfaction.com/start/101022?signup=true#engage
 *
 * @param {Object} page
 */

GetSatisfaction.prototype.initialize = function (page) {
  var widget = this.options.widgetId;
  var div = document.createElement('div');
  var id = div.id = 'getsat-widget-' + widget;
  onBody(function (body) { body.appendChild(div); });

  // usually the snippet is sync, so wait for it before initializing the tab
  this.load(function () {
    window.GSFN.loadWidget(widget, { containerId: id });
  });
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

GetSatisfaction.prototype.loaded = function () {
  return !! window.GSFN;
};


/**
 * Load the Get Satisfaction library.
 *
 * @param {Function} callback
 */

GetSatisfaction.prototype.load = function (callback) {
  load('https://loader.engage.gsfn.us/loader.js', callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/google-analytics.js", function(exports, require, module){

var callback = require('callback');
var canonical = require('canonical');
var each = require('each');
var integration = require('integration');
var is = require('is');
var load = require('load-script');
var push = require('global-queue')('_gaq');
var type = require('type');
var url = require('url');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(GA);
};


/**
 * Expose `GA` integration.
 *
 * http://support.google.com/analytics/bin/answer.py?hl=en&answer=2558867
 * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiBasicConfiguration#_gat.GA_Tracker_._setSiteSpeedSampleRate
 */

var GA = exports.Integration = integration('Google Analytics')
  .readyOnLoad()
  .global('ga')
  .global('gaplugins')
  .global('_gaq')
  .global('GoogleAnalyticsObject')
  .option('anonymizeIp', false)
  .option('classic', false)
  .option('domain', 'none')
  .option('doubleClick', false)
  .option('enhancedLinkAttribution', false)
  .option('ignoreReferrer', null)
  .option('siteSpeedSampleRate', null)
  .option('trackingId', '')
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true);


/**
 * When in "classic" mode, on `construct` swap all of the method to point to
 * their classic counterparts.
 */

GA.on('construct', function (integration) {
  if (!integration.options.classic) return;
  integration.initialize = integration.initializeClassic;
  integration.load = integration.loadClassic;
  integration.loaded = integration.loadedClassic;
  integration.page = integration.pageClassic;
  integration.track = integration.trackClassic;
});


/**
 * Initialize.
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced
 */

GA.prototype.initialize = function () {
  var opts = this.options;

  // setup the tracker globals
  window.GoogleAnalyticsObject = 'ga';
  window.ga = window.ga || function () {
    window.ga.q = window.ga.q || [];
    window.ga.q.push(arguments);
  };
  window.ga.l = new Date().getTime();

  window.ga('create', opts.trackingId, {
    cookieDomain: opts.domain || GA.prototype.defaults.domain, // to protect against empty string
    siteSpeedSampleRate: opts.siteSpeedSampleRate,
    allowLinker: true
  });

  // anonymize after initializing, otherwise a warning is shown
  // in google analytics debugger
  if (opts.anonymizeIp) window.ga('set', 'anonymizeIp', true);

  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

GA.prototype.loaded = function () {
  return !! window.gaplugins;
};


/**
 * Load the Google Analytics library.
 *
 * @param {Function} callback
 */

GA.prototype.load = function (callback) {
  load('//www.google-analytics.com/analytics.js', callback);
};


/**
 * Page.
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

GA.prototype.page = function (category, name, properties, options) {
  properties = properties || {};
  this._category = category; // store for later
  if (name && category) name = category + ' ' + name;

  window.ga('send', 'pageview', {
    page: properties.path,
    title: name || properties.title,
    url: properties.url
  });

  // categorized pages
  if (category && this.options.trackCategorizedPages) {
    this.track('Viewed ' + category + ' Page', properties, { noninteraction: true });
  }

  // named pages
  if (name && this.options.trackNamedPages) {
    this.track('Viewed ' + name + ' Page', properties, { noninteraction: true });
  }
};


/**
 * Track.
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/events
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

GA.prototype.track = function (event, properties, options) {
  properties = properties || {};
  options = options || {};

  window.ga('send', 'event', {
    eventAction: event,
    eventCategory: this._category || properties.category || 'All',
    eventLabel: properties.label,
    eventValue: formatValue(properties.value || properties.revenue),
    nonInteraction: properties.noninteraction || options.noninteraction
  });
};


/**
 * Initialize (classic).
 *
 * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiBasicConfiguration
 */

GA.prototype.initializeClassic = function () {
  var opts = this.options;
  var anonymize = opts.anonymizeIp;
  var db = opts.doubleClick;
  var domain = opts.domain;
  var enhanced = opts.enhancedLinkAttribution;
  var ignore = opts.ignoreReferrer;
  var sample = opts.siteSpeedSampleRate;

  window._gaq = window._gaq || [];
  push('_setAccount', opts.trackingId);
  push('_setAllowLinker', true);

  if (anonymize) push('_gat._anonymizeIp');
  if (domain) push('_setDomainName', domain);
  if (sample) push('_setSiteSpeedSampleRate', sample);

  if (enhanced) {
    var protocol = 'https:' === document.location.protocol ? 'https:' : 'http:';
    var pluginUrl = protocol + '//www.google-analytics.com/plugins/ga/inpage_linkid.js';
    push('_require', 'inpage_linkid', pluginUrl);
  }

  if (ignore) {
    if (!is.array(ignore)) ignore = [ignore];
    each(ignore, function (domain) {
      push('_addIgnoredRef', domain);
    });
  }

  this.load();
};


/**
 * Loaded? (classic)
 *
 * @return {Boolean}
 */

GA.prototype.loadedClassic = function () {
  return !! (window._gaq && window._gaq.push !== Array.prototype.push);
};


/**
 * Load the classic Google Analytics library.
 *
 * @param {Function} callback
 */

GA.prototype.loadClassic = function (callback) {
  if (this.options.doubleClick) {
    load('//stats.g.doubleclick.net/dc.js', callback);
  } else {
    load({
      http: 'http://www.google-analytics.com/ga.js',
      https: 'https://ssl.google-analytics.com/ga.js'
    }, callback);
  }
};


/**
 * Page (classic).
 *
 * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiBasicConfiguration
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

GA.prototype.pageClassic = function (category, name, properties, options) {
  properties = properties || {};
  options = options || {};
  this._category = category; // store for later

  push('_trackPageview', properties.path);

  // categorized pages
  if (category && this.options.trackCategorizedPages) {
    this.track('Viewed ' + category + ' Page', properties, { noninteraction: true });
  }

  // named pages
  if (name && this.options.trackNamedPages) {
    if (name && category) name = category + ' ' + name;
    this.track('Viewed ' + name + ' Page', properties, { noninteraction: true });
  }
};


/**
 * Track (classic).
 *
 * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiEventTracking
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

GA.prototype.trackClassic = function (event, properties, options) {
  properties = properties || {};
  options = options || {};

  var category = this._category || properties.category || 'All';
  var label = properties.label;
  var value = formatValue(properties.revenue || properties.value);
  var noninteraction = properties.noninteraction || options.noninteraction;

  push('_trackEvent', category, event, label, value, noninteraction);
};


/**
 * Format the value property to Google's liking.
 *
 * @param {Number} value
 * @return {Number}
 */

function formatValue (value) {
  if (!value || value < 0) return 0;
  return Math.round(value);
}
});
require.register("segmentio-analytics.js-integrations/lib/gosquared.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');
var onBody = require('on-body');


/**
 * User reference.
 */

var user;


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(GoSquared);
  user = analytics.user(); // store reference for later
};


/**
 * Expose `GoSquared` integration.
 */

var GoSquared = exports.Integration = integration('GoSquared')
  .assumesPageview()
  .readyOnLoad()
  .global('GoSquared')
  .global('_gs')
  .global('_gstc_lt')
  .option('siteToken', '');


/**
 * Initialize.
 *
 * http://www.gosquared.com/support
 *
 * @param {Object} page
 */

GoSquared.prototype.initialize = function (page) {
  var self = this;
  var options = this.options;

  // gosquared assumes a body in their script, so we need this wrapper
  onBody(function () {
    window.GoSquared = {};
    window.GoSquared.acct = options.siteToken;
    window.GoSquared.q = [];
    window._gstc_lt = new Date().getTime(); // time from `load`

    self.identify(user.id(), user.traits());
    self.load();
  });
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

GoSquared.prototype.loaded = function () {
  return !! window._gs;
};


/**
 * Load the GoSquared library.
 *
 * @param {Function} callback
 */

GoSquared.prototype.load = function (callback) {
  load('//d1l6p2sc9645hc.cloudfront.net/tracker.js', callback);
};


/**
 * Page.
 *
 * https://www.gosquared.com/customer/portal/articles/612063-tracker-functions
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

GoSquared.prototype.page = function (category, name, properties, options) {
  properties = properties || {};
  if (name && category) name = category + ' ' + name;
  push('TrackView', properties.path, name || properties.title);
};


/**
 * Identify.
 *
 * https://www.gosquared.com/customer/portal/articles/612063-tracker-functions
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

GoSquared.prototype.identify = function (id, traits, options) {
  traits = traits || {};

  if (id) traits.userID = id; // gosquared recognizes this in `Visitor`
  if (id) window.GoSquared.UserName = id;
  if (id || traits.email || traits.username) {
    window.GoSquared.VisitorName = traits.email || traits.username || id;
  }

  window.GoSquared.Visitor = traits;
};


/**
 * Track.
 *
 * https://www.gosquared.com/customer/portal/articles/609683-event-tracking
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

GoSquared.prototype.track = function (event, properties, options) {
  push('TrackEvent', event, properties);
};


/**
 * Helper to push onto the GoSquared queue.
 *
 * @param {Mixed} args...
 */

function push (args) {
  args = [].slice.call(arguments);
  window.GoSquared.q.push(args);
}
});
require.register("segmentio-analytics.js-integrations/lib/heap.js", function(exports, require, module){

var alias = require('alias');
var callback = require('callback');
var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Heap);
};


/**
 * Expose `Heap` integration.
 */

var Heap = exports.Integration = integration('Heap')
  .assumesPageview()
  .readyOnInitialize()
  .global('heap')
  .global('_heapid')
  .option('apiKey', '');


/**
 * Initialize.
 *
 * https://heapanalytics.com/docs#installWeb
 *
 * @param {Object} page
 */

Heap.prototype.initialize = function (page) {
  window.heap=window.heap||[];window.heap.load=function(a){window._heapid=a;var d=function(a){return function(){window.heap.push([a].concat(Array.prototype.slice.call(arguments,0)));};},e=["identify","track"];for(var f=0;f<e.length;f++)window.heap[e[f]]=d(e[f]);};
  window.heap.load(this.options.apiKey);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Heap.prototype.loaded = function () {
  return (window.heap && window.heap.appid);
};


/**
 * Load the Heap library.
 *
 * @param {Function} callback
 */

Heap.prototype.load = function (callback) {
  load('//d36lvucg9kzous.cloudfront.net', callback);
};


/**
 * Trait aliases.
 */

var traitAliases = {
  username: 'handle'
};


/**
 * Identify.
 *
 * https://heapanalytics.com/docs#identify
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Heap.prototype.identify = function (id, traits, options) {
  traits = alias(traits, traitAliases);
  window.heap.identify(traits);
};


/**
 * Track.
 *
 * https://heapanalytics.com/docs#track
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Heap.prototype.track = function (event, properties, options) {
  window.heap.track(event, properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/hittail.js", function(exports, require, module){

var integration = require('integration');
var is = require('is');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(HitTail);
};


/**
 * Expose `HitTail` integration.
 */

var HitTail = exports.Integration = integration('HitTail')
  .assumesPageview()
  .readyOnLoad()
  .global('htk')
  .option('siteId', '');


/**
 * Initialize.
 *
 * @param {Object} page
 */

HitTail.prototype.initialize = function (page) {
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

HitTail.prototype.loaded = function () {
  return is.fn(window.htk);
};


/**
 * Load the HitTail library.
 *
 * @param {Function} callback
 */

HitTail.prototype.load = function (callback) {
  var id = this.options.siteId;
  load('//' + id + '.hittail.com/mlt.js', callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/hubspot.js", function(exports, require, module){

var callback = require('callback');
var convert = require('convert-dates');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_hsq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(HubSpot);
};


/**
 * Expose `HubSpot` integration.
 */

var HubSpot = exports.Integration = integration('HubSpot')
  .assumesPageview()
  .readyOnInitialize()
  .global('_hsq')
  .option('portalId', null);


/**
 * Initialize.
 *
 * @param {Object} page
 */

HubSpot.prototype.initialize = function (page) {
  window._hsq = [];
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

HubSpot.prototype.loaded = function () {
  return !! (window._hsq && window._hsq.push !== Array.prototype.push);
};


/**
 * Load the HubSpot library.
 *
 * @param {Function} fn
 */

HubSpot.prototype.load = function (fn) {
  if (document.getElementById('hs-analytics')) return callback.async(fn);

  var id = this.options.portalId;
  var cache = Math.ceil(new Date() / 300000) * 300000;
  var url = 'https://js.hs-analytics.net/analytics/' + cache + '/' + id + '.js';
  var script = load(url, fn);
  script.id = 'hs-analytics';
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

HubSpot.prototype.page = function (category, name, properties, options) {
  push('_trackPageview');
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

HubSpot.prototype.identify = function (id, traits, options) {
  traits = traits || {};

  if (!traits.email) return;
  if (id) traits.id = id;
  traits = convertDates(traits);
  push('identify', traits);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

HubSpot.prototype.track = function (event, properties, options) {
  properties = properties || {};
  properties = convertDates(properties);
  push('trackEvent', event, properties);
};


/**
 * Convert all the dates in the HubSpot properties to millisecond times
 *
 * @param {Object} properties
 */

function convertDates (properties) {
  return convert(properties, function (date) { return date.getTime(); });
}

});
require.register("segmentio-analytics.js-integrations/lib/improvely.js", function(exports, require, module){

var alias = require('alias');
var callback = require('callback');
var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Improvely);
};


/**
 * Expose `Improvely` integration.
 */

var Improvely = exports.Integration = integration('Improvely')
  .assumesPageview()
  .readyOnInitialize()
  .global('_improvely')
  .global('improvely')
  .option('domain', '')
  .option('projectId', null);


/**
 * Initialize.
 *
 * http://www.improvely.com/docs/landing-page-code
 *
 * @param {Object} page
 */

Improvely.prototype.initialize = function (page) {
  window._improvely = [];
  window.improvely = {init: function (e, t) { window._improvely.push(["init", e, t]); }, goal: function (e) { window._improvely.push(["goal", e]); }, label: function (e) { window._improvely.push(["label", e]); } };

  var domain = this.options.domain;
  var id = this.options.projectId;
  window.improvely.init(domain, id);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Improvely.prototype.loaded = function () {
  return !! (window.improvely && window.improvely.identify);
};


/**
 * Load the Improvely library.
 *
 * @param {Function} callback
 */

Improvely.prototype.load = function (callback) {
  var domain = this.options.domain;
  load('//' + domain + '.iljmp.com/improvely.js', callback);
};


/**
 * Identify.
 *
 * http://www.improvely.com/docs/labeling-visitors
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Improvely.prototype.identify = function (id, traits, options) {
  if (id) window.improvely.label(id);
};


/**
 * Track.
 *
 * http://www.improvely.com/docs/conversion-code
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Improvely.prototype.track = function (event, properties, options) {
  properties = properties || {};
  properties.type = event;
  properties = alias(properties, { revenue: 'amount' });
  window.improvely.goal(properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/inspectlet.js", function(exports, require, module){

var integration = require('integration');
var alias = require('alias');
var clone = require('clone');
var load = require('load-script');
var push = require('global-queue')('__insp');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Inspectlet);
};


/**
 * Expose `Inspectlet` integration.
 */

var Inspectlet = exports.Integration = integration('Inspectlet')
  .assumesPageview()
  .readyOnLoad()
  .global('__insp')
  .global('__insp_')
  .option('wid', '');


/**
 * Initialize.
 *
 * https://www.inspectlet.com/dashboard/embedcode/1492461759/initial
 *
 * @param {Object} page
 */

Inspectlet.prototype.initialize = function (page) {
  push('wid', this.options.wid);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Inspectlet.prototype.loaded = function () {
  return !! window.__insp_;
};


/**
 * Load the Inspectlet library.
 *
 * @param {Function} callback
 */

Inspectlet.prototype.load = function (callback) {
  load('//www.inspectlet.com/inspectlet.js', callback);
};


/**
 * Track.
 *
 * http://www.inspectlet.com/docs/tags
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Inspectlet.prototype.track = function (event, properties, options) {
  push('tagSession', event);
};
});
require.register("segmentio-analytics.js-integrations/lib/intercom.js", function(exports, require, module){

var alias = require('alias');
var convertDates = require('convert-dates');
var integration = require('integration');
var each = require('each');
var is = require('is');
var isEmail = require('is-email');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Intercom);
};


/**
 * Expose `Intercom` integration.
 */

var Intercom = exports.Integration = integration('Intercom')
  .assumesPageview()
  .readyOnLoad()
  .global('Intercom')
  .option('activator', '#IntercomDefaultWidget')
  .option('appId', '')
  .option('counter', true)
  .option('inbox', false);


/**
 * Initialize.
 *
 * http://docs.intercom.io/
 * http://docs.intercom.io/#IntercomJS
 *
 * @param {Object} page
 */

Intercom.prototype.initialize = function (page) {
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Intercom.prototype.loaded = function () {
  return is.fn(window.Intercom);
};


/**
 * Load the Intercom library.
 *
 * @param {Function} callback
 */

Intercom.prototype.load = function (callback) {
  load('https://static.intercomcdn.com/intercom.v1.js', callback);
};


/**
 * Identify.
 *
 * http://docs.intercom.io/#IntercomJS
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Intercom.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  options = options || {};

  if (!id && !traits.email) return; // one is required

  traits.app_id = this.options.appId;
  if (id) traits.user_id = id;

  // handle dates
  traits = convertDates(traits, formatDate);
  traits = alias(traits, { created: 'created_at'});
  if (traits.company) {
    traits.company = alias(traits.company, { created: 'created_at' });
  }

  // handle options
  var Intercom = options.Intercom || options.intercom || {};
  if (Intercom.increments) traits.increments = Intercom.increments;
  if (Intercom.userHash) traits.user_hash = Intercom.userHash;
  if (Intercom.user_hash) traits.user_hash = Intercom.user_hash;
  if (this.options.inbox) {
    traits.widget = {
      activator: this.options.activator,
      use_counter: this.options.counter
    };
  }

  var method = this._id !== id ? 'boot': 'update';
  this._id = id; // cache for next time

  window.Intercom(method, traits);
};


/**
 * Group.
 *
 * @param {String} id (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Intercom.prototype.group = function (id, properties, options) {
  properties = properties || {};
  if (id) properties.id = id;
  window.Intercom('update', { company: properties });
};


/**
 * Format a date to Intercom's liking.
 *
 * @param {Date} date
 * @return {Number}
 */

function formatDate (date) {
  return Math.floor(date / 1000);
}
});
require.register("segmentio-analytics.js-integrations/lib/keen-io.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Keen);
};


/**
 * Expose `Keen IO` integration.
 */

var Keen = exports.Integration = integration('Keen IO')
  .readyOnInitialize()
  .global('Keen')
  .option('projectId', '')
  .option('readKey', '')
  .option('writeKey', '')
  .option('trackNamedPages', true)
  .option('trackAllPages', false)
  .option('trackCategorizedPages', true);


/**
 * Initialize.
 *
 * https://keen.io/docs/
 */

Keen.prototype.initialize = function () {
  var options = this.options;
  window.Keen = window.Keen||{configure:function(e){this._cf=e;},addEvent:function(e,t,n,i){this._eq=this._eq||[],this._eq.push([e,t,n,i]);},setGlobalProperties:function(e){this._gp=e;},onChartsReady:function(e){this._ocrq=this._ocrq||[],this._ocrq.push(e);}};
  window.Keen.configure({
    projectId: options.projectId,
    writeKey: options.writeKey,
    readKey: options.readKey
  });
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Keen.prototype.loaded = function () {
  return !! (window.Keen && window.Keen.Base64);
};


/**
 * Load the Keen IO library.
 *
 * @param {Function} callback
 */

Keen.prototype.load = function (callback) {
  load('//dc8na2hxrj29i.cloudfront.net/code/keen-2.1.0-min.js', callback);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Keen.prototype.page = function (category, name, properties, options) {
  var opts = this.options;

  // all pages
  if (opts.trackAllPages) {
    this.track('Loaded a Page', properties);
  }

  // named pages
  if (name && opts.trackNamedPages) {
    if (name && category) name = category + ' ' + name;
    this.track('Viewed ' + name + ' Page', properties);
  }

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track('Viewed ' + category + ' Page', properties);
  }
};


/**
 * Identify.
 *
 * TODO: migrate from old `userId` to simpler `id`
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Keen.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  var user = {};
  if (id) user.userId = id;
  if (traits) user.traits = traits;
  window.Keen.setGlobalProperties(function() {
    return { user: user };
  });
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Keen.prototype.track = function (event, properties, options) {
  window.Keen.addEvent(event, properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/kissmetrics.js", function(exports, require, module){

var alias = require('alias');
var Batch = require('batch');
var callback = require('callback');
var integration = require('integration');
var is = require('is');
var load = require('load-script');
var push = require('global-queue')('_kmq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(KISSmetrics);
};


/**
 * Expose `KISSmetrics` integration.
 */

var KISSmetrics = exports.Integration = integration('KISSmetrics')
  .assumesPageview()
  .readyOnInitialize()
  .global('_kmq')
  .global('KM')
  .global('_kmil')
  .option('apiKey', '')
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true);


/**
 * Initialize.
 *
 * http://support.kissmetrics.com/apis/javascript
 *
 * @param {Object} page
 */

KISSmetrics.prototype.initialize = function (page) {
  window._kmq = [];
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

KISSmetrics.prototype.loaded = function () {
  return is.object(window.KM);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

KISSmetrics.prototype.load = function (callback) {
  var key = this.options.apiKey;
  var useless = '//i.kissmetrics.com/i.js';
  var library = '//doug1izaerwt3.cloudfront.net/' + key + '.1.js';

  new Batch()
    .push(function (done) { load(useless, done); }) // :)
    .push(function (done) { load(library, done); })
    .end(callback);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

KISSmetrics.prototype.page = function (category, name, properties, options) {
  properties = properties || {};
  var opts = this.options;

  // named pages
  if (name && opts.trackNamedPages) {
    if (name && category) name = category + ' ' + name;
    this.track('Viewed ' + name + ' Page', properties);
  }

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track('Viewed ' + category + ' Page', properties);
  }
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

KISSmetrics.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (id) push('identify', id);
  if (traits) push('set', traits);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

KISSmetrics.prototype.track = function (event, properties, options) {
  properties = properties || {};
  properties = alias(properties, { revenue: 'Billing Amount' });
  push('record', event, properties);
};


/**
 * Alias.
 *
 * @param {String} to
 * @param {String} from (optional)
 */

KISSmetrics.prototype.alias = function (to, from) {
  push('alias', to, from);
};
});
require.register("segmentio-analytics.js-integrations/lib/klaviyo.js", function(exports, require, module){

var alias = require('alias');
var callback = require('callback');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_learnq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Klaviyo);
};


/**
 * Expose `Klaviyo` integration.
 */

var Klaviyo = exports.Integration = integration('Klaviyo')
  .assumesPageview()
  .readyOnInitialize()
  .global('_learnq')
  .option('apiKey', '');


/**
 * Initialize.
 *
 * https://www.klaviyo.com/docs/getting-started
 *
 * @param {Object} page
 */

Klaviyo.prototype.initialize = function (page) {
  push('account', this.options.apiKey);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Klaviyo.prototype.loaded = function () {
  return !! (window._learnq && window._learnq.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Klaviyo.prototype.load = function (callback) {
  load('//a.klaviyo.com/media/js/learnmarklet.js', callback);
};


/**
 * Trait aliases.
 */

var aliases = {
  id: '$id',
  email: '$email',
  firstName: '$first_name',
  lastName: '$last_name',
  phone: '$phone_number',
  title: '$title'
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Klaviyo.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (!id && !traits.email) return;
  if (id) traits.id = id;
  traits = alias(traits, aliases);
  push('identify', traits);
};


/**
 * Group.
 *
 * @param {String} id
 * @param {Object} properties (optional)
 */

Klaviyo.prototype.group = function (id, properties) {
  properties = properties || {};
  if (!properties.name) return;
  push('identify', { $organization: properties.name });
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Klaviyo.prototype.track = function (event, properties, options) {
  properties = properties || {};
  push('track', event, properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/leadlander.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(LeadLander);
};


/**
 * Expose `LeadLander` integration.
 */

var LeadLander = exports.Integration = integration('LeadLander')
  .assumesPageview()
  .readyOnLoad()
  .global('llactid')
  .global('trackalyzer')
  .option('accountId', null);


/**
 * Initialize.
 *
 * @param {Object} page
 */

LeadLander.prototype.initialize = function (page) {
  window.llactid = this.options.accountId;
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

LeadLander.prototype.loaded = function () {
  return !! window.trackalyzer;
};


/**
 * Load.
 *
 * @param {Function} callback
 */

LeadLander.prototype.load = function (callback) {
  load('http://t6.trackalyzer.com/trackalyze-nodoc.js', callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/livechat.js", function(exports, require, module){

var each = require('each');
var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(LiveChat);
};


/**
 * Expose `LiveChat` integration.
 */

var LiveChat = exports.Integration = integration('LiveChat')
  .assumesPageview()
  .readyOnLoad()
  .global('__lc')
  .option('license', '');


/**
 * Initialize.
 *
 * http://www.livechatinc.com/api/javascript-api
 *
 * @param {Object} page
 */

LiveChat.prototype.initialize = function (page) {
  window.__lc = { license: this.options.license };
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

LiveChat.prototype.loaded = function () {
  return !! window.LC_API;
};


/**
 * Load.
 *
 * @param {Function} callback
 */

LiveChat.prototype.load = function (callback) {
  load('//cdn.livechatinc.com/tracking.js', callback);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

LiveChat.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (id) traits['User ID'] = id;
  window.LC_API.set_custom_variables(convert(traits));
};


/**
 * Convert a traits object into the format LiveChat requires.
 *
 * @param {Object} traits
 * @return {Array}
 */

function convert (traits) {
  var arr = [];
  each(traits, function (key, value) {
    arr.push({ name: key, value: value });
  });
  return arr;
}
});
require.register("segmentio-analytics.js-integrations/lib/lucky-orange.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(LuckyOrange);
};


/**
 * Expose `LuckyOrange` integration.
 */

var LuckyOrange = exports.Integration = integration('Lucky Orange')
  .assumesPageview()
  .readyOnLoad()
  .global('_loq')
  .global('__wtw_lucky_site_id')
  .global('__wtw_lucky_is_segment_io')
  .option('siteId', null);


/**
 * Initialize.
 *
 * @param {Object} page
 */

LuckyOrange.prototype.initialize = function (page) {
  window._loq || (window._loq = []);
  window.__wtw_lucky_site_id = this.options.siteId;
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

LuckyOrange.prototype.loaded = function () {
  return (window._loq && window._loq.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

LuckyOrange.prototype.load = function (callback) {
  var cache = Math.floor(new Date().getTime() / 60000);
  load({
    http: 'http://www.luckyorange.com/w.js?' + cache,
    https: 'https://ssl.luckyorange.com/w.js?' + cache
  }, callback);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

LuckyOrange.prototype.identify = function (id, traits, options) {
  if (id) window._loq.push(['identify', id]);
  if (traits) window._loq.push(['set', traits]);
};
});
require.register("segmentio-analytics.js-integrations/lib/lytics.js", function(exports, require, module){

var alias = require('alias');
var callback = require('callback');
var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Lytics);
};


/**
 * Expose `Lytics` integration.
 */

var Lytics = exports.Integration = integration('Lytics')
  .assumesPageview()
  .readyOnInitialize()
  .global('jstag')
  .option('cid', '')
  .option('cookie', 'seerid')
  .option('delay', 200)
  .option('sessionTimeout', 1800)
  .option('url', '//c.lytics.io');


/**
 * Options aliases.
 */

var aliases = {
  sessionTimeout: 'sessecs'
};


/**
 * Initialize.
 *
 * http://admin.lytics.io/doc#jstag
 *
 * @param {Object} page
 */

Lytics.prototype.initialize = function (page) {
  var options = alias(this.options, aliases);
  window.jstag = (function () {var t = {_q: [], _c: options, ts: (new Date()).getTime() }; t.send = function() {this._q.push([ 'ready', 'send', Array.prototype.slice.call(arguments) ]); return this; }; return t; })();
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Lytics.prototype.loaded = function () {
  return !! (window.jstag && window.jstag.bind);
};


/**
 * Load the Lytics library.
 *
 * @param {Function} callback
 */

Lytics.prototype.load = function (callback) {
  load('//c.lytics.io/static/io.min.js', callback);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Lytics.prototype.page = function (category, name, properties, optional) {
  properties = properties || {};
  window.jstag.send(properties);
};


/**
 * Idenfity.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Lytics.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (id) traits._uid = id;
  window.jstag.send(traits);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Lytics.prototype.track = function (event, properties, options) {
  properties = properties || {};
  properties._e = event;
  window.jstag.send(properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/mixpanel.js", function(exports, require, module){

var alias = require('alias');
var clone = require('clone');
var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Mixpanel);
};


/**
 * Expose `Mixpanel` integration.
 */

var Mixpanel = exports.Integration = integration('Mixpanel')
  .readyOnLoad()
  .global('mixpanel')
  .option('cookieName', '')
  .option('nameTag', true)
  .option('pageview', false)
  .option('people', false)
  .option('token', '')
  .option('trackAllPages', false)
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true);


/**
 * Options aliases.
 */

var optionsAliases = {
  cookieName: 'cookie_name'
};


/**
 * Initialize.
 *
 * https://mixpanel.com/help/reference/javascript#installing
 * https://mixpanel.com/help/reference/javascript-full-api-reference#mixpanel.init
 */

Mixpanel.prototype.initialize = function () {
  (function (c, a) {window.mixpanel = a; var b, d, h, e; a._i = []; a.init = function (b, c, f) {function d(a, b) {var c = b.split('.'); 2 == c.length && (a = a[c[0]], b = c[1]); a[b] = function () {a.push([b].concat(Array.prototype.slice.call(arguments, 0))); }; } var g = a; 'undefined' !== typeof f ? g = a[f] = [] : f = 'mixpanel'; g.people = g.people || []; h = ['disable', 'track', 'track_pageview', 'track_links', 'track_forms', 'register', 'register_once', 'unregister', 'identify', 'alias', 'name_tag', 'set_config', 'people.set', 'people.increment', 'people.track_charge', 'people.append']; for (e = 0; e < h.length; e++) d(g, h[e]); a._i.push([b, c, f]); }; a.__SV = 1.2; })(document, window.mixpanel || []);
  var options = alias(this.options, optionsAliases);
  window.mixpanel.init(options.token, options);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Mixpanel.prototype.loaded = function () {
  return !! (window.mixpanel && window.mixpanel.config);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Mixpanel.prototype.load = function (callback) {
  load('//cdn.mxpnl.com/libs/mixpanel-2.2.min.js', callback);
};


/**
 * Page.
 *
 * https://mixpanel.com/help/reference/javascript-full-api-reference#mixpanel.track_pageview
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Mixpanel.prototype.page = function (category, name, properties, options) {
  var opts = this.options;

  // all pages
  if (opts.trackAllPages) {
    this.track('Loaded a Page', properties);
  }

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track('Viewed ' + category + ' Page', properties);
  }

  // named pages
  if (name && opts.trackNamedPages) {
    if (name && category) name = category + ' ' + name;
    this.track('Viewed ' + name + ' Page', properties);
  }
};


/**
 * Trait aliases.
 */

var traitAliases = {
  created: '$created',
  email: '$email',
  firstName: '$first_name',
  lastName: '$last_name',
  lastSeen: '$last_seen',
  name: '$name',
  username: '$username',
  phone: '$phone'
};


/**
 * Identify.
 *
 * https://mixpanel.com/help/reference/javascript#super-properties
 * https://mixpanel.com/help/reference/javascript#user-identity
 * https://mixpanel.com/help/reference/javascript#storing-user-profiles
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Mixpanel.prototype.identify = function (id, traits, options) {
  traits = traits || {};

  // id
  if (id) window.mixpanel.identify(id);

  // name tag
  var nametag = traits.email || traits.username || id;
  if (nametag) window.mixpanel.name_tag(nametag);

  // traits
  traits = alias(traits, traitAliases);
  window.mixpanel.register(traits);
  if (this.options.people) window.mixpanel.people.set(traits);
};


/**
 * Track.
 *
 * https://mixpanel.com/help/reference/javascript#sending-events
 * https://mixpanel.com/help/reference/javascript#tracking-revenue
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Mixpanel.prototype.track = function (event, properties, options) {
  properties = properties || {};
  window.mixpanel.track(event, properties);
  if (properties.revenue && this.options.people) {
    window.mixpanel.people.track_charge(properties.revenue);
  }
};


/**
 * Alias.
 *
 * https://mixpanel.com/help/reference/javascript#user-identity
 * https://mixpanel.com/help/reference/javascript-full-api-reference#mixpanel.alias
 *
 * @param {String} to
 * @param {String} from (optional)
 */

Mixpanel.prototype.alias = function (to, from) {
  var mp = window.mixpanel;
  if (mp.get_distinct_id && mp.get_distinct_id() === to) return;
  // HACK: internal mixpanel API to ensure we don't overwrite
  if (mp.get_property && mp.get_property('$people_distinct_id') === to) return;
  // although undocumented, mixpanel takes an optional original id
  mp.alias(to, from);
};
});
require.register("segmentio-analytics.js-integrations/lib/mousestats.js", function(exports, require, module){

var each = require('each');
var integration = require('integration');
var is = require('is');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(MouseStats);
};


/**
 * Expose `MouseStats` integration.
 */

var MouseStats = exports.Integration = integration('MouseStats')
  .assumesPageview()
  .readyOnLoad()
  .global('msaa')
  .option('accountNumber', '');


/**
 * Initialize.
 *
 * http://www.mousestats.com/docs/pages/allpages
 *
 * @param {Object} page
 */

MouseStats.prototype.initialize = function (page) {
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

MouseStats.prototype.loaded = function () {
  return is.fn(window.msaa);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

MouseStats.prototype.load = function (callback) {
  var number = this.options.accountNumber;
  var path = number.slice(0,1) + '/' + number.slice(1,2) + '/' + number;
  var cache = Math.floor(new Date().getTime() / 60000);
  var partial = '.mousestats.com/js/' + path + '.js?' + cache;
  var http = 'http://www2' + partial;
  var https = 'https://ssl' + partial;
  load({ http: http, https: https }, callback);
};


/**
 * Identify.
 *
 * http://www.mousestats.com/docs/wiki/7/how-to-add-custom-data-to-visitor-playbacks
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

MouseStats.prototype.identify = function (id, traits, options) {
  if (id) traits.id = id;
  each(traits, function (key, value) {
    window.MouseStatsVisitorPlaybacks.customVariable(key, value);
  });
};
});
require.register("segmentio-analytics.js-integrations/lib/olark.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var https = require('use-https');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Olark);
};


/**
 * Expose `Olark` integration.
 */

var Olark = exports.Integration = integration('Olark')
  .assumesPageview()
  .readyOnInitialize()
  .global('olark')
  .option('identify', true)
  .option('page', true)
  .option('siteId', '')
  .option('track', false);


/**
 * Initialize.
 *
 * http://www.olark.com/documentation
 *
 * @param {Object} page
 */

Olark.prototype.initialize = function (page) {
  window.olark||(function(c){var f=window,d=document,l=https()?"https:":"http:",z=c.name,r="load";var nt=function(){f[z]=function(){(a.s=a.s||[]).push(arguments)};var a=f[z]._={},q=c.methods.length;while(q--){(function(n){f[z][n]=function(){f[z]("call",n,arguments)}})(c.methods[q])}a.l=c.loader;a.i=nt;a.p={0:+new Date};a.P=function(u){a.p[u]=new Date-a.p[0]};function s(){a.P(r);f[z](r)}f.addEventListener?f.addEventListener(r,s,false):f.attachEvent("on"+r,s);var ld=function(){function p(hd){hd="head";return["<",hd,"></",hd,"><",i,' onl' + 'oad="var d=',g,";d.getElementsByTagName('head')[0].",j,"(d.",h,"('script')).",k,"='",l,"//",a.l,"'",'"',"></",i,">"].join("")}var i="body",m=d[i];if(!m){return setTimeout(ld,100)}a.P(1);var j="appendChild",h="createElement",k="src",n=d[h]("div"),v=n[j](d[h](z)),b=d[h]("iframe"),g="document",e="domain",o;n.style.display="none";m.insertBefore(n,m.firstChild).id=z;b.frameBorder="0";b.id=z+"-loader";if(/MSIE[ ]+6/.test(navigator.userAgent)){b.src="javascript:false"}b.allowTransparency="true";v[j](b);try{b.contentWindow[g].open()}catch(w){c[e]=d[e];o="javascript:var d="+g+".open();d.domain='"+d.domain+"';";b[k]=o+"void(0);"}try{var t=b.contentWindow[g];t.write(p());t.close()}catch(x){b[k]=o+'d.write("'+p().replace(/"/g,String.fromCharCode(92)+'"')+'");d.close();'}a.P(2)};ld()};nt()})({loader: "static.olark.com/jsclient/loader0.js",name:"olark",methods:["configure","extend","declare","identify"]});
  window.olark.identify(this.options.siteId);

  // keep track of the widget's open state
  var self = this;
  box('onExpand', function () { self._open = true; });
  box('onShrink', function () { self._open = false; });
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Olark.prototype.page = function (category, name, properties, options) {
  if (!this.options.page || !this._open) return;
  properties = properties || {};
  if (!name && !properties.url) return;

  if (name && category) name = category + ' ' + name;
  var msg = name ? name.toLowerCase() + ' page' : properties.url;

  chat('sendNotificationToOperator', {
    body: 'looking at ' + msg // lowercase since olark does
  });
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Olark.prototype.identify = function (id, traits, options) {
  if (!this.options.identify) return;

  traits || (traits = {});
  if (id) traits.id = id;

  visitor('updateCustomFields', traits);
  if (traits.email) visitor('updateEmailAddress', { emailAddress: traits.email });
  if (traits.phone) visitor('updatePhoneNumber', { phoneNumber: traits.phone });

  // figure out best name
  var name = traits.firstName;
  if (traits.lastName) name += ' ' + traits.lastName;
  if (traits.name) name = traits.name;
  if (name) visitor('updateFullName', { fullName: name });

  // figure out best nickname
  var nickname = name || traits.email || traits.username || id;
  if (name && traits.email) nickname += ' (' + traits.email + ')';
  if (nickname) chat('updateVisitorNickname', { snippet: nickname });
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Olark.prototype.track = function (event, properties, options) {
  if (!this.options.track || !this._open) return;
  chat('sendNotificationToOperator', {
    body: 'visitor triggered "' + event + '"' // lowercase since olark does
  });
};


/**
 * Helper method for Olark box API calls.
 *
 * @param {String} action
 * @param {Object} value
 */

function box (action, value) {
  window.olark('api.box.' + action, value);
}


/**
 * Helper method for Olark visitor API calls.
 *
 * @param {String} action
 * @param {Object} value
 */

function visitor (action, value) {
  window.olark('api.visitor.' + action, value);
}


/**
 * Helper method for Olark chat API calls.
 *
 * @param {String} action
 * @param {Object} value
 */

function chat (action, value) {
  window.olark('api.chat.' + action, value);
}
});
require.register("segmentio-analytics.js-integrations/lib/optimizely.js", function(exports, require, module){

var bind = require('bind');
var callback = require('callback');
var each = require('each');
var integration = require('integration');
var push = require('global-queue')('optimizely');
var tick = require('next-tick');


/**
 * Analytics reference.
 */

var analytics;


/**
 * Expose plugin.
 */

module.exports = exports = function (ajs) {
  ajs.addIntegration(Optimizely);
  analytics = ajs; // store for later
};


/**
 * Expose `Optimizely` integration.
 */

var Optimizely = exports.Integration = integration('Optimizely')
  .readyOnInitialize()
  .option('variations', true)
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true);


/**
 * Initialize.
 *
 * https://www.optimizely.com/docs/api#function-calls
 */

Optimizely.prototype.initialize = function () {
  if (this.options.variations) tick(this.replay);
};


/**
 * Track.
 *
 * https://www.optimizely.com/docs/api#track-event
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Optimizely.prototype.track = function (event, properties, options) {
  properties || (properties = {});
  if (properties.revenue) properties.revenue = properties.revenue * 100;
  push('trackEvent', event, properties);
};


/**
 * Page.
 *
 * https://www.optimizely.com/docs/api#track-event
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Optimizely.prototype.page = function (category, name, properties, options) {
  var opts = this.options;

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track('Viewed ' + category + ' Page', properties);
  }

  // named pages
  if (name && opts.trackNamedPages) {
    if (name && category) name = category + ' ' + name;
    this.track('Viewed ' + name + ' Page', properties);
  }
};


/**
 * Replay experiment data as traits to other enabled providers.
 *
 * https://www.optimizely.com/docs/api#data-object
 */

Optimizely.prototype.replay = function () {
  if (!window.optimizely) return; // in case the snippet isnt on the page

  var data = window.optimizely.data;
  if (!data) return;

  var experiments = data.experiments;
  var map = data.state.variationNamesMap;
  var traits = {};

  each(map, function (experimentId, variation) {
    var experiment = experiments[experimentId].name;
    traits['Experiment: ' + experiment] = variation;
  });

  analytics.identify(traits);
};
});
require.register("segmentio-analytics.js-integrations/lib/perfect-audience.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(PerfectAudience);
};


/**
 * Expose `PerfectAudience` integration.
 */

var PerfectAudience = exports.Integration = integration('Perfect Audience')
  .assumesPageview()
  .readyOnLoad()
  .global('_pa')
  .option('siteId', '');


/**
 * Initialize.
 *
 * https://www.perfectaudience.com/docs#javascript_api_autoopen
 *
 * @param {Object} page
 */

PerfectAudience.prototype.initialize = function (page) {
  window._pa = window._pa || {};
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

PerfectAudience.prototype.loaded = function () {
  return !! (window._pa && window._pa.track);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

PerfectAudience.prototype.load = function (callback) {
  var id = this.options.siteId;
  load('//tag.perfectaudience.com/serve/' + id + '.js', callback);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

PerfectAudience.prototype.track = function (event, properties, options) {
  window._pa.track(event, properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/pingdom.js", function(exports, require, module){

var date = require('load-date');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_prum');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Pingdom);
};


/**
 * Expose `Pingdom` integration.
 */

var Pingdom = exports.Integration = integration('Pingdom')
  .assumesPageview()
  .readyOnLoad()
  .global('_prum')
  .option('id', '');


/**
 * Initialize.
 *
 * @param {Object} page
 */

Pingdom.prototype.initialize = function (page) {
  window._prum = window._prum || [];
  push('id', this.options.id);
  push('mark', 'firstbyte', date.getTime());
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Pingdom.prototype.loaded = function () {
  return !! (window._prum && window._prum.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Pingdom.prototype.load = function (callback) {
  load('//rum-static.pingdom.net/prum.min.js', callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/preact.js", function(exports, require, module){

var alias = require('alias');
var callback = require('callback');
var convertDates = require('convert-dates');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_lnq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Preact);
};


/**
 * Expose `Preact` integration.
 */

var Preact = exports.Integration = integration('Preact')
  .assumesPageview()
  .readyOnInitialize()
  .global('_lnq')
  .option('projectCode', '');


/**
 * Initialize.
 *
 * http://www.preact.io/api/javascript
 *
 * @param {Object} page
 */

Preact.prototype.initialize = function (page) {
  window._lnq = window._lnq || [];
  push('_setCode', this.options.projectCode);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Preact.prototype.loaded = function () {
  return !! (window._lnq && window._lnq.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Preact.prototype.load = function (callback) {
  load('//d2bbvl6dq48fa6.cloudfront.net/js/ln-2.4.min.js', callback);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Preact.prototype.identify = function (id, traits, options) {
  if (!id) return;
  traits = traits || {};
  traits = convertDates(traits, convertDate);
  traits = alias(traits, { created: 'created_at' });
  push('_setPersonData', {
    name: traits.name,
    email: traits.email,
    uid: id,
    properties: traits
  });
};


/**
 * Group.
 *
 * @param {String} id
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Preact.prototype.group = function (id, properties, options) {
  if (!id) return;
  properties || ( properties = {});
  properties.id = id;
  push('_setAccount', properties);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Preact.prototype.track = function (event, properties, options) {
  properties || (properties = {});
  var special = {};
  special.name = event;
  if (properties.revenue) {
    special.revenue = properties.revenue * 100;
    delete properties.revenue;
  }
  if (properties.note) {
    special.note = properties.note;
    delete properties.note;
  }
  push('_logEvent', special, properties);
};


/**
 * Convert a `date` to a format Preact supports.
 *
 * @param {Date} date
 * @return {Number}
 */

function convertDate (date) {
  return Math.floor(date / 1000);
}
});
require.register("segmentio-analytics.js-integrations/lib/qualaroo.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_kiq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Qualaroo);
};


/**
 * Expose `Qualaroo` integration.
 */

var Qualaroo = exports.Integration = integration('Qualaroo')
  .assumesPageview()
  .readyOnInitialize()
  .global('_kiq')
  .option('customerId', '')
  .option('siteToken', '')
  .option('track', false);


/**
 * Initialize.
 *
 * @param {Object} page
 */

Qualaroo.prototype.initialize = function (page) {
  window._kiq = window._kiq || [];
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Qualaroo.prototype.loaded = function () {
  return !! (window._kiq && window._kiq.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Qualaroo.prototype.load = function (callback) {
  var token = this.options.siteToken;
  var id = this.options.customerId;
  load('//s3.amazonaws.com/ki.js/' + id + '/' + token + '.js', callback);
};


/**
 * Identify.
 *
 * http://help.qualaroo.com/customer/portal/articles/731085-identify-survey-nudge-takers
 * http://help.qualaroo.com/customer/portal/articles/731091-set-additional-user-properties
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Qualaroo.prototype.identify = function (id, traits, options) {
  traits || (traits = {});
  if (traits.email) id = traits.email;
  if (id) push('identify', id);
  if (traits) push('set', traits);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Qualaroo.prototype.track = function (event, properties, options) {
  if (!this.options.track) return;
  var traits = {};
  traits['Triggered: ' + event] = true;
  this.identify(null, traits);
};
});
require.register("segmentio-analytics.js-integrations/lib/quantcast.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_qevents', { wrap: false });


/**
 * User reference.
 */

var user;


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Quantcast);
  user = analytics.user(); // store for later
};


/**
 * Expose `Quantcast` integration.
 */

var Quantcast = exports.Integration = integration('Quantcast')
  .assumesPageview()
  .readyOnInitialize()
  .global('_qevents')
  .global('__qc')
  .option('pCode', null)
  .option('labelPages', false);


/**
 * Initialize.
 *
 * https://www.quantcast.com/learning-center/guides/using-the-quantcast-asynchronous-tag/
 * https://www.quantcast.com/help/cross-platform-audience-measurement-guide/
 *
 * @param {Object} page
 */

Quantcast.prototype.initialize = function (page) {
  page = page || {};
  window._qevents = window._qevents || [];

  var opts = this.options;
  var settings = { qacct: opts.pCode };
  if (user.id()) settings.uid = user.id();
  push(settings);

  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Quantcast.prototype.loaded = function () {
  return !! window.__qc;
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Quantcast.prototype.load = function (callback) {
  load({
    http: 'http://edge.quantserve.com/quant.js',
    https: 'https://secure.quantserve.com/quant.js'
  }, callback);
};


/**
 * Page.
 *
 * https://cloudup.com/cBRRFAfq6mf
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Quantcast.prototype.page = function (category, name, properties, options) {
  var settings = {
    event: 'refresh',
    qacct: this.options.pCode,
  };
  if (user.id()) settings.uid = user.id();
  push(settings);
};


/**
 * Identify.
 *
 * https://www.quantcast.com/help/cross-platform-audience-measurement-guide/
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Quantcast.prototype.identify = function (id, traits, options) {
  // edit the initial quantcast settings
  if (id) window._qevents[0].uid = id;
};


/**
 * Track.
 *
 * https://cloudup.com/cBRRFAfq6mf
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Quantcast.prototype.track = function (event, properties, options) {
  var settings = {
    event: 'click',
    qacct: this.options.pCode
  };
  if (user.id()) settings.uid = user.id();
  push(settings);
};
});
require.register("segmentio-analytics.js-integrations/lib/rollbar.js", function(exports, require, module){

var callback = require('callback');
var clone = require('clone');
var extend = require('extend');
var integration = require('integration');
var load = require('load-script');
var onError = require('on-error');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Rollbar);
};


/**
 * Expose `Rollbar` integration.
 */

var Rollbar = exports.Integration = integration('Rollbar')
  .readyOnInitialize()
  .assumesPageview()
  .global('_rollbar')
  .option('accessToken', '')
  .option('identify', true);


/**
 * Initialize.
 *
 * https://rollbar.com/docs/notifier/rollbar.js/
 *
 * @param {Object} page
 */

Rollbar.prototype.initialize = function (page) {
  var options = this.options;
  window._rollbar = window._rollbar || window._ratchet || [options.accessToken, options];
  onError(function() { window._rollbar.push.apply(window._rollbar, arguments); });
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Rollbar.prototype.loaded = function () {
  return !! (window._rollbar && window._rollbar.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Rollbar.prototype.load = function (callback) {
  load('//d37gvrvc0wt4s1.cloudfront.net/js/1/rollbar.min.js', callback);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Rollbar.prototype.identify = function (id, traits, options) {
  if (!this.options.identify) return;
  traits || (traits = {});
  if (id) traits.id = id;

  // rollbar keeps extra params as the second item in their array until loaded
  var rollbar = window._rollbar;
  var params = rollbar.shift
    ? rollbar[1] = rollbar[1] || {}
    : rollbar.extraParams = rollbar.extraParams || {};
  params.person = params.person || {};
  extend(params.person, traits);
};

});
require.register("segmentio-analytics.js-integrations/lib/sentry.js", function(exports, require, module){

var integration = require('integration');
var is = require('is');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Sentry);
};


/**
 * Expose `Sentry` integration.
 */

var Sentry = exports.Integration = integration('Sentry')
  .readyOnLoad()
  .global('Raven')
  .option('config', '');


/**
 * Initialize.
 *
 * http://raven-js.readthedocs.org/en/latest/config/index.html
 */

Sentry.prototype.initialize = function () {
  var config = this.options.config;
  this.load(function () {
    // for now, raven basically requires `install` to be called
    // https://github.com/getsentry/raven-js/blob/master/src/raven.js#L113
    window.Raven.config(config).install();
  });
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Sentry.prototype.loaded = function () {
  return is.object(window.Raven);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Sentry.prototype.load = function (callback) {
  load('//d3nslu0hdya83q.cloudfront.net/dist/1.0/raven.min.js', callback);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Sentry.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (id) traits.id = id;
  window.Raven.setUser(traits);
};
});
require.register("segmentio-analytics.js-integrations/lib/snapengage.js", function(exports, require, module){

var integration = require('integration');
var is = require('is');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(SnapEngage);
};


/**
 * Expose `SnapEngage` integration.
 */

var SnapEngage = exports.Integration = integration('SnapEngage')
  .assumesPageview()
  .readyOnLoad()
  .global('SnapABug')
  .option('apiKey', '');


/**
 * Initialize.
 *
 * http://help.snapengage.com/installation-guide-getting-started-in-a-snap/
 *
 * @param {Object} page
 */

SnapEngage.prototype.initialize = function (page) {
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

SnapEngage.prototype.loaded = function () {
  return is.object(window.SnapABug);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

SnapEngage.prototype.load = function (callback) {
  var key = this.options.apiKey;
  var url = '//commondatastorage.googleapis.com/code.snapengage.com/js/' + key + '.js';
  load(url, callback);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

SnapEngage.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (!traits.email) return;
  window.SnapABug.setUserEmail(traits.email);
};
});
require.register("segmentio-analytics.js-integrations/lib/spinnakr.js", function(exports, require, module){

var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Spinnakr);
};


/**
 * Expose `Spinnakr` integration.
 */

var Spinnakr = exports.Integration = integration('Spinnakr')
  .assumesPageview()
  .readyOnLoad()
  .global('_spinnakr_site_id')
  .global('_spinnakr')
  .option('siteId', '');


/**
 * Initialize.
 *
 * @param {Object} page
 */

Spinnakr.prototype.initialize = function (page) {
  window._spinnakr_site_id = this.options.siteId;
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Spinnakr.prototype.loaded = function () {
  return !! window._spinnakr;
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Spinnakr.prototype.load = function (callback) {
  load('//d3ojzyhbolvoi5.cloudfront.net/js/so.js', callback);
};
});
require.register("segmentio-analytics.js-integrations/lib/tapstream.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');
var slug = require('slug');
var push = require('global-queue')('_tsq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Tapstream);
};


/**
 * Expose `Tapstream` integration.
 */

var Tapstream = exports.Integration = integration('Tapstream')
  .assumesPageview()
  .readyOnInitialize()
  .global('_tsq')
  .option('accountName', '')
  .option('trackAllPages', true)
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true);


/**
 * Initialize.
 *
 * @param {Object} page
 */

Tapstream.prototype.initialize = function (page) {
  window._tsq = window._tsq || [];
  push('setAccountName', this.options.accountName);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Tapstream.prototype.loaded = function () {
  return !! (window._tsq && window._tsq.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Tapstream.prototype.load = function (callback) {
  load('//cdn.tapstream.com/static/js/tapstream.js', callback);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Tapstream.prototype.page = function (category, name, properties, options) {
  var opts = this.options;

  // all pages
  if (opts.trackAllPages) {
    this.track('Loaded a Page', properties);
  }

  // named pages
  if (name && opts.trackNamedPages) {
    if (name && category) name = category + ' ' + name;
    this.track('Viewed ' + name + ' Page', properties);
  }

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track('Viewed ' + category + ' Page', properties);
  }
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Tapstream.prototype.track = function (event, properties, options) {
  properties = properties || {};
  push('fireHit', slug(event), [properties.url]); // needs events as slugs
};
});
require.register("segmentio-analytics.js-integrations/lib/trakio.js", function(exports, require, module){

var alias = require('alias');
var callback = require('callback');
var clone = require('clone');
var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Trakio);
};


/**
 * Expose `Trakio` integration.
 */

var Trakio = exports.Integration = integration('trak.io')
  .assumesPageview()
  .readyOnInitialize()
  .global('trak')
  .option('token', '')
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true);


/**
 * Options aliases.
 */

var optionsAliases = {
  initialPageview: 'auto_track_page_view'
};


/**
 * Initialize.
 *
 * https://docs.trak.io
 *
 * @param {Object} page
 */

Trakio.prototype.initialize = function (page) {
  var self = this;
  var options = this.options;
  window.trak = window.trak || [];
  window.trak.io = window.trak.io || {};
  window.trak.io.load = function(e) {self.load(); var r = function(e) {return function() {window.trak.push([e].concat(Array.prototype.slice.call(arguments,0))); }; } ,i=["initialize","identify","track","alias","channel","source","host","protocol","page_view"]; for (var s=0;s<i.length;s++) window.trak.io[i[s]]=r(i[s]); window.trak.io.initialize.apply(window.trak.io,arguments); };
  window.trak.io.load(options.token, alias(options, optionsAliases));
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Trakio.prototype.loaded = function () {
  return !! (window.trak && window.trak.loaded);
};


/**
 * Load the trak.io library.
 *
 * @param {Function} callback
 */

Trakio.prototype.load = function (callback) {
  load('//d29p64779x43zo.cloudfront.net/v1/trak.io.min.js', callback);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Trakio.prototype.page = function (category, name, properties, options) {
  properties = properties || {};
  if (name && category) name = category + ' ' + name;

  window.trak.io.page_view(properties.path, name || properties.title);

  // named pages
  if (name && this.options.trackNamedPages) {
    this.track('Viewed ' + name + ' Page', properties);
  }

  // categorized pages
  if (category && this.options.trackCategorizedPages) {
    this.track('Viewed ' + category + ' Page', properties);
  }
};


/**
 * Trait aliases.
 *
 * http://docs.trak.io/properties.html#special
 */

var traitAliases = {
  avatar: 'avatar_url',
  firstName: 'first_name',
  lastName: 'last_name'
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Trakio.prototype.identify = function (id, traits, options) {
  traits || (traits = {});
  traits = alias(traits, traitAliases);
  if (id) {
    window.trak.io.identify(id, traits);
  } else {
    window.trak.io.identify(traits);
  }
};


/**
 * Group.
 *
 * @param {String} id (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 *
 * TODO: add group
 * TODO: add `trait.company/organization` from trak.io docs http://docs.trak.io/properties.html#special
 */


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Trakio.prototype.track = function (event, properties, options) {
  window.trak.io.track(event, properties);
};


/**
 * Alias.
 *
 * @param {String} to
 * @param {String} from (optional)
 */

Trakio.prototype.alias = function (to, from) {
  if (!window.trak.io.distinct_id) return;
  if (to === window.trak.io.distinct_id()) return;
  if (from) {
    window.trak.io.alias(from, to);
  } else {
    window.trak.io.alias(to);
  }
};
});
require.register("segmentio-analytics.js-integrations/lib/usercycle.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_uc');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Usercycle);
};


/**
 * Expose `Usercycle` integration.
 */

var Usercycle = exports.Integration = integration('USERcycle')
  .assumesPageview()
  .readyOnInitialize()
  .global('_uc')
  .option('key', '');


/**
 * Initialize.
 *
 * http://docs.usercycle.com/javascript_api
 *
 * @param {Object} page
 */

Usercycle.prototype.initialize = function (page) {
  push('_key', this.options.key);
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Usercycle.prototype.loaded = function () {
  return !! (window._uc && window._uc.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Usercycle.prototype.load = function (callback) {
  load('//api.usercycle.com/javascripts/track.js', callback);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Usercycle.prototype.identify = function (id, traits, options) {
  if (id) push('uid', id);
  // there's a special `came_back` event used for retention and traits
  push('action', 'came_back', traits);
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Usercycle.prototype.track = function (event, properties, options) {
  push('action', event, properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/userfox.js", function(exports, require, module){

var alias = require('alias');
var callback = require('callback');
var convertDates = require('convert-dates');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_ufq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Userfox);
};


/**
 * Expose `Userfox` integration.
 */

var Userfox = exports.Integration = integration('userfox')
  .assumesPageview()
  .readyOnInitialize()
  .global('_ufq')
  .option('clientId', '');


/**
 * Initialize.
 *
 * https://www.userfox.com/docs/
 *
 * @param {Object} page
 */

Userfox.prototype.initialize = function (page) {
  window._ufq = [];
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Userfox.prototype.loaded = function () {
  return !! (window._ufq && window._ufq.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Userfox.prototype.load = function (callback) {
  load('//d2y71mjhnajxcg.cloudfront.net/js/userfox-stable.js', callback);
};


/**
 * Identify.
 *
 * https://www.userfox.com/docs/#custom-data
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Userfox.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (!traits.email) return;

  // initialize the library with the email now that we have it
  push('init', {
    clientId: this.options.clientId,
    email: traits.email
  });

  traits = convertDates(traits, formatDate);
  traits = alias(traits, { created: 'signup_date' });
  push('track', traits);
};


/**
 * Convert a `date` to a format userfox supports.
 *
 * @param {Date} date
 * @return {String}
 */

function formatDate (date) {
  return Math.round(date.getTime() / 1000).toString();
}
});
require.register("segmentio-analytics.js-integrations/lib/uservoice.js", function(exports, require, module){

var alias = require('alias');
var callback = require('callback');
var clone = require('clone');
var convertDates = require('convert-dates');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('UserVoice');
var unix = require('to-unix-timestamp');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(UserVoice);
};


/**
 * Expose `UserVoice` integration.
 */

var UserVoice = exports.Integration = integration('UserVoice')
  .assumesPageview()
  .readyOnInitialize()
  .global('UserVoice')
  .global('showClassicWidget')
  .option('apiKey', '')
  .option('classic', false)
  .option('forumId', null)
  .option('showWidget', true)
  .option('mode', 'contact')
  .option('accentColor', '#448dd6')
  .option('trigger', null)
  .option('triggerPosition', 'bottom-right')
  .option('triggerColor', '#ffffff')
  .option('triggerBackgroundColor', 'rgba(46, 49, 51, 0.6)')
  // BACKWARDS COMPATIBILITY: classic options
  .option('classicMode', 'full')
  .option('primaryColor', '#cc6d00')
  .option('linkColor', '#007dbf')
  .option('defaultMode', 'support')
  .option('tabLabel', 'Feedback & Support')
  .option('tabColor', '#cc6d00')
  .option('tabPosition', 'middle-right')
  .option('tabInverted', false);


/**
 * When in "classic" mode, on `construct` swap all of the method to point to
 * their classic counterparts.
 */

UserVoice.on('construct', function (integration) {
  if (!integration.options.classic) return;
  integration.group = undefined;
  integration.identify = integration.identifyClassic;
  integration.initialize = integration.initializeClassic;
});


/**
 * Initialize.
 *
 * @param {Object} page
 */

UserVoice.prototype.initialize = function (page) {
  var options = this.options;

  var opts = formatOptions(options);
  push('set', opts);
  push('autoprompt', {});
  if (options.showWidget) {
    options.trigger
      ? push('addTrigger', options.trigger, opts)
      : push('addTrigger', opts);
  }

  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

UserVoice.prototype.loaded = function () {
  return !! (window.UserVoice && window.UserVoice.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

UserVoice.prototype.load = function (callback) {
  var key = this.options.apiKey;
  load('//widget.uservoice.com/' + key + '.js', callback);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

UserVoice.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (id) traits.id = id;
  traits = convertDates(traits, unix);
  traits = alias(traits, { created: 'created_at' });
  push('identify', traits);
};


/**
 * Group.
 *
 * @param {String} id (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

UserVoice.prototype.group = function (id, properties, options) {
  properties = properties || {};
  if (id) properties.id = id;
  properties = convertDates(properties, unix);
  properties = alias(properties, { created: 'created_at' });
  push('identify', { account: properties });
};


/**
 * Initialize (classic).
 *
 * @param {Object} options
 * @param {Function} ready
 */

UserVoice.prototype.initializeClassic = function () {
  var options = this.options;
  window.showClassicWidget = showClassicWidget; // part of public api
  if (options.showWidget) showClassicWidget('showTab', formatClassicOptions(options));
  this.load();
};


/**
 * Identify (classic).
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

UserVoice.prototype.identifyClassic = function (id, traits, options) {
  traits = traits || {};
  if (id) traits.id = id;
  push('setCustomFields', traits);
};


/**
 * Format the options for UserVoice.
 *
 * @param {Object} options
 * @return {Object}
 */

function formatOptions (options) {
  return alias(options, {
    forumId: 'forum_id',
    accentColor: 'accent_color',
    triggerColor: 'trigger_color',
    triggerBackgroundColor: 'trigger_background_color',
    triggerPosition: 'trigger_position'
  });
}


/**
 * Format the classic options for UserVoice.
 *
 * @param {Object} options
 * @return {Object}
 */

function formatClassicOptions (options) {
  return alias(options, {
    forumId: 'forum_id',
    classicMode: 'mode',
    primaryColor: 'primary_color',
    tabPosition: 'tab_position',
    tabColor: 'tab_color',
    linkColor: 'link_color',
    defaultMode: 'default_mode',
    tabLabel: 'tab_label',
    tabInverted: 'tab_inverted'
  });
}


/**
 * Show the classic version of the UserVoice widget. This method is usually part
 * of UserVoice classic's public API.
 *
 * @param {String} type ('showTab' or 'showLightbox')
 * @param {Object} options (optional)
 */

function showClassicWidget (type, options) {
  type = type || 'showLightbox';
  push(type, 'classic_widget', options);
}
});
require.register("segmentio-analytics.js-integrations/lib/vero.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');
var push = require('global-queue')('_veroq');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Vero);
};


/**
 * Expose `Vero` integration.
 */

var Vero = exports.Integration = integration('Vero')
  .assumesPageview()
  .readyOnInitialize()
  .global('_veroq')
  .option('apiKey', '');


/**
 * Initialize.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/js.md
 *
 * @param {Object} page
 */

Vero.prototype.initialize = function (pgae) {
  push('init', { api_key: this.options.apiKey });
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Vero.prototype.loaded = function () {
  return !! (window._veroq && window._veroq.push !== Array.prototype.push);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Vero.prototype.load = function (callback) {
  load('//d3qxef4rp70elm.cloudfront.net/m.js', callback);
};


/**
 * Identify.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/js.md#user-identification
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Vero.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (!id || !traits.email) return; // both required
  if (id) traits.id = id;
  push('user', traits);
};


/**
 * Track.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/js.md#tracking-events
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Vero.prototype.track = function (event, properties, options) {
  push('track', event, properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/visual-website-optimizer.js", function(exports, require, module){

var callback = require('callback');
var each = require('each');
var integration = require('integration');
var tick = require('next-tick');


/**
 * Analytics reference.
 */

var analytics;


/**
 * Expose plugin.
 */

module.exports = exports = function (ajs) {
  ajs.addIntegration(VWO);
  analytics = ajs;
};


/**
 * Expose `VWO` integration.
 */

var VWO = exports.Integration = integration('Visual Website Optimizer')
  .readyOnInitialize()
  .option('replay', true);


/**
 * Initialize.
 *
 * http://v2.visualwebsiteoptimizer.com/tools/get_tracking_code.php
 */

VWO.prototype.initialize = function () {
  if (this.options.replay) this.replay();
};


/**
 * Replay the experiments the user has seen as traits to all other integrations.
 * Wait for the next tick to replay so that the `analytics` object and all of
 * the integrations are fully initialized.
 */

VWO.prototype.replay = function () {
  tick(function () {
    experiments(function (err, traits) {
      if (traits) analytics.identify(traits);
    });
  });
};


/**
 * Get dictionary of experiment keys and variations.
 *
 * http://visualwebsiteoptimizer.com/knowledge/integration-of-vwo-with-kissmetrics/
 *
 * @param {Function} callback
 * @return {Object}
 */

function experiments (callback) {
  enqueue(function () {
    var data = {};
    var ids = window._vwo_exp_ids;
    if (!ids) return callback();
    each(ids, function (id) {
      var name = variation(id);
      if (name) data['Experiment: ' + id] = name;
    });
    callback(null, data);
  });
}


/**
 * Add a `fn` to the VWO queue, creating one if it doesn't exist.
 *
 * @param {Function} fn
 */

function enqueue (fn) {
  window._vis_opt_queue = window._vis_opt_queue || [];
  window._vis_opt_queue.push(fn);
}


/**
 * Get the chosen variation's name from an experiment `id`.
 *
 * http://visualwebsiteoptimizer.com/knowledge/integration-of-vwo-with-kissmetrics/
 *
 * @param {String} id
 * @return {String}
 */

function variation (id) {
  var experiments = window._vwo_exp;
  if (!experiments) return null;
  var experiment = experiments[id];
  var variationId = experiment.combination_chosen;
  return variationId ? experiment.comb_n[variationId] : null;
}
});
require.register("segmentio-analytics.js-integrations/lib/woopra.js", function(exports, require, module){

var each = require('each');
var extend = require('extend');
var integration = require('integration');
var isEmail = require('is-email');
var load = require('load-script');
var type = require('type');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Woopra);
};


/**
 * Expose `Woopra` integration.
 */

var Woopra = exports.Integration = integration('Woopra')
  .readyOnLoad()
  .global('woopra')
  .option('domain', '');


/**
 * Initialize.
 *
 * http://www.woopra.com/docs/setup/javascript-tracking/
 *
 * @param {Object} page
 */

Woopra.prototype.initialize = function (page) {
  (function () {var i, s, z, w = window, d = document, a = arguments, q = 'script', f = ['config', 'track', 'identify', 'visit', 'push', 'call'], c = function () {var i, self = this; self._e = []; for (i = 0; i < f.length; i++) {(function (f) {self[f] = function () {self._e.push([f].concat(Array.prototype.slice.call(arguments, 0))); return self; }; })(f[i]); } }; w._w = w._w || {}; for (i = 0; i < a.length; i++) { w._w[a[i]] = w[a[i]] = w[a[i]] || new c(); } })('woopra');
  window.woopra.config({ domain: this.options.domain });
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Woopra.prototype.loaded = function () {
  return !! (window.woopra && window.woopra.loaded);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Woopra.prototype.load = function (callback) {
  load('//static.woopra.com/js/w.js', callback);
};


/**
 * Page.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Woopra.prototype.page = function (category, name, properties, options) {
  properties = properties || {};
  if (name && category) name = category + ' ' + name;
  if (name) properties.title = name;
  window.woopra.track('pv', properties);
};


/**
 * Identify.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 */

Woopra.prototype.identify = function (id, traits, options) {
  traits = traits || {};
  if (id) traits.id = id;
  window.woopra.identify(traits).push(); // `push` sends it off async
};


/**
 * Track.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

Woopra.prototype.track = function (event, properties, options) {
  window.woopra.track(event, properties);
};
});
require.register("segmentio-analytics.js-integrations/lib/yandex-metrica.js", function(exports, require, module){

var callback = require('callback');
var integration = require('integration');
var load = require('load-script');


/**
 * Expose plugin.
 */

module.exports = exports = function (analytics) {
  analytics.addIntegration(Yandex);
};


/**
 * Expose `Yandex` integration.
 */

var Yandex = exports.Integration = integration('Yandex Metrica')
  .assumesPageview()
  .readyOnInitialize()
  .global('yandex_metrika_callbacks')
  .global('Ya')
  .option('counterId', null);


/**
 * Initialize.
 *
 * http://api.yandex.com/metrika/
 * https://metrica.yandex.com/22522351?step=2#tab=code
 *
 * @param {Object} page
 */

Yandex.prototype.initialize = function (page) {
  var id = this.options.counterId;

  push(function () {
    window['yaCounter' + id] = new window.Ya.Metrika({ id: id });
  });

  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 */

Yandex.prototype.loaded = function () {
  return !! (window.Ya && window.Ya.Metrika);
};


/**
 * Load.
 *
 * @param {Function} callback
 */

Yandex.prototype.load = function (callback) {
  load('//mc.yandex.ru/metrika/watch.js', callback);
};


/**
 * Push a new callback on the global Yandex queue.
 *
 * @param {Function} callback
 */

function push (callback) {
  window.yandex_metrika_callbacks = window.yandex_metrika_callbacks || [];
  window.yandex_metrika_callbacks.push(callback);
}
});
require.register("segmentio-canonical/index.js", function(exports, require, module){
module.exports = function canonical () {
  var tags = document.getElementsByTagName('link');
  for (var i = 0, tag; tag = tags[i]; i++) {
    if ('canonical' == tag.getAttribute('rel')) return tag.getAttribute('href');
  }
};
});
require.register("segmentio-extend/index.js", function(exports, require, module){

module.exports = function extend (object) {
    // Takes an unlimited number of extenders.
    var args = Array.prototype.slice.call(arguments, 1);

    // For each extender, copy their properties on our object.
    for (var i = 0, source; source = args[i]; i++) {
        if (!source) continue;
        for (var property in source) {
            object[property] = source[property];
        }
    }

    return object;
};
});
require.register("segmentio-is-email/index.js", function(exports, require, module){

/**
 * Expose `isEmail`.
 */

module.exports = isEmail;


/**
 * Email address matcher.
 */

var matcher = /.+\@.+\..+/;


/**
 * Loosely validate an email address.
 *
 * @param {String} string
 * @return {Boolean}
 */

function isEmail (string) {
  return matcher.test(string);
}
});
require.register("segmentio-is-meta/index.js", function(exports, require, module){
module.exports = function isMeta (e) {
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return true;

    // Logic that handles checks for the middle mouse button, based
    // on [jQuery](https://github.com/jquery/jquery/blob/master/src/event.js#L466).
    var which = e.which, button = e.button;
    if (!which && button !== undefined) {
      return (!button & 1) && (!button & 2) && (button & 4);
    } else if (which === 2) {
      return true;
    }

    return false;
};
});
require.register("segmentio-isodate/index.js", function(exports, require, module){

/**
 * Matcher, slightly modified from:
 *
 * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
 */

var matcher = /^(\d{4})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/;


/**
 * Convert an ISO date string to a date. Fallback to native `Date.parse`.
 *
 * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
 *
 * @param {String} iso
 * @return {Date}
 */

exports.parse = function (iso) {
  var numericKeys = [1, 5, 6, 7, 8, 11, 12];
  var arr = matcher.exec(iso);
  var offset = 0;

  // fallback to native parsing
  if (!arr) return new Date(iso);

  // remove undefined values
  for (var i = 0, val; val = numericKeys[i]; i++) {
    arr[val] = parseInt(arr[val], 10) || 0;
  }

  // allow undefined days and months
  arr[2] = parseInt(arr[2], 10) || 1;
  arr[3] = parseInt(arr[3], 10) || 1;

  // month is 0-11
  arr[2]--;

  // allow abitrary sub-second precision
  if (arr[8]) arr[8] = (arr[8] + '00').substring(0, 3);

  // apply timezone if one exists
  if (arr[4] == ' ') {
    offset = new Date().getTimezoneOffset();
  } else if (arr[9] !== 'Z' && arr[10]) {
    offset = arr[11] * 60 + arr[12];
    if ('+' == arr[10]) offset = 0 - offset;
  }

  var millis = Date.UTC(arr[1], arr[2], arr[3], arr[5], arr[6] + offset, arr[7], arr[8]);
  return new Date(millis);
};


/**
 * Checks whether a `string` is an ISO date string. `strict` mode requires that
 * the date string at least have a year, month and date.
 *
 * @param {String} string
 * @param {Boolean} strict
 * @return {Boolean}
 */

exports.is = function (string, strict) {
  if (strict && false === /^\d{4}-\d{2}-\d{2}/.test(string)) return false;
  return matcher.test(string);
};
});
require.register("segmentio-isodate-traverse/index.js", function(exports, require, module){

var is = require('is');
var isodate = require('isodate');

var clone;
var each;

try {
  clone = require('clone');
  each = require('each');
} catch (err) {
  clone = require('clone-component');
  each = require('each-component');
}

/**
 * Expose `traverse`.
 */

module.exports = traverse;


/**
 * Traverse an object, parsing all ISO strings into dates and returning a clone.
 *
 * @param {Object} obj
 * @return {Object}
 */

function traverse (obj, strict) {
  obj = clone(obj);
  if (strict === undefined) strict = true;
  each(obj, function (key, val) {
    if (isodate.is(val, strict)) {
      obj[key] = isodate.parse(val);
    } else if (is.object(val)) {
      obj[key] = traverse(val);
    }
  });
  return obj;
}
});
require.register("component-json-fallback/index.js", function(exports, require, module){
/*
    json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON = {};

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

module.exports = JSON
});
require.register("segmentio-json/index.js", function(exports, require, module){

module.exports = 'undefined' == typeof JSON
  ? require('json-fallback')
  : JSON;

});
require.register("segmentio-new-date/lib/index.js", function(exports, require, module){

var is = require('is');
var isodate = require('isodate');
var milliseconds = require('./milliseconds');
var seconds = require('./seconds');


/**
 * Returns a new Javascript Date object, allowing a variety of extra input types
 * over the native Date constructor.
 *
 * @param {Date|String|Number} val
 */

module.exports = function newDate (val) {
  if (is.date(val)) return val;
  if (is.number(val)) return new Date(toMs(val));

  // date strings
  if (isodate.is(val)) return isodate.parse(val);
  if (milliseconds.is(val)) return milliseconds.parse(val);
  if (seconds.is(val)) return seconds.parse(val);

  // fallback to Date.parse
  return new Date(val);
};


/**
 * If the number passed val is seconds from the epoch, turn it into milliseconds.
 * Milliseconds would be greater than 31557600000 (December 31, 1970).
 *
 * @param {Number} num
 */

function toMs (num) {
  if (num < 31557600000) return num * 1000;
  return num;
}
});
require.register("segmentio-new-date/lib/milliseconds.js", function(exports, require, module){

/**
 * Matcher.
 */

var matcher = /\d{13}/;


/**
 * Check whether a string is a millisecond date string.
 *
 * @param {String} string
 * @return {Boolean}
 */

exports.is = function (string) {
  return matcher.test(string);
};


/**
 * Convert a millisecond string to a date.
 *
 * @param {String} millis
 * @return {Date}
 */

exports.parse = function (millis) {
  millis = parseInt(millis, 10);
  return new Date(millis);
};
});
require.register("segmentio-new-date/lib/seconds.js", function(exports, require, module){

/**
 * Matcher.
 */

var matcher = /\d{10}/;


/**
 * Check whether a string is a second date string.
 *
 * @param {String} string
 * @return {Boolean}
 */

exports.is = function (string) {
  return matcher.test(string);
};


/**
 * Convert a second string to a date.
 *
 * @param {String} seconds
 * @return {Date}
 */

exports.parse = function (seconds) {
  var millis = parseInt(seconds, 10) * 1000;
  return new Date(millis);
};
});
require.register("segmentio-store.js/store.js", function(exports, require, module){
;(function(win){
	var store = {},
		doc = win.document,
		localStorageName = 'localStorage',
		namespace = '__storejs__',
		storage

	store.disabled = false
	store.set = function(key, value) {}
	store.get = function(key) {}
	store.remove = function(key) {}
	store.clear = function() {}
	store.transact = function(key, defaultVal, transactionFn) {
		var val = store.get(key)
		if (transactionFn == null) {
			transactionFn = defaultVal
			defaultVal = null
		}
		if (typeof val == 'undefined') { val = defaultVal || {} }
		transactionFn(val)
		store.set(key, val)
	}
	store.getAll = function() {}

	store.serialize = function(value) {
		return JSON.stringify(value)
	}
	store.deserialize = function(value) {
		if (typeof value != 'string') { return undefined }
		try { return JSON.parse(value) }
		catch(e) { return value || undefined }
	}

	// Functions to encapsulate questionable FireFox 3.6.13 behavior
	// when about.config::dom.storage.enabled === false
	// See https://github.com/marcuswestin/store.js/issues#issue/13
	function isLocalStorageNameSupported() {
		try { return (localStorageName in win && win[localStorageName]) }
		catch(err) { return false }
	}

	if (isLocalStorageNameSupported()) {
		storage = win[localStorageName]
		store.set = function(key, val) {
			if (val === undefined) { return store.remove(key) }
			storage.setItem(key, store.serialize(val))
			return val
		}
		store.get = function(key) { return store.deserialize(storage.getItem(key)) }
		store.remove = function(key) { storage.removeItem(key) }
		store.clear = function() { storage.clear() }
		store.getAll = function() {
			var ret = {}
			for (var i=0; i<storage.length; ++i) {
				var key = storage.key(i)
				ret[key] = store.get(key)
			}
			return ret
		}
	} else if (doc.documentElement.addBehavior) {
		var storageOwner,
			storageContainer
		// Since #userData storage applies only to specific paths, we need to
		// somehow link our data to a specific path.  We choose /favicon.ico
		// as a pretty safe option, since all browsers already make a request to
		// this URL anyway and being a 404 will not hurt us here.  We wrap an
		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
		// since the iframe access rules appear to allow direct access and
		// manipulation of the document element, even for a 404 page.  This
		// document can be used instead of the current document (which would
		// have been limited to the current path) to perform #userData storage.
		try {
			storageContainer = new ActiveXObject('htmlfile')
			storageContainer.open()
			storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></iframe>')
			storageContainer.close()
			storageOwner = storageContainer.w.frames[0].document
			storage = storageOwner.createElement('div')
		} catch(e) {
			// somehow ActiveXObject instantiation failed (perhaps some special
			// security settings or otherwse), fall back to per-path storage
			storage = doc.createElement('div')
			storageOwner = doc.body
		}
		function withIEStorage(storeFunction) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0)
				args.unshift(storage)
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				storageOwner.appendChild(storage)
				storage.addBehavior('#default#userData')
				storage.load(localStorageName)
				var result = storeFunction.apply(store, args)
				storageOwner.removeChild(storage)
				return result
			}
		}

		// In IE7, keys may not contain special chars. See all of https://github.com/marcuswestin/store.js/issues/40
		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
		function ieKeyFix(key) {
			return key.replace(forbiddenCharsRegex, '___')
		}
		store.set = withIEStorage(function(storage, key, val) {
			key = ieKeyFix(key)
			if (val === undefined) { return store.remove(key) }
			storage.setAttribute(key, store.serialize(val))
			storage.save(localStorageName)
			return val
		})
		store.get = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			return store.deserialize(storage.getAttribute(key))
		})
		store.remove = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			storage.removeAttribute(key)
			storage.save(localStorageName)
		})
		store.clear = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes
			storage.load(localStorageName)
			for (var i=0, attr; attr=attributes[i]; i++) {
				storage.removeAttribute(attr.name)
			}
			storage.save(localStorageName)
		})
		store.getAll = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes
			var ret = {}
			for (var i=0, attr; attr=attributes[i]; ++i) {
				var key = ieKeyFix(attr.name)
				ret[attr.name] = store.deserialize(storage.getAttribute(key))
			}
			return ret
		})
	}

	try {
		store.set(namespace, namespace)
		if (store.get(namespace) != namespace) { store.disabled = true }
		store.remove(namespace)
	} catch(e) {
		store.disabled = true
	}
	store.enabled = !store.disabled
	if (typeof module != 'undefined' && module.exports) { module.exports = store }
	else if (typeof define === 'function' && define.amd) { define(store) }
	else { win.store = store }
})(this.window || global);

});
require.register("segmentio-top-domain/index.js", function(exports, require, module){

var url = require('url');

// Official Grammar: http://tools.ietf.org/html/rfc883#page-56
// Look for tlds with up to 2-6 characters.

module.exports = function (urlStr) {

  var host     = url.parse(urlStr).hostname
    , topLevel = host.match(/[a-z0-9][a-z0-9\-]*[a-z0-9]\.[a-z\.]{2,6}$/i);

  return topLevel ? topLevel[0] : host;
};
});
require.register("yields-prevent/index.js", function(exports, require, module){

/**
 * prevent default on the given `e`.
 * 
 * examples:
 * 
 *      anchor.onclick = prevent;
 *      anchor.onclick = function(e){
 *        if (something) return prevent(e);
 *      };
 * 
 * @param {Event} e
 */

module.exports = function(e){
  e = e || window.event
  return e.preventDefault
    ? e.preventDefault()
    : e.returnValue = false;
};

});
require.register("visionmedia-debug/index.js", function(exports, require, module){
if ('undefined' == typeof window) {
  module.exports = require('./lib/debug');
} else {
  module.exports = require('./debug');
}

});
require.register("visionmedia-debug/debug.js", function(exports, require, module){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

});
require.register("analytics/lib/index.js", function(exports, require, module){
/**
 * Analytics.js
 *
 * (C) 2013 Segment.io Inc.
 */

var Analytics = require('./analytics');
var createIntegration = require('integration');
var each = require('each');
var Integrations = require('integrations');


/**
 * Expose the `analytics` singleton.
 */

var analytics = module.exports = exports = new Analytics();


/**
 * Expose `VERSION`.
 */

exports.VERSION = '1.1.3';


/**
 * Add integrations.
 */

each(Integrations, function (name, Integration) {
  analytics.use(Integration);
});
});
require.register("analytics/lib/analytics.js", function(exports, require, module){

var after = require('after');
var bind = require('bind');
var callback = require('callback');
var canonical = require('canonical');
var clone = require('clone');
var cookie = require('./cookie');
var debug = require('debug');
var defaults = require('defaults');
var each = require('each');
var Emitter = require('emitter');
var group = require('./group');
var is = require('is');
var isEmail = require('is-email');
var isMeta = require('is-meta');
var newDate = require('new-date');
var on = require('event').bind;
var prevent = require('prevent');
var querystring = require('querystring');
var size = require('object').length;
var store = require('./store');
var traverse = require('isodate-traverse');
var url = require('url');
var user = require('./user');


/**
 * Expose `Analytics`.
 */

module.exports = Analytics;


/**
 * Initialize a new `Analytics` instance.
 */

function Analytics () {
  this.Integrations = {};
  this._integrations = {};
  this._readied = false;
  this._timeout = 300;
  this._user = user; // BACKWARDS COMPATIBILITY
  bind.all(this);

  var self = this;
  this.on('initialize', function (settings, options) {
    if (options.initialPageview) self.page();
  });

  this.on('initialize', function () {
    self._parseQuery();
  });

}


/**
 * Event Emitter.
 */

Emitter(Analytics.prototype);


/**
 * Use a `plugin`.
 *
 * @param {Function} plugin
 * @return {Analytics}
 */

Analytics.prototype.use = function (plugin) {
  plugin(this);
  return this;
};


/**
 * Define a new `Integration`.
 *
 * @param {Function} Integration
 * @return {Analytics}
 */

Analytics.prototype.addIntegration = function (Integration) {
  var name = Integration.prototype.name;
  if (!name) throw new TypeError('attempted to add an invalid integration');
  this.Integrations[name] = Integration;
  return this;
};


/**
 * Initialize with the given integration `settings` and `options`. Aliased to
 * `init` for convenience.
 *
 * @param {Object} settings
 * @param {Object} options (optional)
 * @return {Analytics}
 */

Analytics.prototype.init =
Analytics.prototype.initialize = function (settings, options) {
  settings = settings || {};
  options = options || {};

  this._options(options);
  this._readied = false;
  this._integrations = {};

  // load user now that options are set
  user.load();
  group.load();

  // clean unknown integrations from settings
  var self = this;
  each(settings, function (name) {
    var Integration = self.Integrations[name];
    if (!Integration) delete settings[name];
  });

  // make ready callback
  var ready = after(size(settings), function () {
    self._readied = true;
    self.emit('ready');
  });

  // initialize integrations, passing ready
  each(settings, function (name, opts) {
    var Integration = self.Integrations[name];
    if (options.initialPageview && opts.initialPageview === false) {
      Integration.prototype.page = after(2, Integration.prototype.page);
    }

    var integration = new Integration(clone(opts));
    integration.once('ready', ready);
    integration.initialize();
    self._integrations[name] = integration;
  });

  // backwards compat with angular plugin.
  // TODO: remove
  this.initialized = true;

  this.emit('initialize', settings, options);
  return this;
};


/**
 * Identify a user by optional `id` and `traits`.
 *
 * @param {String} id (optional)
 * @param {Object} traits (optional)
 * @param {Object} options (optional)
 * @param {Function} fn (optional)
 * @return {Analytics}
 */

Analytics.prototype.identify = function (id, traits, options, fn) {
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(traits)) fn = traits, options = null, traits = null;
  if (is.object(id)) options = traits, traits = id, id = user.id();

  user.identify(id, traits);

  // clone traits before we manipulate so we don't do anything uncouth, and take
  // from `user` so that we carryover anonymous traits
  id = user.id();
  traits = cleanTraits(id, user.traits());

  this._invoke('identify', id, traits, options);
  this._callback(fn);
  return this;
};


/**
 * Return the current user.
 *
 * @return {Object}
 */

Analytics.prototype.user = function () {
  return user;
};


/**
 * Identify a group by optional `id` and `properties`. Or, if no arguments are
 * supplied, return the current group.
 *
 * @param {String} id (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 * @param {Function} fn (optional)
 * @return {Analytics or Object}
 */

Analytics.prototype.group = function (id, properties, options, fn) {
  if (0 === arguments.length) return group;
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(properties)) fn = properties, options = null, properties = null;
  if (is.object(id)) options = properties, properties = id, id = group.id();

  group.identify(id, properties);

  // grab from group again to make sure we're taking from the source
  id = group.id();
  properties = group.properties();

  // convert a create date to a date
  if (properties.created) properties.created = newDate(properties.created);

  this._invoke('group', id, properties, options);
  this._callback(fn);
  return this;
};


/**
 * Track an `event` that a user has triggered with optional `properties`.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 * @param {Function} fn (optional)
 * @return {Analytics}
 */

Analytics.prototype.track = function (event, properties, options, fn) {
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(properties)) fn = properties, options = null, properties = null;

  properties = traverse(clone(properties)) || {};

  this._invoke('track', event, properties, options);
  this._callback(fn);
  return this;
};


/**
 * Helper method to track an outbound link that would normally navigate away
 * from the page before the analytics calls were sent.
 *
 * BACKWARDS COMPATIBILITY: aliased to `trackClick`.
 *
 * @param {Element or Array} links
 * @param {String or Function} event
 * @param {Object or Function} properties (optional)
 * @return {Analytics}
 */

Analytics.prototype.trackClick =
Analytics.prototype.trackLink = function (links, event, properties) {
  if (!links) return this;
  if (is.element(links)) links = [links]; // always arrays, handles jquery

  var self = this;
  each(links, function (el) {
    on(el, 'click', function (e) {
      var ev = is.fn(event) ? event(el) : event;
      var props = is.fn(properties) ? properties(el) : properties;
      self.track(ev, props);

      if (el.href && el.target !== '_blank' && !isMeta(e)) {
        prevent(e);
        self._callback(function () {
          window.location.href = el.href;
        });
      }
    });
  });

  return this;
};


/**
 * Helper method to track an outbound form that would normally navigate away
 * from the page before the analytics calls were sent.
 *
 * BACKWARDS COMPATIBILITY: aliased to `trackSubmit`.
 *
 * @param {Element or Array} forms
 * @param {String or Function} event
 * @param {Object or Function} properties (optional)
 * @return {Analytics}
 */

Analytics.prototype.trackSubmit =
Analytics.prototype.trackForm = function (forms, event, properties) {
  if (!forms) return this;
  if (is.element(forms)) forms = [forms]; // always arrays, handles jquery

  var self = this;
  each(forms, function (el) {
    function handler (e) {
      prevent(e);

      var ev = is.fn(event) ? event(el) : event;
      var props = is.fn(properties) ? properties(el) : properties;
      self.track(ev, props);

      self._callback(function () {
        el.submit();
      });
    }

    // support the events happening through jQuery or Zepto instead of through
    // the normal DOM API, since `el.submit` doesn't bubble up events...
    var $ = window.jQuery || window.Zepto;
    if ($) {
      $(el).submit(handler);
    } else {
      on(el, 'submit', handler);
    }
  });

  return this;
};


/**
 * Trigger a pageview, labeling the current page with an optional `category`,
 * `name` and `properties`.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object or String} properties (or path) (optional)
 * @param {Object} options (optional)
 * @param {Function} fn (optional)
 * @return {Analytics}
 */

Analytics.prototype.page = function (category, name, properties, options, fn) {
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(properties)) fn = properties, options = properties = null;
  if (is.fn(name)) fn = name, options = properties = name = null;
  if (is.object(name)) options = properties, properties = name, name = null;
  if (is.object(category)) options = properties, properties = name, name = category = null;
  if (is.string(category) && !is.string(name)) name = category, category = null;

  var defs = {
    path: canonicalPath(),
    referrer: document.referrer,
    title: document.title,
    url: location.href
  };

  if (name) defs.name = name;
  if (category) defs.category = category;

  properties = clone(properties) || {};
  defaults(properties, defs);

  this._invoke('page', category, name, properties, options);
  this._callback(fn);
  return this;
};


/**
 * BACKWARDS COMPATIBILITY: convert an old `pageview` to a `page` call.
 *
 * @param {String} url (optional)
 * @param {Object} options (optional)
 * @return {Analytics}
 * @api private
 */

Analytics.prototype.pageview = function (url, options) {
  var properties = {};
  if (url) properties.path = url;
  this.page(properties);
  return this;
};


/**
 * Merge two previously unassociated user identities.
 *
 * @param {String} to
 * @param {String} from (optional)
 * @param {Object} options (optional)
 * @param {Function} fn (optional)
 * @return {Analytics}
 */

Analytics.prototype.alias = function (to, from, options, fn) {
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(from)) fn = from, options = null, from = null;
  if (is.object(from)) options = from, from = null;
  this._invoke('alias', to, from, options);
  this._callback(fn);
  return this;
};


/**
 * Register a `fn` to be fired when all the analytics services are ready.
 *
 * @param {Function} fn
 * @return {Analytics}
 */

Analytics.prototype.ready = function (fn) {
  if (!is.fn(fn)) return this;
  this._readied
    ? callback.async(fn)
    : this.once('ready', fn);
  return this;
};


/**
 * Set the `timeout` (in milliseconds) used for callbacks.
 *
 * @param {Number} timeout
 */

Analytics.prototype.timeout = function (timeout) {
  this._timeout = timeout;
};


/**
 * Enable or disable debug.
 *
 * @param {String or Boolean} str
 */

Analytics.prototype.debug = function(str){
  if (0 == arguments.length || str) {
    debug.enable('analytics:' + (str || '*'));
  } else {
    debug.disable();
  }
};


/**
 * Apply options.
 *
 * @param {Object} options
 * @return {Analytics}
 * @api private
 */

Analytics.prototype._options = function (options) {
  options = options || {};
  cookie.options(options.cookie);
  store.options(options.localStorage);
  user.options(options.user);
  group.options(options.group);
  return this;
};


/**
 * Callback a `fn` after our defined timeout period.
 *
 * @param {Function} fn
 * @return {Analytics}
 * @api private
 */

Analytics.prototype._callback = function (fn) {
  callback.async(fn, this._timeout);
  return this;
};


/**
 * Call a `method` on all of initialized integrations, passing clones of arguments
 * along to keep each integration isolated.
 *
 * TODO: check integration enabled
 *
 * @param {String} method
 * @param {Mixed} args...
 * @return {Analytics}
 * @api private
 */

Analytics.prototype._invoke = function () {
  var args = [].slice.call(arguments);
  var options = args[args.length-1]; // always the last one

  each(this._integrations, function (name, integration) {
    if (!isEnabled(integration, options)) return;
    integration.invoke.apply(integration, clone(args));
  });

  this.emit.apply(this, clone(args));
  return this;
};


/**
 * Parse the query string for callable methods.
 *
 * @return {Analytics}
 * @api private
 */

Analytics.prototype._parseQuery = function () {
  // Identify and track any `ajs_uid` and `ajs_event` parameters in the URL.
  var q = querystring.parse(window.location.search);
  if (q.ajs_uid) this.identify(q.ajs_uid);
  if (q.ajs_event) this.track(q.ajs_event);
  return this;
};


/**
 * Determine whether a `integration` is enabled or not based on `options`.
 *
 * @param {Object} integration
 * @param {Object} options
 * @return {Boolean}
 */

function isEnabled (integration, options) {
  var enabled = true;
  if (!options || !options.providers) return enabled;

  // Default to the 'all' or 'All' setting.
  var map = options.providers;
  if (map.all !== undefined) enabled = map.all;
  if (map.All !== undefined) enabled = map.All;

  // Look for this integration's specific setting.
  var name = integration.name;
  if (map[name] !== undefined) enabled = map[name];

  return enabled;
}


/**
 * Clean up traits, default some useful things both so the user doesn't have to
 * and so we don't have to do it on a integration-basis.
 *
 * @param {Object} traits
 * @return {Object}
 */

function cleanTraits (userId, traits) {
  // Add the `email` trait if it doesn't exist and the `userId` is an email.
  if (!traits.email && isEmail(userId)) traits.email = userId;

  // Create the `name` trait if it doesn't exist and `firstName` and `lastName`
  // are both supplied.
  if (!traits.name && traits.firstName && traits.lastName) {
    traits.name = traits.firstName + ' ' + traits.lastName;
  }

  // Convert dates from more types of input into Date objects.
  if (traits.created) traits.created = newDate(traits.created);
  if (traits.company && traits.company.created) {
    traits.company.created = newDate(traits.company.created);
  }

  return traits;
}


/**
 * Return the canonical path for the page.
 *
 * @return {String}
 */

function canonicalPath () {
  var canon = canonical();
  if (!canon) return window.location.pathname;
  var parsed = url.parse(canon);
  return parsed.pathname;
}
});
require.register("analytics/lib/cookie.js", function(exports, require, module){

var bind = require('bind');
var cookie = require('cookie');
var clone = require('clone');
var defaults = require('defaults');
var json = require('json');
var topDomain = require('top-domain');


/**
 * Initialize a new `Cookie` with `options`.
 *
 * @param {Object} options
 */

function Cookie (options) {
  this.options(options);
}


/**
 * Get or set the cookie options.
 *
 * @param {Object} options
 *   @field {Number} maxage (1 year)
 *   @field {String} domain
 *   @field {String} path
 *   @field {Boolean} secure
 */

Cookie.prototype.options = function (options) {
  if (arguments.length === 0) return this._options;

  options = options || {};

  var domain = '.' + topDomain(window.location.href);

  // localhost cookies are special: http://curl.haxx.se/rfc/cookie_spec.html
  if (domain === '.localhost') domain = '';

  defaults(options, {
    maxage: 31536000000, // default to a year
    path: '/',
    domain: domain
  });

  this._options = options;
};


/**
 * Set a `key` and `value` in our cookie.
 *
 * @param {String} key
 * @param {Object} value
 * @return {Boolean} saved
 */

Cookie.prototype.set = function (key, value) {
  try {
    value = json.stringify(value);
    cookie(key, value, clone(this._options));
    return true;
  } catch (e) {
    return false;
  }
};


/**
 * Get a value from our cookie by `key`.
 *
 * @param {String} key
 * @return {Object} value
 */

Cookie.prototype.get = function (key) {
  try {
    var value = cookie(key);
    value = value ? json.parse(value) : null;
    return value;
  } catch (e) {
    return null;
  }
};


/**
 * Remove a value from our cookie by `key`.
 *
 * @param {String} key
 * @return {Boolean} removed
 */

Cookie.prototype.remove = function (key) {
  try {
    cookie(key, null, clone(this._options));
    return true;
  } catch (e) {
    return false;
  }
};


/**
 * Expose the cookie singleton.
 */

module.exports = bind.all(new Cookie());


/**
 * Expose the `Cookie` constructor.
 */

module.exports.Cookie = Cookie;
});
require.register("analytics/lib/group.js", function(exports, require, module){

var debug = require('debug')('analytics:group');
var bind = require('bind');
var clone = require('clone');
var cookie = require('./cookie');
var defaults = require('defaults');
var extend = require('extend');
var store = require('./store');
var traverse = require('isodate-traverse');


/**
 * Initialize a new `Group` with `options`.
 *
 * @param {Object} options
 */

function Group (options) {
  this.options(options);
  this.id(null);
  this.properties({});
}


/**
 * Get or set storage `options`.
 *
 * @param {Object} options
 *   @property {Object} cookie
 *   @property {Object} localStorage
 *   @property {Boolean} persist (default: `true`)
 */

Group.prototype.options = function (options) {
  if (arguments.length === 0) return this._options;
  options || (options = {});

  defaults(options, {
    persist: true,
    cookie: {
      key: 'ajs_group_id'
    },
    localStorage: {
      key: 'ajs_group_properties'
    }
  });

  this._options = options;
};


/**
 * Get or set the group's `id`.
 *
 * @param {String} id
 */

Group.prototype.id = function (id) {
  switch (arguments.length) {
    case 0: return this._getId();
    case 1: return this._setId(id);
  }
};


/**
 * Get the group's id.
 *
 * @return {String}
 */

Group.prototype._getId = function () {
  var ret = this._options.persist
    ? cookie.get(this._options.cookie.key)
    : this._id;
  return ret === undefined ? null : ret;
};


/**
 * Set the group's `id`.
 *
 * @param {String} id
 */

Group.prototype._setId = function (id) {
  if (this._options.persist) {
    cookie.set(this._options.cookie.key, id);
  } else {
    this._id = id;
  }
};


/**
 * Get or set the group's `properties`.
 *
 * @param {String} properties
 */

Group.prototype.properties = function (properties) {
  switch (arguments.length) {
    case 0: return this._getProperties();
    case 1: return this._setProperties(properties);
  }
};


/**
 * Get the group's properties. Always convert ISO date strings into real dates,
 * since they aren't parsed back from local storage.
 *
 * @return {Object}
 */

Group.prototype._getProperties = function () {
  var ret = this._options.persist
    ? store.get(this._options.localStorage.key)
    : this._properties;
  return ret ? traverse(clone(ret)) : {};
};


/**
 * Set the group's `properties`.
 *
 * @param {Object} properties
 */

Group.prototype._setProperties = function (properties) {
  properties || (properties = {});
  if (this._options.persist) {
    store.set(this._options.localStorage.key, properties);
  } else {
    this._properties = properties;
  }
};


/**
 * Idenfity the group with an `id` and `properties`. If we it's the same group,
 * extend the existing `properties` instead of overwriting.
 *
 * @param {String} id
 * @param {Object} properties
 */

Group.prototype.identify = function (id, properties) {
  properties || (properties = {});
  var current = this.id();
  if (current === null || current === id) properties = extend(this.properties(), properties);
  if (id) this.id(id);
  debug('identify %o, %o', id, properties);
  this.properties(properties);
  this.save();
};


/**
 * Save the group to local storage and the cookie.
 *
 * @return {Boolean}
 */

Group.prototype.save = function () {
  if (!this._options.persist) return false;
  cookie.set(this._options.cookie.key, this.id());
  store.set(this._options.localStorage.key, this.properties());
  return true;
};


/**
 * Log the group out, reseting `id` and `properties` to defaults.
 */

Group.prototype.logout = function () {
  this.id(null);
  this.properties({});
  cookie.remove(this._options.cookie.key);
  store.remove(this._options.localStorage.key);
};


/**
 * Reset all group state, logging out and returning options to defaults.
 */

Group.prototype.reset = function () {
  this.logout();
  this.options({});
};


/**
 * Load saved group `id` or `properties` from storage.
 */

Group.prototype.load = function () {
  this.id(cookie.get(this._options.cookie.key));
  this.properties(store.get(this._options.localStorage.key));
};


/**
 * Expose the group singleton.
 */

module.exports = bind.all(new Group());


/**
 * Expose the `Group` constructor.
 */

module.exports.Group = Group;

});
require.register("analytics/lib/store.js", function(exports, require, module){

var bind = require('bind');
var defaults = require('defaults');
var store = require('store');


/**
 * Initialize a new `Store` with `options`.
 *
 * @param {Object} options
 */

function Store (options) {
  this.options(options);
}


/**
 * Set the `options` for the store.
 *
 * @param {Object} options
 *   @field {Boolean} enabled (true)
 */

Store.prototype.options = function (options) {
  if (arguments.length === 0) return this._options;

  options = options || {};
  defaults(options, { enabled : true });

  this.enabled  = options.enabled && store.enabled;
  this._options = options;
};


/**
 * Set a `key` and `value` in local storage.
 *
 * @param {String} key
 * @param {Object} value
 */

Store.prototype.set = function (key, value) {
  if (!this.enabled) return false;
  return store.set(key, value);
};


/**
 * Get a value from local storage by `key`.
 *
 * @param {String} key
 * @return {Object}
 */

Store.prototype.get = function (key) {
  if (!this.enabled) return null;
  return store.get(key);
};


/**
 * Remove a value from local storage by `key`.
 *
 * @param {String} key
 */

Store.prototype.remove = function (key) {
  if (!this.enabled) return false;
  return store.remove(key);
};


/**
 * Expose the store singleton.
 */

module.exports = bind.all(new Store());


/**
 * Expose the `Store` constructor.
 */

module.exports.Store = Store;
});
require.register("analytics/lib/user.js", function(exports, require, module){

var debug = require('debug')('analytics:user');
var bind = require('bind');
var clone = require('clone');
var cookie = require('./cookie');
var defaults = require('defaults');
var extend = require('extend');
var store = require('./store');
var traverse = require('isodate-traverse');


/**
 * Initialize a new `User` with `options`.
 *
 * @param {Object} options
 */

function User (options) {
  this.options(options);
  this.id(null);
  this.traits({});
}


/**
 * Get or set storage `options`.
 *
 * @param {Object} options
 *   @property {Object} cookie
 *   @property {Object} localStorage
 *   @property {Boolean} persist (default: `true`)
 */

User.prototype.options = function (options) {
  if (arguments.length === 0) return this._options;
  options || (options = {});

  defaults(options, {
    persist: true,
    cookie: {
      key: 'ajs_user_id',
      oldKey: 'ajs_user'
    },
    localStorage: {
      key: 'ajs_user_traits'
    }
  });

  this._options = options;
};


/**
 * Get or set the user's `id`.
 *
 * @param {String} id
 */

User.prototype.id = function (id) {
  switch (arguments.length) {
    case 0: return this._getId();
    case 1: return this._setId(id);
  }
};


/**
 * Get the user's id.
 *
 * @return {String}
 */

User.prototype._getId = function () {
  var ret = this._options.persist
    ? cookie.get(this._options.cookie.key)
    : this._id;
  return ret === undefined ? null : ret;
};


/**
 * Set the user's `id`.
 *
 * @param {String} id
 */

User.prototype._setId = function (id) {
  if (this._options.persist) {
    cookie.set(this._options.cookie.key, id);
  } else {
    this._id = id;
  }
};


/**
 * Get or set the user's `traits`.
 *
 * @param {String} traits
 */

User.prototype.traits = function (traits) {
  switch (arguments.length) {
    case 0: return this._getTraits();
    case 1: return this._setTraits(traits);
  }
};


/**
 * Get the user's traits. Always convert ISO date strings into real dates, since
 * they aren't parsed back from local storage.
 *
 * @return {Object}
 */

User.prototype._getTraits = function () {
  var ret = this._options.persist
    ? store.get(this._options.localStorage.key)
    : this._traits;
  return ret ? traverse(clone(ret)) : {};
};


/**
 * Set the user's `traits`.
 *
 * @param {Object} traits
 */

User.prototype._setTraits = function (traits) {
  traits || (traits = {});
  if (this._options.persist) {
    store.set(this._options.localStorage.key, traits);
  } else {
    this._traits = traits;
  }
};


/**
 * Idenfity the user with an `id` and `traits`. If we it's the same user, extend
 * the existing `traits` instead of overwriting.
 *
 * @param {String} id
 * @param {Object} traits
 */

User.prototype.identify = function (id, traits) {
  traits || (traits = {});
  var current = this.id();
  if (current === null || current === id) traits = extend(this.traits(), traits);
  if (id) this.id(id);
  debug('identify %o, %o', id, traits);
  this.traits(traits);
  this.save();
};


/**
 * Save the user to local storage and the cookie.
 *
 * @return {Boolean}
 */

User.prototype.save = function () {
  if (!this._options.persist) return false;
  cookie.set(this._options.cookie.key, this.id());
  store.set(this._options.localStorage.key, this.traits());
  return true;
};


/**
 * Log the user out, reseting `id` and `traits` to defaults.
 */

User.prototype.logout = function () {
  this.id(null);
  this.traits({});
  cookie.remove(this._options.cookie.key);
  store.remove(this._options.localStorage.key);
};


/**
 * Reset all user state, logging out and returning options to defaults.
 */

User.prototype.reset = function () {
  this.logout();
  this.options({});
};


/**
 * Load saved user `id` or `traits` from storage.
 */

User.prototype.load = function () {
  if (this._loadOldCookie()) return;
  this.id(cookie.get(this._options.cookie.key));
  this.traits(store.get(this._options.localStorage.key));
};


/**
 * BACKWARDS COMPATIBILITY: Load the old user from the cookie.
 *
 * @return {Boolean}
 * @api private
 */

User.prototype._loadOldCookie = function () {
  var user = cookie.get(this._options.cookie.oldKey);
  if (!user) return false;

  this.id(user.id);
  this.traits(user.traits);
  cookie.remove(this._options.cookie.oldKey);
  return true;
};


/**
 * Expose the user singleton.
 */

module.exports = bind.all(new User());


/**
 * Expose the `User` constructor.
 */

module.exports.User = User;

});






































require.alias("avetisk-defaults/index.js", "analytics/deps/defaults/index.js");
require.alias("avetisk-defaults/index.js", "defaults/index.js");

require.alias("component-clone/index.js", "analytics/deps/clone/index.js");
require.alias("component-clone/index.js", "clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-cookie/index.js", "analytics/deps/cookie/index.js");
require.alias("component-cookie/index.js", "cookie/index.js");

require.alias("component-each/index.js", "analytics/deps/each/index.js");
require.alias("component-each/index.js", "each/index.js");
require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-emitter/index.js", "analytics/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-event/index.js", "analytics/deps/event/index.js");
require.alias("component-event/index.js", "event/index.js");

require.alias("component-object/index.js", "analytics/deps/object/index.js");
require.alias("component-object/index.js", "object/index.js");

require.alias("component-querystring/index.js", "analytics/deps/querystring/index.js");
require.alias("component-querystring/index.js", "querystring/index.js");
require.alias("component-trim/index.js", "component-querystring/deps/trim/index.js");

require.alias("component-url/index.js", "analytics/deps/url/index.js");
require.alias("component-url/index.js", "url/index.js");

require.alias("ianstormtaylor-bind/index.js", "analytics/deps/bind/index.js");
require.alias("ianstormtaylor-bind/index.js", "bind/index.js");
require.alias("component-bind/index.js", "ianstormtaylor-bind/deps/bind/index.js");

require.alias("segmentio-bind-all/index.js", "ianstormtaylor-bind/deps/bind-all/index.js");
require.alias("component-bind/index.js", "segmentio-bind-all/deps/bind/index.js");

require.alias("component-type/index.js", "segmentio-bind-all/deps/type/index.js");

require.alias("ianstormtaylor-callback/index.js", "analytics/deps/callback/index.js");
require.alias("ianstormtaylor-callback/index.js", "callback/index.js");
require.alias("timoxley-next-tick/index.js", "ianstormtaylor-callback/deps/next-tick/index.js");

require.alias("ianstormtaylor-is/index.js", "analytics/deps/is/index.js");
require.alias("ianstormtaylor-is/index.js", "is/index.js");
require.alias("component-type/index.js", "ianstormtaylor-is/deps/type/index.js");

require.alias("ianstormtaylor-is-empty/index.js", "ianstormtaylor-is/deps/is-empty/index.js");

require.alias("segmentio-after/index.js", "analytics/deps/after/index.js");
require.alias("segmentio-after/index.js", "after/index.js");

require.alias("segmentio-analytics.js-integration/lib/index.js", "analytics/deps/integration/lib/index.js");
require.alias("segmentio-analytics.js-integration/lib/protos.js", "analytics/deps/integration/lib/protos.js");
require.alias("segmentio-analytics.js-integration/lib/statics.js", "analytics/deps/integration/lib/statics.js");
require.alias("segmentio-analytics.js-integration/lib/index.js", "analytics/deps/integration/index.js");
require.alias("segmentio-analytics.js-integration/lib/index.js", "integration/index.js");
require.alias("avetisk-defaults/index.js", "segmentio-analytics.js-integration/deps/defaults/index.js");

require.alias("component-clone/index.js", "segmentio-analytics.js-integration/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-emitter/index.js", "segmentio-analytics.js-integration/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("ianstormtaylor-bind/index.js", "segmentio-analytics.js-integration/deps/bind/index.js");
require.alias("component-bind/index.js", "ianstormtaylor-bind/deps/bind/index.js");

require.alias("segmentio-bind-all/index.js", "ianstormtaylor-bind/deps/bind-all/index.js");
require.alias("component-bind/index.js", "segmentio-bind-all/deps/bind/index.js");

require.alias("component-type/index.js", "segmentio-bind-all/deps/type/index.js");

require.alias("ianstormtaylor-callback/index.js", "segmentio-analytics.js-integration/deps/callback/index.js");
require.alias("timoxley-next-tick/index.js", "ianstormtaylor-callback/deps/next-tick/index.js");

require.alias("segmentio-after/index.js", "segmentio-analytics.js-integration/deps/after/index.js");

require.alias("timoxley-next-tick/index.js", "segmentio-analytics.js-integration/deps/next-tick/index.js");

require.alias("yields-slug/index.js", "segmentio-analytics.js-integration/deps/slug/index.js");

require.alias("visionmedia-debug/index.js", "segmentio-analytics.js-integration/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "segmentio-analytics.js-integration/deps/debug/debug.js");

require.alias("segmentio-analytics.js-integration/lib/index.js", "segmentio-analytics.js-integration/index.js");
require.alias("segmentio-analytics.js-integrations/index.js", "analytics/deps/integrations/index.js");
require.alias("segmentio-analytics.js-integrations/lib/adroll.js", "analytics/deps/integrations/lib/adroll.js");
require.alias("segmentio-analytics.js-integrations/lib/amplitude.js", "analytics/deps/integrations/lib/amplitude.js");
require.alias("segmentio-analytics.js-integrations/lib/awesm.js", "analytics/deps/integrations/lib/awesm.js");
require.alias("segmentio-analytics.js-integrations/lib/awesomatic.js", "analytics/deps/integrations/lib/awesomatic.js");
require.alias("segmentio-analytics.js-integrations/lib/bugherd.js", "analytics/deps/integrations/lib/bugherd.js");
require.alias("segmentio-analytics.js-integrations/lib/bugsnag.js", "analytics/deps/integrations/lib/bugsnag.js");
require.alias("segmentio-analytics.js-integrations/lib/chartbeat.js", "analytics/deps/integrations/lib/chartbeat.js");
require.alias("segmentio-analytics.js-integrations/lib/clicktale.js", "analytics/deps/integrations/lib/clicktale.js");
require.alias("segmentio-analytics.js-integrations/lib/clicky.js", "analytics/deps/integrations/lib/clicky.js");
require.alias("segmentio-analytics.js-integrations/lib/comscore.js", "analytics/deps/integrations/lib/comscore.js");
require.alias("segmentio-analytics.js-integrations/lib/crazy-egg.js", "analytics/deps/integrations/lib/crazy-egg.js");
require.alias("segmentio-analytics.js-integrations/lib/customerio.js", "analytics/deps/integrations/lib/customerio.js");
require.alias("segmentio-analytics.js-integrations/lib/drip.js", "analytics/deps/integrations/lib/drip.js");
require.alias("segmentio-analytics.js-integrations/lib/evergage.js", "analytics/deps/integrations/lib/evergage.js");
require.alias("segmentio-analytics.js-integrations/lib/errorception.js", "analytics/deps/integrations/lib/errorception.js");
require.alias("segmentio-analytics.js-integrations/lib/foxmetrics.js", "analytics/deps/integrations/lib/foxmetrics.js");
require.alias("segmentio-analytics.js-integrations/lib/gauges.js", "analytics/deps/integrations/lib/gauges.js");
require.alias("segmentio-analytics.js-integrations/lib/get-satisfaction.js", "analytics/deps/integrations/lib/get-satisfaction.js");
require.alias("segmentio-analytics.js-integrations/lib/google-analytics.js", "analytics/deps/integrations/lib/google-analytics.js");
require.alias("segmentio-analytics.js-integrations/lib/gosquared.js", "analytics/deps/integrations/lib/gosquared.js");
require.alias("segmentio-analytics.js-integrations/lib/heap.js", "analytics/deps/integrations/lib/heap.js");
require.alias("segmentio-analytics.js-integrations/lib/hittail.js", "analytics/deps/integrations/lib/hittail.js");
require.alias("segmentio-analytics.js-integrations/lib/hubspot.js", "analytics/deps/integrations/lib/hubspot.js");
require.alias("segmentio-analytics.js-integrations/lib/improvely.js", "analytics/deps/integrations/lib/improvely.js");
require.alias("segmentio-analytics.js-integrations/lib/inspectlet.js", "analytics/deps/integrations/lib/inspectlet.js");
require.alias("segmentio-analytics.js-integrations/lib/intercom.js", "analytics/deps/integrations/lib/intercom.js");
require.alias("segmentio-analytics.js-integrations/lib/keen-io.js", "analytics/deps/integrations/lib/keen-io.js");
require.alias("segmentio-analytics.js-integrations/lib/kissmetrics.js", "analytics/deps/integrations/lib/kissmetrics.js");
require.alias("segmentio-analytics.js-integrations/lib/klaviyo.js", "analytics/deps/integrations/lib/klaviyo.js");
require.alias("segmentio-analytics.js-integrations/lib/leadlander.js", "analytics/deps/integrations/lib/leadlander.js");
require.alias("segmentio-analytics.js-integrations/lib/livechat.js", "analytics/deps/integrations/lib/livechat.js");
require.alias("segmentio-analytics.js-integrations/lib/lucky-orange.js", "analytics/deps/integrations/lib/lucky-orange.js");
require.alias("segmentio-analytics.js-integrations/lib/lytics.js", "analytics/deps/integrations/lib/lytics.js");
require.alias("segmentio-analytics.js-integrations/lib/mixpanel.js", "analytics/deps/integrations/lib/mixpanel.js");
require.alias("segmentio-analytics.js-integrations/lib/mousestats.js", "analytics/deps/integrations/lib/mousestats.js");
require.alias("segmentio-analytics.js-integrations/lib/olark.js", "analytics/deps/integrations/lib/olark.js");
require.alias("segmentio-analytics.js-integrations/lib/optimizely.js", "analytics/deps/integrations/lib/optimizely.js");
require.alias("segmentio-analytics.js-integrations/lib/perfect-audience.js", "analytics/deps/integrations/lib/perfect-audience.js");
require.alias("segmentio-analytics.js-integrations/lib/pingdom.js", "analytics/deps/integrations/lib/pingdom.js");
require.alias("segmentio-analytics.js-integrations/lib/preact.js", "analytics/deps/integrations/lib/preact.js");
require.alias("segmentio-analytics.js-integrations/lib/qualaroo.js", "analytics/deps/integrations/lib/qualaroo.js");
require.alias("segmentio-analytics.js-integrations/lib/quantcast.js", "analytics/deps/integrations/lib/quantcast.js");
require.alias("segmentio-analytics.js-integrations/lib/rollbar.js", "analytics/deps/integrations/lib/rollbar.js");
require.alias("segmentio-analytics.js-integrations/lib/sentry.js", "analytics/deps/integrations/lib/sentry.js");
require.alias("segmentio-analytics.js-integrations/lib/snapengage.js", "analytics/deps/integrations/lib/snapengage.js");
require.alias("segmentio-analytics.js-integrations/lib/spinnakr.js", "analytics/deps/integrations/lib/spinnakr.js");
require.alias("segmentio-analytics.js-integrations/lib/tapstream.js", "analytics/deps/integrations/lib/tapstream.js");
require.alias("segmentio-analytics.js-integrations/lib/trakio.js", "analytics/deps/integrations/lib/trakio.js");
require.alias("segmentio-analytics.js-integrations/lib/usercycle.js", "analytics/deps/integrations/lib/usercycle.js");
require.alias("segmentio-analytics.js-integrations/lib/userfox.js", "analytics/deps/integrations/lib/userfox.js");
require.alias("segmentio-analytics.js-integrations/lib/uservoice.js", "analytics/deps/integrations/lib/uservoice.js");
require.alias("segmentio-analytics.js-integrations/lib/vero.js", "analytics/deps/integrations/lib/vero.js");
require.alias("segmentio-analytics.js-integrations/lib/visual-website-optimizer.js", "analytics/deps/integrations/lib/visual-website-optimizer.js");
require.alias("segmentio-analytics.js-integrations/lib/woopra.js", "analytics/deps/integrations/lib/woopra.js");
require.alias("segmentio-analytics.js-integrations/lib/yandex-metrica.js", "analytics/deps/integrations/lib/yandex-metrica.js");
require.alias("segmentio-analytics.js-integrations/index.js", "integrations/index.js");
require.alias("component-clone/index.js", "segmentio-analytics.js-integrations/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-domify/index.js", "segmentio-analytics.js-integrations/deps/domify/index.js");

require.alias("component-each/index.js", "segmentio-analytics.js-integrations/deps/each/index.js");
require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-once/index.js", "segmentio-analytics.js-integrations/deps/once/index.js");

require.alias("component-type/index.js", "segmentio-analytics.js-integrations/deps/type/index.js");

require.alias("component-url/index.js", "segmentio-analytics.js-integrations/deps/url/index.js");

require.alias("ianstormtaylor-callback/index.js", "segmentio-analytics.js-integrations/deps/callback/index.js");
require.alias("timoxley-next-tick/index.js", "ianstormtaylor-callback/deps/next-tick/index.js");

require.alias("ianstormtaylor-bind/index.js", "segmentio-analytics.js-integrations/deps/bind/index.js");
require.alias("component-bind/index.js", "ianstormtaylor-bind/deps/bind/index.js");

require.alias("segmentio-bind-all/index.js", "ianstormtaylor-bind/deps/bind-all/index.js");
require.alias("component-bind/index.js", "segmentio-bind-all/deps/bind/index.js");

require.alias("component-type/index.js", "segmentio-bind-all/deps/type/index.js");

require.alias("ianstormtaylor-is/index.js", "segmentio-analytics.js-integrations/deps/is/index.js");
require.alias("component-type/index.js", "ianstormtaylor-is/deps/type/index.js");

require.alias("ianstormtaylor-is-empty/index.js", "ianstormtaylor-is/deps/is-empty/index.js");

require.alias("segmentio-alias/index.js", "segmentio-analytics.js-integrations/deps/alias/index.js");
require.alias("component-clone/index.js", "segmentio-alias/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-type/index.js", "segmentio-alias/deps/type/index.js");

require.alias("segmentio-analytics.js-integration/lib/index.js", "segmentio-analytics.js-integrations/deps/integration/lib/index.js");
require.alias("segmentio-analytics.js-integration/lib/protos.js", "segmentio-analytics.js-integrations/deps/integration/lib/protos.js");
require.alias("segmentio-analytics.js-integration/lib/statics.js", "segmentio-analytics.js-integrations/deps/integration/lib/statics.js");
require.alias("segmentio-analytics.js-integration/lib/index.js", "segmentio-analytics.js-integrations/deps/integration/index.js");
require.alias("avetisk-defaults/index.js", "segmentio-analytics.js-integration/deps/defaults/index.js");

require.alias("component-clone/index.js", "segmentio-analytics.js-integration/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-emitter/index.js", "segmentio-analytics.js-integration/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("ianstormtaylor-bind/index.js", "segmentio-analytics.js-integration/deps/bind/index.js");
require.alias("component-bind/index.js", "ianstormtaylor-bind/deps/bind/index.js");

require.alias("segmentio-bind-all/index.js", "ianstormtaylor-bind/deps/bind-all/index.js");
require.alias("component-bind/index.js", "segmentio-bind-all/deps/bind/index.js");

require.alias("component-type/index.js", "segmentio-bind-all/deps/type/index.js");

require.alias("ianstormtaylor-callback/index.js", "segmentio-analytics.js-integration/deps/callback/index.js");
require.alias("timoxley-next-tick/index.js", "ianstormtaylor-callback/deps/next-tick/index.js");

require.alias("segmentio-after/index.js", "segmentio-analytics.js-integration/deps/after/index.js");

require.alias("timoxley-next-tick/index.js", "segmentio-analytics.js-integration/deps/next-tick/index.js");

require.alias("yields-slug/index.js", "segmentio-analytics.js-integration/deps/slug/index.js");

require.alias("visionmedia-debug/index.js", "segmentio-analytics.js-integration/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "segmentio-analytics.js-integration/deps/debug/debug.js");

require.alias("segmentio-analytics.js-integration/lib/index.js", "segmentio-analytics.js-integration/index.js");
require.alias("segmentio-canonical/index.js", "segmentio-analytics.js-integrations/deps/canonical/index.js");

require.alias("segmentio-convert-dates/index.js", "segmentio-analytics.js-integrations/deps/convert-dates/index.js");
require.alias("component-clone/index.js", "segmentio-convert-dates/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("ianstormtaylor-is/index.js", "segmentio-convert-dates/deps/is/index.js");
require.alias("component-type/index.js", "ianstormtaylor-is/deps/type/index.js");

require.alias("ianstormtaylor-is-empty/index.js", "ianstormtaylor-is/deps/is-empty/index.js");

require.alias("segmentio-extend/index.js", "segmentio-analytics.js-integrations/deps/extend/index.js");

require.alias("segmentio-global-queue/index.js", "segmentio-analytics.js-integrations/deps/global-queue/index.js");

require.alias("segmentio-is-email/index.js", "segmentio-analytics.js-integrations/deps/is-email/index.js");

require.alias("segmentio-load-date/index.js", "segmentio-analytics.js-integrations/deps/load-date/index.js");

require.alias("segmentio-load-script/index.js", "segmentio-analytics.js-integrations/deps/load-script/index.js");
require.alias("component-type/index.js", "segmentio-load-script/deps/type/index.js");

require.alias("segmentio-on-body/index.js", "segmentio-analytics.js-integrations/deps/on-body/index.js");
require.alias("component-each/index.js", "segmentio-on-body/deps/each/index.js");
require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("segmentio-on-error/index.js", "segmentio-analytics.js-integrations/deps/on-error/index.js");

require.alias("segmentio-to-unix-timestamp/index.js", "segmentio-analytics.js-integrations/deps/to-unix-timestamp/index.js");

require.alias("segmentio-use-https/index.js", "segmentio-analytics.js-integrations/deps/use-https/index.js");

require.alias("timoxley-next-tick/index.js", "segmentio-analytics.js-integrations/deps/next-tick/index.js");

require.alias("yields-slug/index.js", "segmentio-analytics.js-integrations/deps/slug/index.js");

require.alias("visionmedia-batch/index.js", "segmentio-analytics.js-integrations/deps/batch/index.js");
require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("visionmedia-debug/index.js", "segmentio-analytics.js-integrations/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "segmentio-analytics.js-integrations/deps/debug/debug.js");

require.alias("segmentio-canonical/index.js", "analytics/deps/canonical/index.js");
require.alias("segmentio-canonical/index.js", "canonical/index.js");

require.alias("segmentio-extend/index.js", "analytics/deps/extend/index.js");
require.alias("segmentio-extend/index.js", "extend/index.js");

require.alias("segmentio-is-email/index.js", "analytics/deps/is-email/index.js");
require.alias("segmentio-is-email/index.js", "is-email/index.js");

require.alias("segmentio-is-meta/index.js", "analytics/deps/is-meta/index.js");
require.alias("segmentio-is-meta/index.js", "is-meta/index.js");

require.alias("segmentio-isodate-traverse/index.js", "analytics/deps/isodate-traverse/index.js");
require.alias("segmentio-isodate-traverse/index.js", "isodate-traverse/index.js");
require.alias("component-clone/index.js", "segmentio-isodate-traverse/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-each/index.js", "segmentio-isodate-traverse/deps/each/index.js");
require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("ianstormtaylor-is/index.js", "segmentio-isodate-traverse/deps/is/index.js");
require.alias("component-type/index.js", "ianstormtaylor-is/deps/type/index.js");

require.alias("ianstormtaylor-is-empty/index.js", "ianstormtaylor-is/deps/is-empty/index.js");

require.alias("segmentio-isodate/index.js", "segmentio-isodate-traverse/deps/isodate/index.js");

require.alias("segmentio-json/index.js", "analytics/deps/json/index.js");
require.alias("segmentio-json/index.js", "json/index.js");
require.alias("component-json-fallback/index.js", "segmentio-json/deps/json-fallback/index.js");

require.alias("segmentio-new-date/lib/index.js", "analytics/deps/new-date/lib/index.js");
require.alias("segmentio-new-date/lib/milliseconds.js", "analytics/deps/new-date/lib/milliseconds.js");
require.alias("segmentio-new-date/lib/seconds.js", "analytics/deps/new-date/lib/seconds.js");
require.alias("segmentio-new-date/lib/index.js", "analytics/deps/new-date/index.js");
require.alias("segmentio-new-date/lib/index.js", "new-date/index.js");
require.alias("ianstormtaylor-is/index.js", "segmentio-new-date/deps/is/index.js");
require.alias("component-type/index.js", "ianstormtaylor-is/deps/type/index.js");

require.alias("ianstormtaylor-is-empty/index.js", "ianstormtaylor-is/deps/is-empty/index.js");

require.alias("segmentio-isodate/index.js", "segmentio-new-date/deps/isodate/index.js");

require.alias("segmentio-new-date/lib/index.js", "segmentio-new-date/index.js");
require.alias("segmentio-store.js/store.js", "analytics/deps/store/store.js");
require.alias("segmentio-store.js/store.js", "analytics/deps/store/index.js");
require.alias("segmentio-store.js/store.js", "store/index.js");
require.alias("segmentio-store.js/store.js", "segmentio-store.js/index.js");
require.alias("segmentio-top-domain/index.js", "analytics/deps/top-domain/index.js");
require.alias("segmentio-top-domain/index.js", "analytics/deps/top-domain/index.js");
require.alias("segmentio-top-domain/index.js", "top-domain/index.js");
require.alias("component-url/index.js", "segmentio-top-domain/deps/url/index.js");

require.alias("segmentio-top-domain/index.js", "segmentio-top-domain/index.js");
require.alias("yields-prevent/index.js", "analytics/deps/prevent/index.js");
require.alias("yields-prevent/index.js", "prevent/index.js");

require.alias("visionmedia-debug/index.js", "analytics/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "analytics/deps/debug/debug.js");
require.alias("visionmedia-debug/index.js", "debug/index.js");

require.alias("analytics/lib/index.js", "analytics/index.js");if (typeof exports == "object") {
  module.exports = require("analytics");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("analytics"); });
} else {
  this["analytics"] = require("analytics");
}})();