// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"node_modules/solid-js/dist/solid.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createContext = createContext;
exports.createDependentEffect = createDependentEffect;
exports.createEffect = createEffect;
exports.createMemo = createMemo;
exports.createRoot = createRoot;
exports.createSignal = createSignal;
exports.createState = createState;
exports.freeze = freeze;
exports.getContextOwner = getContextOwner;
exports.isListening = isListening;
exports.lazy = lazy;
exports.loadResource = loadResource;
exports.onCleanup = onCleanup;
exports.reconcile = reconcile;
exports.registerSuspense = registerSuspense;
exports.sample = sample;
exports.selectEach = selectEach;
exports.selectWhen = selectWhen;
exports.setContext = setContext;
exports.setDefaults = setDefaults;
exports.unwrap = unwrap;
exports.useContext = useContext;
exports.SuspenseContext = void 0;

// Modified version of S.js[https://github.com/adamhaile/S] by Adam Haile
// Public interface
function createSignal(value, comparator) {
  const d = new DataNode(value);
  let setter;

  if (comparator) {
    let age = -1;

    setter = v => {
      if (!comparator(value, v)) {
        const time = RootClock.time;

        if (time === age) {
          throw new Error(`Conflicting value update: ${v} is not the same as ${value}`);
        }

        age = time;
        value = v;
        d.next(v);
      }
    };
  } else setter = d.next.bind(d);

  return [d.current.bind(d), setter];
}

function createEffect(fn, seed) {
  makeComputationNode(fn, seed, false, false);
} // explicit dependencies and defered initial execution


function createDependentEffect(fn, deps, defer) {
  if (Array.isArray(deps)) deps = callAll(deps);
  defer = !!defer;
  return createEffect(on);

  function on(value) {
    var listener = Listener;
    deps();
    if (defer) defer = false;else {
      Listener = null;
      value = fn(value);
      Listener = listener;
    }
    return value;
  }
}

function createMemo(fn, value) {
  if (Owner === null) console.warn("computations created without a root or parent will never be disposed");
  var {
    node,
    value: _value
  } = makeComputationNode(fn, value, false, false);

  if (node === null) {
    return function computation() {
      return _value;
    };
  } else {
    return function computation() {
      return node.current();
    };
  }
}

function createRoot(fn, detachedOwner) {
  var owner = Owner,
      disposer = fn.length === 0 ? null : function _dispose() {
    if (root === null) ;else if (RunningClock !== null) {
      RootClock.disposes.add(root);
    } else {
      dispose(root);
    }
  },
      root = disposer === null ? UNOWNED : getCandidateNode(),
      result;
  let potentialOwner = detachedOwner || Owner;
  root !== potentialOwner && (root.owner = potentialOwner);
  Owner = root;

  try {
    result = disposer === null ? fn() : fn(disposer);
  } finally {
    Owner = owner;
  }

  if (disposer !== null && recycleOrClaimNode(root, null, undefined, true)) {
    root = null;
  }

  return result;
}

function freeze(fn) {
  var result = undefined;

  if (RunningClock !== null) {
    result = fn();
  } else {
    RunningClock = RootClock;
    RunningClock.changes.reset();

    try {
      result = fn();
      event();
    } finally {
      RunningClock = null;
    }
  }

  return result;
}

function sample(fn) {
  var result,
      listener = Listener;
  Listener = null;
  result = fn();
  Listener = listener;
  return result;
}

function onCleanup(fn) {
  if (Owner === null) console.warn("cleanups created without a root or parent will never be run");else if (Owner.cleanups === null) Owner.cleanups = [fn];else Owner.cleanups.push(fn);
}

function isListening() {
  return Listener !== null;
}

function createContext(initFn) {
  const id = Symbol('context');
  return {
    id,
    initFn
  };
}

function useContext(context) {
  if (Owner === null) return console.warn("Context keys cannot be looked up without a root or parent");
  return lookup(Owner, context.id);
}

function getContextOwner() {
  Owner && (Owner.noRecycle = true);
  return Owner;
}

function setContext(key, value) {
  if (Owner === null) return console.warn("Context keys cannot be set without a root or parent");
  const context = Owner.context || (Owner.context = {});
  Owner.noRecycle = true;
  context[key] = value;
} // Internal implementation
/// Graph classes and operations


class DataNode {
  constructor(value) {
    this.value = value;
    this.pending = NOTPENDING;
    this.log = null;
  }

  current() {
    if (Listener !== null) {
      logDataRead(this);
    }

    return this.value;
  }

  next(value) {
    if (RunningClock !== null) {
      if (this.pending !== NOTPENDING) {
        // value has already been set once, check for conflicts
        if (value !== this.pending) {
          throw new Error("conflicting changes: " + value + " !== " + this.pending);
        }
      } else {
        // add to list of changes
        this.pending = value;
        RootClock.changes.add(this);
      }
    } else {
      // not batching, respond to change now
      if (this.log !== null) {
        this.pending = value;
        RootClock.changes.add(this);
        event();
      } else {
        this.value = value;
      }
    }

    return value;
  }

}

class ComputationNode {
  constructor() {
    this.fn = null;
    this.age = -1;
    this.state = CURRENT;
    this.source1 = null;
    this.source1slot = 0;
    this.sources = null;
    this.sourceslots = null;
    this.log = null;
    this.owner = Owner;
    this.owned = null;
    this.cleanups = null;
  }

  current() {
    if (Listener !== null) {
      if (this.age === RootClock.time) {
        if (this.state === RUNNING) throw new Error("circular dependency");else updateNode(this); // checks for state === STALE internally, so don't need to check here
      }

      logComputationRead(this);
    }

    return this.value;
  }

}

function createClock() {
  return {
    time: 0,
    changes: new Queue(),
    // batched changes to data nodes
    updates: new Queue(),
    // computations to update
    disposes: new Queue() // disposals to run after current batch of updates finishes

  };
}

function createLog() {
  return {
    node1: null,
    node1slot: 0,
    nodes: null,
    nodeslots: null
  };
}

class Queue {
  constructor() {
    this.items = [];
    this.count = 0;
  }

  reset() {
    this.count = 0;
  }

  add(item) {
    this.items[this.count++] = item;
  }

  run(fn) {
    var items = this.items;

    for (var i = 0; i < this.count; i++) {
      fn(items[i]);
      items[i] = null;
    }

    this.count = 0;
  }

} // Constants


