// ============================================================================
// Vanilla AV-Visualizer — single-file bundle
// Generated from src/. All ES modules inlined into one IIFE; cross-module
// references renamed with module prefixes to avoid collisions. Behaviourally
// identical to the modular build. Edit src/ for development; rebuild this file.
// ============================================================================
(function () {
  "use strict";

  // --------------------------------------------------------------------------
  // state.js
  // --------------------------------------------------------------------------
  const state = {
    source: null,
    url: "https://mdn.github.io/webaudio-examples/audio-basics/outfoxing.mp3",
    playing: false,

    fftSize: 2048,
    freqData: null,
    timeData: null,
    bass: 0,
    rms: 0,

    bassGain: 1.0,
    particleCount: 1000,
    glitchIntensity: 0.3,
    rgbShift: 4,
    chromaThreshold: 0.4,

    modules: {
      circularSpectrum: true,
      particles: true,
      rgbShift: true,
      glitch: true,
      chroma: false,
    },

    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    frame: 0,
  };

  // --------------------------------------------------------------------------
  // i18n.js
  // --------------------------------------------------------------------------
  const dict = {
    "zh-TW": {
      "app.title": "純前端影音視覺化引擎",
      "app.heading": "AV//視覺化",
      "app.sub": "原生 · canvas · vhs",
      "panel.source": "來源網址",
      "btn.load": "載入",
      "btn.file": "上傳檔案",
      "btn.mic": "麥克風",
      "btn.play": "播放",
      "btn.pause": "暫停",
      "sec.parameters": "參數",
      "sec.modules": "模組",
      "param.bassGain": "低頻增益",
      "param.particleCount": "粒子數量",
      "param.glitchIntensity": "故障強度",
      "param.rgbShift": "RGB 偏移",
      "param.chromaThreshold": "綠幕閾值",
      "mod.circularSpectrum": "環狀頻譜",
      "mod.particles": "粒子共振",
      "mod.rgbShift": "RGB 分離",
      "mod.glitch": "數位故障",
      "mod.chroma": "綠幕去背",
      "status.ready": "就緒",
      "status.loading": "載入中…",
      "status.playing": "播放中",
      "status.paused": "已暫停",
      "status.mic": "麥克風中",
      "status.error": "錯誤",
      "lang.toggle": "中 / EN",
      "error.unsupportedHost": "此網址為串流平台頁面，瀏覽器無法解析其音訊。請改用直連 .mp3/.mp4 檔案網址或上傳本地檔案。",
      "error.maybeNotMedia": "此網址看起來不是直連媒體檔，可能載入失敗",
      "sample.title": "範例",
      "sample.1": "範例 1",
      "sample.2": "範例 2",
      "sample.3": "範例 3",
    },
    "en": {
      "app.title": "Vanilla AV Visualizer",
      "app.heading": "AV//VISUALIZER",
      "app.sub": "vanilla · canvas · vhs",
      "panel.source": "Source URL",
      "btn.load": "Load",
      "btn.file": "Upload File",
      "btn.mic": "Microphone",
      "btn.play": "Play",
      "btn.pause": "Pause",
      "sec.parameters": "Parameters",
      "sec.modules": "Modules",
      "param.bassGain": "Bass Gain",
      "param.particleCount": "Particles",
      "param.glitchIntensity": "Glitch",
      "param.rgbShift": "RGB Shift",
      "param.chromaThreshold": "Chroma Threshold",
      "mod.circularSpectrum": "Circular Spectrum",
      "mod.particles": "Particles",
      "mod.rgbShift": "RGB Shift",
      "mod.glitch": "Glitch",
      "mod.chroma": "Chroma Key",
      "status.ready": "Ready",
      "status.loading": "Loading…",
      "status.playing": "Playing",
      "status.paused": "Paused",
      "status.mic": "Microphone Active",
      "status.error": "Error",
      "lang.toggle": "中 / EN",
      "error.unsupportedHost": "Streaming platform URLs cannot be decoded by the browser. Please use a direct .mp3/.mp4 file URL or upload a local file.",
      "error.maybeNotMedia": "URL doesn't look like a direct media file, may fail to load",
      "sample.title": "Samples",
      "sample.1": "Song 1",
      "sample.2": "Song 2",
      "sample.3": "Song 8",
    },
  };

  const I18N_STORAGE_KEY = "av-lang";
  let currentLang = (() => {
    try {
      const saved = localStorage.getItem(I18N_STORAGE_KEY);
      if (saved && dict[saved]) return saved;
    } catch (_) {}
    return "zh-TW";
  })();

  function getLang() { return currentLang; }
  function setLang(lang) {
    if (!dict[lang]) return;
    currentLang = lang;
    try { localStorage.setItem(I18N_STORAGE_KEY, lang); } catch (_) {}
  }
  function t(key) {
    const table = dict[currentLang] || dict["zh-TW"];
    let s = table[key] ?? dict["en"][key] ?? key;
    for (let i = 1; i < arguments.length; i++) s = s.replace(`{${i - 1}}`, String(arguments[i]));
    return s;
  }
  function applyTo(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });
    root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr") || "";
      spec.split(",").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s && s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    if (root === document || root === document.documentElement) {
      document.documentElement.setAttribute("lang", currentLang);
    }
    document.title = t("app.title");
    document.dispatchEvent(new CustomEvent("av:lang-change", { detail: { lang: currentLang } }));
  }

  // --------------------------------------------------------------------------
  // render/particlePool.js  (prefix: pool_)
  // --------------------------------------------------------------------------
  let pool_cap = 0;
  let pool_freeTop = 0;
  let pool_freeStack = null;
  let pool_x, pool_y, pool_vx, pool_vy, pool_life, pool_maxLife, pool_size, pool_hue;
  let pool_active;

  function pool_allocate(n) {
    pool_cap = n | 0;
    pool_x = new Float32Array(pool_cap);
    pool_y = new Float32Array(pool_cap);
    pool_vx = new Float32Array(pool_cap);
    pool_vy = new Float32Array(pool_cap);
    pool_life = new Float32Array(pool_cap);
    pool_maxLife = new Float32Array(pool_cap);
    pool_size = new Float32Array(pool_cap);
    pool_hue = new Float32Array(pool_cap);
    pool_active = new Uint8Array(pool_cap);
    pool_freeStack = new Int32Array(pool_cap);
    pool_freeTop = 0;
    for (let i = pool_cap - 1; i >= 0; i--) pool_freeStack[pool_freeTop++] = i;
  }
  function pool_init(ctxObj) {
    const n = (ctxObj && ctxObj.state && ctxObj.state.particleCount) || 1000;
    pool_allocate(n);
  }
  function pool_resize(n) {
    n = n | 0;
    if (n === pool_cap) return;
    pool_allocate(n);
  }
  function pool_capacity() { return pool_cap; }
  function pool_acquire() {
    if (pool_freeTop === 0) return -1;
    const i = pool_freeStack[--pool_freeTop];
    pool_active[i] = 1;
    return i;
  }
  function pool_release(i) {
    if (i < 0 || i >= pool_cap || !pool_active[i]) return;
    pool_active[i] = 0;
    pool_freeStack[pool_freeTop++] = i;
  }

  // --------------------------------------------------------------------------
  // audio/analyser.js  (prefix: an_)
  // --------------------------------------------------------------------------
  let an_audioCtx = null;
  let an_node = null;
  let an_freqArr = null;
  let an_timeArr = null;
  let an_currentSourceNode = null;

  const AN_HISTORY_LEN = 43;
  const an_bassHistory = new Float32Array(AN_HISTORY_LEN);
  let an_historyIdx = 0;
  let an_historyFilled = 0;
  let an_lastBeatAt = -Infinity;
  const AN_BEAT_COOLDOWN_MS = 200;

  function an_ensureCtx() {
    if (an_audioCtx) return an_audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    an_audioCtx = new AC();
    an_node = an_audioCtx.createAnalyser();
    an_node.fftSize = state.fftSize || 2048;
    an_node.smoothingTimeConstant = 0.82;
    an_freqArr = new Uint8Array(an_node.frequencyBinCount);
    an_timeArr = new Uint8Array(an_node.fftSize);
    state.freqData = an_freqArr;
    state.timeData = an_timeArr;
    state.audio = {
      freq: an_freqArr, time: an_timeArr,
      bass: 0, mid: 0, treble: 0, rms: 0, beat: false,
    };
    return an_audioCtx;
  }
  function an_resumeOnGesture() {
    if (!an_audioCtx) return;
    if (an_audioCtx.state === "suspended") an_audioCtx.resume().catch(() => {});
  }
  function an_attachSource(detail) {
    an_ensureCtx();
    an_resumeOnGesture();
    if (an_currentSourceNode) {
      try { an_currentSourceNode.disconnect(); } catch (_) {}
      an_currentSourceNode = null;
    }
    if (detail.type === "mic" && detail.stream) {
      an_currentSourceNode = an_audioCtx.createMediaStreamSource(detail.stream);
      an_currentSourceNode.connect(an_node);
    } else if (detail.element) {
      try {
        an_currentSourceNode = an_audioCtx.createMediaElementSource(detail.element);
      } catch (e) {
        return;
      }
      an_currentSourceNode.connect(an_node);
      an_node.connect(an_audioCtx.destination);
    }
  }
  function an_init() {
    const gesture = () => {
      an_ensureCtx();
      an_resumeOnGesture();
      window.removeEventListener("pointerdown", gesture);
      window.removeEventListener("keydown", gesture);
    };
    window.addEventListener("pointerdown", gesture);
    window.addEventListener("keydown", gesture);
    window.addEventListener("av:source-ready", (ev) => {
      an_attachSource(ev.detail || {});
    });
  }
  function an_update() {
    if (!an_node) return;
    an_node.getByteFrequencyData(an_freqArr);
    an_node.getByteTimeDomainData(an_timeArr);

    const binCount = an_freqArr.length;
    let sum = 0;
    for (let i = 0; i < 8; i = (i + 1) | 0) sum += an_freqArr[i];
    const bass = (sum / 8) / 255;

    sum = 0;
    const midStart = 9, midEnd = 64;
    for (let i = midStart; i < midEnd; i = (i + 1) | 0) sum += an_freqArr[i];
    const mid = (sum / (midEnd - midStart)) / 255;

    sum = 0;
    const trebStart = 64, trebEnd = Math.min(256, binCount);
    for (let i = trebStart; i < trebEnd; i = (i + 1) | 0) sum += an_freqArr[i];
    const treble = (sum / (trebEnd - trebStart)) / 255;

    let acc = 0;
    const N = an_timeArr.length;
    for (let i = 0; i < N; i = (i + 1) | 0) {
      const v = an_timeArr[i] - 128;
      acc += v * v;
    }
    const rms = Math.sqrt(acc / N) / 128;

    let avg = 0;
    const len = an_historyFilled || 1;
    for (let i = 0; i < len; i = (i + 1) | 0) avg += an_bassHistory[i];
    avg /= len;

    let beat = false;
    const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
    if (an_historyFilled >= 8 && bass > avg * 1.45 && bass > 0.15 && (now - an_lastBeatAt) > AN_BEAT_COOLDOWN_MS) {
      beat = true;
      an_lastBeatAt = now;
    }
    an_bassHistory[an_historyIdx] = bass;
    an_historyIdx = (an_historyIdx + 1) % AN_HISTORY_LEN;
    if (an_historyFilled < AN_HISTORY_LEN) an_historyFilled++;

    state.bass = bass;
    state.rms = rms;
    const a = state.audio;
    a.bass = bass; a.mid = mid; a.treble = treble; a.rms = rms; a.beat = beat;
  }

  // --------------------------------------------------------------------------
  // input/sourceManager.js  (prefix: sm_)
  // --------------------------------------------------------------------------
  let sm_currentMedia = null;
  let sm_currentStream = null;
  let sm_currentObjectURL = null;

  const SM_BLOCKED_HOST_RE = /(?:youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|bilibili\.com|vimeo\.com|tiktok\.com)/i;
  const SM_MEDIA_EXT_RE = /\.(mp3|wav|ogg|m4a|flac|aac|opus|mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
  const SM_MEDIA_PATH_HINT_RE = /\/(audio|media|sound|music|stream)\//i;

  function sm_setStatus(msg) {
    state.status = msg;
    const el = typeof document !== "undefined" && document.getElementById("status");
    if (el) el.textContent = msg;
  }
  function sm_isVideoUrl(url) {
    return /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url);
  }
  function sm_disposeCurrent() {
    if (sm_currentMedia) {
      try { sm_currentMedia.pause(); } catch (_) {}
      try { sm_currentMedia.removeAttribute("src"); sm_currentMedia.load(); } catch (_) {}
      if (sm_currentMedia.parentNode) sm_currentMedia.parentNode.removeChild(sm_currentMedia);
    }
    if (sm_currentObjectURL) {
      try { URL.revokeObjectURL(sm_currentObjectURL); } catch (_) {}
      sm_currentObjectURL = null;
    }
    if (sm_currentStream) {
      try { sm_currentStream.getTracks().forEach((tr) => tr.stop()); } catch (_) {}
    }
    sm_currentMedia = null;
    sm_currentStream = null;
  }
  function sm_makeMediaElement(url, isVideo) {
    const el = document.createElement(isVideo ? "video" : "audio");
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    el.playsInline = true;
    el.style.display = "none";
    el.src = url;
    document.body.appendChild(el);
    el.addEventListener("error", () => {
      sm_setStatus("ERR " + (el.error?.message || "load failed"));
    });
    return el;
  }
  function sm_dispatchReady(type, payload) {
    const detail = type === "mic"
      ? { type, stream: payload }
      : { type, element: payload };
    window.dispatchEvent(new CustomEvent("av:source-ready", { detail }));
  }
  function sm_init() { /* no-op */ }

  function sm_loadFromURL(url) {
    if (!url) return null;

    // Block streaming-platform page URLs — browser can't decode those.
    if (SM_BLOCKED_HOST_RE.test(url)) {
      sm_setStatus(t("error.unsupportedHost"));
      return null;
    }

    // Warn when URL doesn't look like a direct media file.
    if (!SM_MEDIA_EXT_RE.test(url) && !SM_MEDIA_PATH_HINT_RE.test(url)) {
      sm_setStatus(t("error.maybeNotMedia"));
      // still attempt
    }

    sm_disposeCurrent();
    const isVideo = sm_isVideoUrl(url);
    const el = sm_makeMediaElement(url, isVideo);
    sm_currentMedia = el;
    state.source = "url";
    if (SM_MEDIA_EXT_RE.test(url) || SM_MEDIA_PATH_HINT_RE.test(url)) {
      sm_setStatus("LOAD " + (isVideo ? "VIDEO" : "AUDIO"));
    }
    el.addEventListener("loadedmetadata", () => {
      sm_setStatus("READY");
      sm_dispatchReady(isVideo ? "video" : "audio", el);
    }, { once: true });
    return el;
  }

  function sm_loadFromFile(file) {
    if (!file) return null;
    sm_disposeCurrent();
    const url = URL.createObjectURL(file);
    sm_currentObjectURL = url;
    const isVideo = file.type.startsWith("video/") || sm_isVideoUrl(file.name);
    const el = document.createElement(isVideo ? "video" : "audio");
    el.preload = "auto";
    el.playsInline = true;
    el.style.display = "none";
    el.src = url;
    document.body.appendChild(el);
    el.addEventListener("error", () => sm_setStatus("ERR file load"));
    sm_currentMedia = el;
    state.source = "file";
    sm_setStatus("FILE " + file.name);
    el.addEventListener("loadedmetadata", () => {
      sm_setStatus("READY");
      sm_dispatchReady(isVideo ? "video" : "audio", el);
    }, { once: true });
    return el;
  }

  async function sm_startMicrophone() {
    sm_disposeCurrent();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sm_currentStream = stream;
      state.source = "mic";
      sm_setStatus("MIC LIVE");
      sm_dispatchReady("mic", stream);
      return stream;
    } catch (err) {
      sm_setStatus("ERR mic: " + (err?.message || err));
      return null;
    }
  }

  function sm_play() {
    if (sm_currentMedia) {
      const p = sm_currentMedia.play();
      if (p && p.catch) p.catch((e) => sm_setStatus("ERR play: " + e.message));
      state.playing = true;
    }
  }
  function sm_pause() {
    if (sm_currentMedia) {
      sm_currentMedia.pause();
      state.playing = false;
    }
  }
  function sm_setPlaying(playing) {
    if (playing) sm_play(); else sm_pause();
  }

  // Legacy aliases
  const sm_loadUrl = sm_loadFromURL;
  const sm_loadFile = sm_loadFromFile;
  const sm_loadMic = sm_startMicrophone;

  // --------------------------------------------------------------------------
  // video/frameExtractor.js  (prefix: fx_)
  // --------------------------------------------------------------------------
  let fx_video = null;
  let fx_canvas = null;
  let fx_ctx = null;
  let fx_cachedImageData = null;
  let fx_lastFrameAt = -1;
  const FX_MAX_W = 640;

  function fx_init() {
    fx_canvas = document.createElement("canvas");
    fx_canvas.width = 2;
    fx_canvas.height = 2;
    fx_ctx = fx_canvas.getContext("2d", { willReadFrequently: true });

    window.addEventListener("av:source-ready", (ev) => {
      const detail = ev.detail || {};
      if (detail.element instanceof HTMLVideoElement) {
        fx_setSource(detail.element);
      } else {
        fx_setSource(null);
      }
    });
  }
  function fx_setSource(videoElement) {
    fx_video = videoElement || null;
    fx_cachedImageData = null;
    fx_lastFrameAt = -1;
  }
  function fx_update() {
    if (!fx_video || !fx_ctx) return;
    if (fx_video.readyState < 2) return;
    const vw = fx_video.videoWidth | 0;
    const vh = fx_video.videoHeight | 0;
    if (!vw || !vh) return;
    const scale = vw > FX_MAX_W ? FX_MAX_W / vw : 1;
    const w = Math.max(1, (vw * scale) | 0);
    const h = Math.max(1, (vh * scale) | 0);
    if (fx_canvas.width !== w || fx_canvas.height !== h) {
      fx_canvas.width = w;
      fx_canvas.height = h;
    }
    fx_ctx.drawImage(fx_video, 0, 0, w, h);
    fx_cachedImageData = null;
    fx_lastFrameAt = performance.now();
  }
  function fx_getCanvas() {
    if (!fx_video || !fx_canvas || fx_canvas.width < 4) return null;
    return fx_canvas;
  }
  function fx_getImageData() {
    if (!fx_getCanvas()) return null;
    if (!fx_cachedImageData) {
      try {
        fx_cachedImageData = fx_ctx.getImageData(0, 0, fx_canvas.width, fx_canvas.height);
      } catch (_) {
        return null;
      }
    }
    return fx_cachedImageData;
  }

  // --------------------------------------------------------------------------
  // modules/circularSpectrum.js  (prefix: cs_)
  // --------------------------------------------------------------------------
  const CS_BARS = 96;
  const CS_TWO_PI = Math.PI * 2;
  const cs_cosT = new Float32Array(CS_BARS);
  const cs_sinT = new Float32Array(CS_BARS);
  for (let i = 0; i < CS_BARS; i++) {
    const a = (i / CS_BARS) * CS_TWO_PI - Math.PI * 0.5;
    cs_cosT[i] = Math.cos(a);
    cs_sinT[i] = Math.sin(a);
  }
  function cs_init() {}
  function cs_draw(ctx, w, h, audio) {
    const freq = audio && audio.freq;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const minDim = w < h ? w : h;
    const innerR = minDim * 0.18;
    const maxLen = minDim * 0.22;
    const binCount = freq ? freq.length : 0;
    const usable = binCount ? (binCount * 0.75) | 0 : 0;
    const stride = usable ? usable / CS_BARS : 0;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const offset = (audio && audio.__offset) || 0;

    for (let pass = 0; pass < 2; pass++) {
      const dx = pass === 0 ? -offset : offset;
      const colorChan = pass === 0 ? "rgba(255,40,20," : "rgba(40,120,255,";
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < CS_BARS; i++) {
        const v = freq ? (freq[(i * stride) | 0] / 255) : 0;
        if (v <= 0.01) continue;
        const len = v * maxLen;
        const r0 = innerR;
        const r1 = innerR + len;
        const c = cs_cosT[i];
        const s = cs_sinT[i];
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

    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < CS_BARS; i++) {
      const v = freq ? (freq[(i * stride) | 0] / 255) : 0;
      if (v <= 0.01) continue;
      const len = v * maxLen;
      const r0 = innerR;
      const r1 = innerR + len;
      const c = cs_cosT[i];
      const s = cs_sinT[i];
      const x0 = cx + c * r0;
      const y0 = cy + s * r0;
      const x1 = cx + c * r1;
      const y1 = cy + s * r1;
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

  // --------------------------------------------------------------------------
  // modules/particles.js  (prefix: particles_)
  // --------------------------------------------------------------------------
  const PARTICLES_TWO_PI = Math.PI * 2;
  const PARTICLES_DAMPING = 0.96;
  const PARTICLES_PER_BEAT = 40;
  let particles_lastBeatFrame = -1;

  function particles_init(arg) {
    const st = (arg && arg.state) ? arg.state : arg;
    if (!pool_capacity()) {
      pool_init({ state: st });
    }
  }
  function particles_spawn(st) {
    const audio = st.audio || {};
    const bass = audio.bass || 0;
    const cx = st.width * 0.5;
    const cy = st.height * 0.5;
    const speedBase = 2 + bass * 8;

    for (let k = 0; k < PARTICLES_PER_BEAT; k++) {
      const i = pool_acquire();
      if (i < 0) break;
      const a = Math.random() * PARTICLES_TWO_PI;
      const sp = speedBase * (0.6 + Math.random() * 0.8);
      pool_x[i] = cx;
      pool_y[i] = cy;
      pool_vx[i] = Math.cos(a) * sp;
      pool_vy[i] = Math.sin(a) * sp;
      const lf = 60 + (Math.random() * 40) | 0;
      pool_life[i] = lf;
      pool_maxLife[i] = lf;
      pool_size[i] = 1.5 + Math.random() * 2.5;
      pool_hue[i] = 15 + Math.random() * 30;
    }
  }
  function particles_update(st, dt) {
    const audio = st.audio || {};
    if (audio.beat === true && st.frame !== particles_lastBeatFrame) {
      particles_spawn(st);
      particles_lastBeatFrame = st.frame;
    }
    const w = st.width, h = st.height;
    const cap = pool_capacity();
    for (let i = 0; i < cap; i++) {
      if (!pool_active[i]) continue;
      pool_vx[i] *= PARTICLES_DAMPING;
      pool_vy[i] *= PARTICLES_DAMPING;
      pool_x[i] += pool_vx[i];
      pool_y[i] += pool_vy[i];
      pool_life[i] -= 1;
      if (pool_life[i] <= 0 || pool_x[i] < -8 || pool_y[i] < -8 || pool_x[i] > w + 8 || pool_y[i] > h + 8) {
        pool_release(i);
      }
    }
  }
  function particles_draw(ctx, w, h, st) {
    const cap = pool_capacity();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < cap; i++) {
      if (!pool_active[i]) continue;
      const tt = pool_life[i] / pool_maxLife[i];
      const alpha = tt * 0.85;
      const r = pool_size[i];
      ctx.fillStyle = "hsla(" + (pool_hue[i] | 0) + ",95%,60%," + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(pool_x[i], pool_y[i], r, 0, PARTICLES_TWO_PI);
      ctx.fill();
    }
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // modules/rgbShift.js  (prefix: rgb_)
  // --------------------------------------------------------------------------
  let rgb_tintR = null, rgb_tintG = null, rgb_tintB = null;
  function rgb_ensureTint(w, h) {
    if (!rgb_tintR || rgb_tintR.width !== w || rgb_tintR.height !== h) {
      rgb_tintR = document.createElement("canvas"); rgb_tintR.width = w; rgb_tintR.height = h;
      rgb_tintG = document.createElement("canvas"); rgb_tintG.width = w; rgb_tintG.height = h;
      rgb_tintB = document.createElement("canvas"); rgb_tintB.width = w; rgb_tintB.height = h;
    }
  }
  function rgb_paintChannel(temp, src, color) {
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
  function rgb_init() {}
  function rgb_draw(ctx, w, h, st) {
    const bass = (st.audio && st.audio.bass) || 0;
    const dx = (st.rgbShift || 0) * (1 + bass * 4);
    const src = fx_getCanvas();
    if (src) {
      rgb_ensureTint(w, h);
      rgb_paintChannel(rgb_tintR, src, "#ff0000");
      rgb_paintChannel(rgb_tintG, src, "#00ff00");
      rgb_paintChannel(rgb_tintB, src, "#0000ff");
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(rgb_tintR, -dx, 0);
      ctx.drawImage(rgb_tintG, 0, 0);
      ctx.drawImage(rgb_tintB, dx, 0);
      ctx.restore();
      return;
    }
    if (dx < 0.5) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.5;
    ctx.drawImage(ctx.canvas, -dx, 0, ctx.canvas.width, ctx.canvas.height, -dx, 0, w, h);
    ctx.drawImage(ctx.canvas, dx, 0, ctx.canvas.width, ctx.canvas.height, dx, 0, w, h);
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // modules/glitch.js  (prefix: glitch_)
  // --------------------------------------------------------------------------
  function glitch_init() {}
  function glitch_draw(ctx, w, h, st) {
    const intensity = st.glitchIntensity || 0;
    const beat = !!(st.audio && st.audio.beat);
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

  // --------------------------------------------------------------------------
  // modules/chroma.js  (prefix: chroma_)
  // --------------------------------------------------------------------------
  let chroma_tempCanvas = null;
  let chroma_tempCtx = null;
  let chroma_frameSkip = 0;
  let chroma_cachedReady = false;

  function chroma_init() {
    chroma_tempCanvas = document.createElement("canvas");
    chroma_tempCtx = chroma_tempCanvas.getContext("2d", { willReadFrequently: true });
  }
  function chroma_draw(ctx, w, h, st) {
    if (!chroma_tempCtx) return;
    const src = fx_getCanvas();
    if (!src) return;

    chroma_frameSkip = (chroma_frameSkip + 1) | 0;
    const reprocess = !chroma_cachedReady || (chroma_frameSkip & 1) === 0;

    if (reprocess) {
      if (chroma_tempCanvas.width !== src.width || chroma_tempCanvas.height !== src.height) {
        chroma_tempCanvas.width = src.width;
        chroma_tempCanvas.height = src.height;
      }
      const img = fx_getImageData();
      if (!img) return;
      const out = chroma_tempCtx.createImageData(img.width, img.height);
      const sd = img.data;
      const dd = out.data;
      const thr = st.chromaThreshold || 0;
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
      chroma_tempCtx.putImageData(out, 0, 0);
      chroma_cachedReady = true;
    }
    ctx.drawImage(chroma_tempCanvas, 0, 0, w, h);
  }

  // --------------------------------------------------------------------------
  // render/renderer.js  (prefix: renderer_)
  // --------------------------------------------------------------------------
  let renderer_canvasRef = null;
  let renderer_ctx = null;
  let renderer_grainCanvas = null;
  let renderer_grainCtx = null;
  let renderer_grainFrame = 0;
  const RENDERER_GRAIN_REGEN = 10;
  const RENDERER_GRAIN_W = 256;
  const RENDERER_GRAIN_H = 256;

  function renderer_regenGrain() {
    const img = renderer_grainCtx.createImageData(RENDERER_GRAIN_W, RENDERER_GRAIN_H);
    const d = img.data;
    for (let i = 0, n = d.length; i < n; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = v;
      d[i + 1] = (v * 0.7) | 0;
      d[i + 2] = (v * 0.4) | 0;
      d[i + 3] = 18;
    }
    renderer_grainCtx.putImageData(img, 0, 0);
  }
  function renderer_drawVhsBase(w, h, tt) {
    const g = renderer_ctx.createRadialGradient(w * 0.5, h * 0.42, 40, w * 0.5, h * 0.5, (w > h ? w : h) * 0.7);
    g.addColorStop(0, "#3a1a08");
    g.addColorStop(0.55, "#1f0d05");
    g.addColorStop(1, "#0a0502");
    renderer_ctx.fillStyle = g;
    renderer_ctx.fillRect(0, 0, w, h);

    renderer_ctx.save();
    renderer_ctx.globalAlpha = 0.05;
    renderer_ctx.fillStyle = "#ffb347";
    const bandH = 2;
    const offset = (tt * 0.04) % (bandH * 2);
    for (let y = -offset; y < h; y += bandH * 2) {
      renderer_ctx.fillRect(0, y, w, bandH);
    }
    renderer_ctx.restore();

    renderer_ctx.strokeStyle = "rgba(255,179,71,0.06)";
    renderer_ctx.lineWidth = 1;
    renderer_ctx.beginPath();
    renderer_ctx.moveTo(w * 0.5, 0); renderer_ctx.lineTo(w * 0.5, h);
    renderer_ctx.moveTo(0, h * 0.5); renderer_ctx.lineTo(w, h * 0.5);
    renderer_ctx.stroke();
  }
  function renderer_init(arg) {
    if (arg && arg.canvas) {
      renderer_canvasRef = arg.canvas;
      renderer_ctx = arg.ctx || renderer_canvasRef.getContext("2d", { alpha: false });
    } else if (arg && arg.getContext) {
      renderer_canvasRef = arg;
      renderer_ctx = renderer_canvasRef.getContext("2d", { alpha: false });
    }
    renderer_grainCanvas = document.createElement("canvas");
    renderer_grainCanvas.width = RENDERER_GRAIN_W;
    renderer_grainCanvas.height = RENDERER_GRAIN_H;
    renderer_grainCtx = renderer_grainCanvas.getContext("2d");
    renderer_regenGrain();
  }
  function renderer_draw(st, dt) {
    if (!renderer_ctx) return;
    const w = st.width, h = st.height;
    if (!w || !h) return;

    renderer_ctx.save();
    renderer_ctx.globalCompositeOperation = "source-over";
    renderer_ctx.fillStyle = "rgba(15,8,5,0.18)";
    renderer_ctx.fillRect(0, 0, w, h);
    renderer_ctx.restore();

    renderer_drawVhsBase(w, h, st.time);

    const audio = st.audio || { freq: null, time: null, bass: 0, mid: 0, treble: 0, rms: 0, beat: false };
    audio.__offset = (st.rgbShift || 0) * 0.5;

    if (st.modules.rgbShift) { try { rgb_draw(renderer_ctx, w, h, st); } catch (_) {} }
    if (st.modules.chroma)   { try { chroma_draw(renderer_ctx, w, h, st); } catch (_) {} }
    if (st.modules.glitch)   { try { glitch_draw(renderer_ctx, w, h, st); } catch (_) {} }

    if (st.modules.circularSpectrum) {
      try { cs_draw(renderer_ctx, w, h, audio); } catch (_) {}
    }
    if (st.modules.particles) {
      try { particles_draw(renderer_ctx, w, h, st); } catch (_) {}
    }

    renderer_grainFrame++;
    if ((renderer_grainFrame % RENDERER_GRAIN_REGEN) === 0) renderer_regenGrain();
    renderer_ctx.save();
    renderer_ctx.globalCompositeOperation = "lighter";
    renderer_ctx.globalAlpha = 0.35;
    for (let gy = 0; gy < h; gy += RENDERER_GRAIN_H) {
      for (let gx = 0; gx < w; gx += RENDERER_GRAIN_W) {
        renderer_ctx.drawImage(renderer_grainCanvas, gx, gy);
      }
    }
    renderer_ctx.restore();
  }

  // --------------------------------------------------------------------------
  // ui/controlPanel.js  (prefix: cp_)
  // --------------------------------------------------------------------------
  const CP_NUM_PARAMS = ["bassGain", "particleCount", "glitchIntensity", "rgbShift", "chromaThreshold"];

  function cp_fmt(key, v) {
    if (key === "particleCount" || key === "rgbShift") return String(Math.round(v));
    return Number(v).toFixed(2);
  }
  function cp_setStatus(kind) {
    const el = document.getElementById("status");
    if (!el) return;
    const key = "status." + kind;
    el.setAttribute("data-i18n", key);
    el.textContent = t(key);
  }
  function cp_init(opts) {
    const st = opts.state;
    const onLoadUrl = opts.onLoadUrl;
    const onFile = opts.onFile;
    const onMic = opts.onMic;
    const onPlayToggle = opts.onPlayToggle;

    applyTo(document);

    for (const key of CP_NUM_PARAMS) {
      const input = document.getElementById(key);
      const out = document.querySelector(`[data-val="${key}"]`);
      if (!input) continue;
      input.value = st[key];
      if (out) out.textContent = cp_fmt(key, st[key]);
      input.addEventListener("input", () => {
        const v = parseFloat(input.value);
        st[key] = v;
        if (out) out.textContent = cp_fmt(key, v);
      });
    }

    document.querySelectorAll('.tgl input[type="checkbox"]').forEach((cb) => {
      const key = cb.dataset.mod;
      if (!key) return;
      cb.checked = !!st.modules[key];
      cb.addEventListener("change", () => {
        st.modules[key] = cb.checked;
      });
    });

    const urlInput = document.getElementById("url-input");
    const btnLoad = document.getElementById("btn-load");
    if (urlInput) urlInput.value = st.url;
    if (btnLoad && urlInput) {
      btnLoad.addEventListener("click", () => {
        cp_setStatus("loading");
        onLoadUrl && onLoadUrl(urlInput.value.trim());
      });
      urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          cp_setStatus("loading");
          onLoadUrl && onLoadUrl(urlInput.value.trim());
        }
      });
    }

    // Sample buttons — set URL input and trigger load.
    document.querySelectorAll("[data-sample-url]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-sample-url");
        if (!url) return;
        if (urlInput) urlInput.value = url;
        cp_setStatus("loading");
        onLoadUrl && onLoadUrl(url);
      });
    });

    const fileInput = document.getElementById("file-input");
    fileInput && fileInput.addEventListener("change", () => {
      const f = fileInput.files && fileInput.files[0];
      if (f) { cp_setStatus("loading"); onFile && onFile(f); }
    });

    const btnMic = document.getElementById("btn-mic");
    btnMic && btnMic.addEventListener("click", () => {
      cp_setStatus("mic");
      onMic && onMic();
    });

    const btnPlay = document.getElementById("btn-play");
    btnPlay && btnPlay.addEventListener("click", () => {
      const playing = onPlayToggle && onPlayToggle();
      btnPlay.setAttribute("data-i18n", playing ? "btn.pause" : "btn.play");
      btnPlay.textContent = t(playing ? "btn.pause" : "btn.play");
      cp_setStatus(playing ? "playing" : "paused");
    });

    const btnLang = document.getElementById("btn-lang");
    btnLang && btnLang.addEventListener("click", () => {
      setLang(getLang() === "zh-TW" ? "en" : "zh-TW");
      applyTo(document);
    });

    document.addEventListener("av:lang-change", () => {
      if (btnPlay) btnPlay.textContent = t(btnPlay.getAttribute("data-i18n") || "btn.play");
    });
  }

  // --------------------------------------------------------------------------
  // main.js  (entry)
  // --------------------------------------------------------------------------
  function boot() {
    const canvas = document.getElementById("stage");
    if (!canvas) return;
    const mainCtx = canvas.getContext("2d", { alpha: false });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.dpr = dpr;
      state.width = canvas.clientWidth;
      state.height = canvas.clientHeight;
      canvas.width = Math.floor(state.width * dpr);
      canvas.height = Math.floor(state.height * dpr);
      mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    // Module init (stub-safe).
    const initArg = { canvas, ctx: mainCtx, state };
    try { sm_init(); } catch (_) {}
    try { an_init(); } catch (_) {}
    try { fx_init(); } catch (_) {}
    try { renderer_init(initArg); } catch (_) {}
    try { pool_init(initArg); } catch (_) {}
    try { cs_init(); } catch (_) {}
    try { particles_init(initArg); } catch (_) {}
    try { rgb_init(); } catch (_) {}
    try { glitch_init(); } catch (_) {}
    try { chroma_init(); } catch (_) {}

    cp_init({
      state,
      onLoadUrl: (url) => {
        state.url = url;
        mainSetStatus("LOAD " + truncate(url, 24));
        sm_loadFromURL(url);
      },
      onFile: (file) => {
        mainSetStatus("FILE " + truncate(file.name, 22));
        sm_loadFromFile(file);
      },
      onMic: () => {
        mainSetStatus("MIC LIVE");
        sm_startMicrophone();
      },
      onPlayToggle: () => {
        state.playing = !state.playing;
        mainSetStatus(state.playing ? "PLAY" : "PAUSE");
        sm_setPlaying(state.playing);
        return state.playing;
      },
    });

    function mainSetStatus(msg) {
      const el = document.getElementById("status");
      if (el) el.textContent = msg;
    }
    function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

    const hudTime = document.getElementById("hud-time");
    function updateHud() {
      if (!hudTime) return;
      const s = Math.floor(state.time / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, "0");
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      hudTime.textContent = `${hh}:${mm}:${ss}`;
    }

    let last = performance.now();
    function frame(now) {
      const dt = now - last;
      last = now;
      state.time += dt;
      state.frame++;

      try { an_update(); } catch (_) {}
      try { fx_update(); } catch (_) {}

      if (state.modules.particles) { try { particles_update(state, dt); } catch (_) {} }

      try { renderer_draw(state, dt); } catch (_) {}

      updateHud();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame((tt) => { last = tt; frame(tt); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
