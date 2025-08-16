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

  // Enhanced character voice presets with optimized settings for better quality
  private characterVoices: CharacterVoice[] = [
    {
      id: 'sarcastic_narrator',
      name: 'Sarcastic Narrator',
      description: 'Deep, gravelly voice with dramatic pauses and dry wit',
      voiceSettings: {
        pitch: 0.75, // Optimized for deeper voice without being too extreme
        rate: 0.75, // Slower for dramatic effect but still natural
        volume: 0.85
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
        pitch: 1.25, // Higher for cheerfulness but not too extreme
        rate: 1.2, // Faster for energy but still clear
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
        pitch: 0.85, // Lower for authority but still warm
        rate: 0.8, // Slower for thoughtfulness but natural
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
        pitch: 1.15, // Higher for playfulness but not too high
        rate: 1.1, // Faster for energy but still understandable
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
        pitch: 0.8, // Lower for drama but not too extreme
        rate: 0.65, // Slower for impact but still clear
        volume: 0.95
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
        rate: 0.85, // Slower for smoothness but natural
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
        pitch: 1.1, // Higher for energy but not too extreme
        rate: 1.3, // Faster for enthusiasm but still clear
        volume: 0.9
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
      selectedVoice = this.findBestVoiceForCharacter(voices, character) || undefined;
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

      // Base score for being an English voice
      score += 5;

      // Gender preference (higher weight)
      if (character.voicePreferences.gender === 'male') {
        if (voiceName.includes('male') || voiceName.includes('david') || voiceName.includes('james') || 
            voiceName.includes('john') || voiceName.includes('mike') || voiceName.includes('tom') ||
            voiceName.includes('alex') || voiceName.includes('daniel') || voiceName.includes('mark')) {
          score += 15;
        }
        // Penalize female voices for male characters
        if (voiceName.includes('female') || voiceName.includes('sarah') || voiceName.includes('emma') || 
            voiceName.includes('lisa') || voiceName.includes('anna') || voiceName.includes('sophie')) {
          score -= 10;
        }
      } else if (character.voicePreferences.gender === 'female') {
        if (voiceName.includes('female') || voiceName.includes('sarah') || voiceName.includes('emma') || 
            voiceName.includes('lisa') || voiceName.includes('anna') || voiceName.includes('sophie') ||
            voiceName.includes('karen') || voiceName.includes('victoria') || voiceName.includes('samantha')) {
          score += 15;
        }
        // Penalize male voices for female characters
        if (voiceName.includes('male') || voiceName.includes('david') || voiceName.includes('james') || 
            voiceName.includes('john') || voiceName.includes('mike') || voiceName.includes('tom')) {
          score -= 10;
        }
      }

      // Age preference
      if (character.voicePreferences.age === 'young') {
        if (voiceName.includes('young') || voiceName.includes('teen') || voiceName.includes('kid') ||
            voiceName.includes('alex') || voiceName.includes('emma') || voiceName.includes('sophie')) {
          score += 8;
        }
      } else if (character.voicePreferences.age === 'mature') {
        if (voiceName.includes('mature') || voiceName.includes('adult') || voiceName.includes('man') || 
            voiceName.includes('woman') || voiceName.includes('david') || voiceName.includes('sarah')) {
          score += 8;
        }
      } else if (character.voicePreferences.age === 'elderly') {
        if (voiceName.includes('elder') || voiceName.includes('senior') || voiceName.includes('old') ||
            voiceName.includes('wise') || voiceName.includes('calm')) {
          score += 8;
        }
      }

      // Accent preference (higher weight for specific characters)
      if (character.voicePreferences.accent === 'british') {
        if (voiceLang.includes('gb') || voiceName.includes('british') || voiceName.includes('uk') ||
            voiceName.includes('victoria') || voiceName.includes('daniel')) {
          score += 12;
        }
      } else if (character.voicePreferences.accent === 'american') {
        if (voiceLang.includes('us') || voiceName.includes('american') || voiceName.includes('us') ||
            voiceName.includes('alex') || voiceName.includes('sarah') || voiceName.includes('david')) {
          score += 12;
        }
      }

      // Character-specific voice matching (enhanced)
      switch (character.id) {
        case 'sarcastic_narrator':
          if (voiceName.includes('deep') || voiceName.includes('gravel') || voiceName.includes('rough') ||
              voiceName.includes('david') || voiceName.includes('daniel')) {
            score += 20;
          }
          // Prefer slower, deeper voices
          if (voiceName.includes('calm') || voiceName.includes('mature')) {
            score += 10;
          }
          break;
        case 'cheerful_host':
          if (voiceName.includes('bright') || voiceName.includes('cheerful') || voiceName.includes('happy') ||
              voiceName.includes('emma') || voiceName.includes('sophie') || voiceName.includes('sarah')) {
            score += 20;
          }
          // Prefer higher-pitched, energetic voices
          if (voiceName.includes('young') || voiceName.includes('alex')) {
            score += 10;
          }
          break;
        case 'wise_mentor':
          if (voiceName.includes('wise') || voiceName.includes('calm') || voiceName.includes('gentle') ||
              voiceName.includes('daniel') || voiceName.includes('victoria')) {
            score += 20;
          }
          // Prefer mature, measured voices
          if (voiceName.includes('mature') || voiceName.includes('elder')) {
            score += 10;
          }
          break;
        case 'comedic_sidekick':
          if (voiceName.includes('playful') || voiceName.includes('energetic') || voiceName.includes('alex') ||
              voiceName.includes('emma') || voiceName.includes('sophie')) {
            score += 20;
          }
          // Prefer young, energetic voices
          if (voiceName.includes('young') || voiceName.includes('teen')) {
            score += 10;
          }
          break;
        case 'dramatic_announcer':
          if (voiceName.includes('dramatic') || voiceName.includes('theatrical') || voiceName.includes('booming') ||
              voiceName.includes('david') || voiceName.includes('daniel')) {
            score += 20;
          }
          // Prefer deep, authoritative voices
          if (voiceName.includes('deep') || voiceName.includes('mature')) {
            score += 10;
          }
          break;
        case 'smooth_operator':
          if (voiceName.includes('smooth') || voiceName.includes('suave') || voiceName.includes('sophisticated') ||
              voiceName.includes('daniel') || voiceName.includes('victoria')) {
            score += 20;
          }
          // Prefer refined, elegant voices
          if (voiceName.includes('mature') || voiceName.includes('calm')) {
            score += 10;
          }
          break;
        case 'energetic_coach':
          if (voiceName.includes('energetic') || voiceName.includes('motivational') || voiceName.includes('passionate') ||
              voiceName.includes('alex') || voiceName.includes('david')) {
            score += 20;
          }
          // Prefer strong, confident voices
          if (voiceName.includes('mature') || voiceName.includes('adult')) {
            score += 10;
          }
          break;
      }

      // Quality preferences
      if (voiceName.includes('premium') || voiceName.includes('enhanced') || voiceName.includes('natural')) {
        score += 5;
      }

      // Avoid system voices that might be robotic
      if (voiceName.includes('system') || voiceName.includes('default') || voiceName.includes('basic')) {
        score -= 5;
      }

      return { voice, score };
    });

    // Sort by score and return the best match
    scoredVoices.sort((a, b) => b.score - a.score);
    
    if (this.debugMode && scoredVoices.length > 0) {
      console.log(`🎤 Voice selection for ${character.name}:`);
      console.log(`🎤 Top 3 candidates:`);
      scoredVoices.slice(0, 3).forEach((candidate, index) => {
        console.log(`🎤 ${index + 1}. ${candidate.voice.name} (${candidate.voice.lang}) - Score: ${candidate.score}`);
      });
    }
    
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