var NOTPENDING = {},
    CURRENT = 0,
    STALE = 1,
    RUNNING = 2,
    UNOWNED = new ComputationNode(); // "Globals" used to keep track of current system state

var RootClock = createClock(),
    RunningClock = null,
    // currently running clock
Listener = null,
    // currently listening computation
Owner = null,
    // owner for new computations
LastNode = null; // cached unused node, for re-use
// Functions

function callAll(ss) {
  return function all() {
    for (var i = 0; i < ss.length; i++) ss[i]();
  };
}

function lookup(owner, key) {
  return owner && owner.context && owner.context[key] || owner.owner && lookup(owner.owner, key);
}

var makeComputationNodeResult = {
  node: null,
  value: undefined
};

function makeComputationNode(fn, value, orphan, sample) {
  var node = getCandidateNode(),
      owner = Owner,
      listener = Listener,
      toplevel = RunningClock === null;
  Owner = node;
  Listener = sample ? null : node;

  if (toplevel) {
    value = execToplevelComputation(fn, value);
  } else {
    value = fn(value);
  }

  Owner = owner;
  Listener = listener;
  var recycled = recycleOrClaimNode(node, fn, value, orphan);
  if (toplevel) finishToplevelComputation(owner, listener);
  makeComputationNodeResult.node = recycled ? null : node;
  makeComputationNodeResult.value = value;
  return makeComputationNodeResult;
}

function execToplevelComputation(fn, value) {
  RunningClock = RootClock;
  RootClock.changes.reset();
  RootClock.updates.reset();

  try {
    return fn(value);
  } finally {
    Owner = Listener = RunningClock = null;
  }
}

function finishToplevelComputation(owner, listener) {
  if (RootClock.changes.count > 0 || RootClock.updates.count > 0) {
    RootClock.time++;

    try {
      run(RootClock);
    } finally {
      RunningClock = null;
      Owner = owner;
      Listener = listener;
    }
  }
}

function getCandidateNode() {
  var node = LastNode;
  if (node === null) node = new ComputationNode();else LastNode = null;
  return node;
}

function recycleOrClaimNode(node, fn, value, orphan) {
  var _owner = orphan || Owner === null || Owner === UNOWNED ? null : Owner,
      recycle = !node.noRecycle && node.source1 === null && (node.owned === null && node.cleanups === null || _owner !== null),
      i;

  if (recycle) {
    LastNode = node;
    node.owner = null;

    if (_owner !== null) {
      if (node.owned !== null) {
        if (_owner.owned === null) _owner.owned = node.owned;else for (i = 0; i < node.owned.length; i++) {
          _owner.owned.push(node.owned[i]);
        }
        node.owned = null;
      }

      if (node.cleanups !== null) {
        if (_owner.cleanups === null) _owner.cleanups = node.cleanups;else for (i = 0; i < node.cleanups.length; i++) {
          _owner.cleanups.push(node.cleanups[i]);
        }
        node.cleanups = null;
      }
    }
  } else {
    node.fn = fn;
    node.value = value;
    node.age = RootClock.time;

    if (_owner !== null) {
      if (_owner.owned === null) _owner.owned = [node];else _owner.owned.push(node);
    }
  }

  return recycle;
}

function logRead(from) {
  var to = Listener,
      fromslot,
      toslot = to.source1 === null ? -1 : to.sources === null ? 0 : to.sources.length;

  if (from.node1 === null) {
    from.node1 = to;
    from.node1slot = toslot;
    fromslot = -1;
  } else if (from.nodes === null) {
    from.nodes = [to];
    from.nodeslots = [toslot];
    fromslot = 0;
  } else {
    fromslot = from.nodes.length;
    from.nodes.push(to);
    from.nodeslots.push(toslot);
  }

  if (to.source1 === null) {
    to.source1 = from;
    to.source1slot = fromslot;
  } else if (to.sources === null) {
    to.sources = [from];
    to.sourceslots = [fromslot];
  } else {
    to.sources.push(from);
    to.sourceslots.push(fromslot);
  }
}

function logDataRead(data) {
  if (data.log === null) data.log = createLog();
  logRead(data.log);
}

function logComputationRead(node) {
  if (node.log === null) node.log = createLog();
  logRead(node.log);
}

function event() {
  // b/c we might be under a top level S.root(), have to preserve current root
  var owner = Owner;
  RootClock.updates.reset();
  RootClock.time++;

  try {
    run(RootClock);
  } finally {
    RunningClock = Listener = null;
    Owner = owner;
  }
}

function run(clock) {
  var running = RunningClock,
      count = 0;
  RunningClock = clock;
  clock.disposes.reset(); // for each batch ...

  while (clock.changes.count !== 0 || clock.updates.count !== 0 || clock.disposes.count !== 0) {
    if (count > 0) // don't tick on first run, or else we expire already scheduled updates
      clock.time++;
    clock.changes.run(applyDataChange);
    clock.updates.run(updateNode);
    clock.disposes.run(dispose); // if there are still changes after excessive batches, assume runaway

    if (count++ > 1e5) {
      throw new Error("Runaway clock detected");
    }
  }

  RunningClock = running;
}

function applyDataChange(data) {
  data.value = data.pending;
  data.pending = NOTPENDING;
  if (data.log) markComputationsStale(data.log);
}

function markComputationsStale(log) {
  var node1 = log.node1,
      nodes = log.nodes; // mark all downstream nodes stale which haven't been already

  if (node1 !== null) markNodeStale(node1);

  if (nodes !== null) {
    for (var i = 0, len = nodes.length; i < len; i++) {
      markNodeStale(nodes[i]);
    }
  }
}

function markNodeStale(node) {
  var time = RootClock.time;

  if (node.age < time) {
    node.age = time;
    node.state = STALE;
    RootClock.updates.add(node);
    if (node.owned !== null) markOwnedNodesForDisposal(node.owned);
    if (node.log !== null) markComputationsStale(node.log);
  }
}

function markOwnedNodesForDisposal(owned) {
  for (var i = 0; i < owned.length; i++) {
    var child = owned[i];
    child.age = RootClock.time;
    child.state = CURRENT;
    if (child.owned !== null) markOwnedNodesForDisposal(child.owned);
  }
}

