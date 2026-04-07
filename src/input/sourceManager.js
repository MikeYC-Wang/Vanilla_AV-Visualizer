// Input source manager: URL / file / microphone.
// Owns the current <audio>/<video> element or MediaStream.
// Dispatches 'av:source-ready' on window so the analyser can attach.

import { state } from "../state.js";
import { t } from "../i18n.js";

const BLOCKED_HOST_RE = /(?:youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|bilibili\.com|vimeo\.com|tiktok\.com)/i;
const MEDIA_EXT_RE = /\.(mp3|wav|ogg|m4a|flac|aac|opus|mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const MEDIA_PATH_HINT_RE = /\/(audio|media|sound|music|stream)\//i;

let currentMedia = null;   // HTMLMediaElement
let currentStream = null;  // MediaStream
let currentObjectURL = null;

function setStatus(msg) {
  state.status = msg;
  const el = typeof document !== "undefined" && document.getElementById("status");
  if (el) el.textContent = msg;
}

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url);
}

function disposeCurrent() {
  if (currentMedia) {
    try { currentMedia.pause(); } catch (_) {}
    try { currentMedia.removeAttribute("src"); currentMedia.load(); } catch (_) {}
    if (currentMedia.parentNode) currentMedia.parentNode.removeChild(currentMedia);
  }
  if (currentObjectURL) {
    try { URL.revokeObjectURL(currentObjectURL); } catch (_) {}
    currentObjectURL = null;
  }
  if (currentStream) {
    try { currentStream.getTracks().forEach((t) => t.stop()); } catch (_) {}
  }
  currentMedia = null;
  currentStream = null;
}

function makeMediaElement(url, isVideo) {
  const el = document.createElement(isVideo ? "video" : "audio");
  el.crossOrigin = "anonymous";
  el.preload = "auto";
  el.playsInline = true;
  el.style.display = "none";
  el.src = url;
  document.body.appendChild(el);
  el.addEventListener("error", () => {
    setStatus("ERR " + (el.error?.message || "load failed"));
  });
  return el;
}

function dispatchReady(type, payload) {
  const detail = type === "mic"
    ? { type, stream: payload }
    : { type, element: payload };
  window.dispatchEvent(new CustomEvent("av:source-ready", { detail }));
}

export function init() { /* no-op; lazy */ }

export function loadFromURL(url) {
  if (!url) return null;
  if (BLOCKED_HOST_RE.test(url)) {
    setStatus(t("error.unsupportedHost"));
    return null;
  }
  if (!MEDIA_EXT_RE.test(url) && !MEDIA_PATH_HINT_RE.test(url)) {
    setStatus(t("error.maybeNotMedia"));
  }
  disposeCurrent();
  const isVideo = isVideoUrl(url);
  const el = makeMediaElement(url, isVideo);
  currentMedia = el;
  state.source = "url";
  setStatus("LOAD " + (isVideo ? "VIDEO" : "AUDIO"));
  el.addEventListener("loadedmetadata", () => {
    setStatus("READY");
    dispatchReady(isVideo ? "video" : "audio", el);
    play();
  }, { once: true });
  return el;
}

export function loadFromFile(file) {
  if (!file) return null;
  disposeCurrent();
  const url = URL.createObjectURL(file);
  currentObjectURL = url;
  const isVideo = file.type.startsWith("video/") || isVideoUrl(file.name);
  const el = document.createElement(isVideo ? "video" : "audio");
  el.preload = "auto";
  el.playsInline = true;
  el.style.display = "none";
  el.src = url;
  document.body.appendChild(el);
  el.addEventListener("error", () => setStatus("ERR file load"));
  currentMedia = el;
  state.source = "file";
  setStatus("FILE " + file.name);
  el.addEventListener("loadedmetadata", () => {
    setStatus("READY");
    dispatchReady(isVideo ? "video" : "audio", el);
    play();
  }, { once: true });
  return el;
}

export async function startMicrophone() {
  disposeCurrent();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    currentStream = stream;
    state.source = "mic";
    setStatus("MIC LIVE");
    dispatchReady("mic", stream);
    return stream;
  } catch (err) {
    setStatus("ERR mic: " + (err?.message || err));
    return null;
  }
}

export function play() {
  if (currentMedia) {
    const p = currentMedia.play();
    if (p && p.catch) p.catch((e) => setStatus("ERR play: " + e.message));
    state.playing = true;
  }
}

export function pause() {
  if (currentMedia) {
    currentMedia.pause();
    state.playing = false;
  }
}

export function setPlaying(playing) {
  if (playing) play(); else pause();
}

export function getCurrentMedia() { return currentMedia; }
export function getCurrentStream() { return currentStream; }

// Legacy aliases used by main.js scaffold.
export const loadUrl = loadFromURL;
export const loadFile = loadFromFile;
export const loadMic = startMicrophone;
