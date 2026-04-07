// Tiny i18n for AV-Visualizer. zh-TW default, en toggle. Persists to localStorage.

export const dict = {
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
    "sample.1": "輕音樂",
    "sample.2": "節奏",
    "sample.3": "電子",
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
    "sample.1": "Lo-Fi",
    "sample.2": "Beat",
    "sample.3": "Electronic",
  },
};

const STORAGE_KEY = "av-lang";
let current = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && dict[saved]) return saved;
  } catch (_) {}
  return "zh-TW";
})();

export function getLang() {
  return current;
}

export function setLang(lang) {
  if (!dict[lang]) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
}

export function t(key, ...args) {
  const table = dict[current] || dict["zh-TW"];
  let s = table[key] ?? dict["en"][key] ?? key;
  args.forEach((a, i) => { s = s.replace(`{${i}}`, String(a)); });
  return s;
}

export function applyTo(root = document) {
  // textContent
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  // attribute translations: "placeholder:key, title:key"
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const spec = el.getAttribute("data-i18n-attr") || "";
    spec.split(",").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s && s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
  // <html lang>
  if (root === document || root === document.documentElement) {
    document.documentElement.setAttribute("lang", current);
  }
  // <title>
  document.title = t("app.title");

  document.dispatchEvent(new CustomEvent("av:lang-change", { detail: { lang: current } }));
}

export default { dict, getLang, setLang, t, applyTo };