function updateNode(node) {
  if (node.state === STALE) {
    var owner = Owner,
        listener = Listener;
    Owner = Listener = node;
    node.state = RUNNING;
    cleanupNode(node, false);
    node.value = node.fn(node.value);
    node.state = CURRENT;
    Owner = owner;
    Listener = listener;
  }
}

function cleanupNode(node, final) {
  var source1 = node.source1,
      sources = node.sources,
      sourceslots = node.sourceslots,
      cleanups = node.cleanups,
      owned = node.owned,
      i,
      len;

  if (cleanups !== null) {
    for (i = 0; i < cleanups.length; i++) {
      cleanups[i](final);
    }

    node.cleanups = null;
  }

  if (owned !== null) {
    for (i = 0; i < owned.length; i++) {
      dispose(owned[i]);
    }

    node.owned = null;
  }

  if (source1 !== null) {
    cleanupSource(source1, node.source1slot);
    node.source1 = null;
  }

  if (sources !== null) {
    for (i = 0, len = sources.length; i < len; i++) {
      cleanupSource(sources.pop(), sourceslots.pop());
    }
  }
}

function cleanupSource(source, slot) {
  var nodes = source.nodes,
      nodeslots = source.nodeslots,
      last,
      lastslot;

  if (slot === -1) {
    source.node1 = null;
  } else {
    last = nodes.pop();
    lastslot = nodeslots.pop();

    if (slot !== nodes.length) {
      nodes[slot] = last;
      nodeslots[slot] = lastslot;

      if (lastslot === -1) {
        last.source1slot = slot;
      } else {
        last.sourceslots[lastslot] = slot;
      }
    }
  }
}

function dispose(node) {
  node.fn = null;
  node.log = null;
  node.owner = null;
  cleanupNode(node, true);
}

const SNODE = Symbol('solid-node'),
      SPROXY = Symbol('solid-proxy');

function wrap(value) {
  return value[SPROXY] || (value[SPROXY] = new Proxy(value, proxyTraps));
}

function isWrappable(obj) {
  return obj !== null && typeof obj === 'object' && (obj.__proto__ === Object.prototype || Array.isArray(obj));
}

function unwrap(item) {
  let result, unwrapped, v;
  if (result = item != null && item._state) return result;
  if (!isWrappable(item)) return item;

  if (Array.isArray(item)) {
    if (Object.isFrozen(item)) item = item.slice(0);

    for (let i = 0, l = item.length; i < l; i++) {
      v = item[i];
      if ((unwrapped = unwrap(v)) !== v) item[i] = unwrapped;
    }
  } else {
    if (Object.isFrozen(item)) item = Object.assign({}, item);
    let keys = Object.keys(item);

    for (let i = 0, l = keys.length; i < l; i++) {
      v = item[keys[i]];
      if ((unwrapped = unwrap(v)) !== v) item[keys[i]] = unwrapped;
    }
  }

  return item;
}

function getDataNodes(target) {
  let nodes = target[SNODE];
  if (!nodes) target[SNODE] = nodes = {};
  return nodes;
}

const proxyTraps = {
  get(target, property) {
    if (property === '_state') return target;
    if (property === SPROXY || property === SNODE) return;
    const value = target[property],
          wrappable = isWrappable(value);

    if (isListening() && typeof value !== 'function') {
      let nodes, node;

      if (wrappable && (nodes = getDataNodes(value))) {
        node = nodes._self || (nodes._self = new DataNode(undefined));
        node.current();
      }

      nodes = getDataNodes(target);
      node = nodes[property] || (nodes[property] = new DataNode(undefined));
      node.current();
    }

    return wrappable ? wrap(value) : value;
  },

  set() {
    return true;
  },

  deleteProperty() {
    return true;
  }

};

function setProperty(state, property, value) {
  value = unwrap(value);
  if (state[property] === value) return;
  const notify = Array.isArray(state) || !(property in state);

  if (value === void 0) {
    delete state[property];
  } else state[property] = value;

  let nodes = getDataNodes(state),
      node;
  (node = nodes[property]) && node.next();
  notify && (node = nodes._self) && node.next();
}

function mergeState(state, value) {
  const keys = Object.keys(value);

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    setProperty(state, key, value[key]);
  }
}

function updatePath(current, path, traversed = []) {
  if (path.length === 1) {
    let value = path[0];

    if (typeof value === 'function') {
      value = value(wrap(current), traversed); // reconciled

      if (value === undefined) return;
    }

    mergeState(current, value);
    return;
  }

  const part = path.shift(),
        partType = typeof part,
        isArray = Array.isArray(current);

  if (Array.isArray(part)) {
    // Ex. update('data', [2, 23], 'label', l => l + ' !!!');
    for (let i = 0; i < part.length; i++) {
      updatePath(current, [part[i]].concat(path), traversed.concat([part[i]]));
    }
  } else if (isArray && partType === 'function') {
    // Ex. update('data', i => i.id === 42, 'label', l => l + ' !!!');
    for (let i = 0; i < current.length; i++) {
      if (part(current[i], i)) updatePath(current, [i].concat(path), traversed.concat([i]));
    }
  } else if (isArray && partType === 'object') {
    // Ex. update('data', { from: 3, to: 12, by: 2 }, 'label', l => l + ' !!!');
    const {
      from = 0,
      to = current.length - 1,
      by = 1
    } = part;

    for (let i = from; i <= to; i += by) {
      updatePath(current, [i].concat(path), traversed.concat([i]));
    }
  } else if (isArray && part === '*') {
    // Ex. update('data', '*', 'label', l => l + ' !!!');
    for (let i = 0; i < current.length; i++) {
      updatePath(current, [i].concat(path), traversed.concat([i]));
    }
  } else if (path.length === 1) {
    let value = path[0];

    if (typeof value === 'function') {
      const currentPart = current[part];
      value = value(isWrappable(currentPart) ? wrap(currentPart) : currentPart, traversed.concat([part]));
    }

    if (isWrappable(current[part]) && isWrappable(value) && !Array.isArray(value)) {
      mergeState(current[part], value);
    } else setProperty(current, part, value);
  } else updatePath(current[part], path, traversed.concat([part]));
}

