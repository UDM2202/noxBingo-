import { useRef, useCallback, useState, useEffect } from 'react';
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
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
// Store voices once loaded
let cachedVoices: SpeechSynthesisVoice[] = [];

// === VOICE SYNTHESIZER ===
// Letter frequency maps for robotic speech
const LETTER_TONES: Record<string, number> = {
  'B': 200, 'I': 300, 'N': 400, 'G': 500, 'O': 600,
};

const NUMBER_TONES: Record<string, number[]> = {
  '1': [300], '2': [350], '3': [400], '4': [450], '5': [500],
  '6': [550], '7': [600], '8': [650], '9': [700], '0': [250],
};

function playSynthesizedVoice(letter: string, number: number, style: 'robot' | 'alien') {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const letterFreq = LETTER_TONES[letter] || 400;
  const numStr = number.toString();
  
  if (style === 'robot') {
    // ROBOT: Square wave + ring modulation = metallic, mechanical voice
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.connect(ctx.destination);

    // Letter beep
    playRobotTone(ctx, letterFreq, 0.3, now, masterGain);
    
    // Number beeps with gaps
    let time = now + 0.5;
    numStr.split('').forEach((digit) => {
      const baseFreq = NUMBER_TONES[digit]?.[0] || 400;
      // Two-tone for each digit
      playRobotTone(ctx, baseFreq, 0.2, time, masterGain);
      playRobotTone(ctx, baseFreq * 1.5, 0.15, time + 0.1, masterGain);
      time += 0.35;
    });
    
    // Fade out
    masterGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    
  } else if (style === 'alien') {
    // ALIEN: Sine wave with frequency wobble + reverb-like delay
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.25, now);
    masterGain.connect(ctx.destination);

    // Letter - warbling tone
    playAlienTone(ctx, letterFreq, 0.4, now, masterGain);
    
    // Numbers - sliding tones
    let time = now + 0.6;
    numStr.split('').forEach((digit, i) => {
      const baseFreq = (NUMBER_TONES[digit]?.[0] || 400) * 1.5;
      playAlienSlide(ctx, baseFreq, baseFreq * 1.8, 0.4, time, masterGain);
      time += 0.4;
    });
    
    masterGain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
  }
}

