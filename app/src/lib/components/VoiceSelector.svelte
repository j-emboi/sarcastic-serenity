<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settings';
  
  let settingsValue: any = null;
  
  onMount(() => {
    const unsubscribe = settings.subscribe(value => {
      settingsValue = value;
    });
    
    return unsubscribe;
  });
  
  // Get values from settings store
  $: voiceId = settingsValue?.voiceId;
  $: voicePitch = settingsValue?.voicePitch || 1.8;
  $: voiceRate = settingsValue?.voiceRate || 1.12;
  
  let voices: SpeechSynthesisVoice[] = [];
  let voicesLoaded = false;
  let testText = "Hey there, stress ball. Ready for some sarcastic serenity?";
  let isTesting = false;
  
  onMount(() => {
    // Load voices immediately if available
    loadVoices();
    
    // Listen for voices to be loaded
    speechSynthesis.onvoiceschanged = loadVoices;
  });
  
  function loadVoices() {
    const availableVoices = speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      voices = availableVoices;
      voicesLoaded = true;
      
      // Auto-select first English voice if no voice is selected
      if (!voiceId) {
        const englishVoice = voices.find(v => /en/i.test(v.lang));
        if (englishVoice) {
          voiceId = englishVoice.voiceURI;
        }
      }
    }
  }
  
  function testVoice() {
    if (!voiceId || isTesting) return;
    
    isTesting = true;
    
    try {
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.voice = voices.find(v => v.voiceURI === voiceId) || null;
      utterance.pitch = voicePitch;
      utterance.rate = voiceRate;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        isTesting = false;
      };
      
      utterance.onerror = () => {
        isTesting = false;
      };
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Voice test failed:', error);
      isTesting = false;
    }
  }
  
  function getVoiceDisplayName(voice: SpeechSynthesisVoice): string {
    const lang = voice.lang.split('-')[0].toUpperCase();
    return `${voice.name} (${lang})`;
  }
  
  function getVoiceGroup(voice: SpeechSynthesisVoice): string {
    const lang = voice.lang.split('-')[0].toLowerCase();
    if (lang === 'en') return 'English';
    if (lang === 'es') return 'Spanish';
    if (lang === 'fr') return 'French';
    if (lang === 'de') return 'German';
    if (lang === 'it') return 'Italian';
    if (lang === 'pt') return 'Portuguese';
    if (lang === 'ja') return 'Japanese';
    if (lang === 'ko') return 'Korean';
    if (lang === 'zh') return 'Chinese';
    return 'Other';
  }
  
  $: groupedVoices = voices.reduce((groups, voice) => {
    const group = getVoiceGroup(voice);
    if (!groups[group]) groups[group] = [];
    groups[group].push(voice);
    return groups;
  }, {} as Record<string, SpeechSynthesisVoice[]>);
  
  $: sortedGroups = Object.keys(groupedVoices).sort((a, b) => {
    if (a === 'English') return -1;
    if (b === 'English') return 1;
    return a.localeCompare(b);
  });
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <label class="block text-sm font-medium">Voice Selection</label>
    
    {#if !voicesLoaded}
      <div class="text-sm text-gray-500">Loading available voices...</div>
    {:else if voices.length === 0}
      <div class="text-sm text-red-500">No voices available. Please check your system TTS settings.</div>
    {:else}
      <select 
        value={voiceId || ''}
        on:change={(e) => {
          const target = e.target as HTMLSelectElement;
          if (target) {
            settings.update(s => ({ ...s, voiceId: target.value || undefined }));
          }
        }}
        class="w-full rounded border p-2 text-sm"
        disabled={!voicesLoaded}
      >
        {#each sortedGroups as group}
          <optgroup label={group}>
            {#each groupedVoices[group] as voice}
              <option value={voice.voiceURI}>
                {getVoiceDisplayName(voice)}
              </option>
            {/each}
          </optgroup>
        {/each}
      </select>
      
      <div class="flex items-center gap-2">
        <button 
          type="button"
          on:click={testVoice}
          disabled={!voiceId || isTesting}
          class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Voice'}
        </button>
        <span class="text-xs text-gray-500">"{testText}"</span>
      </div>
    {/if}
  </div>
  
  <div class="grid gap-4 md:grid-cols-2">
    <label class="space-y-2">
      <span class="block text-sm font-medium">Pitch: {voicePitch.toFixed(1)}</span>
      <input 
        type="range" 
        min="0.5" 
        max="2.0" 
        step="0.1" 
        value={voicePitch}
        on:input={(e) => {
          const target = e.target as HTMLInputElement;
          if (target) {
            settings.update(s => ({ ...s, voicePitch: parseFloat(target.value) }));
          }
        }}
        class="w-full" 
      />
      <span class="text-xs text-gray-500">Lower = deeper, Higher = squeakier</span>
    </label>
    
    <label class="space-y-2">
      <span class="block text-sm font-medium">Speed: {voiceRate.toFixed(1)}</span>
      <input 
        type="range" 
        min="0.5" 
        max="2.0" 
        step="0.1" 
        value={voiceRate}
        on:input={(e) => {
          const target = e.target as HTMLInputElement;
          if (target) {
            settings.update(s => ({ ...s, voiceRate: parseFloat(target.value) }));
          }
        }}
        class="w-full" 
      />
      <span class="text-xs text-gray-500">Slower = more dramatic, Faster = more energetic</span>
    </label>
  </div>
  

</div>
