export interface CharacterVoice {
  id: string;
  name: string;
  description: string;
  voiceSettings: {
    pitch: number; // 0.5..2.0
    rate: number; // 0.1..10.0
    volume: number; // 0..1
  };
  personality: {
    enthusiasm: number; // 0-100
    sarcasm: number; // 0-100
    warmth: number; // 0-100
  };
}

export class CharacterVoiceService {
  private isPlaying = false;

  // Character voice presets using browser TTS with audio effects
  private characterVoices: CharacterVoice[] = [
    {
      id: 'sarcastic_narrator',
      name: 'Sarcastic Narrator',
      description: 'Deep, slow voice with a hint of sarcasm and wit',
      voiceSettings: {
        pitch: 0.8, // Lower pitch for deeper voice
        rate: 0.8, // Slower rate for dramatic effect
        volume: 0.9
      },
      personality: {
        enthusiasm: 30,
        sarcasm: 95,
        warmth: 40
      }
    },
    {
      id: 'cheerful_host',
      name: 'Cheerful Host',
      description: 'Bright, energetic voice with enthusiasm and positivity',
      voiceSettings: {
        pitch: 1.3, // Higher pitch for cheerfulness
        rate: 1.2, // Faster rate for energy
        volume: 0.9
      },
      personality: {
        enthusiasm: 90,
        sarcasm: 20,
        warmth: 85
      }
    },
    {
      id: 'wise_mentor',
      name: 'Wise Mentor',
      description: 'Calm, measured voice with wisdom and authority',
      voiceSettings: {
        pitch: 0.9, // Slightly lower for authority
        rate: 0.9, // Slower for thoughtfulness
        volume: 0.8
      },
      personality: {
        enthusiasm: 50,
        sarcasm: 60,
        warmth: 80
      }
    },
    {
      id: 'comedic_sidekick',
      name: 'Comedic Sidekick',
      description: 'Playful, variable voice with humor and charm',
      voiceSettings: {
        pitch: 1.1, // Slightly higher for playfulness
        rate: 1.1, // Moderate speed
        volume: 0.9
      },
      personality: {
        enthusiasm: 85,
        sarcasm: 75,
        warmth: 70
      }
    },
    {
      id: 'dramatic_announcer',
      name: 'Dramatic Announcer',
      description: 'Bold, theatrical voice with dramatic flair',
      voiceSettings: {
        pitch: 0.7, // Lower for drama
        rate: 0.7, // Slower for impact
        volume: 1.0
      },
      personality: {
        enthusiasm: 70,
        sarcasm: 80,
        warmth: 30
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
    utterance.rate = character.voiceSettings.rate;
    utterance.pitch = character.voiceSettings.pitch;
    utterance.volume = character.voiceSettings.volume;

    // Try to find a suitable voice based on character
    const voices = speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => /en/i.test(v.lang));
    
    // Character-specific voice selection
    if (character.id === 'sarcastic_narrator' || character.id === 'dramatic_announcer') {
      // Prefer male voices for deeper characters
      const maleVoice = voices.find(v => 
        /en/i.test(v.lang) && 
        (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('james'))
      );
      if (maleVoice) {
        selectedVoice = maleVoice;
      }
    } else if (character.id === 'cheerful_host') {
      // Prefer female voices for cheerful characters
      const femaleVoice = voices.find(v => 
        /en/i.test(v.lang) && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('sarah') || v.name.toLowerCase().includes('emma'))
      );
      if (femaleVoice) {
        selectedVoice = femaleVoice;
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
    this.isPlaying = false;
    
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying || (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking);
  }

  async testCharacterVoice(characterId: string): Promise<void> {
    const testText = "Hey there, stress ball. Ready for some sarcastic serenity?";
    await this.speakWithCharacter(testText, characterId);
  }

  // Get character voice by ID
  getCharacterVoice(characterId: string): CharacterVoice | undefined {
    return this.characterVoices.find(c => c.id === characterId);
  }

  // Get default character voice
  getDefaultCharacterVoice(): CharacterVoice {
    return this.characterVoices[0]; // Sarcastic Narrator
  }
}

// Export singleton instance
export const characterVoiceService = new CharacterVoiceService();
