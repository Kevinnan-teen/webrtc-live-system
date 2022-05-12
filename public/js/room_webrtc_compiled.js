(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

},{}],2:[function(require,module,exports){
var grammar = module.exports = {
  v: [{
    name: 'version',
    reg: /^(\d*)$/
  }],
  o: [{
    // o=- 20518 0 IN IP4 203.0.113.1
    // NB: sessionId will be a String in most cases because it is huge
    name: 'origin',
    reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
    names: ['username', 'sessionId', 'sessionVersion', 'netType', 'ipVer', 'address'],
    format: '%s %s %d %s IP%d %s'
  }],
  // default parsing of these only (though some of these feel outdated)
  s: [{ name: 'name' }],
  i: [{ name: 'description' }],
  u: [{ name: 'uri' }],
  e: [{ name: 'email' }],
  p: [{ name: 'phone' }],
  z: [{ name: 'timezones' }], // TODO: this one can actually be parsed properly...
  r: [{ name: 'repeats' }],   // TODO: this one can also be parsed properly
  // k: [{}], // outdated thing ignored
  t: [{
    // t=0 0
    name: 'timing',
    reg: /^(\d*) (\d*)/,
    names: ['start', 'stop'],
    format: '%d %d'
  }],
  c: [{
    // c=IN IP4 10.47.197.26
    name: 'connection',
    reg: /^IN IP(\d) (\S*)/,
    names: ['version', 'ip'],
    format: 'IN IP%d %s'
  }],
  b: [{
    // b=AS:4000
    push: 'bandwidth',
    reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
    names: ['type', 'limit'],
    format: '%s:%s'
  }],
  m: [{
    // m=video 51744 RTP/AVP 126 97 98 34 31
    // NB: special - pushes to session
    // TODO: rtp/fmtp should be filtered by the payloads found here?
    reg: /^(\w*) (\d*) ([\w/]*)(?: (.*))?/,
    names: ['type', 'port', 'protocol', 'payloads'],
    format: '%s %d %s %s'
  }],
  a: [
    {
      // a=rtpmap:110 opus/48000/2
      push: 'rtp',
      reg: /^rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
      names: ['payload', 'codec', 'rate', 'encoding'],
      format: function (o) {
        return (o.encoding)
          ? 'rtpmap:%d %s/%s/%s'
          : o.rate
            ? 'rtpmap:%d %s/%s'
            : 'rtpmap:%d %s';
      }
    },
    {
      // a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
      // a=fmtp:111 minptime=10; useinbandfec=1
      push: 'fmtp',
      reg: /^fmtp:(\d*) ([\S| ]*)/,
      names: ['payload', 'config'],
      format: 'fmtp:%d %s'
    },
    {
      // a=control:streamid=0
      name: 'control',
      reg: /^control:(.*)/,
      format: 'control:%s'
    },
    {
      // a=rtcp:65179 IN IP4 193.84.77.194
      name: 'rtcp',
      reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
      names: ['port', 'netType', 'ipVer', 'address'],
      format: function (o) {
        return (o.address != null)
          ? 'rtcp:%d %s IP%d %s'
          : 'rtcp:%d';
      }
    },
    {
      // a=rtcp-fb:98 trr-int 100
      push: 'rtcpFbTrrInt',
      reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
      names: ['payload', 'value'],
      format: 'rtcp-fb:%s trr-int %d'
    },
    {
      // a=rtcp-fb:98 nack rpsi
      push: 'rtcpFb',
      reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
      names: ['payload', 'type', 'subtype'],
      format: function (o) {
        return (o.subtype != null)
          ? 'rtcp-fb:%s %s %s'
          : 'rtcp-fb:%s %s';
      }
    },
    {
      // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
      // a=extmap:1/recvonly URI-gps-string
      // a=extmap:3 urn:ietf:params:rtp-hdrext:encrypt urn:ietf:params:rtp-hdrext:smpte-tc 25@600/24
      push: 'ext',
      reg: /^extmap:(\d+)(?:\/(\w+))?(?: (urn:ietf:params:rtp-hdrext:encrypt))? (\S*)(?: (\S*))?/,
      names: ['value', 'direction', 'encrypt-uri', 'uri', 'config'],
      format: function (o) {
        return (
          'extmap:%d' +
          (o.direction ? '/%s' : '%v') +
          (o['encrypt-uri'] ? ' %s' : '%v') +
          ' %s' +
          (o.config ? ' %s' : '')
        );
      }
    },
    {
      // a=extmap-allow-mixed
      name: 'extmapAllowMixed',
      reg: /^(extmap-allow-mixed)/
    },
    {
      // a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
      push: 'crypto',
      reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
      names: ['id', 'suite', 'config', 'sessionConfig'],
      format: function (o) {
        return (o.sessionConfig != null)
          ? 'crypto:%d %s %s %s'
          : 'crypto:%d %s %s';
      }
    },
    {
      // a=setup:actpass
      name: 'setup',
      reg: /^setup:(\w*)/,
      format: 'setup:%s'
    },
    {
      // a=connection:new
      name: 'connectionType',
      reg: /^connection:(new|existing)/,
      format: 'connection:%s'
    },
    {
      // a=mid:1
      name: 'mid',
      reg: /^mid:([^\s]*)/,
      format: 'mid:%s'
    },
    {
      // a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
      name: 'msid',
      reg: /^msid:(.*)/,
      format: 'msid:%s'
    },
    {
      // a=ptime:20
      name: 'ptime',
      reg: /^ptime:(\d*(?:\.\d*)*)/,
      format: 'ptime:%d'
    },
    {
      // a=maxptime:60
      name: 'maxptime',
      reg: /^maxptime:(\d*(?:\.\d*)*)/,
      format: 'maxptime:%d'
    },
    {
      // a=sendrecv
      name: 'direction',
      reg: /^(sendrecv|recvonly|sendonly|inactive)/
    },
    {
      // a=ice-lite
      name: 'icelite',
      reg: /^(ice-lite)/
    },
    {
      // a=ice-ufrag:F7gI
      name: 'iceUfrag',
      reg: /^ice-ufrag:(\S*)/,
      format: 'ice-ufrag:%s'
    },
    {
      // a=ice-pwd:x9cml/YzichV2+XlhiMu8g
      name: 'icePwd',
      reg: /^ice-pwd:(\S*)/,
      format: 'ice-pwd:%s'
    },
    {
      // a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
      name: 'fingerprint',
      reg: /^fingerprint:(\S*) (\S*)/,
      names: ['type', 'hash'],
      format: 'fingerprint:%s %s'
    },
    {
      // a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
      // a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0 network-id 3 network-cost 10
      // a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0 network-id 3 network-cost 10
      // a=candidate:229815620 1 tcp 1518280447 192.168.150.19 60017 typ host tcptype active generation 0 network-id 3 network-cost 10
      // a=candidate:3289912957 2 tcp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 tcptype passive generation 0 network-id 3 network-cost 10
      push:'candidates',
      reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?(?: network-id (\d*))?(?: network-cost (\d*))?/,
      names: ['foundation', 'component', 'transport', 'priority', 'ip', 'port', 'type', 'raddr', 'rport', 'tcptype', 'generation', 'network-id', 'network-cost'],
      format: function (o) {
        var str = 'candidate:%s %d %s %d %s %d typ %s';

        str += (o.raddr != null) ? ' raddr %s rport %d' : '%v%v';

        // NB: candidate has three optional chunks, so %void middles one if it's missing
        str += (o.tcptype != null) ? ' tcptype %s' : '%v';

        if (o.generation != null) {
          str += ' generation %d';
        }

        str += (o['network-id'] != null) ? ' network-id %d' : '%v';
        str += (o['network-cost'] != null) ? ' network-cost %d' : '%v';
        return str;
      }
    },
    {
      // a=end-of-candidates (keep after the candidates line for readability)
      name: 'endOfCandidates',
      reg: /^(end-of-candidates)/
    },
    {
      // a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
      name: 'remoteCandidates',
      reg: /^remote-candidates:(.*)/,
      format: 'remote-candidates:%s'
    },
    {
      // a=ice-options:google-ice
      name: 'iceOptions',
      reg: /^ice-options:(\S*)/,
      format: 'ice-options:%s'
    },
    {
      // a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
      push: 'ssrcs',
      reg: /^ssrc:(\d*) ([\w_-]*)(?::(.*))?/,
      names: ['id', 'attribute', 'value'],
      format: function (o) {
        var str = 'ssrc:%d';
        if (o.attribute != null) {
          str += ' %s';
          if (o.value != null) {
            str += ':%s';
          }
        }
        return str;
      }
    },
    {
      // a=ssrc-group:FEC 1 2
      // a=ssrc-group:FEC-FR 3004364195 1080772241
      push: 'ssrcGroups',
      // token-char = %x21 / %x23-27 / %x2A-2B / %x2D-2E / %x30-39 / %x41-5A / %x5E-7E
      reg: /^ssrc-group:([\x21\x23\x24\x25\x26\x27\x2A\x2B\x2D\x2E\w]*) (.*)/,
      names: ['semantics', 'ssrcs'],
      format: 'ssrc-group:%s %s'
    },
    {
      // a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
      name: 'msidSemantic',
      reg: /^msid-semantic:\s?(\w*) (\S*)/,
      names: ['semantic', 'token'],
      format: 'msid-semantic: %s %s' // space after ':' is not accidental
    },
    {
      // a=group:BUNDLE audio video
      push: 'groups',
      reg: /^group:(\w*) (.*)/,
      names: ['type', 'mids'],
      format: 'group:%s %s'
    },
    {
      // a=rtcp-mux
      name: 'rtcpMux',
      reg: /^(rtcp-mux)/
    },
    {
      // a=rtcp-rsize
      name: 'rtcpRsize',
      reg: /^(rtcp-rsize)/
    },
    {
      // a=sctpmap:5000 webrtc-datachannel 1024
      name: 'sctpmap',
      reg: /^sctpmap:([\w_/]*) (\S*)(?: (\S*))?/,
      names: ['sctpmapNumber', 'app', 'maxMessageSize'],
      format: function (o) {
        return (o.maxMessageSize != null)
          ? 'sctpmap:%s %s %s'
          : 'sctpmap:%s %s';
      }
    },
    {
      // a=x-google-flag:conference
      name: 'xGoogleFlag',
      reg: /^x-google-flag:([^\s]*)/,
      format: 'x-google-flag:%s'
    },
    {
      // a=rid:1 send max-width=1280;max-height=720;max-fps=30;depend=0
      push: 'rids',
      reg: /^rid:([\d\w]+) (\w+)(?: ([\S| ]*))?/,
      names: ['id', 'direction', 'params'],
      format: function (o) {
        return (o.params) ? 'rid:%s %s %s' : 'rid:%s %s';
      }
    },
    {
      // a=imageattr:97 send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320] recv [x=330,y=250]
      // a=imageattr:* send [x=800,y=640] recv *
      // a=imageattr:100 recv [x=320,y=240]
      push: 'imageattrs',
      reg: new RegExp(
        // a=imageattr:97
        '^imageattr:(\\d+|\\*)' +
        // send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320]
        '[\\s\\t]+(send|recv)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*)' +
        // recv [x=330,y=250]
        '(?:[\\s\\t]+(recv|send)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*))?'
      ),
      names: ['pt', 'dir1', 'attrs1', 'dir2', 'attrs2'],
      format: function (o) {
        return 'imageattr:%s %s %s' + (o.dir2 ? ' %s %s' : '');
      }
    },
    {
      // a=simulcast:send 1,2,3;~4,~5 recv 6;~7,~8
      // a=simulcast:recv 1;4,5 send 6;7
      name: 'simulcast',
      reg: new RegExp(
        // a=simulcast:
        '^simulcast:' +
        // send 1,2,3;~4,~5
        '(send|recv) ([a-zA-Z0-9\\-_~;,]+)' +
        // space + recv 6;~7,~8
        '(?:\\s?(send|recv) ([a-zA-Z0-9\\-_~;,]+))?' +
        // end
        '$'
      ),
      names: ['dir1', 'list1', 'dir2', 'list2'],
      format: function (o) {
        return 'simulcast:%s %s' + (o.dir2 ? ' %s %s' : '');
      }
    },
    {
      // old simulcast draft 03 (implemented by Firefox)
      //   https://tools.ietf.org/html/draft-ietf-mmusic-sdp-simulcast-03
      // a=simulcast: recv pt=97;98 send pt=97
      // a=simulcast: send rid=5;6;7 paused=6,7
      name: 'simulcast_03',
      reg: /^simulcast:[\s\t]+([\S+\s\t]+)$/,
      names: ['value'],
      format: 'simulcast: %s'
    },
    {
      // a=framerate:25
      // a=framerate:29.97
      name: 'framerate',
      reg: /^framerate:(\d+(?:$|\.\d+))/,
      format: 'framerate:%s'
    },
    {
      // RFC4570
      // a=source-filter: incl IN IP4 239.5.2.31 10.1.15.5
      name: 'sourceFilter',
      reg: /^source-filter: *(excl|incl) (\S*) (IP4|IP6|\*) (\S*) (.*)/,
      names: ['filterMode', 'netType', 'addressTypes', 'destAddress', 'srcList'],
      format: 'source-filter: %s %s %s %s %s'
    },
    {
      // a=bundle-only
      name: 'bundleOnly',
      reg: /^(bundle-only)/
    },
    {
      // a=label:1
      name: 'label',
      reg: /^label:(.+)/,
      format: 'label:%s'
    },
    {
      // RFC version 26 for SCTP over DTLS
      // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-5
      name: 'sctpPort',
      reg: /^sctp-port:(\d+)$/,
      format: 'sctp-port:%s'
    },
    {
      // RFC version 26 for SCTP over DTLS
      // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-6
      name: 'maxMessageSize',
      reg: /^max-message-size:(\d+)$/,
      format: 'max-message-size:%s'
    },
    {
      // RFC7273
      // a=ts-refclk:ptp=IEEE1588-2008:39-A7-94-FF-FE-07-CB-D0:37
      push:'tsRefClocks',
      reg: /^ts-refclk:([^\s=]*)(?:=(\S*))?/,
      names: ['clksrc', 'clksrcExt'],
      format: function (o) {
        return 'ts-refclk:%s' + (o.clksrcExt != null ? '=%s' : '');
      }
    },
    {
      // RFC7273
      // a=mediaclk:direct=963214424
      name:'mediaClk',
      reg: /^mediaclk:(?:id=(\S*))? *([^\s=]*)(?:=(\S*))?(?: *rate=(\d+)\/(\d+))?/,
      names: ['id', 'mediaClockName', 'mediaClockValue', 'rateNumerator', 'rateDenominator'],
      format: function (o) {
        var str = 'mediaclk:';
        str += (o.id != null ? 'id=%s %s' : '%v%s');
        str += (o.mediaClockValue != null ? '=%s' : '');
        str += (o.rateNumerator != null ? ' rate=%s' : '');
        str += (o.rateDenominator != null ? '/%s' : '');
        return str;
      }
    },
    {
      // a=keywds:keywords
      name: 'keywords',
      reg: /^keywds:(.+)$/,
      format: 'keywds:%s'
    },
    {
      // a=content:main
      name: 'content',
      reg: /^content:(.+)/,
      format: 'content:%s'
    },
    // BFCP https://tools.ietf.org/html/rfc4583
    {
      // a=floorctrl:c-s
      name: 'bfcpFloorCtrl',
      reg: /^floorctrl:(c-only|s-only|c-s)/,
      format: 'floorctrl:%s'
    },
    {
      // a=confid:1
      name: 'bfcpConfId',
      reg: /^confid:(\d+)/,
      format: 'confid:%s'
    },
    {
      // a=userid:1
      name: 'bfcpUserId',
      reg: /^userid:(\d+)/,
      format: 'userid:%s'
    },
    {
      // a=floorid:1
      name: 'bfcpFloorId',
      reg: /^floorid:(.+) (?:m-stream|mstrm):(.+)/,
      names: ['id', 'mStream'],
      format: 'floorid:%s mstrm:%s'
    },
    {
      // any a= that we don't understand is kept verbatim on media.invalid
      push: 'invalid',
      names: ['value']
    }
  ]
};

// set sensible defaults to avoid polluting the grammar with boring details
Object.keys(grammar).forEach(function (key) {
  var objs = grammar[key];
  objs.forEach(function (obj) {
    if (!obj.reg) {
      obj.reg = /(.*)/;
    }
    if (!obj.format) {
      obj.format = '%s';
    }
  });
});

},{}],3:[function(require,module,exports){
var parser = require('./parser');
var writer = require('./writer');

exports.write = writer;
exports.parse = parser.parse;
exports.parseParams = parser.parseParams;
exports.parseFmtpConfig = parser.parseFmtpConfig; // Alias of parseParams().
exports.parsePayloads = parser.parsePayloads;
exports.parseRemoteCandidates = parser.parseRemoteCandidates;
exports.parseImageAttributes = parser.parseImageAttributes;
exports.parseSimulcastStreamList = parser.parseSimulcastStreamList;

},{"./parser":4,"./writer":5}],4:[function(require,module,exports){
var toIntIfInt = function (v) {
  return String(Number(v)) === v ? Number(v) : v;
};

var attachProperties = function (match, location, names, rawName) {
  if (rawName && !names) {
    location[rawName] = toIntIfInt(match[1]);
  }
  else {
    for (var i = 0; i < names.length; i += 1) {
      if (match[i+1] != null) {
        location[names[i]] = toIntIfInt(match[i+1]);
      }
    }
  }
};

var parseReg = function (obj, location, content) {
  var needsBlank = obj.name && obj.names;
  if (obj.push && !location[obj.push]) {
    location[obj.push] = [];
  }
  else if (needsBlank && !location[obj.name]) {
    location[obj.name] = {};
  }
  var keyLocation = obj.push ?
    {} :  // blank object that will be pushed
    needsBlank ? location[obj.name] : location; // otherwise, named location or root

  attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name);

  if (obj.push) {
    location[obj.push].push(keyLocation);
  }
};

var grammar = require('./grammar');
var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);