function createState(state) {
  state = unwrap(state || {});
  const wrappedState = wrap(state);

  function setState() {
    const args = arguments;
    freeze(() => {
      if (Array.isArray(args[0])) {
        for (let i = 0; i < args.length; i += 1) {
          updatePath(state, args[i]);
        }
      } else updatePath(state, Array.prototype.slice.call(args));
    });
  }

  return [wrappedState, setState];
}

function applyState(target, parent, property, merge, key) {
  let previous = parent[property];
  if (target === previous) return;

  if (!isWrappable(target) || previous == null) {
    target !== previous && setProperty(parent, property, target);
    return;
  }

  if (Array.isArray(target)) {
    if (target.length && previous.length && (!merge || key && target[0][key] != null)) {
      let i,
          j,
          start,
          end,
          newEnd,
          item,
          newIndicesNext,
          keyVal,
          temp = new Array(target.length),
          newIndices = new Map(); // skip common prefix and suffix

      for (start = 0, end = Math.min(previous.length, target.length); start < end && (previous[start] === target[start] || key && previous[start][key] === target[start][key]); start++) {
        applyState(target[start], previous, start, merge, key);
      }

      for (end = previous.length - 1, newEnd = target.length - 1; end >= 0 && newEnd >= 0 && (previous[end] === target[newEnd] || key && previous[end][key] === target[newEnd][key]); end--, newEnd--) {
        temp[newEnd] = previous[end];
      } // prepare a map of all indices in target


      newIndicesNext = new Array(newEnd + 1);

      for (j = newEnd; j >= start; j--) {
        item = target[j];
        keyVal = key ? item[key] : item;
        i = newIndices.get(keyVal);
        newIndicesNext[j] = i === undefined ? -1 : i;
        newIndices.set(keyVal, j);
      } // step through all old items to check reuse


      for (i = start; i <= end; i++) {
        item = previous[i];
        keyVal = key ? item[key] : item;
        j = newIndices.get(keyVal);

        if (j !== undefined && j !== -1) {
          temp[j] = previous[i];
          j = newIndicesNext[j];
          newIndices.set(keyVal, j);
        }
      } // set all the new values


      for (j = start; j < target.length; j++) {
        if (temp.hasOwnProperty(j)) {
          setProperty(previous, j, temp[j]);
          applyState(target[j], previous, j, merge, key);
        } else setProperty(previous, j, target[j]);
      }
    } else {
      for (let i = 0, len = target.length; i < len; i++) {
        applyState(target[i], previous, i, merge, key);
      }
    }

    if (previous.length > target.length) setProperty(previous, 'length', target.length);
    return;
  }

  const targetKeys = Object.keys(target);

  for (let i = 0, len = targetKeys.length; i < len; i++) {
    applyState(target[targetKeys[i]], previous, targetKeys[i], merge, key);
  }

  const previousKeys = Object.keys(previous);

  for (let i = 0, len = previousKeys.length; i < len; i++) {
    if (target[previousKeys[i]] === undefined) setProperty(previous, previousKeys[i], undefined);
  }
} // Diff method for setState


function reconcile(path, options = {}) {
  let value;

  if (Array.isArray(path)) {
    value = path.pop();
  } else if (typeof path === 'object') {
    value = path;
    path = undefined;
  } else {
    path = Array.prototype.slice.call(arguments, 0, -1), value = arguments[arguments.length - 1];
    options = {};
  }

  const {
    merge,
    key = 'id'
  } = options;
  return state => {
    state = unwrap(state);

    if (path) {
      for (let i = 0; i < path.length - 1; i += 1) state = state[path[i]];

      applyState(value, state, path[path.length - 1], merge, key);
    } else applyState(value, {
      state
    }, 'state', merge, key);
  };
}

function createHandler(className) {
  return (e, s) => e.classList.toggle(className, s);
}

function shallowDiff(a, b) {
  let sa = new Set(a),
      sb = new Set(b);
  return [a.filter(i => !sb.has(i)), b.filter(i => !sa.has(i))];
}

function selectWhen(signal, handler) {
  if (typeof handler === 'string') handler = createHandler(handler);
  let start, end;
  createEffect(element => {
    const model = signal();
    if (element) handler(element, false);
    let marker = start;

    while (marker && marker !== end) {
      if (marker.model === model) {
        handler(marker, true);
        return marker;
      }

      marker = marker.nextSibling;
    }
  });
  return (s, e) => (start = s, end = e);
}

function selectEach(signal, handler) {
  if (typeof handler === 'string') handler = createHandler(handler);
  let start, end;
  createEffect((elements = []) => {
    const models = signal(),
          newElements = [];
    let marker = start;

    while (marker && marker !== end) {
      if (models.indexOf(marker.model) > -1) newElements.push(marker);
      marker = marker.nextSibling;
    }

    const [additions, removals] = shallowDiff(newElements, elements);
    additions.forEach(el => handler(el, true));
    removals.forEach(el => handler(el, false));
    return newElements;
  });
  return (s, e) => (start = s, end = e);
}

const SuspenseContext = createContext(() => {
  let counter = 0;
  const [get, next] = createSignal(),
        store = {
    increment: () => ++counter === 1 && !store.initializing && next(),
    decrement: () => --counter === 0 && next(),
    suspended: () => {
      get();
      return !!counter;
    },
    initializing: true
  };
  return store;
}); // used in the runtime to seed the Suspend control flow

exports.SuspenseContext = SuspenseContext;

function registerSuspense(fn) {
  createEffect(() => {
    const c = SuspenseContext.initFn();
    setContext(SuspenseContext.id, c);
    fn(c);
    c.initializing = false;
  });
}

function lazy(fn) {
  return props => {
    const result = loadResource(fn().then(mod => mod.default));
    let Comp;
    return () => (Comp = result.data) && sample(() => Comp(props));
  };
} // load any async resource


function loadResource(resource) {
  const {
    increment,
    decrement
  } = useContext(SuspenseContext) || {};
  const [state, setState] = createState({
    loading: false
  });

  function doRequest(p, ref) {
    setState({
      loading: true
    });
    increment && increment();
    p.then(data => !(ref && ref.cancelled) && setState({
      data,
      loading: false
    })).catch(error => setState({
      error,
      loading: false
    })).finally(() => decrement && decrement());
  }

  if (typeof resource === 'function') {
    createEffect(() => {
      let ref = {
        cancelled: false
      },
          res = resource();
      if (!res) return setState({
        data: undefined,
        loading: false
      });
      doRequest(res, ref);
      onCleanup(() => ref.cancelled = true);
    });
  } else doRequest(resource);

  return state;
}

