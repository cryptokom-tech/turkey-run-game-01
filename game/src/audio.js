// Tiny WebAudio bleeps generated in code — no audio files, no network.
// The context is created lazily on the first user gesture, as browsers require.

let audioContext = null;
let muted = false;

function ensureAudioContext() {
  if (!audioContext) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioContext = new Ctor();
  }
  if (audioContext && audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playTone(frequency, durationSeconds, type, volume, slideTo) {
  if (muted) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + durationSeconds);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + durationSeconds);
}

export function playJumpSound() { playTone(320, 0.16, 'square', 0.05, 640); }
export function playCornSound() { playTone(880, 0.1, 'sine', 0.07, 1320); }
export function playFeatherSound() { playTone(660, 0.22, 'triangle', 0.08, 1560); }
export function playHitSound() { playTone(180, 0.25, 'sawtooth', 0.09, 70); }
export function playMudSound() { playTone(140, 0.2, 'sine', 0.08, 80); }
export function playClickSound() { playTone(520, 0.06, 'square', 0.04); }
export function playKnifeWarningSound() { playTone(1240, 0.08, 'square', 0.03); }

export function playEscapeFanfare() {
  [523, 659, 784, 1046].forEach((note, i) => {
    setTimeout(() => playTone(note, 0.24, 'triangle', 0.08), i * 130);
  });
}

export function playCaughtSound() {
  [392, 330, 262, 196].forEach((note, i) => {
    setTimeout(() => playTone(note, 0.26, 'triangle', 0.08), i * 150);
  });
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