exports.parse = function (sdp) {
  var session = {}
    , media = []
    , location = session; // points at where properties go under (one of the above)

  // parse lines we understand
  sdp.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function (l) {
    var type = l[0];
    var content = l.slice(2);
    if (type === 'm') {
      media.push({rtp: [], fmtp: []});
      location = media[media.length-1]; // point at latest media line
    }

    for (var j = 0; j < (grammar[type] || []).length; j += 1) {
      var obj = grammar[type][j];
      if (obj.reg.test(content)) {
        return parseReg(obj, location, content);
      }
    }
  });

  session.media = media; // link it up
  return session;
};

var paramReducer = function (acc, expr) {
  var s = expr.split(/=(.+)/, 2);
  if (s.length === 2) {
    acc[s[0]] = toIntIfInt(s[1]);
  } else if (s.length === 1 && expr.length > 1) {
    acc[s[0]] = undefined;
  }
  return acc;
};

exports.parseParams = function (str) {
  return str.split(/;\s?/).reduce(paramReducer, {});
};

// For backward compatibility - alias will be removed in 3.0.0
exports.parseFmtpConfig = exports.parseParams;

exports.parsePayloads = function (str) {
  return str.toString().split(' ').map(Number);
};

exports.parseRemoteCandidates = function (str) {
  var candidates = [];
  var parts = str.split(' ').map(toIntIfInt);
  for (var i = 0; i < parts.length; i += 3) {
    candidates.push({
      component: parts[i],
      ip: parts[i + 1],
      port: parts[i + 2]
    });
  }
  return candidates;
};