function setDefaults(props, defaultProps) {
  const propKeys = Object.keys(defaultProps);

  for (let i = 0; i < propKeys.length; i++) {
    const key = propKeys[i];
    !(key in props) && (props[key] = defaultProps[key]);
  }
}
},{}],"node_modules/solid-js/dist/dom/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.classList = classList;
exports.clearDelegatedEvents = clearDelegatedEvents;
exports.createComponent = createComponent;
exports.delegateEvents = delegateEvents;
exports.each = each;
exports.insert = insert;
exports.portal = portal;
exports.provide = provide;
exports.spread = spread;
exports.suspend = suspend;
exports.when = when;
Object.defineProperty(exports, "currentContext", {
  enumerable: true,
  get: function () {
    return _solid.getContextOwner;
  }
});
Object.defineProperty(exports, "wrap", {
  enumerable: true,
  get: function () {
    return _solid.createEffect;
  }
});

var _solid = require("../solid.js");

const Types = {
  ATTRIBUTE: 'attribute',
  PROPERTY: 'property'
},
      Attributes = {
  href: {
    type: Types.ATTRIBUTE
  },
  style: {
    type: Types.PROPERTY,
    alias: 'style.cssText'
  },
  for: {
    type: Types.PROPERTY,
    alias: 'htmlFor'
  },
  class: {
    type: Types.PROPERTY,
    alias: 'className'
  },
  // React compat
  spellCheck: {
    type: Types.PROPERTY,
    alias: 'spellcheck'
  },
  allowFullScreen: {
    type: Types.PROPERTY,
    alias: 'allowFullscreen'
  },
  autoCapitalize: {
    type: Types.PROPERTY,
    alias: 'autocapitalize'
  },
  autoFocus: {
    type: Types.PROPERTY,
    alias: 'autofocus'
  },
  autoPlay: {
    type: Types.PROPERTY,
    alias: 'autoplay'
  }
};
const GROUPING = '__rGroup',
      FORWARD = 'nextSibling',
      BACKWARD = 'previousSibling';
let groupCounter = 0;

function normalizeIncomingArray(normalized, array) {
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i];

    if (item instanceof Node) {
      if (item.nodeType === 11) {
        normalizeIncomingArray(normalized, item.childNodes);
      } else normalized.push(item);
    } else if (item == null || item === true || item === false) ;else if (Array.isArray(item)) {
      normalizeIncomingArray(normalized, item);
    } else if (typeof item === 'string') {
      normalized.push(document.createTextNode(item));
    } else {
      normalized.push(document.createTextNode(item.toString()));
    }
  }

  return normalized;
}

function addNode(parent, node, afterNode, counter) {
  if (Array.isArray(node)) {
    if (!node.length) return;
    node = normalizeIncomingArray([], node);
    let mark = node[0];
    if (node.length !== 1) mark[GROUPING] = node[node.length - 1][GROUPING] = counter;

    for (let i = 0; i < node.length; i++) afterNode ? parent.insertBefore(node[i], afterNode) : parent.appendChild(node[i]);

    return mark;
  }

  let mark,
      t = typeof node;
  if (node == null || t === 'string' || t === 'number') node = document.createTextNode(node || '');else if (node.nodeType === 11 && (mark = node.firstChild) && mark !== node.lastChild) {
    mark[GROUPING] = node.lastChild[GROUPING] = counter;
  }
  afterNode ? parent.insertBefore(node, afterNode) : parent.appendChild(node);
  return mark || node;
}

function step(node, direction, inner) {
  const key = node[GROUPING];

  if (key) {
    node = node[direction];

    while (node && node[GROUPING] !== key) node = node[direction];
  }

  return inner ? node : node[direction];
}

function removeNodes(parent, node, end) {
  let tmp;

  while (node !== end) {
    tmp = node.nextSibling;
    parent.removeChild(node);
    node = tmp;
  }
}

function clearAll(parent, current, marker, startNode) {
  if (marker === undefined) return parent.textContent = '';
  if (Array.isArray(current)) startNode = current[0];else if (current != null && current != '' && startNode === undefined) {
    startNode = step(marker && marker.previousSibling || parent.lastChild, BACKWARD, true);
  }
  startNode && removeNodes(parent, startNode, marker);
  return '';
}

function insertExpression(parent, value, current, marker) {
  if (value === current) return current;
  parent = marker && marker.parentNode || parent;
  const t = typeof value;

  if (t === 'string' || t === 'number') {
    if (t === 'number') value = value.toString();

    if (marker !== undefined) {
      const startNode = marker && marker.previousSibling || parent.lastChild;
      if (value === '') clearAll(parent, current, marker);else if (current !== '' && typeof current === 'string') {
        startNode.data = value;
      } else {
        const node = document.createTextNode(value);

        if (current !== '' && current != null) {
          parent.replaceChild(node, startNode);
        } else parent.insertBefore(node, marker);
      }
      current = value;
    } else {
      if (current !== '' && typeof current === 'string') {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === 'boolean') {
    current = clearAll(parent, current, marker);
  } else if (t === 'function') {
    (0, _solid.createEffect)(function () {
      current = insertExpression(parent, value(), current, marker);
    });
  } else if (value instanceof Node || Array.isArray(value)) {
    if (current !== '' && current != null) clearAll(parent, current, marker);
    addNode(parent, value, marker, ++groupCounter);
    current = value;
  } else {
    throw new Error("content must be Node, stringable, or array of same");
  }

  return current;
}

function insert(parent, accessor, marker, initial) {
  if (typeof accessor !== 'function') return insertExpression(parent, accessor, initial, marker);
  (0, _solid.createEffect)((current = initial) => insertExpression(parent, accessor(), current, marker));
}

function dynamicProp(props, key) {
  const src = props[key];
  Object.defineProperty(props, key, {
    get() {
      return src();
    },

    enumerable: true
  });
}

function createComponent(Comp, props, dynamicKeys) {
  if (dynamicKeys) {
    for (let i = 0; i < dynamicKeys.length; i++) dynamicProp(props, dynamicKeys[i]);
  }

  return Comp(props);
}

const eventRegistry = new Set();

function lookup(el) {
  return el && (el.model || lookup(el.host || el.parentNode));
}

function eventHandler(e) {
  const key = `__${e.type}`;
  let node = e.composedPath && e.composedPath()[0] || e.target; // reverse Shadow DOM retargetting

  if (e.target !== node) {
    Object.defineProperty(e, 'target', {
      configurable: true,
      value: node
    });
  } // simulate currentTarget


  Object.defineProperty(e, 'currentTarget', {
    configurable: true,

    get() {
      return node;
    }

  });

  while (node !== null) {
    const handler = node[key];

    if (handler) {
      const model = handler.length > 1 ? lookup(node) : undefined;
      handler(e, model);
      if (e.cancelBubble) return;
    }

    node = node.host && node.host instanceof Node ? node.host : node.parentNode;
  }
}

function delegateEvents(eventNames) {
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];

    if (!eventRegistry.has(name)) {
      eventRegistry.add(name);
      document.addEventListener(name, eventHandler);
    }
  }
}

