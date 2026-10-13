import { useRef, useCallback, useState, useEffect } from 'react';

let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Browsers (and Farcaster/wallet in-app browsers) start audio paused
  // until the player taps something. Resuming here is harmless if it's
  // already running, and the unlock listener below handles the first tap.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Unlocks audio on the player's first tap or key press. iOS also needs a
 * sound to actually be started inside that tap, so a one-sample silent
 * buffer is played. Listeners remove themselves once audio is running.
 */
let unlockInstalled = false;
function installAudioUnlock() {
  if (unlockInstalled || typeof window === 'undefined') return;
  unlockInstalled = true;
  const events = ['pointerdown', 'touchend', 'keydown', 'click'] as const;
  const unlock = () => {
    try {
      const ctx = getAudioContext();
      const silent = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = silent;
      src.connect(ctx.destination);
      src.start(0);
      ctx.resume().then(() => {
        if (ctx.state === 'running') {
          events.forEach((e) => window.removeEventListener(e, unlock, true));
        }
      }).catch(() => {});
    } catch {}
  };
  events.forEach((e) => window.addEventListener(e, unlock, true));
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3, rampDown: boolean = true) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    if (rampDown) gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {}
}
function playCountdownBeep() { playTone(880, 0.15, 'square', 0.15); }
function playBallDraw() {
  const ctx = getAudioContext();
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}
function playGameStart() {
  const ctx = getAudioContext();
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.0);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.5);
    gain2.gain.setValueAtTime(0.05, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.8);
  } catch {}
}
function playWinFanfare() {
  const ctx = getAudioContext();
  try {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.5);
    });
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(130, ctx.currentTime);
    bassGain.gain.setValueAtTime(0.25, ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(ctx.currentTime);
    bass.stop(ctx.currentTime + 0.8);
  } catch {}
}

export type VoicePreset = 'male' | 'female' | 'robot' | 'alien' | 'whisper' | 'announcer';
export const VOICE_PRESETS: { id: VoicePreset; label: string; emoji: string; description: string }[] = [
  { id: 'male', label: 'Male', emoji: '\u{1F468}', description: 'Deep, warm voice' },
  { id: 'female', label: 'Female', emoji: '\u{1F469}', description: 'Clear, pleasant voice' },
  { id: 'robot', label: 'Robot', emoji: '\u{1F916}', description: 'Classic synthetic caller' },
  { id: 'alien', label: 'Alien', emoji: '\u{1F47D}', description: 'Otherworldly tones' },
  { id: 'whisper', label: 'Whisper', emoji: '\u{1F92B}', description: 'Soft, intimate call' },
  { id: 'announcer', label: 'Announcer', emoji: '\u{1F4E2}', description: 'Hype sports announcer' },
];
const VALID_PRESETS = new Set<string>(VOICE_PRESETS.map((p) => p.id));

/*
 * Caller voices are pre-recorded clips, not the browser's speechSynthesis.
 * speechSynthesis is missing or silent in Farcaster and wallet in-app
 * browsers, while Web Audio (which the sound effects above already use)
 * works everywhere.
 *
 * Each preset is one MP3 in public/voices/<preset>.mp3 holding all 75
 * calls in order. Every call sits in a fixed slot of SLOT_SECONDS, so
 * call N starts at (N - 1) * SLOT_SECONDS. If the clips are ever
 * regenerated with a different slot length, update this number.
 */
const SLOT_SECONDS = 1.9;
const voiceUrl = (preset: VoicePreset) => `${import.meta.env.BASE_URL}voices/${preset}.mp3`;

// Shared across hook instances so each preset downloads and decodes once.
const voiceBuffers = new Map<VoicePreset, AudioBuffer>();
const voiceLoads = new Map<VoicePreset, Promise<AudioBuffer | null>>();