exports.parseImageAttributes = function (str) {
  return str.split(' ').map(function (item) {
    return item.substring(1, item.length-1).split(',').reduce(paramReducer, {});
  });
};

exports.parseSimulcastStreamList = function (str) {
  return str.split(';').map(function (stream) {
    return stream.split(',').map(function (format) {
      var scid, paused = false;

      if (format[0] !== '~') {
        scid = toIntIfInt(format);
      } else {
        scid = toIntIfInt(format.substring(1, format.length));
        paused = true;
      }

      return {
        scid: scid,
        paused: paused
      };
    });
  });
};

},{"./grammar":2}],5:[function(require,module,exports){
var grammar = require('./grammar');

// customized util.format - discards excess arguments and can void middle ones
var formatRegExp = /%[sdv%]/g;
var format = function (formatStr) {
  var i = 1;
  var args = arguments;
  var len = args.length;
  return formatStr.replace(formatRegExp, function (x) {
    if (i >= len) {
      return x; // missing argument
    }
    var arg = args[i];
    i += 1;
    switch (x) {
    case '%%':
      return '%';
    case '%s':
      return String(arg);
    case '%d':
      return Number(arg);
    case '%v':
      return '';
    }
  });
  // NB: we discard excess arguments - they are typically undefined from makeLine
};

var makeLine = function (type, obj, location) {
  var str = obj.format instanceof Function ?
    (obj.format(obj.push ? location : location[obj.name])) :
    obj.format;

  var args = [type + '=' + str];
  if (obj.names) {
    for (var i = 0; i < obj.names.length; i += 1) {
      var n = obj.names[i];
      if (obj.name) {
        args.push(location[obj.name][n]);
      }
      else { // for mLine and push attributes
        args.push(location[obj.names[i]]);
      }
    }
  }
  else {
    args.push(location[obj.name]);
  }
  return format.apply(null, args);
};

// RFC specified order
// TODO: extend this with all the rest
var defaultOuterOrder = [
  'v', 'o', 's', 'i',
  'u', 'e', 'p', 'c',
  'b', 't', 'r', 'z', 'a'
];
var defaultInnerOrder = ['i', 'c', 'b', 'a'];


module.exports = function (session, opts) {
  opts = opts || {};
  // ensure certain properties exist
  if (session.version == null) {
    session.version = 0; // 'v=0' must be there (only defined version atm)
  }
  if (session.name == null) {
    session.name = ' '; // 's= ' must be there if no meaningful name set
  }
  session.media.forEach(function (mLine) {
    if (mLine.payloads == null) {
      mLine.payloads = '';
    }
  });

  var outerOrder = opts.outerOrder || defaultOuterOrder;
  var innerOrder = opts.innerOrder || defaultInnerOrder;
  var sdp = [];

  // loop through outerOrder for matching properties on session
  outerOrder.forEach(function (type) {
    grammar[type].forEach(function (obj) {
      if (obj.name in session && session[obj.name] != null) {
        sdp.push(makeLine(type, obj, session));
      }
      else if (obj.push in session && session[obj.push] != null) {
        session[obj.push].forEach(function (el) {
          sdp.push(makeLine(type, obj, el));
        });
      }
    });
  });

  // then for each media line, follow the innerOrder
  session.media.forEach(function (mLine) {
    sdp.push(makeLine('m', grammar.m[0], mLine));

    innerOrder.forEach(function (type) {
      grammar[type].forEach(function (obj) {
        if (obj.name in mLine && mLine[obj.name] != null) {
          sdp.push(makeLine(type, obj, mLine));
        }
        else if (obj.push in mLine && mLine[obj.push] != null) {
          mLine[obj.push].forEach(function (el) {
            sdp.push(makeLine(type, obj, el));
          });
        }
      });
    });
  });

  return sdp.join('\r\n') + '\r\n';
};

},{"./grammar":2}],6:[function(require,module,exports){
const EnhancedEventEmitter = require('./EnhancedEventEmitter');
const StreamManager = require('./StreamManager');
const SdpTransformer = require('sdp-transform');
const wsClient = require('./WebSocketClient');
const UserInfo = require('./UserInfo');
const MediaStatsInfo = require('./MediaStatsInfo');
const PCManager = require('./PCManager')

class Client extends EnhancedEventEmitter
{
    constructor()
    {
        super();
        this._remoteUsers = new Map();//uid, UserInfo

        this._cameraStream = null;
        this._screenStream = null;

        this._closed = true;
        this._connected = true;
        this._sendPCMap = new Map();//peerConnectionId, PCManager object
        this._recvPCMap = new Map();//peerConnectionId, PCManager object
        this._sendVideoStats = new MediaStatsInfo();
        this._sendAudioStats = new MediaStatsInfo();

        this._cameraIndex  = 0;

        setInterval(async () => {
            await this.OnPublisherStats();
        }, 2000);

        setInterval(async () => {
            await this.OnSubscribeStats();
        }, 2000);
    }

    async OpenCamera()
    {
        if (this._cameraStream)
        {
            throw Error("the camera is opened");
        }

        try
        {
            this._cameraStream = new StreamManager();
            return await this._cameraStream.Open('camera');
            //return await this._cameraStream.Open('screen');
        } catch (error) {
            console.log("create stream error:", error);
            throw new Error("create stream error:" + error);
        }
    }

    async OpenScreen()
    {
        if (this._screenStream)
        {
            throw Error("the screen is opened");
        }

        try
        {
            this._screenStream = new StreamManager();
            return await this._screenStream.Open('screen');
        } catch (error) {
            console.log("create stream error:", error);
            throw new Error("create stream error:" + error);
        }
    }
    
    /*
    return: {"users":[{"uid":"11111"}, {"uid":"22222"}]}
    */
    async Join({serverHost, roomId, userId})
    {
        this._server = serverHost;
        this._roomId = roomId;
        this._uid    = userId;

        console.log("join api server:", serverHost, "roomId:", roomId, "userId:", userId);

        this.ws = new wsClient();

        this.url = 'ws://' + serverHost;
        this.ws.Connect(this.url);

        await new Promise((resolve, reject) => {
            this._wsRegistEvent(resolve, reject);
        });

        var data = {
            'roomId': roomId,
            'uid': userId
        };
        console.log("ws is connected, starting joining server:", this.url, "data:", data);
        var respData = null;
        try {
            respData = await this.ws.request('join', data);
        } catch (error) {
            console.log("join exception error:", error);
            throw error;
        }

        var users = respData['users'];
        for (const user of users)
        {
            var uid = user['uid'];
            var userinfo = new UserInfo({roomId: this._roomId, uid: uid});

            this._remoteUsers.set(uid, userinfo);
        }
        console.log("join response:", JSON.stringify(respData));

        return respData;
    }
    
    async PublishScreen({videoEnable, audioEnable}){
        if (!this._connected)
        {
            throw new Error('websocket is not ready');
        }

        if (!this._screenStream)
        {
            throw new Error('screen does not init');
        }

        if (!videoEnable && !audioEnable)
        {
            throw new Error('video and audio are not enable');
        }

        var mediaTracks = [];
        if (videoEnable)
        {
            mediaTracks.push(this._screenStream.GetVideoTrack());
        }
        if (audioEnable)
        {
            mediaTracks.push(this._screenStream.GetAudioTrack());
        }

        var sendCameraPc = null;
        var offerInfo;
        try {
            sendCameraPc = new PCManager();
            sendCameraPc.CreatePeerConnection('send');
            sendCameraPc.SetType('screen');
            offerInfo = await sendCameraPc.AddSendMediaTrack(mediaTracks);
        } catch (error) {
            throw error;
        }

        var data = {
            'roomId': this._roomId,
            'uid': this._uid,
            'sdp' : offerInfo.offSdp
        }
        var respData;

        try {
            console.log("send publish request:", data);
            respData = await this.ws.request('publish', data);
        } catch (error) {
            console.log("send publish message exception:", error)
            throw error
        }
        console.log("Publish response message:", respData);

        var answerSdp = respData['sdp'];
        var peerConnectionId = respData['pcid'];

        sendCameraPc.SetId(peerConnectionId);

        await sendCameraPc.SetSendAnswerSdp(answerSdp);

        var answerSdpObj = SdpTransformer.parse(answerSdp);
        for (const item of answerSdpObj.media)
        {
            if (item.type == 'video')
            {
                this._screenVideoMid = item.mid;
            }
            else if (item.type == 'audio')
            {
                this._screenAudioMid = item.mid;
            }
            else
            {
                throw new Error("the sdp type is unkown:", item.type);
            }
        }
        this._sendPCMap.set(peerConnectionId, sendCameraPc);
        return;
    }

    async UnPublishScreen({videoDisable, audioDisable}){
        if (!this._connected)
        {
            throw new Error('websocket is not ready');
        }

        if (!this._screenStream)
        {
            throw new Error('screen does not init');
        }

        if (!videoDisable && !audioDisable)
        {
            throw new Error('video and audio are not disable');
        }

        var removeMids = [];
        if (videoDisable)
        {
            removeMids.push(this._screenVideoMid);
        }
        if (audioDisable)
        {
            removeMids.push(this._screenAudioMid);
        }

        var sendPC = null;

        for (var pc of this._sendPCMap.values())
        {
            if (pc.GetType() == 'screen')
            {
                sendPC = pc;
                break;
            }
        }
        if (sendPC == null)
        {
            throw new Error("fail to find camera");
        }
        sendPC.removeSendTrack(removeMids);

        sendPC.ClosePC();

        this._sendPCMap.delete(sendPC.GetId());

        //send unpublish request
        var data = {
            'roomId': this._roomId,
            'uid': this._uid,
            'pcid' : sendPC.GetId()
        }

        var respData;
        try {
            console.log("unpublish request: ", data);
            respData = await this.ws.request('unpublish', data);
        } catch (error) {
            console.log("send unpublish message exception:", error)
            throw error
        }
        console.log("UnPublish response message:", respData);

        return respData;
    }

    async PublishCamera({videoEnable, audioEnable}){
        if (!this._connected)
        {
            throw new Error('websocket is not ready');
        }

        if (!this._cameraStream)
        {
            throw new Error('camera does not init');
        }

        if (!videoEnable && !audioEnable)
        {
            throw new Error('video and audio are not enable');
        }

        if (this._publishCamera)
        {
            throw new Error('the camera has been published');
        }

        var mediaTracks = [];
        if (videoEnable)
        {
            mediaTracks.push(this._cameraStream.GetVideoTrack());
        }
        if (audioEnable)
        {
            mediaTracks.push(this._cameraStream.GetAudioTrack());
        }

        var sendCameraPc = null;
        var offerInfo;
        try {
            sendCameraPc = new PCManager();
            sendCameraPc.CreatePeerConnection('send');
            sendCameraPc.SetType('camera');
            offerInfo = await sendCameraPc.AddSendMediaTrack(mediaTracks);
        } catch (error) {
            throw error;
        }

        var data = {
            'roomId': this._roomId,
            'uid': this._uid,
            'sdp' : offerInfo.offSdp
        }
        var respData;

        try {
            console.log("send publish request:", data);
            respData = await this.ws.request('publish', data);
        } catch (error) {
            console.log("send publish message exception:", error)
            throw error
        }
        console.log("Publish response message:", respData);

        var answerSdp = respData['sdp'];
        var peerConnectionId = respData['pcid'];

        sendCameraPc.SetId(peerConnectionId);

        await sendCameraPc.SetSendAnswerSdp(answerSdp);

        var answerSdpObj = SdpTransformer.parse(answerSdp);
        for (const item of answerSdpObj.media)
        {
            if (item.type == 'video')
            {
                this._cameraVideoMid = item.mid;
            }
            else if (item.type == 'audio')
            {
                this._cameraAudioMid = item.mid;
            }
            else
            {
                throw new Error("the sdp type is unkown:", item.type);
            }
        }
        this._sendPCMap.set(peerConnectionId, sendCameraPc);
        return;
    }

    async UnPublishCamera({videoDisable, audioDisable}){
        if (!this._connected)
        {
            throw new Error('websocket is not ready');
        }

        if (!this._cameraStream)
        {
            throw new Error('camera does not init');
        }

        if (!videoDisable && !audioDisable)
        {
            throw new Error('video and audio are not disable');
        }

        var removeMids = [];
        if (videoDisable)
        {
            removeMids.push(this._cameraVideoMid);
        }
        if (audioDisable)
        {
            removeMids.push(this._cameraAudioMid);
        }

        var sendPC = null;

        for (var pc of this._sendPCMap.values())
        {
            if (pc.GetType() == 'camera')
            {
                sendPC = pc;
                break;
            }
        }
        if (sendPC == null)
        {
            throw new Error("fail to find camera");
        }
        sendPC.removeSendTrack(removeMids);

        sendPC.ClosePC();

        this._sendPCMap.delete(sendPC.GetId());

        //send unpublish request
        var data = {
            'roomId': this._roomId,
            'uid': this._uid,
            'pcid' : sendPC.GetId()
        }

        var respData;
        try {
            console.log("unpublish request: ", data);
            respData = await this.ws.request('unpublish', data);
        } catch (error) {
            console.log("send unpublish message exception:", error)
            throw error
        }
        console.log("UnPublish response message:", respData);

        return respData;
    }

    async OnPublisherStats() {
        let statsList = await this.GetPublisherRtcStats();
        if (!statsList) {
            return;
        }
        
        statsList.forEach((report) => {
            //console.log("report type:", report.type, ", report:", JSON.stringify(report));
            if (report.type == 'outbound-rtp') {
                if (report.mediaType == 'video') {
                    this._sendVideoStats.SetWidth(report.frameWidth);
                    this._sendVideoStats.SetHeight(report.frameHeight);
                    this._sendVideoStats.SetFps(report.framesPerSecond);
                    this._sendVideoStats.SetBytesSent(report.bytesSent);
                } else if (report.mediaType == 'audio') {
                    this._sendAudioStats.SetFps(report.framesPerSecond);
                    this._sendAudioStats.SetBytesSent(report.bytesSent);
                    this._sendAudioStats.SetFrameSent(report.packetsSent);
                }
            } else if (report.type == 'candidate-pair') {
                if (report.nominated) {
                    this._sendVideoStats.SetRtt(report.currentRoundTripTime * 1000);
                }
            }
        });

        this.safeEmit('stats', {
            'video': {
                'width': this._sendVideoStats.GetWidth(),
                'height': this._sendVideoStats.GetHeight(),
                'fps': this._sendVideoStats.GetFps(),
                'bps': this._sendVideoStats.GetSentBitsPerSec()
            },
            'audio': {
                'fps': this._sendAudioStats.GetFps(),
                'bps': this._sendAudioStats.GetSentBitsPerSec()
            },
            'rtt': this._sendVideoStats.GetRtt()
        });
    }

    async GetPublisherRtcStats() {
        if (this._sendPCMap.size == 0) {
            return null;
        }

        for (const sendPc of this._sendPCMap.values()) {
            if (sendPc == null) {
                console.log('peer connection is null, the pc map length:', this._sendPCMap.size);
                continue;
            }
    
            let stats = await sendPc.GetStats();
    
            return stats;
        }

        return null;
    }

    async OnSubscribeStats() {
        if (this._remoteUsers.size == 0) {
            return;
        }

        for (const user of this._remoteUsers.values()) {
            if (user == null) {
                continue;
            }
            let pcId = user.GetPcid();

            let recvPc = this._recvPCMap.get(pcId);
            if (recvPc == null) {
                continue;
            }
            let stats = await recvPc.GetStats();
            if (stats == null) {
                continue;
            }

            stats.forEach((report) => {
                if (report.type == 'inbound-rtp') {
                    if (report.mediaType == 'video') {
                        user.RecvVideoStats().SetWidth(report.frameWidth);
                        user.RecvVideoStats().SetHeight(report.frameHeight);
                        user.RecvVideoStats().SetFps(report.framesPerSecond);
                        user.RecvVideoStats().SetBytesSent(report.bytesReceived);
                    } else if (report.mediaType == 'audio') {
                        user.RecvAudioStats().SetFps(report.framesPerSecond);
                        user.RecvAudioStats().SetBytesSent(report.bytesReceived);
                        user.RecvAudioStats().SetFrameSent(report.packetsReceived);
                    }
                } else if (report.type == 'candidate-pair') {
                    if (report.nominated) {
                        user.RecvVideoStats().SetRtt(report.currentRoundTripTime * 1000);
                    }
                }
            });

            this.safeEmit('remoteStats', {
                'uid': user.GetUserId(),
                'video': {
                    'width':  user.RecvVideoStats().GetWidth(),
                    'height': user.RecvVideoStats().GetHeight(),
                    'fps':    parseInt(user.RecvVideoStats().GetFps()),
                    'bps':    parseInt(user.RecvVideoStats().GetSentBitsPerSec())
                },
                'audio': {
                    'fps': parseInt(user.RecvAudioStats().GetFps()),
                    'bps': parseInt(user.RecvAudioStats().GetSentBitsPerSec())
                },
                'rtt': user.RecvVideoStats().GetRtt()
            });
        }
        return;
    }

    _wsRegistEvent(resolve, reject)
    {
        this.ws.on('open', () =>
        {
            this._connected = true;
            this._closed = false;
            resolve(0);
        });
        
        this.ws.on('close', () => 
        {
            if (this._connected) {
                this.safeEmit('disconected', '');
            }
            this._connected = false;
            this._closed = true;
            
            reject(new Error('protoo close'));
        });

        this.ws.on('error', (err) =>
        {
            this._connected = false;
            this._closed = true;
            reject(err);
        });

        this.ws.on('notification', (info) =>
        {
            try {
                console.log("notification method:", info.method);
                console.log("notification info:", info);
                if (info.method == 'userin')
                {
                    var remoteUid = info.data['uid'];
                    var userType  = info.data['user_type'];
                    var remoteUser = new UserInfo({roomId: this._roomId, uid:remoteUid, userType: userType});
                    this._remoteUsers.set(remoteUid, remoteUser);
                }
                this.safeEmit(info.method, info.data);
            } catch (error) {
                console.log("notify error:", error);
            }
            
        });
    }

    async Subscribe(remoteUid, userType, remotePcId, publishers)
    {
        if (!this._connected)
        {
            throw new Error('websocket is not ready');
        }

        var hasUid = this._remoteUsers.has(remoteUid);
        if (!hasUid)
        {
            throw new Error('remote uid has not exist:' + remoteUid);
        }
        var remoteUser = this._remoteUsers.get(remoteUid);

        console.log("start subscribe remote user:", remoteUser, "publishers:",
            publishers, "userType:", userType);

        var recvPC = new PCManager();
        recvPC.CreatePeerConnection('recv');
        recvPC.SetRemoteUid(remoteUid);

        for (const info of publishers) {
            recvPC.AddSubscriberMedia(info);
        }

        var offerSdp = await recvPC.GetSubscribeOfferSdp();
        console.log("update publishers:", publishers);

        var respData = null;
        var data = {
            'roomId': this._roomId,
            'uid': this._uid,
            'user_type': userType,
            'remoteUid': remoteUid,
            'remotePcId': remotePcId,
            'publishers': publishers,
            'sdp' : offerSdp
        }

        try {
            console.log("subscribe request: ", data);
            respData = await this.ws.request('subscribe', data);
        } catch (error) {
            console.log("send subscribe message exception:", error)
            throw error
        }
        console.log("subscribe response message:", respData);

        var respSdp = respData.sdp;
        var pcid    = respData.pcid;
        var respSdpJson = SdpTransformer.parse(respSdp);

        console.log("subscribe response json sdp:", JSON.stringify(respSdpJson));
        recvPC.SetRemoteSubscriberSdp(respSdp);

        var trackList = [];
        for (const mediaInfo of publishers)
        {
            console.log("subscribe is waiting track ready...");
            var newTrack = await new Promise(async (resolve, reject) =>
            {
                recvPC.on('newTrack', (track) => {
                    console.log("rtc receive new track:", track);
                    if (track != null) {
                        resolve(track);
                    } else {
                        reject(track);
                    }
                });
            });
            if (newTrack != null)
            {
                trackList.push(newTrack);
            }
        }
        console.log("receive new track list:", trackList);

        var mediaStream = remoteUser.CreateMediaStream();

        for (const track of trackList)
        {
            console.log("remote user:", remoteUser, "add new track:", track);
            mediaStream.addTrack(track);
        }

        console.log("set subscribe pcid:", pcid, "publishers:", publishers);
        recvPC.SetSubscribeInfo(pcid, publishers)
        recvPC.SetId(pcid);
        this._recvPCMap.set(pcid, recvPC);

        remoteUser.SetPcId(pcid);
        remoteUser.SetPublishers(publishers);
    
        return mediaStream;
    }

    GetRemoteUserPcId(remoteUid) {
        var remoteUser = this._remoteUsers.get(remoteUid);
        if (!remoteUser) {
            return '';
        }
        return remoteUser.GetPcId();
    }

    GetRemoteUserPublishers(remoteUid) {
        var publisers;
        var remoteUser = this._remoteUsers.get(remoteUid);
        if (!remoteUser) {
            return publisers;
        }

        return remoteUser.GetPublishers();
    }
    async UnSubscribe(remoteUid, publisers)
    {
        if (!this._connected)
        {
            throw new Error('websocket is not ready');
        }

        var hasUid = this._remoteUsers.has(remoteUid);
        if (!hasUid)
        {
            throw new Error('remote uid has not exist:' + remoteUid);
        }
        var remoteUser = this._remoteUsers.get(remoteUid);
        var pcid = '';

        console.log("start unsubscribe remote user:", remoteUser, "publishers:", publisers);

        for (var [keyPCid, recvPC] of this._recvPCMap)
        {
            pcid = recvPC.GetSubscribePcId(publisers);
            if (pcid != undefined && pcid.length > 0)
            {
                break;
            }
        }
        if (pcid == undefined || pcid.length == '')
        {
            console.log("fail to get peer connection id:", pcid);
            throw new Error("fail to get peer connection id");
        }
        
        for (const info of publisers) {
            recvPC.RemoveSubscriberMedia(info);
        }
        recvPC.SetRemoteUnSubscriberSdp();
        recvPC.ClosePC();
        remoteUser.CloseMediaStream();
        
        var data = {
            'uid': this._uid,
            'remoteUid': remoteUid,
            'pcid': pcid,
            'publishers': publisers
        }
        var respData;

        console.log("request unsubscribe data:", data);
        try {
            respData = await this.ws.request('unsubscribe', data);
        } catch (error) {
            console.log('unsubscribe error:', error);
            throw error;
        }
        console.log('unsubscribe return data:', respData);

    }
};

module.exports = Client;

},{"./EnhancedEventEmitter":7,"./MediaStatsInfo":8,"./PCManager":9,"./StreamManager":10,"./UserInfo":11,"./WebSocketClient":12,"sdp-transform":3}],7:[function(require,module,exports){
const { EventEmitter } = require('events');

class EnhancedEventEmitter extends EventEmitter
{
	constructor(logger)
	{
		super();
		this.setMaxListeners(Infinity);
	}

	safeEmit(event, ...args)
	{
		try
		{
			this.emit(event, ...args);
		}
		catch (error)
		{
		}
	}

	async safeEmitAsPromise(event, ...args)
	{
		return new Promise((resolve, reject) =>
		{
			this.safeEmit(event, ...args, resolve, reject);
		});
	}
}

module.exports = EnhancedEventEmitter;

},{"events":1}],8:[function(require,module,exports){

class MediaStatsInfo
{
    constructor()
    {
        this._width = 0;
        this._height = 0;

        this._fps = 0;
        this._frameSent = 0;
        this._lastFrameSent = 0;
        this._lastFpsMs = 0;

        this._bytesSent = 0;
        this._lastBytesSent = 0;
        this._lastBitsPerSecMs = 0;
        this._bitsPerSec = 0;

        this._rtt = 0;
    }

    SetWidth(width) {
        this._width = width;
    }

    GetWidth() {
        return this._width;
    }

    SetHeight(height) {
        this._height = height;
    }

    GetHeight() {
        return this._height;
    }

    SetFps(fps) {
        this._fps = fps;
    }

    GetFps() {
        let nowMs = Date.now();

        if (this._frameSent == 0) {
            this._lastFpsMs     = nowMs;
            this._lastFrameSent = this._frameSent;
            return this._fps;
        }

        let durationMs = nowMs - this._lastFpsMs;
        let frameCnt = this._frameSent - this._lastFrameSent;

        if (durationMs == 0) {
            return this._fps;
        }

        this._fps = frameCnt * 1000 / durationMs;

        this._lastFpsMs     = nowMs;
        this._lastFrameSent = this._frameSent;

        return this._fps;
    }

    SetFrameSent(frameSent) {
        this._frameSent = frameSent;
    }

    SetBytesSent(bytesSent) {
        this._bytesSent = bytesSent;
    }

    GetBytesSent() {
        return this._bytesSent;
    }

    GetSentBitsPerSec() {
        let nowMs = Date.now();

        if (this._lastBitsPerSecMs == 0) {
            this._lastBitsPerSecMs = nowMs;
            this._lastBytesSent    = this._bytesSent;
            return 0;
        }

        let durationMs = nowMs - this._lastBitsPerSecMs;
        let bytes = this._bytesSent - this._lastBytesSent;

        if (durationMs == 0) {
            return this._bitsPerSec;
        }

        this._bitsPerSec = bytes * 8.0 / durationMs;

        this._lastBitsPerSecMs = nowMs;
        this._lastBytesSent    = this._bytesSent;

        return this._bitsPerSec;
    }

    SetRtt(rtt) {
        this._rtt = rtt;
    }

    GetRtt() {
        return this._rtt;
    }
};

module.exports = MediaStatsInfo;
},{}],9:[function(require,module,exports){
const SdpTransformer = require('sdp-transform');
const EnhancedEventEmitter = require('./EnhancedEventEmitter');

const PUBLISH_SDP_OFFER_OPTIONS = {
    offerToReceiveAudio: 0,
    offerToReceiveVideo: 0,
    voiceActivityDetection: true
};

class PCManager extends EnhancedEventEmitter
{
    constructor()
    {
        super();
        this._pc = null;

        this._vMid = 0;
        this._aMid = 0;

        this._senderRemoteSdp   = null;
        this._receiverRemoteSdp = null;
        this._direction         = 'send';//or 'recv'
        this._type              = 'screen';//or 'screen'
        this._id                = '';
        this._remoteUid         = '';
        this._remotePublishers  = new Map();//key:pcid, value info:{"pid": "xxxx", "type": "video", "mid": 0, "ssrc": 12345678}
        this._recvTransceivers   = new Map();//key:publisherId, value: RTPTransceiver
    }

    async GetStats() {
        if (this._pc == null) {
            return null;
        }
        return await this._pc.getStats();
    }

    ClosePC()
    {
        this._pc.close();
        this._pc = null;
    }

    SetId(id)
    {
        this._id = id;
    }

    GetId()
    {
        return this._id;
    }

    SetType(type)
    {
        this._type = type;
    }

    GetType()
    {
        return this._type;
    }

    SetRemoteUid(uid)
    {
        this._remoteUid = uid;
    }

    GetRemoteUid()
    {
        return this._remoteUid;
    }

    CreatePeerConnection(direction) {
        var config = {
            'bundlePolicy': 'max-bundle',
            'rtcpMuxPolicy': 'require'
        };
        config.sdpSemantics = "unified-plan";

        this._direction = direction;
        this._pc = new RTCPeerConnection(config);
        this._pc.oniceconnectionstatechange = (event) => {
            console.log("peer connection ice state change:", event, ", iceConnectionState:", this._pc.iceConnectionState);
        };
        this._pc.onconnectionstatechange = (event) => {
            console.log("peer connection state change:", event, ", state:", this._pc.connectionState);
        };
        this._pc.onsignalingstatechange = (event) => {
            console.log("peer connection signal state change:", event, ", signalingState:", this._pc.signalingState);
        };
        this._pc.onicecandidate = (event) => {
            console.log("peer connection ice candidate:", event);
        };
        this._pc.ontrack = (event) => {
            console.log("peer connection on track event:", event, 'direction:', this._direction);
            if (this._direction == 'recv')
            {
                if (event.track.kind == 'video') {
                    console.log("add remote video track:", event.track);
                    this.emit('newTrack', event.track);
                } else if (event.track.kind == 'audio') {
                    console.log("add remote audio track:", event.track);
                    this.emit('newTrack', event.track);
                } else {
                    throw new Error("unkown track kind" + event.track.kind);
                }
            }
        };
        console.log("create peer connection is done");
    }

    async AddSendMediaTrack(mediatracks) {
        if (!this._pc)
        {
            throw new Error('sender peerconnection is not ready');
        }
        var offer;
        try
        {
            for (const track of mediatracks)
            {
                if (track.kind == 'audio') {
                    console.log("pc addTransceiver audio, id", track.id);
                    this._pc.addTransceiver(track, {direction: 'sendonly'});
                }
                if (track.kind == 'video') {
                    console.log("pc addTransceiver video, id", track.id);
                    this._pc.addTransceiver(track, {direction: 'sendonly'});
                }
            }

            var op = PUBLISH_SDP_OFFER_OPTIONS;
            console.log("start creating offer, option:", op);

            offer = await this._pc.createOffer(op);
            var senderLocalSdp = SdpTransformer.parse(offer.sdp);

            let payloadMap = new Map();

            senderLocalSdp.media.forEach(media => {
                if (media.type == 'video') {
                    media.fmtp?.forEach(fmtp => {
                        if (!payloadMap.has(fmtp.payload)) {
                            let pos = fmtp.config.indexOf('apt=');
                            if (pos == 0) {
                                return;
                            }
                            payloadMap.set(fmtp.payload, true);
                            media.fmtp.push({payload: fmtp.payload, config: 'x-google-start-bitrate=1500'});
                            media.fmtp.push({payload: fmtp.payload, config: 'x-google-min-bitrate=1000'});
                            media.fmtp.push({payload: fmtp.payload, config: 'x-google-max-bitrate=3000'});
                        }
                    })
                }
            });

            console.log("local sdp object:", senderLocalSdp);
            var newSdp = SdpTransformer.write(senderLocalSdp);
            offer.sdp = newSdp;

            await this._pc.setLocalDescription(offer);

            var retInfo = {
                offSdp: offer.sdp,
                mids: [
                ]
            };

            for (const media of senderLocalSdp.media)
            {
                var mediainfo = {
                    mid: media.mid,
                    type: media.type
                };
                retInfo.mids.push(mediainfo);
            }

            return retInfo;
        } catch(error) {
            throw `add send media track error:${error}`;
        }
    }

    async SetSendAnswerSdp(remoteSdp)
    {
        try {
            this._senderRemoteSdp = SdpTransformer.parse(remoteSdp);
            console.log('set sender remote sdp:',this._senderRemoteSdp);

            const answer = { type: 'answer', sdp: remoteSdp };
            await this._pc.setRemoteDescription(answer);
        } catch (error) {
            console.log("setSenderRemoteSDP error:", error);
        }
    }

    _RemoteSenderSdpbyMid(mid)
    {
        var index = 0;
        var found = false;
        //this._senderRemoteSdp.media.slice(i, 1);
        for (index = 0; index < this._senderRemoteSdp.media.length; index++)
        {
            if (this._senderRemoteSdp.media[index].mid == mid)
            {
                this._senderRemoteSdp.media[index].direction = 'inactive';

                this._senderRemoteSdp.media[index].port = 0;
        
                delete this._senderRemoteSdp.media[index].ext;
                delete this._senderRemoteSdp.media[index].ssrcs;
                delete this._senderRemoteSdp.media[index].ssrcGroups;
                delete this._senderRemoteSdp.media[index].simulcast;
                delete this._senderRemoteSdp.media[index].simulcast_03;
                delete this._senderRemoteSdp.media[index].rids;
                delete this._senderRemoteSdp.media[index].extmapAllowMixed;
                found = true;
                break;
            }
        }
        if (found)
        {
            console.log("remove send remote sdp index:", index, "remove sender sdp object:", this._senderRemoteSdp);
        }
    }

    async removeSendTrack(removeMids)
    {
        var transList = this._pc.getTransceivers();

        console.log("current send pc transceivers:", transList, "remove mids:", removeMids);
        for (const transceiver of transList)
        {
            var found = false;
            var mid = 0;
            for (const removeMid of removeMids)
            {
                if (removeMid == transceiver.mid)
                {
                    found = true;
                    mid = removeMid;
                    break;
                }
            }
            if (found)
            {
                transceiver.sender.replaceTrack(null);
                this._pc.removeTrack(transceiver.sender);
                this._RemoteSenderSdpbyMid(mid);
            }
        }

        const offer = await this._pc.createOffer();
        console.log("remove sender offer:", offer);

        await this._pc.setLocalDescription(offer);

        var answerSdp = SdpTransformer.write(this._senderRemoteSdp)
        const answer = { type: 'answer', sdp: answerSdp };
        console.log("remove sender answer:", answer);
        await this._pc.setRemoteDescription(answer);
    }

    AddSubscriberMedia(info)
    {
        if (info.type == 'video') {
            var videoTransceiver = this._pc.addTransceiver("video", {direction: "recvonly"});
            this._recvTransceivers.set(info.pid, videoTransceiver);
        } else if (info.type == 'audio') {
            var audioTransceiver = this._pc.addTransceiver("audio", {direction: "recvonly"});
            this._recvTransceivers.set(info.pid, audioTransceiver);
        } else {
            throw new Error('unkown media type:' + mediaType);
        }
    }

    RemoveSubscriberMedia(info)
    {
        //var mediaTransceiver = this._recvTransceivers.get(info.pid);
        //if (mediaTransceiver != undefined && mediaTransceiver != null)
        //{
        //    this._pc.removeTrack(mediaTransceiver.sender)
        //}

        for (const item of this._receiverRemoteSdp.media)
        {
            if (item.mid == info.mid)
            {
                item.direction = 'inactive';

                item.port = 0;
        
                delete  item.ext;
                delete  item.ssrcs;
                delete  item.ssrcGroups;
                delete  item.simulcast;
                delete  item.simulcast_03;
                delete  item.rids;
                delete  item.extmapAllowMixed;
                console.log("remove subscribe item:", item);
            }
        }
        console.log("remove info.mid:", info.mid, "left sdp object:", this._receiverRemoteSdp.media);
    }

    SetSubscribeInfo(pcid, infos)
    {
        this._remotePublishers.set(pcid, infos);
    }

    GetSubscribePcId(infos)
    {
        for (const info of infos)
        {
            var pid = info.pid;
            for (var [pcid, publisherInfos] of this._remotePublishers)
            {
                for (const publisher of publisherInfos) {
                    console.log("info:", info, "pcid:", pcid, "publisher info:", publisher);
                    if (publisher.pid == pid)
                    {
                        return pcid;
                    }
                }

            }
        }
        return '';
    }

    async GetSubscribeOfferSdp()
    {
        var offer = await this._pc.createOffer();
        var offerSdpObj = SdpTransformer.parse(offer.sdp);
        
        console.log("subscriber offer sdp:", offerSdpObj);
        let payloadMap = new Map();
		offerSdpObj.media.forEach(media => {
			media.rtcpFb?.forEach(rtcpfb => {
                if (!payloadMap.has(rtcpfb.payload)) {
                    payloadMap.set(rtcpfb.payload, "rrtr");
                    media.rtcpFb.push({payload:rtcpfb.payload, type:'rrtr'});
                }
            })
		});
        
        var newSdp = SdpTransformer.write(offerSdpObj);
        console.log("new sdp:", newSdp);
        offer.sdp = newSdp;
        await this._pc.setLocalDescription(offer);

        //return sdp for requesting subscribe request
        return offer.sdp;
    }

    SetRemoteSubscriberSdp(remoteSdp) {
        this._receiverRemoteSdp = SdpTransformer.parse(remoteSdp);
        const answer = { type: 'answer', sdp: remoteSdp };
        this._pc.setRemoteDescription(answer)
    }

    async SetRemoteUnSubscriberSdp() {
        var remoteSdp = SdpTransformer.write(this._receiverRemoteSdp);
        const answer = { type: 'answer', sdp: remoteSdp };

        console.log("set remote unsubscribe answer:", answer);
        
        await this._pc.setRemoteDescription(answer)
        if (this._recvTransceivers.length == 0)
        {
            this._pc.close();
        }
    }
};

module.exports = PCManager;

},{"./EnhancedEventEmitter":7,"sdp-transform":3}],10:[function(require,module,exports){
const SdpTransformer = require('sdp-transform');
const EnhancedEventEmitter = require('./EnhancedEventEmitter');

class StreamManager extends EnhancedEventEmitter
{
    /*
    mediaType: 'camera', 'shared screen'
    */
    constructor() {
        super();

        this._mediastream = null;
        this._videoTrack  = null;
        this._audioTrack  = null;
        this._width      = 1920;
        this._height     = 1080;
        this._vBitrate   = 1000*1000;
        this._channel    = 2;
        this._sampleRate = 48000;
    }

    GetAudioTrack()
    {
        return this._audioTrack;
    }

    GetVideoTrack()
    {
        return this._videoTrack;
    }

    SetVideoParam({width, height, bitrate})
    {
        this._width    = width;
        this._height   = height;
        this._vBitrate = bitrate;
    }

    SetAudioParam({channel, sampleRate})
    {
        this._channel    = channel;
        this._sampleRate = sampleRate;
    }

    async Open(mediaType)
    {
        if (this._mediastream) {
            throw new Error("the mediastream has been opened.");
        }
        this._mediaType = mediaType;

        var constraints = {
            video: { width: this._width , height: this._height, frameRate: 15, bitrate: this._vBitrate },
            audio: {
                channelCount: this._channel,
                sampleRate: this._sampleRate,
            },
        }
        var ms = null;
        
        try {
            if (mediaType == 'camera')
            {
                console.log("open camera constraints:", constraints);
                ms = await navigator.mediaDevices.getUserMedia(constraints);
            }
            else if (mediaType == 'screen')
            {
                console.log("open screen constraints:", constraints);
                ms = await navigator.mediaDevices.getDisplayMedia(constraints);
            }
            else
            {
                throw new Error("open media type is error:" + this._mediaType);
            }
        } catch (error) {
            console.log("open device error:", error);
            throw error;
        }
        
        var videoTracksNum = ms.getVideoTracks().length;
        var audioTracksNum = ms.getAudioTracks().length;

        console.log("video tracks number:", videoTracksNum, "audio tracks number:", audioTracksNum);

        this._mediastream = new MediaStream();
        this._videoTrack = ms.getVideoTracks()[videoTracksNum - 1];
        this._audioTrack = ms.getAudioTracks()[audioTracksNum - 1];
        this._mediastream.addTrack(this._videoTrack);
        //this._mediastream.addTrack(this._audioTrack);

        console.log("the media stream is open, type:", this._mediaType,
            "videoTrack:", this._videoTrack,
            "audioTrack:", this._audioTrack);
        return this._mediastream
    }

    async Close()
    {
        if (this._mediastream == null) {
            throw new Error("the mediastream has been closed.");
        }
        this._mediastream.Close();

        this._mediastream = null;
        this._videoTrack  = null;
        this._audioTrack  = null;
    }
};

module.exports = StreamManager;

},{"./EnhancedEventEmitter":7,"sdp-transform":3}],11:[function(require,module,exports){
const EnhancedEventEmitter = require('./EnhancedEventEmitter');
const MediaStatsInfo = require('./MediaStatsInfo');

class UserInfo extends EnhancedEventEmitter
{
    constructor({roomId, uid, userType})
    {
        super();

        this._roomId = roomId;
        this._uid    = uid;
        this._userType = userType;
        this._mediaStream = null;

        this._pcId = ''
        this._publishers;

        this._recvVideoStats = new MediaStatsInfo();
        this._recvAudioStats = new MediaStatsInfo();
    }

    RecvVideoStats() {
        return this._recvVideoStats;
    }

    RecvAudioStats() {
        return this._recvAudioStats;
    }

    SetPcId(pcid) {
        this._pcId = pcid;
    }

    GetPcid() {
        return this._pcId;
    }

    SetPublishers(publishers) {
        this._publishers = publishers;
    }

    GetPublishers() {
        return this._publishers;
    }
    
    CreateMediaStream()
    {
        if (this._mediaStream == null)
        {
            this._mediaStream = new MediaStream();
        }
        return this._mediaStream;
    }

    CloseMediaStream()
    {
        this._mediaStream = null;
    }

    GetMediaStream()
    {
        return this._mediaStream;
    }

    GetRoomId()
    {
        return this._roomId;
    }

    GetUserId()
    {
        return this._uid;
    }
};


module.exports = UserInfo;
},{"./EnhancedEventEmitter":7,"./MediaStatsInfo":8}],12:[function(require,module,exports){
const EnhancedEventEmitter = require('./EnhancedEventEmitter');

class WebSocketClient extends EnhancedEventEmitter
{
    constructor() {
        super();
        this.connectFlag = false;
        this.wsConn = null;
        this.id = 0;
        this._sents = new Map();
    }

    async Connect(url) {
        console.log("websocket url:", url);
        try {
            this.wsConn = new WebSocket(url);

            this.wsConn.onopen = () => {
                console.log("ws client is opened....");
                this.safeEmit('open');
            };
            this.wsConn.onmessage = (evt) => {
                if (!evt.data) {
                    return;
                }
                this._handleMessage(evt.data);
            };
            
            this.wsConn.onclose = () => {
                console.log("ws client closed...");
                this.safeEmit('close');
            };
        } catch (error) {
            console.log("websocket exception:", error);
            this.safeEmit('error');
        }
    }

    _handleMessage(msg) {
        console.log("handel message:", msg);
        var data = JSON.parse(msg);
        var request = data['request'];
        if ((request != null) && (request == true)) {
            this._handleRequest(data);
            return;
        }

        var response = data['response'];
        if ((response != null) && (response == true)) {
            this._handleResponse(data);
            return;
        }

        var notification = data['notification'];
        if ((notification != null) && (notification == true)) {
            this._handleNotification(data);
            return;
        }
    }

    handleRequest(data) {
		try
		{
			this.emit('request',
				// Request.
				data,
				// accept() function.
				(dataAck) =>
				{
                    var response = {
                        'response': true,
                        'id': data['id'],
                        'ok': true,
                        data: dataAck
                    };
                    this.wsConn.send(JSON.stringify(response));
				},
				// reject() function.
				(errorCode, errorReason) =>
				{
					if (errorCode instanceof Error)
					{
						errorReason = errorCode.message;
						errorCode = 500;
					}
					else if (typeof errorCode === 'number' && errorReason instanceof Error)
					{
						errorReason = errorReason.message;
					}
                    var response = {
                        'response': true,
                        'id': data['id'],
                        'ok': false,
                        'errorCode': errorCode,
                        'errorReason': errorReason
                    };
                    this.wsConn.send(JSON.stringify(response));
				});
		}
		catch (error)
		{
            var response = {
                'response': true,
                'id': data['id'],
                'ok': false,
                'errorCode': 500,
                'errorReason': String(error)
            };
            this.wsConn.send(JSON.stringify(response));
		}
    }

    _handleResponse(data) {
        var id = data['id'];
        const sent = this._sents.get(id);

        if (!sent) {
            return;
        }
        var ok = data['ok'];
        var info = data['data'];
        if (ok && (info != null)) {
            sent.resolve(info);
        } else {
            var errorCode   = data['errorCode'];
            var errorReason = data['errorReason'];

            console.log("response error code:", errorCode, ", reason:", errorReason);
            const err = new Error(errorReason);
            err.code = errorCode;
            sent.reject(err);
        }
    }

    _handleNotification(data) {
        this.safeEmit('notification', data);
    }

    async request(method, data) {
        var id = this.id++;
        var body = {
            'request' : true,
            'id': id,
            'method': method,
            'data' : data
        }

        this.wsConn.send(JSON.stringify(body));
        const timeout = 1500 * (15 + (0.1 * this._sents.size));

        return new Promise((pResolve, pReject) => {
            const sent = {
                id: id,
                method: method,
                resolve: (data2) => {
                    if (!this._sents.delete(id)) {
                        return;
                    }
					clearTimeout(sent.timer);
					pResolve(data2);
                },
                reject : (error) => {
					if (!this._sents.delete(id))
						return;

					clearTimeout(sent.timer);
					pReject(error);
                },
				timer : setTimeout(() =>
				{
					if (!this._sents.delete(id))
						return;

					pReject(new Error('request timeout'));
				}, timeout),
				close : () =>
				{
					clearTimeout(sent.timer);
					pReject(new Error('peer closed'));
				}
            };
            this._sents.set(id, sent);
        });
    }

    async notify(method, data) {
        var body = {
            'notification' : true,
            'method': method,
            'data' : data
        }

        this.wsConn.send(JSON.stringify(body));
    }
}

module.exports = WebSocketClient;
},{"./EnhancedEventEmitter":7}],13:[function(require,module,exports){
const Client = require('./Client');

console.log('------------------------------');

//获取get请求参数
function getUrlParam(name){
    //构造一个含有目标参数的正则表达式对象
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    //匹配目标参数
    var r = window.location.search.substr(1).match(reg);
    //返回参数值
    if(r != null) {
    return decodeURI(r[2]);
    }
    return null;
}


var AppController = function () {
    this.server = window.location.host.split(':')[0] + ':8000';
    this.roomId = getUrlParam("room_id");
    this.userId = Math.ceil(Math.random()*100000).toString();

    console.log("server:", this.server, "roomId:", this.roomId, "userId:", this.userId);
   
    this.change_button = document.getElementById("changeBtn");
    this.change_button.onclick = this.ChangeClicked.bind(this);

    this.flvPlayer = null;

    if (flvjs.isSupported()) {
      var videoElement = document.getElementById('videoElement');          
      this.flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url: sessionStorage.getItem('httpflv_link')
      });
      this.flvPlayer.attachMediaElement(videoElement);
      this.flvPlayer.load();
      this.flvPlayer.play();
    }

    this._client = new Client();
    
};


