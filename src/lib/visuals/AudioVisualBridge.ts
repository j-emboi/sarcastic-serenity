import type { AudioData } from './WebGLSceneManager';

export class AudioVisualBridge {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private frequencyArray: Float32Array | null = null;
  private _isConnected = false;

  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.frequencyArray = null;
  }

  async connect(audioElement?: HTMLAudioElement): Promise<boolean> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create data arrays
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.frequencyArray = new Float32Array(bufferLength);

      // Connect to audio element if provided
      if (audioElement) {
        const source = this.audioContext.createMediaElementSource(audioElement);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      this._isConnected = true;
      console.log('🎵 Audio Visual Bridge connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect Audio Visual Bridge:', error);
      return false;
    }
  }

  connectToAudioContext(audioContext: AudioContext, sourceNode: AudioNode): boolean {
    try {
      this.audioContext = audioContext;
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create data arrays
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.frequencyArray = new Float32Array(bufferLength);

      // Connect source to analyser
      sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this._isConnected = true;
      console.log('🎵 Audio Visual Bridge connected to existing audio context');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect Audio Visual Bridge to audio context:', error);
      return false;
    }
  }

  getAudioData(): AudioData {
    if (!this._isConnected || !this.analyser || !this.dataArray || !this.frequencyArray) {
      return {
        frequency: new Array(64).fill(0),
        amplitude: 0,
        bass: 0,
        mid: 0,
        treble: 0
      };
    }

    // Get frequency data
    this.analyser.getFloatFrequencyData(this.frequencyArray);
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate amplitude
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const amplitude = sum / this.dataArray.length / 255;

    // Calculate frequency bands
    const bass = this.calculateFrequencyBand(0, 8); // 0-250Hz
    const mid = this.calculateFrequencyBand(8, 32);  // 250-1000Hz
    const treble = this.calculateFrequencyBand(32, 64); // 1000-4000Hz

    // Convert frequency data to normalized array
    const frequency = Array.from(this.frequencyArray).slice(0, 64).map(f => 
      Math.max(0, (f + 140) / 140) // Normalize from -140dB to 0dB
    );

    return {
      frequency,
      amplitude,
      bass,
      mid,
      treble
    };
  }

  private calculateFrequencyBand(start: number, end: number): number {
    if (!this.dataArray) return 0;
    
    let sum = 0;
    for (let i = start; i < Math.min(end, this.dataArray.length); i++) {
      sum += this.dataArray[i];
    }
    return sum / (end - start) / 255;
  }

  getAmplitude(): number {
    const data = this.getAudioData();
    return data.amplitude;
  }

  getBassLevel(): number {
    const data = this.getAudioData();
    return data.bass;
  }

  getMidLevel(): number {
    const data = this.getAudioData();
    return data.mid;
  }

  getTrebleLevel(): number {
    const data = this.getAudioData();
    return data.treble;
  }

  getFrequencySpectrum(): number[] {
    const data = this.getAudioData();
    return data.frequency;
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  disconnect(): void {
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this._isConnected = false;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.frequencyArray = null;
    
    console.log('🔌 Audio Visual Bridge disconnected');
  }
}
