<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settings';
  import { characterVoiceService } from '$lib/audio/characterVoiceService';
  import { aiVoiceService } from '$lib/audio/aiVoiceService';
  
  let settingsValue: any = null;
  
  onMount(() => {
    const unsubscribe = settings.subscribe(value => {
      settingsValue = value;
    });
    
    return unsubscribe;
  });
  
  // Get values from settings store
  $: selectedVoiceType = settingsValue?.selectedVoiceType || 'browser';
  $: selectedVoiceId = settingsValue?.selectedVoiceId;
  
  let characterVoices: any[] = [];
  let aiVoices: any[] = [];
  let browserVoices: any[] = [];
  let voicesLoaded = false;
  let isLoading = false;
  let isTesting = false;
  
  onMount(async () => {
    await loadAllVoices();
  });
  
  async function loadAllVoices() {
    if (isLoading) return;
    
    isLoading = true;
    try {
      // Load character voices
      characterVoices = await characterVoiceService.getAvailableCharacterVoices();
      
      // Load AI voices
      aiVoices = await aiVoiceService.getAvailableVoices();
      
      // Load browser voices
      if (typeof speechSynthesis !== 'undefined') {
        browserVoices = speechSynthesis.getVoices();
        if (browserVoices.length === 0) {
          // Wait for voices to load
          speechSynthesis.onvoiceschanged = () => {
            browserVoices = speechSynthesis.getVoices();
            voicesLoaded = true;
          };
        } else {
          voicesLoaded = true;
        }
      } else {
        voicesLoaded = true;
      }
      
      // Auto-select Mickey Mouse if no voice is selected
      if (!selectedVoiceId && characterVoices.length > 0) {
        const mickeyVoice = characterVoices.find((v: any) => v.id === 'mickey_mouse_1928');
        if (mickeyVoice) {
          settings.update(s => ({ 
            ...s, 
            selectedVoiceType: 'character',
            selectedVoiceId: mickeyVoice.id 
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function testVoice() {
    if (!selectedVoiceId || isTesting) return;
    
    isTesting = true;
    try {
      const testText = "Hot dog! This is going to be a swell session!";
      
      if (selectedVoiceType === 'character') {
        await characterVoiceService.speakWithCharacter(testText, selectedVoiceId);
      } else if (selectedVoiceType === 'ai') {
        const aiSettings = {
          voiceId: selectedVoiceId,
          pitch: settingsValue?.aiVoicePitch || 0,
          rate: settingsValue?.aiVoiceRate || 0,
          volume: settingsValue?.aiVoiceVolume || 80
        };
        await aiVoiceService.speak(testText, aiSettings);
      } else {
        // Browser TTS
        if (typeof speechSynthesis !== 'undefined') {
          const utterance = new SpeechSynthesisUtterance(testText);
          utterance.rate = settingsValue?.voiceRate || 1.0;
          utterance.pitch = settingsValue?.voicePitch || 1.0;
          utterance.volume = 0.8;
          
          const selectedVoice = browserVoices.find((v: any) => v.voiceURI === selectedVoiceId);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          
          speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      isTesting = false;
    }
  }
  
  function handleVoiceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target) {
      const [voiceType, voiceId] = target.value.split('|');
      settings.update(s => ({ 
        ...s, 
        selectedVoiceType: voiceType as 'character' | 'ai' | 'browser',
        selectedVoiceId: voiceId || undefined
      }));
    }
  }
  
  function getCurrentVoiceValue(): string {
    if (selectedVoiceType && selectedVoiceId) {
      return `${selectedVoiceType}|${selectedVoiceId}`;
    }
    return '';
  }
  
  function getVoiceDisplayName(voice: any, type: string): string {
    switch (type) {
      case 'character':
        return `🎭 ${voice.name} (${voice.character})`;
      case 'ai':
        return `🤖 ${voice.name} (${voice.gender})`;
      case 'browser':
        const lang = voice.lang.split('-')[0].toUpperCase();
        return `🔊 ${voice.name} (${lang})`;
      default:
        return voice.name;
    }
  }
  
  function getVoiceGroup(voice: any, type: string): string {
    switch (type) {
      case 'character':
        return 'Character Voices';
      case 'ai':
        if (voice.language.startsWith('en-US')) return 'US AI Voices';
        if (voice.language.startsWith('en-GB')) return 'British AI Voices';
        return 'AI Voices';
      case 'browser':
        const lang = voice.lang.split('-')[0].toLowerCase();
        if (lang === 'en') return 'English Browser Voices';
        if (lang === 'es') return 'Spanish Browser Voices';
        if (lang === 'fr') return 'French Browser Voices';
        return 'Other Browser Voices';
      default:
        return 'Other';
    }
  }
  
  // Group all voices by type and then by language
  $: allVoices = [
    ...characterVoices.map((v: any) => ({ ...v, type: 'character' })),
    ...aiVoices.map((v: any) => ({ ...v, type: 'ai' })),
    ...browserVoices.map((v: any) => ({ ...v, type: 'browser' }))
  ];
  
  $: groupedVoices = allVoices.reduce((groups: any, voice: any) => {
    const group = getVoiceGroup(voice, voice.type);
    if (!groups[group]) groups[group] = [];
    groups[group].push(voice);
    return groups;
  }, {});
  
  $: sortedGroups = Object.keys(groupedVoices).sort((a, b) => {
    // Character voices first, then AI, then browser
    if (a.includes('Character')) return -1;
    if (b.includes('Character')) return 1;
    if (a.includes('AI')) return -1;
    if (b.includes('AI')) return 1;
    return a.localeCompare(b);
  });
</script>

<div class="space-y-4">
  <!-- Unified Voice Selection -->
  <div class="space-y-2">
    <label for="unified-voice-select" class="block text-sm font-medium">Voice Selection</label>
    
    {#if isLoading}
      <div class="text-sm text-gray-500">Loading available voices...</div>
    {:else if !voicesLoaded || allVoices.length === 0}
      <div class="text-sm text-red-500">
        Failed to load voices. Please try refreshing.
      </div>
      <button 
        on:click={loadAllVoices}
        class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
      >
        Retry
      </button>
    {:else}
      <select 
        id="unified-voice-select"
        value={getCurrentVoiceValue()}
        on:change={handleVoiceChange}
        class="w-full p-2 rounded bg-gray-800 text-white border-gray-600"
      >
        {#each sortedGroups as group}
          <optgroup label={group}>
            {#each groupedVoices[group] as voice}
              <option value="{voice.type}|{voice.id || voice.voiceURI}">
                {getVoiceDisplayName(voice, voice.type)}
              </option>
            {/each}
          </optgroup>
        {/each}
      </select>
      
      <div class="flex items-center gap-2">
        <button 
          type="button"
          on:click={testVoice}
          disabled={!selectedVoiceId || isTesting}
          class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Voice'}
        </button>
        <span class="text-xs text-blue-200">"Hot dog! This is going to be a swell session!"</span>
      </div>
    {/if}
  </div>
  
  <!-- Voice Controls -->
  {#if selectedVoiceType === 'ai'}
    <div class="grid gap-4 md:grid-cols-3">
      <label for="ai-pitch-slider" class="space-y-2">
        <span class="block text-sm font-medium">AI Pitch: {settingsValue?.aiVoicePitch || 0}</span>
        <input 
          id="ai-pitch-slider"
          type="range" 
          min="-50" 
          max="50" 
          step="5" 
          value={settingsValue?.aiVoicePitch || 0}
          on:input={(e) => {
            const target = e.target as HTMLInputElement;
            if (target) {
              settings.update(s => ({ ...s, aiVoicePitch: parseInt(target.value) }));
            }
          }}
          class="w-full" 
        />
      </label>
      
      <label for="ai-rate-slider" class="space-y-2">
        <span class="block text-sm font-medium">AI Speed: {settingsValue?.aiVoiceRate || 0}</span>
        <input 
          id="ai-rate-slider"
          type="range" 
          min="-50" 
          max="50" 
          step="5" 
          value={settingsValue?.aiVoiceRate || 0}
          on:input={(e) => {
            const target = e.target as HTMLInputElement;
            if (target) {
              settings.update(s => ({ ...s, aiVoiceRate: parseInt(target.value) }));
            }
          }}
          class="w-full" 
        />
      </label>
      
      <label for="ai-volume-slider" class="space-y-2">
        <span class="block text-sm font-medium">AI Volume: {settingsValue?.aiVoiceVolume || 80}%</span>
        <input 
          id="ai-volume-slider"
          type="range" 
          min="0" 
          max="100" 
          step="5" 
          value={settingsValue?.aiVoiceVolume || 80}
          on:input={(e) => {
            const target = e.target as HTMLInputElement;
            if (target) {
              settings.update(s => ({ ...s, aiVoiceVolume: parseInt(target.value) }));
            }
          }}
          class="w-full" 
        />
      </label>
    </div>
  {:else if selectedVoiceType === 'browser'}
    <div class="grid gap-4 md:grid-cols-2">
      <label for="browser-pitch-slider" class="space-y-2">
        <span class="block text-sm font-medium">Pitch: {(settingsValue?.voicePitch || 1.0).toFixed(1)}</span>
        <input 
          id="browser-pitch-slider"
          type="range" 
          min="0.5" 
          max="2.0" 
          step="0.1" 
          value={settingsValue?.voicePitch || 1.0}
          on:input={(e) => {
            const target = e.target as HTMLInputElement;
            if (target) {
              settings.update(s => ({ ...s, voicePitch: parseFloat(target.value) }));
            }
          }}
          class="w-full" 
        />
      </label>
      
      <label for="browser-rate-slider" class="space-y-2">
        <span class="block text-sm font-medium">Speed: {(settingsValue?.voiceRate || 1.0).toFixed(1)}</span>
        <input 
          id="browser-rate-slider"
          type="range" 
          min="0.5" 
          max="2.0" 
          step="0.1" 
          value={settingsValue?.voiceRate || 1.0}
          on:input={(e) => {
            const target = e.target as HTMLInputElement;
            if (target) {
              settings.update(s => ({ ...s, voiceRate: parseFloat(target.value) }));
            }
          }}
          class="w-full" 
        />
      </label>
    </div>
  {/if}
</div>
