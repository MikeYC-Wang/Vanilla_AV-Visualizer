// Particle resonance system reacting to bass beats.
// Uses the SoA particle pool — no per-frame allocations.

import * as pool from "../render/particlePool.js";

const TWO_PI = Math.PI * 2;
const DAMPING = 0.96;
const PER_BEAT = 40;

let lastBeatFrame = -1;

export function init(arg) {
  const state = (arg && arg.state) ? arg.state : arg;
  if (!pool.capacity()) {
    pool.init({ state });
  }
}

function spawn(state) {
  const audio = state.audio || {};
  const bass = audio.bass || 0;
  const cx = state.width * 0.5;
  const cy = state.height * 0.5;
  const speedBase = 2 + bass * 8;

  for (let k = 0; k < PER_BEAT; k++) {
    const i = pool.acquire();
    if (i < 0) break;
    const a = Math.random() * TWO_PI;
    const sp = speedBase * (0.6 + Math.random() * 0.8);
    pool.x[i] = cx;
    pool.y[i] = cy;
    pool.vx[i] = Math.cos(a) * sp;
    pool.vy[i] = Math.sin(a) * sp;
    const lf = 60 + (Math.random() * 40) | 0;
    pool.life[i] = lf;
    pool.maxLife[i] = lf;
    pool.size[i] = 1.5 + Math.random() * 2.5;
    // warm hues 15..45 (red-orange -> amber)
    pool.hue[i] = 15 + Math.random() * 30;
  }
}

export function update(state, dt) {
  const audio = state.audio || {};
  if (audio.beat === true && state.frame !== lastBeatFrame) {
    spawn(state);
    lastBeatFrame = state.frame;
  }

  const w = state.width, h = state.height;
  const cap = pool.capacity();
  const ax = pool.x, ay = pool.y, avx = pool.vx, avy = pool.vy;
  const alife = pool.life, aactive = pool.active;

  for (let i = 0; i < cap; i++) {
    if (!aactive[i]) continue;
    avx[i] *= DAMPING;
    avy[i] *= DAMPING;
    ax[i] += avx[i];
    ay[i] += avy[i];
    alife[i] -= 1;
    if (alife[i] <= 0 || ax[i] < -8 || ay[i] < -8 || ax[i] > w + 8 || ay[i] > h + 8) {
      pool.release(i);
    }
  }
}

export function draw(ctx, w, h, state) {
  const cap = pool.capacity();
  const ax = pool.x, ay = pool.y, alife = pool.life, amax = pool.maxLife;
  const asize = pool.size, ahue = pool.hue, aactive = pool.active;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < cap; i++) {
    if (!aactive[i]) continue;
    const t = alife[i] / amax[i];
    const alpha = t * 0.85;
    const r = asize[i];
    ctx.fillStyle = "hsla(" + (ahue[i] | 0) + ",95%,60%," + alpha.toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(ax[i], ay[i], r, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}
