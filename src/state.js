// Central mutable state for the AV-Visualizer.
// Other modules import { state } and read/write directly.

export const state = {
  // playback / source
  source: null,          // 'url' | 'file' | 'mic' | null
  url: "https://mdn.github.io/webaudio-examples/audio-basics/outfoxing.mp3",
  playing: false,

  // audio analysis (filled by analyser module)
  fftSize: 2048,
  freqData: null,        // Uint8Array
  timeData: null,        // Uint8Array
  bass: 0,               // 0..1 normalized low-band energy
  rms: 0,

  // tunable params (driven by sliders)
  bassGain: 1.0,
  particleCount: 1000,
  glitchIntensity: 0.3,
  rgbShift: 4,
  chromaThreshold: 0.4,

  // module enable flags
  modules: {
    circularSpectrum: true,
    particles: true,
    rgbShift: true,
    glitch: true,
    chroma: false,
  },

  // render
  width: 0,
  height: 0,
  dpr: 1,
  time: 0,
  frame: 0,
};

export default state;
