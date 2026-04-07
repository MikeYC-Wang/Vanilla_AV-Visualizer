// 360-degree FFT bar visualizer centered on the canvas.
// VHS palette: amber -> orange driven by frequency magnitude.

const BARS = 96;
const TWO_PI = Math.PI * 2;

// Pre-computed trig tables — built once at module load.
const cosT = new Float32Array(BARS);
const sinT = new Float32Array(BARS);
for (let i = 0; i < BARS; i++) {
  const a = (i / BARS) * TWO_PI - Math.PI * 0.5;
  cosT[i] = Math.cos(a);
  sinT[i] = Math.sin(a);
}

export function init() {}

export function draw(ctx, w, h, audio) {
  const freq = audio && audio.freq;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const minDim = w < h ? w : h;
  const innerR = minDim * 0.18;
  const maxLen = minDim * 0.22;

  // Sample stride across the freq bin range (use lower 75% — high bins are quiet).
  const binCount = freq ? freq.length : 0;
  const usable = binCount ? (binCount * 0.75) | 0 : 0;
  const stride = usable ? usable / BARS : 0;

  const rgbShift = (audio && audio.__rgbShift) || 0; // optional override
  // Read shift from state via global hint — but we keep it audio-agnostic by accepting via param.
  // Caller (renderer) passes audio with optional rgbShift; default 0.

  ctx.save();
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  // Two passes: red-offset and blue-offset for VHS chromatic feel.
  const offset = (audio && audio.__offset) || 0;

  for (let pass = 0; pass < 2; pass++) {
    const dx = pass === 0 ? -offset : offset;
    const colorChan = pass === 0 ? "rgba(255,40,20," : "rgba(40,120,255,";
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < BARS; i++) {
      const v = freq ? (freq[(i * stride) | 0] / 255) : 0;
      if (v <= 0.01) continue;
      const len = v * maxLen;
      const r0 = innerR;
      const r1 = innerR + len;
      const c = cosT[i];
      const s = sinT[i];
      const x0 = cx + c * r0 + dx;
      const y0 = cy + s * r0;
      const x1 = cx + c * r1 + dx;
      const y1 = cy + s * r1;
      const alpha = 0.35 + v * 0.45;
      ctx.strokeStyle = colorChan + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  // Main amber/orange pass on top.
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < BARS; i++) {
    const v = freq ? (freq[(i * stride) | 0] / 255) : 0;
    if (v <= 0.01) continue;
    const len = v * maxLen;
    const r0 = innerR;
    const r1 = innerR + len;
    const c = cosT[i];
    const s = sinT[i];
    const x0 = cx + c * r0;
    const y0 = cy + s * r0;
    const x1 = cx + c * r1;
    const y1 = cy + s * r1;
    // hue: 35 (amber) -> 25 (orange) as v increases
    const hue = 35 - v * 10;
    const light = 45 + v * 20;
    ctx.strokeStyle = "hsl(" + (hue | 0) + "," + "90%," + (light | 0) + "%)";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  ctx.restore();
}
