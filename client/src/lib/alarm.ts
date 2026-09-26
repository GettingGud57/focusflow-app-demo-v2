// ============================================================
// ALARM CUES
// ============================================================
// Tones are synthesised with Web Audio rather than played from files. No asset
// to fetch, nothing to 404, no decode latency on the first beep, and a new cue
// costs a frequency and a duration instead of a trip to a sample library.
//
// Audio is a nicety layered on top of the timer, so every call here is wrapped
// defensively: a browser that refuses to play must never break the countdown.

type Tone = {
  freq: number;      // Hz
  duration: number;  // seconds
  gap: number;       // seconds of silence before the next tone
  volume: number;    // 0..1
};

let ctx: AudioContext | null = null;

/**
 * MUST be called from inside a user gesture handler.
 *
 * An AudioContext is created in the "suspended" state, and resume() is only
 * honoured while a gesture is being handled. Call it any later and playback
 * fails *silently* - no error, no sound. startTimer() is only ever reached from
 * a button press, which is why the unlock lives there.
 */
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    // No audio available. Not fatal.
  }
}

function playTone(startAt: number, tone: Tone) {
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = tone.freq;

  // Ramp the gain in and out instead of switching it. Starting or stopping a
  // sine wave at full amplitude is a discontinuity, and a discontinuity is an
  // audible click - which on a 4am alarm sounds like a bug.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(tone.volume, startAt + 0.012);
  gain.gain.setValueAtTime(tone.volume, startAt + tone.duration - 0.03);
  gain.gain.linearRampToValueAtTime(0, startAt + tone.duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + tone.duration + 0.02);
}

function playPattern(tones: Tone[]) {
  // state !== "running" means the unlock never happened (or was revoked), so
  // scheduling would be a no-op anyway.
  if (!ctx || ctx.state !== "running") return;

  let at = ctx.currentTime + 0.02;
  for (const tone of tones) {
    playTone(at, tone);
    at += tone.duration + tone.gap;
  }
}

function vibrate(pattern: number[]) {
  try {
    // Android Chrome supports this; iOS Safari does not. Silently absent there.
    (navigator as any).vibrate?.(pattern);
  } catch {
    // Not fatal.
  }
}

// ------------------------------------------------------------
// The cues
// ------------------------------------------------------------
// Distinguishable by shape, not just pitch - you need to tell them apart with
// earphones in and without looking.

// Time's up: three even beeps then one higher, longer. Reads as "...and stop".
const TIME_UP: Tone[] = [
  { freq: 880, duration: 0.13, gap: 0.07, volume: 0.28 },
  { freq: 880, duration: 0.13, gap: 0.07, volume: 0.28 },
  { freq: 880, duration: 0.13, gap: 0.07, volume: 0.28 },
  { freq: 1318, duration: 0.34, gap: 0, volume: 0.3 },
];

// Still in overtime: two quiet low blips. Deliberately unobtrusive - this one
// repeats, so it has to be easy to ignore while you finish what you're doing.
const REMINDER: Tone[] = [
  { freq: 587, duration: 0.09, gap: 0.11, volume: 0.13 },
  { freq: 587, duration: 0.09, gap: 0, volume: 0.13 },
];

export const alarm = {
  unlock: unlockAudio,

  /** The planned duration just ran out. */
  timeUp() {
    playPattern(TIME_UP);
    vibrate([250, 110, 250, 110, 420]);
  },

  /** You're still in overtime. Softer, and capped by the caller. */
  reminder() {
    playPattern(REMINDER);
    vibrate([110, 90, 110]);
  },
};