function playRobotTone(ctx: AudioContext, freq: number, duration: number, startTime: number, output: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, startTime);
  
  // Ring modulation for metallic sound
  const ringMod = ctx.createOscillator();
  const ringGain = ctx.createGain();
  ringMod.type = 'sine';
  ringMod.frequency.setValueAtTime(freq * 3, startTime);
  ringGain.gain.setValueAtTime(0.3, startTime);
  ringMod.connect(ringGain);
  ringGain.connect(osc.frequency);
  ringMod.start(startTime);
  ringMod.stop(startTime + duration);
  
  // Low-pass filter to muffle
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, startTime);
  filter.Q.setValueAtTime(5, startTime);
  
  gain.gain.setValueAtTime(0.5, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playAlienTone(ctx: AudioContext, freq: number, duration: number, startTime: number, output: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = 'sine';
  
  // Frequency wobble
  osc.frequency.setValueAtTime(freq * 0.5, startTime);
  osc.frequency.linearRampToValueAtTime(freq * 1.5, startTime + duration * 0.3);
  osc.frequency.linearRampToValueAtTime(freq * 0.7, startTime + duration * 0.6);
  osc.frequency.linearRampToValueAtTime(freq * 1.2, startTime + duration);
  
  // High-pass for thin, ethereal sound
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(600, startTime);
  
  gain.gain.setValueAtTime(0.4, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  
  // Add echo/delay effect
  const delay = ctx.createDelay(0.15);
  const feedback = ctx.createGain();
  delay.delayTime.setValueAtTime(0.15, startTime);
  feedback.gain.setValueAtTime(0.3, startTime);
  gain.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(output);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playAlienSlide(ctx: AudioContext, startFreq: number, endFreq: number, duration: number, startTime: number, output: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
  
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(500, startTime);
  
  // Vibrato
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.type = 'sine';
  vibrato.frequency.setValueAtTime(8, startTime);
  vibratoGain.gain.setValueAtTime(30, startTime);
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  vibrato.start(startTime);
  vibrato.stop(startTime + duration);
  
  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
}
export function useAudio() {
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('noxbingo-sound') !== 'false');
  const [voicePreset, setVoicePreset] = useState<VoicePreset>(() => (localStorage.getItem('noxbingo-voice') as VoicePreset) || 'male');
  const [voicesReady, setVoicesReady] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  // Load voices on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    speechSynthRef.current = window.speechSynthesis;
    const loadVoices = () => {
      cachedVoices = speechSynthRef.current?.getVoices() || [];
      if (cachedVoices.length > 0) {
        setVoicesReady(true);
        console.log('Voices loaded:', cachedVoices.length, 'English voices:', cachedVoices.filter(v => v.lang.startsWith('en')).map(v => v.name));
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  const getVoiceForPreset = useCallback((preset: VoicePreset): SpeechSynthesisVoice | null => {
    const englishVoices = cachedVoices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length === 0) return null;
    switch (preset) {
      case 'female':
        // Microsoft Zira or Google UK English Female
        return englishVoices.find(v => /zira|female/i.test(v.name)) || englishVoices[0];
      case 'male':
        // Microsoft David or Google UK English Male
        return englishVoices.find(v => /david|male/i.test(v.name)) || englishVoices[0];
      case 'announcer':
        // Google US English sounds most natural
        return englishVoices.find(v => /google.*us|google.*english/i.test(v.name)) || englishVoices[0];
      case 'robot':
        // Use deepest available voice + low pitch
        return englishVoices.find(v => /david|male/i.test(v.name)) || englishVoices[0];
      case 'alien':
        // Use female voice + very high pitch
        return englishVoices.find(v => /zira|female/i.test(v.name)) || englishVoices[0];
      case 'whisper':
        // Any voice, volume handles the effect
        return englishVoices[0];
      default:
        return englishVoices[0];
    }
  }, []);
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
  const speakNumber = useCallback((letter: string, number: number) => {
    if (!soundEnabled) return;
    try {
      if (!speechSynthRef.current) speechSynthRef.current = window.speechSynthesis;
      // Force reload voices if cache is empty
      if (cachedVoices.length === 0) {
        cachedVoices = speechSynthRef.current.getVoices();
      }
      speechSynthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(letter + '. ' + number);
      utterance.lang = 'en-US';
      // Set voice based on preset
      const voice = getVoiceForPreset(voicePreset);
      if (voice) {
        utterance.voice = voice;
      }
      // Apply pitch/rate/volume modifiers
      switch (voicePreset) {
        case 'male':
          utterance.rate = 0.85;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;
          break;
        case 'female':
          utterance.rate = 0.9;
          utterance.pitch = 1.5;
          utterance.volume = 0.75;
          break;
        case 'robot':
          utterance.rate = 0.6;
          utterance.pitch = 0.2;
          utterance.volume = 0.9;
          break;
        case 'alien':
          utterance.rate = 0.4;
          utterance.pitch = 2.5;
          utterance.volume = 0.7;
          break;
        case 'whisper':
          utterance.rate = 0.5;
          utterance.pitch = 1.0;
          utterance.volume = 0.12;
          break;
        case 'announcer':
          utterance.rate = 1.0;
          utterance.pitch = 1.2;
          utterance.volume = 1.0;
          break;
      }
      speechSynthRef.current.speak(utterance);
    } catch {}
  }, [soundEnabled, voicePreset, getVoiceForPreset]);
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('noxbingo-sound', String(next));
      return next;
    });
  }, []);
  const changeVoice = useCallback((preset: VoicePreset) => {
    setVoicePreset(preset);
    localStorage.setItem('noxbingo-voice', preset);
  }, []);
  const previewVoice = useCallback((preset: VoicePreset) => {
    const prevPreset = voicePreset;
    setVoicePreset(preset);
    setTimeout(() => speakNumber('B', 12), 200);
    setTimeout(() => setVoicePreset(prevPreset), 2500);
  }, [voicePreset, speakNumber]);
  return { play, speakNumber, soundEnabled, toggleSound, voicePreset, changeVoice, previewVoice, VOICE_PRESETS, voicesReady };
}