AppController.prototype.ChangeClicked = async function(){
    var video_type = document.getElementById("video_type").innerText;
    if(video_type === "HTTP-FLV"){
        document.getElementById("video_type").innerHTML = "WebRTC";
        this.flvPlayer.unload();
        this.flvPlayer.detachMediaElement();
        this.flvPlayer.destroy();
        this.webrtcSupport();        
    }else{
        document.getElementById("video_type").innerHTML = "HTTP-FLV";
        
        var webrtc_video = document.getElementById("webrtc_video");
        webrtc_video.pause();
        webrtc_video.removeAttribute('src');
        webrtc_video.srcObject = null;
        //webrtc_video.load();

        if (flvjs.isSupported()) {
          var videoElement = document.getElementById('videoElement');          
          this.flvPlayer = flvjs.createPlayer({
              type: 'flv',
              url: sessionStorage.getItem('httpflv_link')
          });
          this.flvPlayer.attachMediaElement(videoElement);
          this.flvPlayer.load();
          this.flvPlayer.play();
        }
    }
};


AppController.prototype.webrtcSupport = async function(){
    var usersInRoom = null;//{"users":[{"uid":"11111"}, {"uid":"22222"}]}
    try
    {
        console.log("call join api userid:", this.userId);
        usersInRoom = await this._client.Join({serverHost: this.server,
                                            roomId: this.roomId, userId: this.userId});
    }
    catch (error)
    {
        console.log("join error:", error);
        return;
    }

    this._client.on('disconected', async(data) => {
        console.log('websocket is disconnected');
    });
    this._client.on('userin', async(data) => {
        console.log('notify userin, data:' + JSON.stringify(data));
    });
    this._client.on('userout', async(data) => {
        var remoteUid = data.uid;
        console('notify userout, data:' + JSON.stringify(data));
        removeRemoteUserView(remoteUid);

        var publishers = this._client.GetRemoteUserPublishers(remoteUid);
        if (publishers != null) {
            console.log("start unsubscirbing remote uid:", remoteUid, ", publishers:", publishers);
            console.log('start unsubscribe remote uid:' +  remoteUid + ", publishers:" + JSON.stringify(publishers))
            this._client.UnSubscribe(remoteUid, publishers);
        }
    });

    this._client.on('publish', async (data) => {
        try {
            var remoteUid  = data['uid'];
            var remotePcId = data['pcid'];
            var userType   = data['user_type'];

            console.log(' receive publish message user type:', userType);
            console.log('notify publish, data:' + JSON.stringify(data));

            var newMediaStream = await this._client.Subscribe(remoteUid, userType, remotePcId, data['publishers']);
            
    
            var videoElement = document.getElementById("webrtc_video");
            //var videoElement = document.getElementById("videoElement");
            //videoElement.setAttribute("playsinline", "playsinline");
            videoElement.setAttribute("autoplay", "autoplay");
            videoElement.setAttribute("loop", "loop");
            videoElement.setAttribute("controls", "controls");
            videoElement.srcObject    = newMediaStream;
            //videoElement.style.width  = 320;
            //videoElement.style.height = 180;

            var statsContainer = document.getElementById("webrtc_status");

            var videoWidthElement = document.createElement("label");
            var videoHeightElement = document.createElement("label");
            var videoBpsElement = document.createElement("label");
            var videoFpsElement = document.createElement("label");
            var audioBpsElement = document.createElement("label");
            var audioFpsElement = document.createElement("label");
            var rttElement = document.createElement("label");

            videoWidthElement.id = 'videoWidth_' + remoteUid;
            videoHeightElement.id = 'videoHeight_' + remoteUid;
            videoHeightElement.style.paddingLeft = '10px';
            videoBpsElement.id = 'videoBps_' + remoteUid;
            videoFpsElement.id = 'videoFps_' + remoteUid;
            videoFpsElement.style.paddingLeft = '10px';
            audioBpsElement.id = 'audioBps_' + remoteUid;
            audioFpsElement.id = 'audioFps_' + remoteUid;
            audioFpsElement.style.paddingLeft = '10px';
            rttElement.id = 'rtt_' + remoteUid;
            rttElement.style.paddingLeft = '10px';

            var statsVideo1Container = document.createElement("div");
            statsVideo1Container.id = 'statsVideo1Container_' + remoteUid;
            statsVideo1Container.className = 'StatsItemContainer';
            statsContainer.appendChild(statsVideo1Container);
            
            statsVideo1Container.appendChild(videoWidthElement);
            statsVideo1Container.appendChild(videoHeightElement);

            var statsVideo2Container = document.createElement("div");
            statsVideo2Container.id = 'statsVideo2Container_' + remoteUid;
            statsVideo2Container.className = 'StatsItemContainer';
            statsContainer.appendChild(statsVideo2Container);

            statsVideo2Container.appendChild(videoBpsElement);
            statsVideo2Container.appendChild(videoFpsElement);

            var statsAudioContainer = document.createElement("div");
            statsAudioContainer.id = 'statsAudioContainer_' + remoteUid;
            statsAudioContainer.className = 'StatsItemContainer';
            statsContainer.appendChild(statsAudioContainer);

            statsAudioContainer.appendChild(audioBpsElement);
            statsAudioContainer.appendChild(audioFpsElement);
            statsAudioContainer.appendChild(rttElement);
    
            console.log("start play remote uid:", remoteUid);
            await videoElement.play();
        } catch (error) {
            console.log("subscribe error:", error);
            return;
        }
    });

    this._client.on('unpublish', async(data) => {
        var remoteUid = data.uid;
        var publishersInfo = data.publishers;

        console.log('notify unpublish, data:' + JSON.stringify(data));
        try {
            this._client.UnSubscribe(remoteUid, publishersInfo);
        } catch (error) {
            console.log("UnSubscribe error:", error);
            throw error;
        }
        removeRemoteUserView(remoteUid);
    });

    this._client.on('stats', (data) => {
        document.getElementById("videoWidth").value = data.video.width.toString();
        document.getElementById("videoHeight").value = data.video.height.toString();
        document.getElementById("videoFps").value = parseInt(data.video.fps).toString();
        document.getElementById("videoBps").value = parseInt(data.video.bps).toString();

        document.getElementById("audioFps").value = parseInt(data.audio.fps).toString();
        document.getElementById("audioBps").value = parseInt(data.audio.bps).toString();

        document.getElementById("Rtt").value = data.rtt.toString();
        var videoElement = document.getElementById("webrtc_video");
    });

    this._client.on('remoteStats', (data) => {
        let remoteUid = data.uid;
        let videoWidthId = 'videoWidth_' + remoteUid;
        let videoHeightId = 'videoHeight_' + remoteUid;
        let videoBpsId = 'videoBps_' + remoteUid;
        let videoFpsId = 'videoFps_' + remoteUid;
        let audioBpsId = 'audioBps_' + remoteUid;
        let audioFpsId = 'audioFps_' + remoteUid;
        let rttElementId = 'rtt_' + remoteUid;

        document.getElementById(videoWidthId).innerText = 'video width: ' + data.video.width.toString();
        document.getElementById(videoHeightId).innerText = 'video height: ' + data.video.height.toString();
        document.getElementById(videoBpsId).innerText = 'video bps(kbps): ' + data.video.bps.toString();
        document.getElementById(videoFpsId).innerText = 'video fps: ' + data.video.fps.toString();
        document.getElementById(audioBpsId).innerText = 'audio bps(kbps): ' + data.audio.bps.toString();
        document.getElementById(audioFpsId).innerText = 'audio fps: ' + data.audio.fps.toString();
        document.getElementById(rttElementId).innerText = 'rtt(ms): ' + data.rtt.toString();
    })
}

function removeRemoteUserView(remoteUid) {
    var userContainerId = 'userContainer_' + remoteUid;
    var userContainer = document.getElementById(userContainerId);
    var userLabelId = 'userLabel_' + remoteUid;
    var userLabel = document.getElementById(userLabelId);
    var mediaContainerId = 'mediaContainer_' + remoteUid;
    var mediaContainer = document.getElementById(mediaContainerId);
    var videoElementId = 'videoElement_' + remoteUid;
    var videoElement = document.getElementById(videoElementId);
    var remoteContainerElement = document.getElementById('remoteContainer');

    if (mediaContainer) {
        mediaContainer.removeChild(videoElement);
    }
    
    if (userContainer && mediaContainer) {
        userContainer.removeChild(mediaContainer);
        userContainer.removeChild(userLabel);
    }

    if (remoteContainerElement && userContainer) {
        remoteContainerElement.removeChild(userContainer);
    }

    videoElement   = null;
    mediaContainer = null;
    userLabel      = null;
    userContainer  = null;
}


var appConntrol = new AppController();


},{"./Client":6}]},{},[13]);
