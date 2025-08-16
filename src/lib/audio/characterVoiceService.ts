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
  voicePreferences: {
    gender: 'male' | 'female' | 'any';
    age: 'young' | 'mature' | 'elderly' | 'any';
    accent: 'american' | 'british' | 'any';
  };
}

export class CharacterVoiceService {
  private isPlaying = false;
  private voiceCache: Map<string, SpeechSynthesisVoice> = new Map();
  private voicesLoaded = false;
  private debugMode = true; // Enable debugging for testing

  // Enhanced character voice presets with more dramatic differences
  private characterVoices: CharacterVoice[] = [
    {
      id: 'sarcastic_narrator',
      name: 'Sarcastic Narrator',
      description: 'Deep, gravelly voice with dramatic pauses and dry wit',
      voiceSettings: {
        pitch: 0.6, // Much lower for deeper voice
        rate: 0.6, // Much slower for dramatic effect
        volume: 0.9
      },
      personality: {
        enthusiasm: 20,
        sarcasm: 95,
        warmth: 30
      },
      voicePreferences: {
        gender: 'male',
        age: 'mature',
        accent: 'american'
      }
    },
    {
      id: 'cheerful_host',
      name: 'Cheerful Host',
      description: 'Bright, bubbly voice with infectious energy and enthusiasm',
      voiceSettings: {
        pitch: 1.5, // Much higher for cheerfulness
        rate: 1.4, // Much faster for energy
        volume: 0.9
      },
      personality: {
        enthusiasm: 95,
        sarcasm: 15,
        warmth: 90
      },
      voicePreferences: {
        gender: 'female',
        age: 'young',
        accent: 'american'
      }
    },
    {
      id: 'wise_mentor',
      name: 'Wise Mentor',
      description: 'Smooth, measured voice with wisdom and gentle authority',
      voiceSettings: {
        pitch: 0.8, // Lower for authority
        rate: 0.7, // Slower for thoughtfulness
        volume: 0.8
      },
      personality: {
        enthusiasm: 40,
        sarcasm: 70,
        warmth: 85
      },
      voicePreferences: {
        gender: 'male',
        age: 'elderly',
        accent: 'british'
      }
    },
    {
      id: 'comedic_sidekick',
      name: 'Comedic Sidekick',
      description: 'Playful, animated voice with lots of personality and humor',
      voiceSettings: {
        pitch: 1.3, // Higher for playfulness
        rate: 1.3, // Faster for energy
        volume: 0.9
      },
      personality: {
        enthusiasm: 90,
        sarcasm: 80,
        warmth: 75
      },
      voicePreferences: {
        gender: 'male',
        age: 'young',
        accent: 'american'
      }
    },
    {
      id: 'dramatic_announcer',
      name: 'Dramatic Announcer',
      description: 'Booming, theatrical voice with dramatic flair and gravitas',
      voiceSettings: {
        pitch: 0.7, // Lower for drama
        rate: 0.5, // Much slower for impact
        volume: 1.0
      },
      personality: {
        enthusiasm: 85,
        sarcasm: 60,
        warmth: 40
      },
      voicePreferences: {
        gender: 'male',
        age: 'mature',
        accent: 'american'
      }
    },
    {
      id: 'smooth_operator',
      name: 'Smooth Operator',
      description: 'Suave, sophisticated voice with charm and elegance',
      voiceSettings: {
        pitch: 0.9, // Slightly lower for sophistication
        rate: 0.8, // Slower for smoothness
        volume: 0.85
      },
      personality: {
        enthusiasm: 60,
        sarcasm: 85,
        warmth: 70
      },
      voicePreferences: {
        gender: 'male',
        age: 'mature',
        accent: 'british'
      }
    },
    {
      id: 'energetic_coach',
      name: 'Energetic Coach',
      description: 'Motivational, passionate voice with infectious energy',
      voiceSettings: {
        pitch: 1.2, // Higher for energy
        rate: 1.5, // Much faster for enthusiasm
        volume: 0.95
      },
      personality: {
        enthusiasm: 100,
        sarcasm: 50,
        warmth: 80
      },
      voicePreferences: {
        gender: 'male',
        age: 'mature',
        accent: 'american'
      }
    }
  ];

