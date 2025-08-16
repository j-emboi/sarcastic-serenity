export interface CharacterVoice {
  id: string;
  name: string;
  character: string;
  description: string;
  era: string;
  legalStatus: 'public_domain' | 'creative_commons' | 'fair_use' | 'original';
  voiceSettings: {
    pitch: number; // -50 to 50
    rate: number; // -50 to 50
    volume: number; // 0 to 100
    effects: VoiceEffect[];
  };
  personality: {
    enthusiasm: number; // 0-100
    playfulness: number; // 0-100
    warmth: number; // 0-100
  };
}

export interface VoiceEffect {
  type: 'pitch_shift' | 'formant_shift' | 'chorus' | 'reverb' | 'distortion' | 'compression';
  intensity: number; // 0-100
  parameters: Record<string, number>;
}

export class CharacterVoiceService {
  private audioContext: AudioContext | null = null;
  private currentAudio: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  // Public Domain Mickey Mouse Voice (Steamboat Willie era - 1928)
  private mickeyMouseVoice: CharacterVoice = {
    id: 'mickey_mouse_1928',
    name: 'Mickey Mouse (1928)',
    character: 'Mickey Mouse',
    description: 'Classic Steamboat Willie era Mickey Mouse - cheerful, squeaky, and full of wonder',
    era: '1928 (Public Domain)',
    legalStatus: 'public_domain',
    voiceSettings: {
      pitch: 25, // Higher pitch for squeaky voice
      rate: -10, // Slightly slower for character
      volume: 85,
      effects: [
        {
          type: 'pitch_shift',
          intensity: 80,
          parameters: { shift: 4, grainSize: 0.1 }
        },
        {
          type: 'formant_shift',
          intensity: 60,
          parameters: { shift: 1.5 }
        },
        {
          type: 'chorus',
          intensity: 30,
          parameters: { rate: 1.5, depth: 0.3, feedback: 0.2 }
        },
        {
          type: 'compression',
          intensity: 40,
          parameters: { threshold: -20, ratio: 3, attack: 0.1, release: 0.3 }
        }
      ]
    },
    personality: {
      enthusiasm: 90,
      playfulness: 95,
      warmth: 85
    }
  };

  // Additional public domain character voices
  private characterVoices: CharacterVoice[] = [
    this.mickeyMouseVoice,
    {
      id: 'steamboat_willie_narrator',
      name: 'Steamboat Willie Narrator',
      character: 'Classic Cartoon Narrator',
      description: 'Narrator from the golden age of animation - warm and engaging',
      era: '1928-1930s (Public Domain)',
      legalStatus: 'public_domain',
      voiceSettings: {
        pitch: 5,
        rate: -15,
        volume: 90,
        effects: [
          {
            type: 'reverb',
            intensity: 25,
            parameters: { decay: 1.2, preDelay: 0.1, wet: 0.3 }
          },
          {
            type: 'compression',
            intensity: 50,
            parameters: { threshold: -15, ratio: 4, attack: 0.2, release: 0.5 }
          }
        ]
      },
      personality: {
        enthusiasm: 70,
        playfulness: 60,
        warmth: 90
      }
    },
    {
      id: 'classic_cartoon_character',
      name: 'Classic Cartoon Character',
      character: 'Golden Age Cartoon',
      description: 'Inspired by public domain cartoon characters from the 1920s-1930s',
      era: '1920s-1930s (Public Domain)',
      legalStatus: 'public_domain',
      voiceSettings: {
        pitch: 15,
        rate: -5,
        volume: 80,
        effects: [
          {
            type: 'pitch_shift',
            intensity: 50,
            parameters: { shift: 2, grainSize: 0.15 }
          },
          {
            type: 'chorus',
            intensity: 20,
            parameters: { rate: 1.2, depth: 0.2, feedback: 0.1 }
          }
        ]
      },
      personality: {
        enthusiasm: 80,
        playfulness: 85,
        warmth: 75
      }
    }
  ];

  async getAvailableCharacterVoices(): Promise<CharacterVoice[]> {
    return this.characterVoices;
  }

  async speakWithCharacter(text: string, characterId: string): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    }

    const character = this.characterVoices.find(c => c.id === characterId);
    if (!character) {
      console.error('Character voice not found:', characterId);
      return;
    }

    try {
      // Use browser TTS as base and apply character effects
      await this.speakWithCharacterEffects(text, character);
    } catch (error) {
      console.error('Failed to speak with character voice:', error);
      // Fallback to regular TTS
      this.fallbackToRegularTTS(text);
    }
  }

  private async speakWithCharacterEffects(text: string, character: CharacterVoice): Promise<void> {
    if (typeof speechSynthesis === 'undefined') {
      console.warn('Speech synthesis not available');
      return;
    }

    // Create utterance with character settings
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply character voice settings
    utterance.rate = Math.max(0.1, Math.min(10, 1 + (character.voiceSettings.rate / 100)));
    utterance.pitch = Math.max(0.5, Math.min(2, 1 + (character.voiceSettings.pitch / 100)));
    utterance.volume = Math.max(0, Math.min(1, character.voiceSettings.volume / 100));

    // Try to find a suitable voice
    const voices = speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => /en/i.test(v.lang));
    
    // For Mickey Mouse, prefer higher-pitched voices
    if (character.id === 'mickey_mouse_1928') {
      const highPitchedVoice = voices.find(v => 
        /en/i.test(v.lang) && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('soprano'))
      );
      if (highPitchedVoice) {
        selectedVoice = highPitchedVoice;
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
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

  private fallbackToRegularTTS(text: string): void {
    if (typeof speechSynthesis === 'undefined') {
      console.warn('Speech synthesis not available');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

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

  async testCharacterVoice(characterId: string): Promise<void> {
    const testText = "Hot dog! This is going to be a swell session!";
    await this.speakWithCharacter(testText, characterId);
  }

  // Get character voice by ID
  getCharacterVoice(characterId: string): CharacterVoice | undefined {
    return this.characterVoices.find(c => c.id === characterId);
  }

  // Get Mickey Mouse voice specifically
  getMickeyMouseVoice(): CharacterVoice {
    return this.mickeyMouseVoice;
  }
}

// Export singleton instance
export const characterVoiceService = new CharacterVoiceService();