function clearDelegatedEvents() {
  for (let name of eventRegistry.keys()) document.removeEventListener(name, eventHandler);

  eventRegistry.clear();
}

function classList(node, value) {
  const classKeys = Object.keys(value);

  for (let i = 0; i < classKeys.length; i++) {
    const key = classKeys[i],
          classNames = key.split(/\s+/);

    for (let j = 0; j < classNames.length; j++) node.classList.toggle(classNames[j], value[key]);
  }
}

function spreadExpression(node, props) {
  let info;

  for (const prop in props) {
    const value = props[prop];

    if (prop === 'style') {
      Object.assign(node.style, value);
    } else if (prop === 'classList') {
      classList(node, value);
    } else if (prop === 'events') {
      for (const eventName in value) node.addEventListener(eventName, value[eventName]);
    } else if (info = Attributes[prop]) {
      if (info.type === 'attribute') {
        node.setAttribute(prop, value);
      } else node[info.alias] = value;
    } else node[prop] = value;
  }
}

function spread(node, accessor) {
  if (typeof accessor === 'function') {
    (0, _solid.createEffect)(() => spreadExpression(node, accessor()));
  } else spreadExpression(node, accessor);
}

function when(parent, accessor, expr, options, marker) {
  let beforeNode, current, disposable;
  const {
    afterRender,
    fallback
  } = options;
  if (marker) beforeNode = marker.previousSibling;
  (0, _solid.onCleanup)(function dispose() {
    disposable && disposable();
  });
  (0, _solid.createEffect)(cached => {
    const value = accessor();
    if (value === cached) return cached;
    return (0, _solid.sample)(() => {
      parent = marker && marker.parentNode || parent;
      disposable && disposable();

      if (value == null || value === false) {
        clearAll(parent, current, marker, beforeNode ? beforeNode.nextSibling : parent.firstChild);
        current = null;
        afterRender && afterRender(current, marker);

        if (fallback) {
          (0, _solid.createRoot)(disposer => {
            disposable = disposer;
            current = insertExpression(parent, fallback(), current, marker);
          });
        }

        return value;
      }

      (0, _solid.createRoot)(disposer => {
        disposable = disposer;
        current = insertExpression(parent, expr(value), current, marker);
      });
      afterRender && afterRender(current, marker);
      return value;
    });
  });
}

function insertNodes(parent, node, end, target) {
  let tmp;

  while (node !== end) {
    tmp = node.nextSibling;
    parent.insertBefore(node, target);
    node = tmp;
  }
}

function cleanNode(disposables, node) {
  let disposable;
  (disposable = disposables.get(node)) && disposable();
  disposables.delete(node);
} // Picked from
// https://github.com/adamhaile/surplus/blob/master/src/runtime/content.ts#L368
// return an array of the indices of ns that comprise the longest increasing subsequence within ns


function longestPositiveIncreasingSubsequence(ns, newStart) {
  let seq = [],
      is = [],
      l = -1,
      pre = new Array(ns.length);

  for (let i = newStart, len = ns.length; i < len; i++) {
    let n = ns[i];
    if (n < 0) continue;
    let j = findGreatestIndexLEQ(seq, n);
    if (j !== -1) pre[i] = is[j];

    if (j === l) {
      l++;
      seq[l] = n;
      is[l] = i;
    } else if (n < seq[j + 1]) {
      seq[j + 1] = n;
      is[j + 1] = i;
    }
  }

  for (let i = is[l]; l >= 0; i = pre[i], l--) {
    seq[l] = i;
  }

  return seq;
}

