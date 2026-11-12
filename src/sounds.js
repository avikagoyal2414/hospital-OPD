// Simple sound effects made in the browser. No audio files needed.
let ctx;
function getCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = "sine", vol = 0.25) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

// Happy rising chime
export function playConfirmed() {
  tone(523.25, 0, 0.25);
  tone(659.25, 0.18, 0.25);
  tone(783.99, 0.36, 0.3);
  tone(1046.5, 0.54, 0.6);
}

// Soft falling "sad" tones
export function playCancelled() {
  tone(392.0, 0, 0.3, "triangle");
  tone(311.13, 0.25, 0.3, "triangle");
  tone(233.08, 0.5, 0.55, "triangle");
}