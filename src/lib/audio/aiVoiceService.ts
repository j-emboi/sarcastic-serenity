export interface AIVoice {
  id: string;
  name: string;
  language: string;
  gender: 'Male' | 'Female';
  description?: string;
}

export interface AIVoiceSettings {
  voiceId: string;
  pitch: number; // -50 to 50
  rate: number; // -50 to 50
  volume: number; // 0 to 100
}

export class AIVoiceService {
  private audioContext: AudioContext | null = null;
  private currentAudio: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  // Predefined high-quality voices
  private voices: AIVoice[] = [
    { id: 'en-US-JennyNeural', name: 'Jenny (US)', language: 'en-US', gender: 'Female', description: 'Friendly and warm' },
    { id: 'en-US-GuyNeural', name: 'Guy (US)', language: 'en-US', gender: 'Male', description: 'Professional and clear' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', language: 'en-GB', gender: 'Female', description: 'British accent, elegant' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (UK)', language: 'en-GB', gender: 'Male', description: 'British accent, confident' },
    { id: 'en-US-AriaNeural', name: 'Aria (US)', language: 'en-US', gender: 'Female', description: 'Calm and soothing' },
    { id: 'en-US-DavisNeural', name: 'Davis (US)', language: 'en-US', gender: 'Male', description: 'Deep and authoritative' },
    { id: 'en-US-JennyMultilingualNeural', name: 'Jenny Multilingual', language: 'en-US', gender: 'Female', description: 'Versatile and expressive' },
    { id: 'en-US-GuyMultilingualNeural', name: 'Guy Multilingual', language: 'en-US', gender: 'Male', description: 'Versatile and clear' }
  ];

  async getAvailableVoices(): Promise<AIVoice[]> {
    // Return predefined voices immediately
    return this.voices;
  }

  async speak(text: string, settings: AIVoiceSettings): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    }

    try {
      // Use a simple TTS API (you can replace this with any TTS service)
      const audioData = await this.getTTSAudio(text, settings);
      
      if (audioData) {
        await this.playAudioData(audioData);
      } else {
        // Fallback to browser TTS
        this.fallbackToBrowserTTS(text, settings);
      }
      
    } catch (error) {
      console.error('Failed to speak with AI voice:', error);
      // Fallback to browser TTS
      this.fallbackToBrowserTTS(text, settings);
    }
  }

  private async getTTSAudio(text: string, settings: AIVoiceSettings): Promise<ArrayBuffer | null> {
    try {
      // For now, we'll use a simple approach that could be enhanced with a real TTS API
      // This is a placeholder - you can integrate with services like:
      // - ElevenLabs API
      // - OpenAI TTS API
      // - Google Cloud TTS
      // - Azure Speech Services
      
      // For demonstration, we'll return null to trigger fallback
      // In a real implementation, you would make an API call here
      console.log('AI TTS requested:', { text, settings });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return null; // Trigger fallback for now
      
    } catch (error) {
      console.error('TTS API call failed:', error);
      return null;
    }
  }

  private async playAudioData(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      this.currentAudio = source;
      this.isPlaying = true;

      source.onended = () => {
        this.isPlaying = false;
        this.currentAudio = null;
      };

      source.start(0);
    } catch (error) {
      console.error('Failed to play AI audio:', error);
      this.isPlaying = false;
    }
  }

  private fallbackToBrowserTTS(text: string, settings: AIVoiceSettings): void {
    if (typeof speechSynthesis === 'undefined') {
      console.warn('Speech synthesis not available');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Convert AI settings to browser TTS settings
    utterance.rate = Math.max(0.1, Math.min(10, 1 + (settings.rate / 100)));
    utterance.pitch = Math.max(0.5, Math.min(2, 1 + (settings.pitch / 100)));
    utterance.volume = Math.max(0, Math.min(1, settings.volume / 100));

    // Try to find a similar voice
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(v => /en/i.test(v.lang));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    // Set up completion handlers
    utterance.onend = () => {
      this.isPlaying = false;
    };

    utterance.onerror = () => {
      this.isPlaying = false;
    };

    this.isPlaying = true;
    speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.stop();
      this.currentAudio = null;
    }
    this.isPlaying = false;
    
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying || (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking);
  }

  async testVoice(settings: AIVoiceSettings): Promise<void> {
    const testText = "Hey there, stress ball. Ready for some sarcastic serenity?";
    await this.speak(testText, settings);
  }

  // Method to integrate with a real TTS API
  async setupTTSAPI(apiKey?: string, service?: 'elevenlabs' | 'openai' | 'azure'): Promise<void> {
    console.log('TTS API setup:', { apiKey: apiKey ? '***' : 'none', service });
    
    // This is where you would configure the actual TTS service
    // For example:
    // if (service === 'elevenlabs' && apiKey) {
    //   this.elevenLabsAPI = new ElevenLabsAPI(apiKey);
    // }
  }
}

// Export singleton instance
export const aiVoiceService = new AIVoiceService();