function findGreatestIndexLEQ(seq, n) {
  // invariant: lo is guaranteed to be index of a value <= n, hi to be >
  // therefore, they actually start out of range: (-1, last + 1)
  let lo = -1,
      hi = seq.length; // fast path for simple increasing sequences

  if (hi > 0 && seq[hi - 1] <= n) return hi - 1;

  while (hi - lo > 1) {
    let mid = Math.floor((lo + hi) / 2);

    if (seq[mid] > n) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return lo;
} // This is almost straightforward implementation of reconcillation algorithm
// based on ivi documentation:
// https://github.com/localvoid/ivi/blob/2c81ead934b9128e092cc2a5ef2d3cabc73cb5dd/packages/ivi/src/vdom/implementation.ts#L1366
// With some fast paths from Surplus implementation:
// https://github.com/adamhaile/surplus/blob/master/src/runtime/content.ts#L86
// And working with data directly from Stage0:
// https://github.com/Freak613/stage0/blob/master/reconcile.js
// This implementation is tailored for fine grained change detection and adds support for fragments


function each(parent, accessor, expr, options, afterNode) {
  let disposables = new Map(),
      isFallback = false,
      beforeNode = afterNode ? afterNode.previousSibling : null;
  const {
    afterRender,
    fallback
  } = options;

  function createFn(item, i, afterNode) {
    return (0, _solid.createRoot)(disposer => {
      const node = addNode(parent, expr(item, i), afterNode, ++groupCounter);
      disposables.set(node, disposer);
      return node;
    });
  }

  function after() {
    afterRender && afterRender(beforeNode ? beforeNode.nextSibling : parent.firstChild, afterNode);
  }

  function disposeAll() {
    for (let i of disposables.keys()) disposables.get(i)();

    disposables.clear();
  }

  (0, _solid.onCleanup)(disposeAll);
  (0, _solid.createEffect)((renderedValues = []) => {
    const data = accessor() || [];
    return (0, _solid.sample)(() => {
      parent = afterNode && afterNode.parentNode || parent;
      const length = data.length; // Fast path for clear

      if (length === 0 || isFallback) {
        if (beforeNode || afterNode) {
          let node = beforeNode ? beforeNode.nextSibling : parent.firstChild;
          removeNodes(parent, node, afterNode ? afterNode : null);
        } else parent.textContent = "";

        disposeAll();

        if (length === 0) {
          after();

          if (fallback) {
            isFallback = true;
            (0, _solid.createRoot)(disposer => {
              const node = addNode(parent, fallback(), afterNode, ++groupCounter);
              disposables.set(node, disposer);
            });
          }

          return [];
        } else isFallback = false;
      } // Fast path for create


      if (renderedValues.length === 0) {
        for (let i = 0; i < length; i++) createFn(data[i], i, afterNode);

        after();
        return data.slice(0);
      }

      let prevStart = 0,
          newStart = 0,
          loop = true,
          prevEnd = renderedValues.length - 1,
          newEnd = length - 1,
          a,
          b,
          prevStartNode = beforeNode ? beforeNode.nextSibling : parent.firstChild,
          newStartNode = prevStartNode,
          prevEndNode = afterNode ? afterNode.previousSibling : parent.lastChild,
          newAfterNode = afterNode;

      fixes: while (loop) {
        loop = false;

        let _node; // Skip prefix


        a = renderedValues[prevStart], b = data[newStart];

        while (a === b) {
          prevStart++;
          newStart++;
          newStartNode = prevStartNode = step(prevStartNode, FORWARD);
          if (prevEnd < prevStart || newEnd < newStart) break fixes;
          a = renderedValues[prevStart];
          b = data[newStart];
        } // Skip suffix


        a = renderedValues[prevEnd], b = data[newEnd];

        while (a === b) {
          prevEnd--;
          newEnd--;
          newAfterNode = step(prevEndNode, BACKWARD, true);
          prevEndNode = newAfterNode.previousSibling;
          if (prevEnd < prevStart || newEnd < newStart) break fixes;
          a = renderedValues[prevEnd];
          b = data[newEnd];
        } // Fast path to swap backward


        a = renderedValues[prevEnd], b = data[newStart];

        while (a === b) {
          loop = true;
          let mark = step(prevEndNode, BACKWARD, true);
          _node = mark.previousSibling;

          if (newStartNode !== mark) {
            insertNodes(parent, mark, prevEndNode.nextSibling, newStartNode);
            prevEndNode = _node;
          }

          newStart++;
          prevEnd--;
          if (prevEnd < prevStart || newEnd < newStart) break fixes;
          a = renderedValues[prevEnd];
          b = data[newStart];
        } // Fast path to swap forward


        a = renderedValues[prevStart], b = data[newEnd];

        while (a === b) {
          loop = true;
          _node = step(prevStartNode, FORWARD);

          if (prevStartNode !== newAfterNode) {
            let mark = _node.previousSibling;
            insertNodes(parent, prevStartNode, _node, newAfterNode);
            newAfterNode = mark;
            prevStartNode = _node;
          }

          prevStart++;
          newEnd--;
          if (prevEnd < prevStart || newEnd < newStart) break fixes;
          a = renderedValues[prevStart];
          b = data[newEnd];
        }
      } // Fast path for shrink


      if (newEnd < newStart) {
        if (prevStart <= prevEnd) {
          let next, node;

          while (prevStart <= prevEnd) {
            node = step(prevEndNode, BACKWARD, true);
            next = node.previousSibling;
            removeNodes(parent, node, prevEndNode.nextSibling);
            cleanNode(disposables, node);
            prevEndNode = next;
            prevEnd--;
          }
        }

        after();
        return data.slice(0);
      } // Fast path for add


      if (prevEnd < prevStart) {
        if (newStart <= newEnd) {
          while (newStart <= newEnd) {
            createFn(data[newStart], newStart, newAfterNode);
            newStart++;
          }
        }

        after();
        return data.slice(0);
      } // Positions for reusing nodes from current DOM state


      const P = new Array(newEnd + 1 - newStart);

      for (let i = newStart; i <= newEnd; i++) P[i] = -1; // Index to resolve position from current to new


      const I = new Map();

      for (let i = newStart; i <= newEnd; i++) I.set(data[i], i);

      let reusingNodes = 0,
          toRemove = [];

      for (let i = prevStart; i <= prevEnd; i++) {
        if (I.has(renderedValues[i])) {
          P[I.get(renderedValues[i])] = i;
          reusingNodes++;
        } else toRemove.push(i);
      } // Fast path for full replace


      if (reusingNodes === 0) {
        const doRemove = prevStartNode !== parent.firstChild || prevEndNode !== parent.lastChild;
        let node = prevStartNode,
            mark;
        newAfterNode = prevEndNode.nextSibling;

        while (node !== newAfterNode) {
          mark = step(node, FORWARD);
          cleanNode(disposables, node);
          doRemove && removeNodes(parent, node, mark);
          node = mark;
          prevStart++;
        }

        !doRemove && (parent.textContent = "");

        for (let i = newStart; i <= newEnd; i++) createFn(data[i], i, newAfterNode);

        after();
        return data.slice(0);
      } // What else?


      const longestSeq = longestPositiveIncreasingSubsequence(P, newStart),
            nodes = [];
      let tmpC = prevStartNode,
          lisIdx = longestSeq.length - 1,
          tmpD; // Collect nodes to work with them

      for (let i = prevStart; i <= prevEnd; i++) {
        nodes[i] = tmpC;
        tmpC = step(tmpC, FORWARD);
      }

      for (let i = 0; i < toRemove.length; i++) {
        let index = toRemove[i],
            node = nodes[index];
        removeNodes(parent, node, step(node, FORWARD));
        cleanNode(disposables, node);
      }

      for (let i = newEnd; i >= newStart; i--) {
        if (longestSeq[lisIdx] === i) {
          newAfterNode = nodes[P[longestSeq[lisIdx]]];
          lisIdx--;
        } else {
          if (P[i] === -1) {
            tmpD = createFn(data[i], i, newAfterNode);
          } else {
            tmpD = nodes[P[i]];
            insertNodes(parent, tmpD, step(tmpD, FORWARD), newAfterNode);
          }

          newAfterNode = tmpD;
        }
      }

      after();
      return data.slice(0);
    });
  });
}

function suspend(parent, accessor, expr, options, marker) {
  let beforeNode, disposable, current;
  const {
    fallback
  } = options,
        doc = document.implementation.createHTMLDocument();
  if (marker) beforeNode = marker.previousSibling;

  for (let name of eventRegistry.keys()) doc.addEventListener(name, eventHandler);

  Object.defineProperty(doc.body, 'host', {
    get() {
      return marker && marker.parentNode || parent;
    }

  });
  (0, _solid.onCleanup)(function dispose() {
    disposable && disposable();
  });

  function suspense(options) {
    const rendered = (0, _solid.sample)(expr);
    (0, _solid.createEffect)(cached => {
      const value = !!options.suspended();
      if (value === cached) return cached;
      let node;
      parent = marker && marker.parentNode || parent;

      if (value) {
        if (options.initializing) insertExpression(doc.body, rendered);else {
          node = beforeNode ? beforeNode.nextSibling : parent.firstChild;

          while (node && node !== marker) {
            const next = node.nextSibling;
            doc.body.appendChild(node);
            node = next;
          }
        }

        if (fallback) {
          (0, _solid.sample)(() => (0, _solid.createRoot)(disposer => {
            disposable = disposer;
            current = insertExpression(parent, fallback(), null, marker);
          }));
        }

        return value;
      }

      if (options.initializing) insertExpression(parent, rendered, null, marker);else {
        if (disposable) {
          clearAll(parent, current, marker, beforeNode ? beforeNode.nextSibling : parent.firstChild);
          disposable();
        }

        while (node = doc.body.firstChild) parent.insertBefore(node, marker);
      }
      return value;
    });
  }

  if (accessor) {
    const config = {
      suspended: accessor,
      initializing: true
    };
    suspense(config);
    config.initializing = false;
  } else (0, _solid.registerSuspense)(suspense);
}

function provide(parent, accessor, expr, options, marker) {
  const Context = accessor(),
        {
    value
  } = options;
  insertExpression(parent, () => (0, _solid.sample)(() => {
    (0, _solid.setContext)(Context.id, Context.initFn ? Context.initFn(value) : value);
    return expr();
  }), undefined, marker);
}

function portal(parent, accessor, expr, options, marker) {
  const {
    useShadow
  } = options,
        container = document.createElement('div'),
        anchor = accessor && (0, _solid.sample)(accessor) || document.body,
        renderRoot = useShadow && container.attachShadow ? container.attachShadow({
    mode: 'open'
  }) : container;
  Object.defineProperty(container, 'host', {
    get() {
      return marker && marker.parentNode || parent;
    }

  });
  const nodes = (0, _solid.sample)(() => expr(container));
  insertExpression(container, nodes); // ShadyDOM polyfill doesn't handle mutationObserver on shadowRoot properly

  if (container !== renderRoot) Promise.resolve().then(() => {
    while (container.firstChild) renderRoot.appendChild(container.firstChild);
  });
  anchor.appendChild(container);
  (0, _solid.onCleanup)(() => anchor.removeChild(container));
}
},{"../solid.js":"node_modules/solid-js/dist/solid.js"}],"components/Home.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

