// RGB channel separation post-effect driven by bass energy.

import * as frameExtractor from "../video/frameExtractor.js";

let tintR = null, tintG = null, tintB = null;

function ensureTint(w, h) {
  if (!tintR || tintR.width !== w || tintR.height !== h) {
    tintR = document.createElement("canvas"); tintR.width = w; tintR.height = h;
    tintG = document.createElement("canvas"); tintG.width = w; tintG.height = h;
    tintB = document.createElement("canvas"); tintB.width = w; tintB.height = h;
  }
}

function paintChannel(temp, src, color) {
  const c = temp.getContext("2d");
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, temp.width, temp.height);
  c.drawImage(src, 0, 0, temp.width, temp.height);
  c.globalCompositeOperation = "multiply";
  c.fillStyle = color;
  c.fillRect(0, 0, temp.width, temp.height);
  c.globalCompositeOperation = "destination-in";
  c.drawImage(src, 0, 0, temp.width, temp.height);
  c.globalCompositeOperation = "source-over";
}

export function init() {}

export function draw(ctx, w, h, state) {
  const bass = (state.audio && state.audio.bass) || 0;
  const dx = (state.rgbShift || 0) * (1 + bass * 4);
  const src = frameExtractor.getCanvas && frameExtractor.getCanvas();

  if (src) {
    ensureTint(w, h);
    paintChannel(tintR, src, "#ff0000");
    paintChannel(tintG, src, "#00ff00");
    paintChannel(tintB, src, "#0000ff");

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(tintR, -dx, 0);
    ctx.drawImage(tintG, 0, 0);
    ctx.drawImage(tintB, dx, 0);
    ctx.restore();
    return;
  }

  // Fallback: shift existing canvas content cheaply.
  if (dx < 0.5) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.5;
  ctx.drawImage(ctx.canvas, -dx, 0, ctx.canvas.width, ctx.canvas.height, -dx, 0, w, h);
  ctx.drawImage(ctx.canvas, dx, 0, ctx.canvas.width, ctx.canvas.height, dx, 0, w, h);
  ctx.restore();
}
