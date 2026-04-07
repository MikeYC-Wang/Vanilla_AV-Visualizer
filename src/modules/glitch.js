// Random horizontal slice displacement glitch.

export function init() {}

export function draw(ctx, w, h, state) {
  const intensity = state.glitchIntensity || 0;
  const beat = !!(state.audio && state.audio.beat);
  const trigger = beat || Math.random() < intensity * 0.15;
  if (!trigger) return;

  const slices = 1 + ((Math.random() * 4) | 0);
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const sxScale = cw / w;
  const syScale = ch / h;

  for (let i = 0; i < slices; i++) {
    const sy = (Math.random() * h) | 0;
    const sh = 4 + ((Math.random() * 60) | 0);
    const dxOff = ((Math.random() * 120) | 0) - 60;
    if (sy + sh > h) continue;
    ctx.drawImage(
      ctx.canvas,
      0, (sy * syScale) | 0, cw, (sh * syScale) | 0,
      dxOff, sy, w, sh
    );
  }

  // Color noise lines.
  const lineCount = 1 + ((Math.random() * 2) | 0);
  ctx.save();
  for (let i = 0; i < lineCount; i++) {
    const ny = (Math.random() * h) | 0;
    const nh = 1 + ((Math.random() * 2) | 0);
    ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,60,80,0.55)" : "rgba(80,220,255,0.55)";
    ctx.fillRect(0, ny, w, nh);
  }
  ctx.restore();
}
