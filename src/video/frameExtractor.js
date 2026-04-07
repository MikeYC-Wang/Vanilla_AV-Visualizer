// Draws current <video> frame to a hidden offscreen canvas, exposes ImageData.

let video = null;
let canvas = null;
let ctx = null;
let cachedImageData = null;
let lastFrameAt = -1;
const MAX_W = 640;

export function init() {
  canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  ctx = canvas.getContext("2d", { willReadFrequently: true });

  window.addEventListener("av:source-ready", (ev) => {
    const detail = ev.detail || {};
    if (detail.element instanceof HTMLVideoElement) {
      setSource(detail.element);
    } else {
      setSource(null);
    }
  });
}

export function setSource(videoElement) {
  video = videoElement || null;
  cachedImageData = null;
  lastFrameAt = -1;
}

export function update() {
  if (!video || !ctx) return;
  if (video.readyState < 2) return;
  const vw = video.videoWidth | 0;
  const vh = video.videoHeight | 0;
  if (!vw || !vh) return;

  const scale = vw > MAX_W ? MAX_W / vw : 1;
  const w = Math.max(1, (vw * scale) | 0);
  const h = Math.max(1, (vh * scale) | 0);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  ctx.drawImage(video, 0, 0, w, h);
  cachedImageData = null; // invalidate
  lastFrameAt = performance.now();
}

export function getCanvas() {
  if (!video || !canvas || canvas.width < 4) return null;
  return canvas;
}

export function getImageData() {
  if (!getCanvas()) return null;
  if (!cachedImageData) {
    try {
      cachedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (_) {
      return null;
    }
  }
  return cachedImageData;
}

export function hasVideo() {
  return !!getCanvas();
}
