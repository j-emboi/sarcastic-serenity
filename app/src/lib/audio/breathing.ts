import type { BreathingPhase } from '../breathing/types';

export class BreathingAudio {
  private context: AudioContext | null = null;
  private transitionGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = true;
  private voiceEnabled: boolean = true;
  private ambientEnabled: boolean = true;
  private currentVolume: number = 0.3;

  constructor(audioContext: AudioContext, masterGain: GainNode) {
    this.context = audioContext;
    this.masterGain = masterGain;
    this.setupAudioNodes();
  }

  private setupAudioNodes(): void {
    if (!this.context || !this.masterGain) return;

    // Create gain nodes for breathing audio
    this.transitionGain = this.context.createGain();
    this.voiceGain = this.context.createGain();
    this.ambientGain = this.context.createGain();

    // Set initial volumes
    this.transitionGain.gain.value = this.currentVolume;
    this.voiceGain.gain.value = 0.4;
    this.ambientGain.gain.value = 0.2;

    // Connect to master gain
    this.transitionGain.connect(this.masterGain);
    this.voiceGain.connect(this.masterGain);
    this.ambientGain.connect(this.masterGain);

    console.log('Enhanced breathing audio system initialized');
  }

  setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.transitionGain) {
      this.transitionGain.gain.value = this.currentVolume;
    }
  }

  setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
  }

  setAmbientEnabled(enabled: boolean): void {
    this.ambientEnabled = enabled;
  }

  playPhaseTransition(phase: BreathingPhase): void {
    if (!this.isEnabled || !this.context || !this.transitionGain) return;

    try {
      // Create oscillator for transition sound
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      // Enhanced frequency mapping with more musical intervals
      let frequency = 440; // A4
      let filterFreq = 2000;
      let filterQ = 1;
      
      switch (phase) {
        case 'inhale':
          frequency = 523; // C5 - bright, uplifting
          filterFreq = 3000;
          filterQ = 2;
          break;
        case 'hold':
          frequency = 440; // A4 - stable, grounding
          filterFreq = 2000;
          filterQ = 1;
          break;
        case 'exhale':
          frequency = 349; // F4 - warm, releasing
          filterFreq = 1500;
          filterQ = 0.5;
          break;
        case 'hold2':
          frequency = 392; // G4 - balanced, peaceful
          filterFreq = 1800;
          filterQ = 1.5;
          break;
      }

      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      oscillator.type = 'sine';

      // Enhanced envelope with smoother curves
      const attackTime = 0.15;
      const decayTime = 0.3;
      const sustainLevel = 0.4;
      const releaseTime = 0.4;

      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.6, this.context.currentTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(sustainLevel, this.context.currentTime + attackTime + decayTime);
      gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + attackTime + decayTime + releaseTime);

      // Apply filter for richer sound
      filter.frequency.setValueAtTime(filterFreq, this.context.currentTime);
      filter.Q.setValueAtTime(filterQ, this.context.currentTime);
      filter.type = 'lowpass';

      // Connect nodes
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.transitionGain);

      // Start and stop oscillator
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + attackTime + decayTime + releaseTime);

      // Play voice cue if enabled
      if (this.voiceEnabled) {
        this.playVoiceCue(phase);
      }

      // Play ambient sound if enabled
      if (this.ambientEnabled) {
        this.playAmbientSound(phase);
      }

      console.log('Played enhanced breathing transition sound:', {
        phase,
        frequency,
        filterFreq,
        time: this.context.currentTime.toFixed(2)
      });
    } catch (error) {
      console.warn('Failed to play breathing transition sound:', error);
    }
  }

  playVoiceCue(phase: BreathingPhase): void {
    if (!this.isEnabled || !this.context || !this.voiceGain) return;

    try {
      // Use Web Speech API for voice guidance
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance();
        
        // Set voice properties
        utterance.volume = 0.7;
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        
        // Choose voice (prefer a calming voice)
        const voices = speechSynthesis.getVoices();
        const calmingVoice = voices.find(v => 
          /en/i.test(v.lang) && /(female|woman|girl)/i.test(v.name)
        ) || voices.find(v => /en/i.test(v.lang)) || voices[0];
        
        if (calmingVoice) {
          utterance.voice = calmingVoice;
        }

        // Set phase-specific guidance
        switch (phase) {
          case 'inhale':
            utterance.text = 'Breathe in...';
            break;
          case 'hold':
            utterance.text = 'Hold...';
            break;
          case 'exhale':
            utterance.text = 'Breathe out...';
            break;
          case 'hold2':
            utterance.text = 'Rest...';
            break;
        }

        // Play the voice cue
        speechSynthesis.speak(utterance);
        
        console.log('Played voice cue:', utterance.text);
      } else {
        // Fallback to beep patterns if speech synthesis not available
        this.playBeepPattern(phase);
      }
    } catch (error) {
      console.warn('Failed to play voice cue:', error);
      // Fallback to beep patterns
      this.playBeepPattern(phase);
    }
  }

  private playBeepPattern(phase: BreathingPhase): void {
    if (!this.context || !this.voiceGain) return;

    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      // Different patterns for different phases
      let frequency = 800;
      let duration = 0.2;
      let pattern = [1];

      switch (phase) {
        case 'inhale':
          frequency = 800; // Higher pitch for inhale
          duration = 0.3;
          pattern = [1, 0.5, 1]; // Two beeps
          break;
        case 'hold':
          frequency = 600; // Medium pitch for hold
          duration = 0.2;
          pattern = [1]; // Single beep
          break;
        case 'exhale':
          frequency = 400; // Lower pitch for exhale
          duration = 0.4;
          pattern = [1, 0.3, 1, 0.3, 1]; // Three beeps
          break;
        case 'hold2':
          frequency = 500; // Medium-low pitch for second hold
          duration = 0.15;
          pattern = [1, 0.5]; // Short beep
          break;
      }

      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      oscillator.type = 'sine';

      // Create pattern envelope
      const totalDuration = duration * pattern.length;
      gainNode.gain.setValueAtTime(0, this.context.currentTime);

      pattern.forEach((level, index) => {
        const startTime = this.context.currentTime + index * duration;
        const endTime = startTime + duration * 0.8;
        gainNode.gain.setValueAtTime(level * 0.3, startTime);
        gainNode.gain.linearRampToValueAtTime(0, endTime);
      });

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.voiceGain);

      // Start and stop oscillator
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + totalDuration);

    } catch (error) {
      console.warn('Failed to play beep pattern:', error);
    }
  }

  playAmbientSound(phase: BreathingPhase): void {
    if (!this.isEnabled || !this.context || !this.ambientGain) return;

    try {
      // Create ambient sound based on phase
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      // Phase-specific ambient sounds
      let frequency = 200;
      let filterFreq = 800;
      let duration = 1.0;

      switch (phase) {
        case 'inhale':
          frequency = 150; // Deep, grounding sound
          filterFreq = 600;
          duration = 1.2;
          break;
        case 'hold':
          frequency = 180; // Stable, peaceful sound
          filterFreq = 800;
          duration = 0.8;
          break;
        case 'exhale':
          frequency = 120; // Very deep, releasing sound
          filterFreq = 400;
          duration = 1.5;
          break;
        case 'hold2':
          frequency = 160; // Balanced, restful sound
          filterFreq = 700;
          duration = 1.0;
          break;
      }

      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      oscillator.type = 'triangle'; // Softer than sine

      // Gentle envelope
      const attackTime = 0.3;
      const releaseTime = 0.5;

      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.context.currentTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration - releaseTime);

      // Apply gentle filter
      filter.frequency.setValueAtTime(filterFreq, this.context.currentTime);
      filter.Q.setValueAtTime(0.5, this.context.currentTime);
      filter.type = 'lowpass';

      // Connect nodes
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ambientGain);

      // Start and stop oscillator
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);

    } catch (error) {
      console.warn('Failed to play ambient sound:', error);
    }
  }

  playNatureSound(soundType: 'ocean' | 'forest' | 'wind' | 'chimes'): void {
    if (!this.isEnabled || !this.context || !this.ambientGain) return;

    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      // Nature-inspired sounds
      let frequency = 200;
      let filterFreq = 1000;
      let duration = 2.0;
      let oscillatorType: OscillatorType = 'sine';

      switch (soundType) {
        case 'ocean':
          frequency = 80; // Deep ocean waves
          filterFreq = 300;
          duration = 3.0;
          oscillatorType = 'sawtooth';
          break;
        case 'forest':
          frequency = 400; // Bird-like sounds
          filterFreq = 1200;
          duration = 1.5;
          oscillatorType = 'triangle';
          break;
        case 'wind':
          frequency = 150; // Wind through trees
          filterFreq = 600;
          duration = 2.5;
          oscillatorType = 'sine';
          break;
        case 'chimes':
          frequency = 800; // Gentle chimes
          filterFreq = 2000;
          duration = 1.8;
          oscillatorType = 'sine';
          break;
      }

      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      oscillator.type = oscillatorType;

      // Gentle envelope
      const attackTime = 0.5;
      const releaseTime = 0.8;

      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, this.context.currentTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration - releaseTime);

      // Apply filter
      filter.frequency.setValueAtTime(filterFreq, this.context.currentTime);
      filter.Q.setValueAtTime(0.3, this.context.currentTime);
      filter.type = 'lowpass';

      // Connect nodes
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ambientGain);

      // Start and stop oscillator
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);

    } catch (error) {
      console.warn('Failed to play nature sound:', error);
    }
  }

  stopAll(): void {
    if (this.context) {
      // Stop any ongoing speech synthesis
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    }
  }

  destroy(): void {
    this.stopAll();
    this.isEnabled = false;
    console.log('Breathing audio system destroyed');
  }
}
