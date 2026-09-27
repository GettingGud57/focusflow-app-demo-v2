// ============================================================
// ALARM CUES
// ============================================================
// Two kinds of cue live here:
//
//   "synth" - tones generated with Web Audio. No asset to fetch, nothing to
//             404, no decode latency, and a new one costs a frequency and a
//             duration. These are the defaults because they cannot fail.
//   "file"  - your own audio file from client/public/sounds/. See the note by
//             TIME_UP_CUES for how to add one.
//
// Both play through the SAME AudioContext, which matters: an AudioContext can
// only be unlocked from a user gesture, so routing files through it means one
// unlock covers everything. Playing files via <audio> instead would need its
// own separate unlock dance.
//
// Audio is a nicety layered on the timer, so every call here is defensive. A
// browser that refuses to play, or a missing file, must never break the
// countdown or throw into the interval.

type Tone = {
  freq: number;      // Hz
  duration: number;  // seconds
  gap: number;       // seconds of silence before the next tone
  volume: number;    // 0..1
};

type SynthCue = { id: string; label: string; kind: "synth"; tones: Tone[] };
type FileCue = { id: string; label: string; kind: "file"; url: string; volume: number };
export type Cue = SynthCue | FileCue;

// ------------------------------------------------------------
// Settings
// ------------------------------------------------------------
// Stored in localStorage and read at play time rather than passed down through
// React. The alarm is a module singleton, so reading on demand means it always
// sees current values with no plumbing, and the settings page only has to write.

export type SoundSettings = {
  enabled: boolean;
  timeUpCue: string; // Cue id
};

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true, // sound on by default
  timeUpCue: "beeps",
};

const SETTINGS_KEY = "myApp_sound";

export function loadSoundSettings(): SoundSettings {
  if (typeof window === "undefined") return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SOUND_SETTINGS;
    // Spread over the defaults so a settings blob written by an older version
    // still gets any newly added field.
    return { ...DEFAULT_SOUND_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
  }
}

export function saveSoundSettings(settings: SoundSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or blocked. Settings just won't persist.
  }
}

// ------------------------------------------------------------
// Audio plumbing
// ------------------------------------------------------------

let ctx: AudioContext | null = null;

