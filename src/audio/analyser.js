// Web Audio analyser: FFT + time-domain extraction, band energies, beat detection.

import { state } from "../state.js";

let audioCtx = null;
let analyser = null;
let freqArr = null;
let timeArr = null;
let currentSourceNode = null;
let connectedToDestination = false;

// Beat detection state
const HISTORY_LEN = 43;            // ~0.7s at 60fps
const bassHistory = new Float32Array(HISTORY_LEN);
let historyIdx = 0;
let historyFilled = 0;
let lastBeatAt = -Infinity;
const BEAT_COOLDOWN_MS = 200;

function ensureCtx() {
  if (audioCtx) return audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AC();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = state.fftSize || 2048;
  analyser.smoothingTimeConstant = 0.82;
  freqArr = new Uint8Array(analyser.frequencyBinCount);
  timeArr = new Uint8Array(analyser.fftSize);

  // Wire to state.
  state.freqData = freqArr;
  state.timeData = timeArr;
  state.audio = {
    freq: freqArr,
    time: timeArr,
    bass: 0, mid: 0, treble: 0, rms: 0, beat: false,
  };
  return audioCtx;
}

function resumeOnGesture() {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
}

function attachSource(detail) {
  ensureCtx();
  resumeOnGesture();

  // Disconnect previous.
  if (currentSourceNode) {
    try { currentSourceNode.disconnect(); } catch (_) {}
    currentSourceNode = null;
  }

  if (detail.type === "mic" && detail.stream) {
    currentSourceNode = audioCtx.createMediaStreamSource(detail.stream);
    currentSourceNode.connect(analyser);
    // Do NOT connect to destination — feedback risk.
    connectedToDestination = false;
  } else if (detail.element) {
    try {
      currentSourceNode = audioCtx.createMediaElementSource(detail.element);
    } catch (e) {
      // Element already attached to a node — bail quietly.
      return;
    }
    currentSourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    connectedToDestination = true;
  }
}

export function init() {
  // Lazy: create context on first user gesture so autoplay policies are respected.
  const gesture = () => {
    ensureCtx();
    resumeOnGesture();
    window.removeEventListener("pointerdown", gesture);
    window.removeEventListener("keydown", gesture);
  };
  window.addEventListener("pointerdown", gesture);
  window.addEventListener("keydown", gesture);

  window.addEventListener("av:source-ready", (ev) => {
    attachSource(ev.detail || {});
  });
}

export function getAnalyser() { return analyser; }
export function getAudioContext() { return audioCtx; }

export function update() {
  if (!analyser) return;
  analyser.getByteFrequencyData(freqArr);
  analyser.getByteTimeDomainData(timeArr);

  // Bands. frequencyBinCount = fftSize/2 = 1024 typically.
  const binCount = freqArr.length;
  // bass: 0..8
  let sum = 0;
  for (let i = 0; i < 8; i = (i + 1) | 0) sum += freqArr[i];
  const bass = (sum / 8) / 255;

  // mid: 9..63 (~55 bins)
  sum = 0;
  const midStart = 9, midEnd = 64;
  for (let i = midStart; i < midEnd; i = (i + 1) | 0) sum += freqArr[i];
  const mid = (sum / (midEnd - midStart)) / 255;

  // treble: 64..255
  sum = 0;
  const trebStart = 64, trebEnd = Math.min(256, binCount);
  for (let i = trebStart; i < trebEnd; i = (i + 1) | 0) sum += freqArr[i];
  const treble = (sum / (trebEnd - trebStart)) / 255;

  // RMS from time domain (centered at 128).
  let acc = 0;
  const N = timeArr.length;
  for (let i = 0; i < N; i = (i + 1) | 0) {
    const v = timeArr[i] - 128;
    acc += v * v;
  }
  const rms = Math.sqrt(acc / N) / 128;

  // Beat detection.
  let avg = 0;
  const len = historyFilled || 1;
  for (let i = 0; i < len; i = (i + 1) | 0) avg += bassHistory[i];
  avg /= len;

  let beat = false;
  const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
  if (historyFilled >= 8 && bass > avg * 1.45 && bass > 0.15 && (now - lastBeatAt) > BEAT_COOLDOWN_MS) {
    beat = true;
    lastBeatAt = now;
  }

  bassHistory[historyIdx] = bass;
  historyIdx = (historyIdx + 1) % HISTORY_LEN;
  if (historyFilled < HISTORY_LEN) historyFilled++;

  // Write to state.
  state.bass = bass;
  state.rms = rms;
  const a = state.audio;
  a.bass = bass; a.mid = mid; a.treble = treble; a.rms = rms; a.beat = beat;
}