  constructor() {
    // Initialize voice loading
    this.initializeVoices();
  }

  // Debug method to get voice system status
  getVoiceSystemStatus(): any {
    return {
      voicesLoaded: this.voicesLoaded,
      voiceCacheSize: this.voiceCache.size,
      availableVoices: typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices().length : 0,
      cachedVoices: Array.from(this.voiceCache.entries()).map(([id, voice]) => ({
        characterId: id,
        voiceName: voice.name,
        voiceLang: voice.lang
      })),
      characterVoices: this.characterVoices.map(c => ({
        id: c.id,
        name: c.name,
        preferences: c.voicePreferences
      }))
    };
  }

  // Test method to verify voice consistency
  async testVoiceConsistency(characterId: string): Promise<any> {
    const character = this.characterVoices.find(c => c.id === characterId);
    if (!character) {
      return { error: 'Character not found' };
    }

    // Ensure voices are loaded
    if (!this.voicesLoaded) {
      await this.initializeVoices();
    }

    const voices = speechSynthesis.getVoices();
    const cachedVoice = this.voiceCache.get(characterId);
    const freshVoice = this.findBestVoiceForCharacter(voices, character);

    return {
      character: {
        id: character.id,
        name: character.name,
        preferences: character.voicePreferences
      },
      cachedVoice: cachedVoice ? {
        name: cachedVoice.name,
        lang: cachedVoice.lang,
        voiceURI: cachedVoice.voiceURI
      } : null,
      freshVoice: freshVoice ? {
        name: freshVoice.name,
        lang: freshVoice.lang,
        voiceURI: freshVoice.voiceURI
      } : null,
      isConsistent: cachedVoice && freshVoice && cachedVoice.voiceURI === freshVoice.voiceURI,
      totalVoices: voices.length,
      englishVoices: voices.filter(v => /en/i.test(v.lang)).length
    };
  }

  private async initializeVoices(): Promise<void> {
    if (typeof speechSynthesis === 'undefined') {
      console.warn('Speech synthesis not available');
      return;
    }

    if (this.debugMode) {
      console.log('🎤 Initializing voice system...');
    }

    // Wait for voices to load
    if (speechSynthesis.getVoices().length === 0) {
      if (this.debugMode) {
        console.log('🎤 Waiting for voices to load...');
      }
      
      await new Promise<void>((resolve) => {
        const onVoicesChanged = () => {
          speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          if (this.debugMode) {
            console.log('🎤 Voices loaded via voiceschanged event');
          }
          resolve();
        };
        speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
        
        // Fallback timeout
        setTimeout(() => {
          if (this.debugMode) {
            console.log('🎤 Voices loaded via timeout fallback');
          }
          resolve();
        }, 1000);
      });
    }

    this.voicesLoaded = true;
    this.cacheVoicesForCharacters();
  }

  private cacheVoicesForCharacters(): void {
    const voices = speechSynthesis.getVoices();
    
    if (this.debugMode) {
      console.log(`🎤 Caching voices for ${this.characterVoices.length} characters from ${voices.length} available voices`);
    }
    
    for (const character of this.characterVoices) {
      const selectedVoice = this.findBestVoiceForCharacter(voices, character);
      if (selectedVoice) {
        this.voiceCache.set(character.id, selectedVoice);
        if (this.debugMode) {
          console.log(`🎤 Cached voice for ${character.name}: ${selectedVoice.name} (${selectedVoice.lang})`);
        }
      } else {
        if (this.debugMode) {
          console.warn(`🎤 No suitable voice found for ${character.name}`);
        }
      }
    }
  }

  async getAvailableCharacterVoices(): Promise<CharacterVoice[]> {
    // Ensure voices are loaded before returning
    if (!this.voicesLoaded) {
      await this.initializeVoices();
    }
    return this.characterVoices;
  }

