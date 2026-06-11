import { useRef, useCallback, useState } from 'react';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  rampDown: boolean = true
) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    if (rampDown) {
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail — audio is optional
  }
}

function playCountdownBeep() {
  playTone(880, 0.15, 'square', 0.15);
}

function playBallDraw() {
  const ctx = getAudioContext();
  try {
    // Quick rising blip
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
  } catch {
    // Silently fail
  }
}

function playGameStart() {
  const ctx = getAudioContext();
  try {
    // Deep whoosh — low frequency sweep
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

    // Add a subtle high sparkle
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
  } catch {
    // Silently fail
  }
}

function playWinFanfare() {
  const ctx = getAudioContext();
  try {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
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

    // Bass hit
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
  } catch {
    // Silently fail
  }
}

export function useAudio() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('noxbingo-sound') !== 'false';
  });

  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  const play = useCallback((sound: string) => {
    if (!soundEnabled) return;

    switch (sound) {
      case 'countdown':
        playCountdownBeep();
        break;
      case 'ballDraw':
        playBallDraw();
        break;
      case 'gameStart':
        playGameStart();
        break;
      case 'win':
        playWinFanfare();
        break;
      case 'daub':
        playTone(1000, 0.05, 'sine', 0.1, true);
        break;
      default:
        break;
    }
  }, [soundEnabled]);

  const speakNumber = useCallback((letter: string, number: number) => {
    if (!soundEnabled) return;
    try {
      if (!speechSynthRef.current) {
        speechSynthRef.current = window.speechSynthesis;
      }
      speechSynthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(letter + ' ' + number);
      utterance.rate = 0.85;
      utterance.pitch = 0.95;
      utterance.volume = 0.7;
      utterance.lang = 'en-US';

      // Do not manually pick a voice — let the browser decide based on lang
      speechSynthRef.current.speak(utterance);
    } catch {
      // Silently fail
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('noxbingo-sound', String(next));
      return next;
    });
  }, []);

  return { play, speakNumber, soundEnabled, toggleSound };
}