// Central compositor. Owns the VHS background, fade trail, grain, and module ordering.

import * as circularSpectrum from "../modules/circularSpectrum.js";
import * as particles from "../modules/particles.js";
import * as rgbShift from "../modules/rgbShift.js";
import * as glitch from "../modules/glitch.js";
import * as chroma from "../modules/chroma.js";

let canvasRef = null;
let ctx = null;
let grainCanvas = null;
let grainCtx = null;
let grainFrame = 0;
const GRAIN_REGEN = 10;
const GRAIN_W = 256;
const GRAIN_H = 256;

function regenGrain() {
  const img = grainCtx.createImageData(GRAIN_W, GRAIN_H);
  const d = img.data;
  for (let i = 0, n = d.length; i < n; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = v;
    d[i + 1] = (v * 0.7) | 0;
    d[i + 2] = (v * 0.4) | 0;
    d[i + 3] = 18; // very faint
  }
  grainCtx.putImageData(img, 0, 0);
}

function drawVhsBase(w, h, t) {
  // Warm radial gradient base — drawn each frame because the fade overlay covers it.
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 40, w * 0.5, h * 0.5, (w > h ? w : h) * 0.7);
  g.addColorStop(0, "#3a1a08");
  g.addColorStop(0.55, "#1f0d05");
  g.addColorStop(1, "#0a0502");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Soft horizontal tape weave bands.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#ffb347";
  const bandH = 2;
  const offset = (t * 0.04) % (bandH * 2);
  for (let y = -offset; y < h; y += bandH * 2) {
    ctx.fillRect(0, y, w, bandH);
  }
  ctx.restore();

  // Faint center crosshair.
  ctx.strokeStyle = "rgba(255,179,71,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h);
  ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5);
  ctx.stroke();
}

export function init(arg) {
  // Accept either ({canvas, ctx, state}) or (canvas, state)
  if (arg && arg.canvas) {
    canvasRef = arg.canvas;
    ctx = arg.ctx || canvasRef.getContext("2d", { alpha: false });
  } else if (arg && arg.getContext) {
    canvasRef = arg;
    ctx = canvasRef.getContext("2d", { alpha: false });
  }

  grainCanvas = document.createElement("canvas");
  grainCanvas.width = GRAIN_W;
  grainCanvas.height = GRAIN_H;
  grainCtx = grainCanvas.getContext("2d");
  regenGrain();
}

function safeDraw(mod, ctx, w, h, state) {
  if (!mod || typeof mod.draw !== "function") return;
  try { mod.draw(ctx, w, h, state); } catch (_) {}
}

export function draw(state, dt) {
  if (!ctx) return;
  const w = state.width, h = state.height;
  if (!w || !h) return;

  // Fade-trail overlay for ghosting (keeps prior frame faintly visible).
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(15,8,5,0.18)";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Re-paint VHS base (radial + bands) — these read fresh, so trails stay subtle.
  drawVhsBase(w, h, state.time);

  // Audio bundle for modules (graceful fallback).
  const audio = state.audio || { freq: null, time: null, bass: 0, mid: 0, treble: 0, rms: 0, beat: false };
  // Decorate with VHS chromatic offset hint for circularSpectrum.
  audio.__offset = (state.rgbShift || 0) * 0.5;

  // Z-order: video FX (rgbShift / chroma / glitch live in the "video FX" tier),
  // then circular spectrum, then particles on top.
  if (state.modules.rgbShift) safeDraw(rgbShift, ctx, w, h, state);
  if (state.modules.chroma)   safeDraw(chroma,   ctx, w, h, state);
  if (state.modules.glitch)   safeDraw(glitch,   ctx, w, h, state);

  if (state.modules.circularSpectrum) {
    try { circularSpectrum.draw(ctx, w, h, audio); } catch (_) {}
  }
  if (state.modules.particles) {
    try { particles.draw(ctx, w, h, state); } catch (_) {}
  }

  // VHS grain overlay — regen periodically, drawImage every frame (cheap).
  grainFrame++;
  if ((grainFrame % GRAIN_REGEN) === 0) regenGrain();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.35;
  // Tile the grain across the canvas without per-frame allocations.
  for (let gy = 0; gy < h; gy += GRAIN_H) {
    for (let gx = 0; gx < w; gx += GRAIN_W) {
      ctx.drawImage(grainCanvas, gx, gy);
    }
  }
  ctx.restore();
}