/**
 * MUST be called from inside a user gesture handler.
 *
 * An AudioContext is created "suspended", and resume() is only honoured while a
 * gesture is being handled. Call it any later and playback fails *silently* -
 * no error, no sound. startTimer() is only ever reached from a button press,
 * which is why the unlock lives there.
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

    // Warm every file cue that could fire during this run, so nothing is waiting
    // on a fetch and a decode at the moment it's supposed to play. This is what
    // caused the confusing ordering earlier: a file cue requested FIRST landed
    // after a synthesised one requested second, because only the file had to
    // load.
    const selected = findCue(loadSoundSettings().timeUpCue);
    const warm = [selected, ...COMPLETION_CUES];
    for (const cue of warm) {
      if (cue?.kind === "file") void loadBuffer(cue.url);
    }
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
  // audible click - which on an alarm just sounds like a bug.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(tone.volume, startAt + 0.012);
  gain.gain.setValueAtTime(tone.volume, startAt + tone.duration - 0.03);
  gain.gain.linearRampToValueAtTime(0, startAt + tone.duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + tone.duration + 0.02);
}

function playTones(tones: Tone[]) {
  // state !== "running" means the unlock never happened, so scheduling anything
  // would be a no-op anyway.
  if (!ctx || ctx.state !== "running") return;

  let at = ctx.currentTime + 0.02;
  for (const tone of tones) {
    playTone(at, tone);
    at += tone.duration + tone.gap;
  }
}

// Decoded audio, kept so a repeated cue doesn't re-fetch or re-decode.
const bufferCache = new Map<string, AudioBuffer>();

async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  if (!ctx) return null;

  const cached = bufferCache.get(url);
  if (cached) return cached;

  try {
    const res = await fetch(url);
    if (!res.ok) return null; // typo'd filename, most likely
    const decoded = await ctx.decodeAudioData(await res.arrayBuffer());
    bufferCache.set(url, decoded);
    return decoded;
  } catch {
    return null; // unsupported codec, or the file isn't really audio
  }
}

function playBuffer(buffer: AudioBuffer, volume: number) {
  if (!ctx || ctx.state !== "running") return;

  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.buffer = buffer;
  src.connect(gain).connect(ctx.destination);
  src.start();
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
// The cue library
// ------------------------------------------------------------
// Distinguishable by shape, not just pitch - you need to tell them apart with
// earphones in and without looking.

// Three even beeps then one higher and longer. Reads as "...and stop".
const BEEPS: Tone[] = [
  { freq: 880, duration: 0.13, gap: 0.07, volume: 0.28 },
  { freq: 880, duration: 0.13, gap: 0.07, volume: 0.28 },
  { freq: 880, duration: 0.13, gap: 0.07, volume: 0.28 },
  { freq: 1318, duration: 0.34, gap: 0, volume: 0.3 },
];

// A rising arpeggio. Gentler - for when an alarm would be jarring.
const CHIME: Tone[] = [
  { freq: 659, duration: 0.16, gap: 0.02, volume: 0.22 },
  { freq: 880, duration: 0.16, gap: 0.02, volume: 0.22 },
  { freq: 1047, duration: 0.45, gap: 0, volume: 0.24 },
];

// Six fast alternating beeps. Hard to sleep through, hard to mistake.
const URGENT: Tone[] = Array.from({ length: 6 }, (_, i) => ({
  freq: i % 2 === 0 ? 1047 : 784,
  duration: 0.11,
  gap: 0.05,
  volume: 0.32,
}));

/**
 * TO ADD YOUR OWN SOUND
 *
 *   1. Drop the file in client/public/sounds/  e.g. airhorn.mp3
 *      (Anything under client/public/ is served from the root as-is, so
 *       client/public/sounds/airhorn.mp3 is reachable at /sounds/airhorn.mp3.
 *       Vite copies the folder into the build untouched - no import needed.)
 *   2. Add a line below.
 *   3. Keep it short (under ~2s) and use mp3 for the widest support.
 *
 * A missing or unplayable file falls back to BEEPS rather than going silent, so
 * a typo costs you the wrong sound, not a missed alarm.
 *
 *   { id: "airhorn", label: "Airhorn", kind: "file", url: "/sounds/airhorn.mp3", volume: 0.5 },
 */
/** Selectable in Settings -> Sound. Plays when a task's planned time runs out. */
export const TIME_UP_CUES: Cue[] = [
  { id: "beeps", label: "Beeps", kind: "synth", tones: BEEPS },
  { id: "chime", label: "Chime", kind: "synth", tones: CHIME },
  { id: "urgent", label: "Urgent", kind: "synth", tones: URGENT },
];

/**
 * Celebrations. A SEPARATE list from TIME_UP_CUES on purpose - anything in that
 * array shows up in the Sound settings picker as an alarm option, and "Yippee"
 * is not an alarm.
 *
 * Fixed rather than user-selectable for now, same treatment as REMINDER. Making
 * them configurable later is just two more fields on SoundSettings.
 */
const COMPLETION_CUES: Cue[] = [
  { id: "yippee", label: "Yippee", kind: "file", url: "/sounds/Yippee.mp3", volume: 0.5 },
  { id: "yay", label: "Yay", kind: "file", url: "/sounds/YayFnaf.mp3", volume: 0.5 },
];

const TASK_DONE_CUE = "yippee";
const WORKFLOW_DONE_CUE = "yay";

function findCue(id: string): Cue | undefined {
  return TIME_UP_CUES.find((c) => c.id === id) ?? COMPLETION_CUES.find((c) => c.id === id);
}

