// Green-screen chroma key pixel filter.

import * as frameExtractor from "../video/frameExtractor.js";

let tempCanvas = null;
let tempCtx = null;
let frameSkip = 0;
let cachedReady = false;

export function init() {
  tempCanvas = document.createElement("canvas");
  tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
}

export function draw(ctx, w, h, state) {
  if (!tempCtx) return;
  const src = frameExtractor.getCanvas && frameExtractor.getCanvas();
  if (!src) return;

  frameSkip = (frameSkip + 1) | 0;
  const reprocess = !cachedReady || (frameSkip & 1) === 0;

  if (reprocess) {
    if (tempCanvas.width !== src.width || tempCanvas.height !== src.height) {
      tempCanvas.width = src.width;
      tempCanvas.height = src.height;
    }
    const img = frameExtractor.getImageData && frameExtractor.getImageData();
    if (!img) return;
    // Copy so we don't mutate the cached one.
    const out = tempCtx.createImageData(img.width, img.height);
    const sd = img.data;
    const dd = out.data;
    const thr = state.chromaThreshold || 0;
    // threshold 0..1 -> ratio 1.05..1.8 (lower = more aggressive)
    const ratio = 1.8 - thr * 0.75;
    const minG = 60 + ((thr * 80) | 0);
    const n = sd.length;
    for (let i = 0; i < n; i = (i + 4) | 0) {
      const r = sd[i] | 0;
      const g = sd[i + 1] | 0;
      const b = sd[i + 2] | 0;
      dd[i] = r;
      dd[i + 1] = g;
      dd[i + 2] = b;
      if (g > minG && g * 10 > (r * ratio * 10 | 0) && g * 10 > (b * ratio * 10 | 0)) {
        dd[i + 3] = 0;
      } else {
        dd[i + 3] = sd[i + 3];
      }
    }
    tempCtx.putImageData(out, 0, 0);
    cachedReady = true;
  }

  ctx.drawImage(tempCanvas, 0, 0, w, h);
}