function loadVoice(preset: VoicePreset): Promise<AudioBuffer | null> {
  const ready = voiceBuffers.get(preset);
  if (ready) return Promise.resolve(ready);
  const inFlight = voiceLoads.get(preset);
  if (inFlight) return inFlight;

  const load = fetch(voiceUrl(preset))
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} loading ${preset} voice`);
      return res.arrayBuffer();
    })
    // Callback form keeps older Safari happy; newer browsers accept it too.
    .then((data) => new Promise<AudioBuffer>((resolve, reject) => {
      getAudioContext().decodeAudioData(data, resolve, reject);
    }))
    .then((buffer) => {
      voiceBuffers.set(preset, buffer);
      return buffer;
    })
    .catch((err) => {
      console.error('Caller voice failed to load', preset, err);
      voiceLoads.delete(preset); // allow a retry on the next call
      return null;
    });

  voiceLoads.set(preset, load);
  return load;
}

// How long a call may wait for its voice file before being skipped, so a
// slow download never makes the caller announce an old number late.
const MAX_CALL_DELAY_MS = 1500;

function readStoredPreset(): VoicePreset {
  try {
    const stored = localStorage.getItem('noxbingo-voice');
    if (stored && VALID_PRESETS.has(stored)) return stored as VoicePreset;
  } catch {}
  return 'male';
}

export function useAudio() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('noxbingo-sound') !== 'false'; } catch { return true; }
  });
  const [voicePreset, setVoicePreset] = useState<VoicePreset>(readStoredPreset);
  const [voicesReady, setVoicesReady] = useState(() => voiceBuffers.has(voicePreset));
  const currentVoiceRef = useRef<AudioBufferSourceNode | null>(null);
  const callIdRef = useRef(0);

  useEffect(() => { installAudioUnlock(); }, []);

  // Download the selected voice ahead of the first call.
  useEffect(() => {
    let cancelled = false;
    setVoicesReady(voiceBuffers.has(voicePreset));
    loadVoice(voicePreset).then((buffer) => {
      if (!cancelled) setVoicesReady(!!buffer);
    });
    return () => { cancelled = true; };
  }, [voicePreset]);

  const stopVoice = useCallback(() => {
    try { currentVoiceRef.current?.stop(); } catch {}
    currentVoiceRef.current = null;
  }, []);

  const playCall = useCallback((preset: VoicePreset, number: number, maxDelayMs = MAX_CALL_DELAY_MS) => {
    if (!Number.isInteger(number) || number < 1 || number > 75) return;
    const callId = ++callIdRef.current;
    const requestedAt = Date.now();
    stopVoice(); // a new call always cuts off the previous one

    loadVoice(preset).then((buffer) => {
      if (!buffer) return;
      if (callId !== callIdRef.current) return; // a newer call replaced this one
      if (Date.now() - requestedAt > maxDelayMs) return;
      try {
        const ctx = getAudioContext();
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start(ctx.currentTime, (number - 1) * SLOT_SECONDS, SLOT_SECONDS);
        src.onended = () => {
          if (currentVoiceRef.current === src) currentVoiceRef.current = null;
        };
        currentVoiceRef.current = src;
      } catch {}
    });
  }, [stopVoice]);

  const play = useCallback((sound: string) => {
    if (!soundEnabled) return;
    switch (sound) {
      case 'countdown': playCountdownBeep(); break;
      case 'ballDraw': playBallDraw(); break;
      case 'gameStart': playGameStart(); break;
      case 'win': playWinFanfare(); break;
      case 'daub': playTone(1000, 0.05, 'sine', 0.1, true); break;
    }
  }, [soundEnabled]);

  // `letter` is kept so existing callers don't change; the clip for each
  // number already says its letter (B for 1-15, I for 16-30, and so on).
  const speakNumber = useCallback((_letter: string, number: number) => {
    if (!soundEnabled) return;
    playCall(voicePreset, number);
  }, [soundEnabled, voicePreset, playCall]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem('noxbingo-sound', String(next)); } catch {}
      if (!next) stopVoice();
      return next;
    });
  }, [stopVoice]);

  const changeVoice = useCallback((preset: VoicePreset) => {
    setVoicePreset(preset);
    try { localStorage.setItem('noxbingo-voice', preset); } catch {}
  }, []);

  // Plays "B 12" in the given voice without changing the saved choice.
  const previewVoice = useCallback((preset: VoicePreset) => {
    if (!soundEnabled) return;
    // A preview can wait longer for a first download than a live call can.
    playCall(preset, 12, 10000);
  }, [soundEnabled, playCall]);

  return { play, speakNumber, soundEnabled, toggleSound, voicePreset, changeVoice, previewVoice, VOICE_PRESETS, voicesReady };
}