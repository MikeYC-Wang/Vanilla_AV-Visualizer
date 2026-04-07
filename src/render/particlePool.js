// Object-pooled particle storage using Struct-of-Arrays (SoA).
// Pre-allocated Float32Arrays / Uint8Arrays — zero per-frame allocations.

let cap = 0;
let count = 0;            // current logical capacity in use
let freeTop = 0;          // top of free-index stack
let freeStack = null;     // Int32Array of free indices

export let x, y, vx, vy, life, maxLife, size, hue;
export let active;        // Uint8Array (0/1)

function allocate(n) {
  cap = n | 0;
  x = new Float32Array(cap);
  y = new Float32Array(cap);
  vx = new Float32Array(cap);
  vy = new Float32Array(cap);
  life = new Float32Array(cap);
  maxLife = new Float32Array(cap);
  size = new Float32Array(cap);
  hue = new Float32Array(cap);
  active = new Uint8Array(cap);
  freeStack = new Int32Array(cap);
  freeTop = 0;
  for (let i = cap - 1; i >= 0; i--) freeStack[freeTop++] = i;
  count = cap;
}

export function init(ctxObj) {
  const n = (ctxObj && ctxObj.state && ctxObj.state.particleCount) || 1000;
  allocate(n);
}

export function resize(n) {
  n = n | 0;
  if (n === cap) return;
  allocate(n);
}

export function capacity() { return cap; }
export function activeCount() { return cap - freeTop; }

export function acquire() {
  if (freeTop === 0) return -1;
  const i = freeStack[--freeTop];
  active[i] = 1;
  return i;
}

export function release(i) {
  if (i < 0 || i >= cap || !active[i]) return;
  active[i] = 0;
  freeStack[freeTop++] = i;
}

export function forEachActive(cb) {
  for (let i = 0; i < cap; i++) {
    if (active[i]) cb(i);
  }
}