  async speakWithCharacter(text: string, characterId: string): Promise<void> {
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

    // Ensure voices are loaded
    if (!this.voicesLoaded) {
      await this.initializeVoices();
    }

    // Create utterance with character settings
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply character voice settings
    utterance.rate = character.voiceSettings.rate;
    utterance.pitch = character.voiceSettings.pitch;
    utterance.volume = character.voiceSettings.volume;

    // Use cached voice for consistency
    let selectedVoice = this.voiceCache.get(character.id);
    
    // If no cached voice, find and cache one
    if (!selectedVoice) {
      const voices = speechSynthesis.getVoices();
      selectedVoice = this.findBestVoiceForCharacter(voices, character);
      if (selectedVoice) {
        this.voiceCache.set(character.id, selectedVoice);
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`Using voice for ${character.name}: ${selectedVoice.name}`);
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

  private findBestVoiceForCharacter(voices: SpeechSynthesisVoice[], character: CharacterVoice): SpeechSynthesisVoice | null {
    // Filter voices by language first
    const englishVoices = voices.filter(v => /en/i.test(v.lang));
    
    if (englishVoices.length === 0) {
      return voices.find(v => /en/i.test(v.lang)) || null;
    }

    // Score each voice based on character preferences
    const scoredVoices = englishVoices.map(voice => {
      let score = 0;
      const voiceName = voice.name.toLowerCase();
      const voiceLang = voice.lang.toLowerCase();

      // Gender preference
      if (character.voicePreferences.gender === 'male') {
        if (voiceName.includes('male') || voiceName.includes('david') || voiceName.includes('james') || 
            voiceName.includes('john') || voiceName.includes('mike') || voiceName.includes('tom')) {
          score += 10;
        }
      } else if (character.voicePreferences.gender === 'female') {
        if (voiceName.includes('female') || voiceName.includes('sarah') || voiceName.includes('emma') || 
            voiceName.includes('lisa') || voiceName.includes('anna') || voiceName.includes('sophie')) {
          score += 10;
        }
      }

      // Age preference
      if (character.voicePreferences.age === 'young') {
        if (voiceName.includes('young') || voiceName.includes('teen') || voiceName.includes('kid')) {
          score += 5;
        }
      } else if (character.voicePreferences.age === 'mature') {
        if (voiceName.includes('mature') || voiceName.includes('adult') || voiceName.includes('man') || 
            voiceName.includes('woman')) {
          score += 5;
        }
      } else if (character.voicePreferences.age === 'elderly') {
        if (voiceName.includes('elder') || voiceName.includes('senior') || voiceName.includes('old')) {
          score += 5;
        }
      }

      // Accent preference
      if (character.voicePreferences.accent === 'british') {
        if (voiceLang.includes('gb') || voiceName.includes('british') || voiceName.includes('uk')) {
          score += 8;
        }
      } else if (character.voicePreferences.accent === 'american') {
        if (voiceLang.includes('us') || voiceName.includes('american') || voiceName.includes('us')) {
          score += 8;
        }
      }

      // Character-specific voice matching
      switch (character.id) {
        case 'sarcastic_narrator':
          if (voiceName.includes('deep') || voiceName.includes('gravel') || voiceName.includes('rough')) {
            score += 15;
          }
          break;
        case 'cheerful_host':
          if (voiceName.includes('bright') || voiceName.includes('cheerful') || voiceName.includes('happy')) {
            score += 15;
          }
          break;
        case 'wise_mentor':
          if (voiceName.includes('wise') || voiceName.includes('calm') || voiceName.includes('gentle')) {
            score += 15;
          }
          break;
        case 'dramatic_announcer':
          if (voiceName.includes('dramatic') || voiceName.includes('theatrical') || voiceName.includes('booming')) {
            score += 15;
          }
          break;
        case 'smooth_operator':
          if (voiceName.includes('smooth') || voiceName.includes('suave') || voiceName.includes('sophisticated')) {
            score += 15;
          }
          break;
        case 'energetic_coach':
          if (voiceName.includes('energetic') || voiceName.includes('motivational') || voiceName.includes('passionate')) {
            score += 15;
          }
          break;
      }

      return { voice, score };
    });

    // Sort by score and return the best match
    scoredVoices.sort((a, b) => b.score - a.score);
    return scoredVoices[0]?.voice || englishVoices[0];
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