// Overtime reminder. Deliberately NOT user-selectable: this one repeats every
// couple of minutes, so it has to stay easy to ignore. An airhorn on a loop
// would be punishment.
const REMINDER: Tone[] = [
  { freq: 587, duration: 0.09, gap: 0.11, volume: 0.13 },
  { freq: 587, duration: 0.09, gap: 0, volume: 0.13 },
];

// Flow mode: one step just handed off to the next. Two quick rising tones -
// shaped as "onwards", distinct from BEEPS (three flat then one high, "stop")
// and from REMINDER (two flat low blips). Loud enough to hear mid-set, since the
// whole point is that you aren't looking.
//
// Only ONE transition cue for now: steps are just tasks, so the app has no way
// to know which are work and which are rest. Telling "lift" from "rest" apart
// would need that distinction in the data model first.
const STEP_ADVANCE: Tone[] = [
  { freq: 784, duration: 0.1, gap: 0.03, volume: 0.3 },
  { freq: 1175, duration: 0.18, gap: 0, volume: 0.3 },
];

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

/** Play a cue by id, ignoring the on/off setting. For the settings preview. */
export async function previewCue(id: string) {
  unlockAudio(); // safe: only ever called from a click
  await playCue(findCue(id), BEEPS);
}

/**
 * The caller resolves the cue and decides what happens when it can't play.
 *
 * `fallback` is the point of this signature. An ALARM that fails must still make
 * a noise - a missed deadline is worse than the wrong sound - so it passes
 * BEEPS. A CELEBRATION that fails should stay quiet: falling back to BEEPS makes
 * a broken congratulation sound exactly like a fresh alarm going off, which is
 * how the FNAFYay.mp3 typo read as "the ringtone rang again".
 */
async function playCue(cue: Cue | undefined, fallback: Tone[] | null) {
  if (!cue) {
    if (fallback) playTones(fallback);
    return;
  }

  if (cue.kind === "synth") {
    playTones(cue.tones);
    return;
  }

  const buffer = await loadBuffer(cue.url);
  if (buffer) {
    playBuffer(buffer, cue.volume);
  } else {
    // A silent fallback must not be a SILENT failure. Without this, a 404, a
    // codec the browser won't decode, or a suspended context are all
    // indistinguishable from "sound is turned off" - which is exactly how the
    // FNAFYay.mp3 typo went unnoticed.
    console.warn(
      `[alarm] cue "${cue.id}" could not play (${cue.url}). ` +
      `Either the file is missing, the browser can't decode it, or audio was ` +
      `never unlocked by a user gesture.`
    );
    if (fallback) playTones(fallback);
  }
}

export const alarm = {
  unlock: unlockAudio,

  /** The planned duration just ran out. Falls back to BEEPS - never silent. */
  timeUp() {
    const settings = loadSoundSettings();
    if (!settings.enabled) return;
    void playCue(findCue(settings.timeUpCue) ?? TIME_UP_CUES[0], BEEPS);
    vibrate([250, 110, 250, 110, 420]);
  },

  /** Flow mode: this step is done and the next one is starting itself. */
  stepAdvance() {
    if (!loadSoundSettings().enabled) return;
    playTones(STEP_ADVANCE);
    vibrate([140, 80, 200]);
  },

  /** Still in overtime. Softer, and capped by the caller. */
  reminder() {
    if (!loadSoundSettings().enabled) return;
    playTones(REMINDER);
    vibrate([110, 90, 110]);
  },

  /** A standalone task finished. Silent if the file is missing. */
  taskComplete() {
    if (!loadSoundSettings().enabled) return;
    void playCue(findCue(TASK_DONE_CUE), null);
    vibrate([110, 90, 110]);
  },

  /** A whole workflow finished. Bigger buzz, since it's the bigger event. */
  workflowComplete() {
    if (!loadSoundSettings().enabled) return;
    void playCue(findCue(WORKFLOW_DONE_CUE), null);
    vibrate([160, 90, 160, 90, 280]);
  },
};