const _tmpl$ = document.createElement("template");

_tmpl$.innerHTML = "<h1>Welcome to this Simple Routing Example</h1><p>Click the links in the Navigation above to load different routes.</p>";

var Home = function Home() {
  return _tmpl$.content.cloneNode(true);
};

var _default = Home;
exports.default = _default;
},{}],"index.js":[function(require,module,exports) {
"use strict";

var _dom = require("solid-js/dom");

var _solidJs = require("solid-js");

var _Home = _interopRequireDefault(require("./components/Home"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const _tmpl$ = document.createElement("template"),
      _tmpl$2 = document.createElement("template"),
      _tmpl$3 = document.createElement("template");

_tmpl$.innerHTML = "<h1>Your Profile</h1><p>This section could be about you.</p>";
_tmpl$2.innerHTML = "<h1>Settings</h1><p>All that configuration you never really ever want to look at.</p>";
_tmpl$3.innerHTML = "<ul><li><a href='#home'>Home</a></li><li><a href='#profile'>Profile</a></li><li><a href='#settings'>Settings</a></li></ul><!----><!----><!---->";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function createRouteHandler() {
  var _createSignal = (0, _solidJs.createSignal)("home"),
      _createSignal2 = _slicedToArray(_createSignal, 2),
      location = _createSignal2[0],
      setLocation = _createSignal2[1],
      locationHandler = function locationHandler(e) {
    return setLocation(window.location.hash.slice(1));
  };

  window.addEventListener("hashchange", locationHandler);
  (0, _solidJs.onCleanup)(function () {
    return window.removeEventListener("hashchange", locationHandler);
  });
  return function (match) {
    return match === location();
  };
}

var Profile = function Profile() {
  return _tmpl$.content.cloneNode(true);
};

var Settings = function Settings() {
  return _tmpl$2.content.cloneNode(true);
};

var App = function App() {
  var matches = createRouteHandler();
  return function () {
    var _el$3 = _tmpl$3.content.cloneNode(true),
        _el$4 = _el$3.firstChild,
        _el$5 = _el$4.nextSibling,
        _el$6 = _el$5.nextSibling,
        _el$7 = _el$6.nextSibling;

    (0, _dom.when)(_el$3, function () {
      return matches("home");
    }, function () {
      return (0, _Home.default)({});
    }, {}, _el$5);
    (0, _dom.when)(_el$3, function () {
      return matches("profile");
    }, function () {
      return Profile({});
    }, {}, _el$6);
    (0, _dom.when)(_el$3, function () {
      return matches("settings");
    }, function () {
      return Settings({});
    }, {}, _el$7);
    return _el$3;
  }();
};

(0, _solidJs.createRoot)(function () {
  return document.body.appendChild(App({}));
});
},{"solid-js/dom":"node_modules/solid-js/dist/dom/index.js","solid-js":"node_modules/solid-js/dist/solid.js","./components/Home":"components/Home.js"}],"node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "54275" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=/my-app-demo1.e31bb0bc.js.map