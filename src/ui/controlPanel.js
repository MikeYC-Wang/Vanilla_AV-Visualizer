// Wires DOM controls to the central state object.

import { setLang, getLang, applyTo, t } from "../i18n.js";

const NUM_PARAMS = ["bassGain", "particleCount", "glitchIntensity", "rgbShift", "chromaThreshold"];

function fmt(key, v) {
  if (key === "particleCount" || key === "rgbShift") return String(Math.round(v));
  return Number(v).toFixed(2);
}

export function init({ state, onLoadUrl, onFile, onMic, onPlayToggle }) {
  // Apply initial translations
  applyTo(document);

  // Sliders
  for (const key of NUM_PARAMS) {
    const input = document.getElementById(key);
    const out = document.querySelector(`[data-val="${key}"]`);
    if (!input) continue;
    input.value = state[key];
    if (out) out.textContent = fmt(key, state[key]);
    input.addEventListener("input", () => {
      const v = parseFloat(input.value);
      state[key] = v;
      if (out) out.textContent = fmt(key, v);
    });
  }

  // Module toggles
  document.querySelectorAll('.tgl input[type="checkbox"]').forEach((cb) => {
    const key = cb.dataset.mod;
    if (!key) return;
    cb.checked = !!state.modules[key];
    cb.addEventListener("change", () => {
      state.modules[key] = cb.checked;
    });
  });

  // URL load
  const urlInput = document.getElementById("url-input");
  const btnLoad = document.getElementById("btn-load");
  if (urlInput) urlInput.value = state.url;
  if (btnLoad && urlInput) {
    btnLoad.addEventListener("click", () => {
      setStatus("loading");
      onLoadUrl?.(urlInput.value.trim());
    });
    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        setStatus("loading");
        onLoadUrl?.(urlInput.value.trim());
      }
    });
  }

  // File input
  const fileInput = document.getElementById("file-input");
  fileInput?.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (f) { setStatus("loading"); onFile?.(f); }
  });

  // Mic
  document.getElementById("btn-mic")?.addEventListener("click", () => {
    setStatus("mic");
    onMic?.();
  });

  // Play/pause
  const btnPlay = document.getElementById("btn-play");
  btnPlay?.addEventListener("click", () => {
    const playing = onPlayToggle?.();
    btnPlay.setAttribute("data-i18n", playing ? "btn.pause" : "btn.play");
    btnPlay.textContent = t(playing ? "btn.pause" : "btn.play");
    setStatus(playing ? "playing" : "paused");
  });

  // Language toggle
  const btnLang = document.getElementById("btn-lang");
  btnLang?.addEventListener("click", () => {
    setLang(getLang() === "zh-TW" ? "en" : "zh-TW");
    applyTo(document);
  });

  // Re-apply play button text on lang change
  document.addEventListener("av:lang-change", () => {
    if (btnPlay) btnPlay.textContent = t(btnPlay.getAttribute("data-i18n") || "btn.play");
  });
}

function setStatus(kind) {
  const el = document.getElementById("status");
  if (!el) return;
  const key = "status." + kind;
  el.setAttribute("data-i18n", key);
  el.textContent = t(key);
}

export function update() {}
export function draw() {}
