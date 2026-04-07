// AV-Visualizer entry point. Boots canvas, wires UI, runs rAF loop.

import { state } from "./state.js";
import * as controlPanel from "./ui/controlPanel.js";

import * as sourceManager from "./input/sourceManager.js";
import * as analyser from "./audio/analyser.js";
import * as frameExtractor from "./video/frameExtractor.js";
import * as renderer from "./render/renderer.js";
import * as particlePool from "./render/particlePool.js";

import * as circularSpectrum from "./modules/circularSpectrum.js";
import * as particles from "./modules/particles.js";
import * as rgbShift from "./modules/rgbShift.js";
import * as glitch from "./modules/glitch.js";
import * as chroma from "./modules/chroma.js";

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d", { alpha: false });

// ---------- Canvas sizing ----------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.dpr = dpr;
  state.width = canvas.clientWidth;
  state.height = canvas.clientHeight;
  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// ---------- Module init (stubs are no-ops) ----------
const modules = [
  sourceManager, analyser, frameExtractor,
  renderer, particlePool,
  circularSpectrum, particles, rgbShift, glitch, chroma,
];
for (const m of modules) {
  if (typeof m.init === "function") {
    try { m.init({ canvas, ctx, state }); } catch (e) { /* stub */ }
  }
}

// ---------- UI wiring ----------
controlPanel.init({
  state,
  onLoadUrl: (url) => {
    state.url = url;
    setStatus("LOAD " + truncate(url, 24));
    if (sourceManager.loadUrl) sourceManager.loadUrl(url);
  },
  onFile: (file) => {
    setStatus("FILE " + truncate(file.name, 22));
    if (sourceManager.loadFile) sourceManager.loadFile(file);
  },
  onMic: () => {
    setStatus("MIC LIVE");
    if (sourceManager.loadMic) sourceManager.loadMic();
  },
  onPlayToggle: () => {
    state.playing = !state.playing;
    setStatus(state.playing ? "PLAY" : "PAUSE");
    if (sourceManager.setPlaying) sourceManager.setPlaying(state.playing);
    return state.playing;
  },
});

function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

// ---------- VHS background draw (until renderer is implemented) ----------
function drawVhsBackground(t) {
  const { width: w, height: h } = state;
  // Warm gradient base
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
  g.addColorStop(0, "#3a1a08");
  g.addColorStop(0.55, "#1f0d05");
  g.addColorStop(1, "#0a0502");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Soft horizontal bands (tape weave)
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#ffb347";
  const bandH = 2;
  const offset = (t * 0.04) % (bandH * 2);
  for (let y = -offset; y < h; y += bandH * 2) {
    ctx.fillRect(0, y, w, bandH);
  }
  ctx.globalAlpha = 1;

  // Center crosshair (placeholder, very faint)
  ctx.strokeStyle = "rgba(255,179,71,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
  ctx.stroke();
}

// ---------- HUD time ----------
const hudTime = document.getElementById("hud-time");
function updateHud() {
  if (!hudTime) return;
  const s = Math.floor(state.time / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  hudTime.textContent = `${hh}:${mm}:${ss}`;
}

// ---------- rAF loop ----------
let last = performance.now();
function frame(now) {
  const dt = now - last;
  last = now;
  state.time += dt;
  state.frame++;

  // Pull audio data (stub-safe)
  if (analyser.update) { try { analyser.update(state); } catch (_) {} }
  if (frameExtractor.update) { try { frameExtractor.update(state); } catch (_) {} }

  // Update modules
  if (state.modules.particles && particles.update) { try { particles.update(state); } catch (_) {} }

  // Background
  drawVhsBackground(state.time);

  // Draw modules (stub-safe)
  if (state.modules.circularSpectrum && circularSpectrum.draw) { try { circularSpectrum.draw(ctx, state); } catch (_) {} }
  if (state.modules.particles && particles.draw) { try { particles.draw(ctx, state); } catch (_) {} }
  if (state.modules.rgbShift && rgbShift.draw) { try { rgbShift.draw(ctx, state); } catch (_) {} }
  if (state.modules.glitch && glitch.draw) { try { glitch.draw(ctx, state); } catch (_) {} }
  if (state.modules.chroma && chroma.draw) { try { chroma.draw(ctx, state); } catch (_) {} }

  if (renderer.draw) { try { renderer.draw(ctx, state); } catch (_) {} }

  updateHud();
  requestAnimationFrame(frame);
}
requestAnimationFrame((t) => { last = t; frame(t); });
