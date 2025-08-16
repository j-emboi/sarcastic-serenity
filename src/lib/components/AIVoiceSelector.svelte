<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settings';
  import { aiVoiceService, type AIVoice, type AIVoiceSettings } from '$lib/audio/aiVoiceService';
  
  let settingsValue: any = null;
  
  onMount(() => {
    const unsubscribe = settings.subscribe(value => {
      settingsValue = value;
    });
    
    return unsubscribe;
  });
  
  // Get values from settings store
  $: useAIVoice = settingsValue?.useAIVoice || false;
  $: aiVoiceId = settingsValue?.aiVoiceId;
  $: aiVoicePitch = settingsValue?.aiVoicePitch || 0;
  $: aiVoiceRate = settingsValue?.aiVoiceRate || 0;
  $: aiVoiceVolume = settingsValue?.aiVoiceVolume || 80;
  
  let aiVoices: AIVoice[] = [];
  let voicesLoaded = false;
  let isLoading = false;
  let isTesting = false;
  let testText = "Hey there, stress ball. Ready for some sarcastic serenity?";
  
  onMount(async () => {
    await loadAIVoices();
  });
  
  async function loadAIVoices() {
    if (isLoading) return;
    
    isLoading = true;
    try {
      aiVoices = await aiVoiceService.getAvailableVoices();
      voicesLoaded = true;
      
      // Auto-select first voice if none selected
      if (!aiVoiceId && aiVoices.length > 0) {
        const firstVoice = aiVoices[0];
        settings.update(s => ({ ...s, aiVoiceId: firstVoice.id }));
      }
    } catch (error) {
      console.error('Failed to load AI voices:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function testAIVoice() {
    if (!aiVoiceId || isTesting) return;
    
    isTesting = true;
    try {
      const voiceSettings: AIVoiceSettings = {
        voiceId: aiVoiceId,
        pitch: aiVoicePitch,
        rate: aiVoiceRate,
        volume: aiVoiceVolume
      };
      
      await aiVoiceService.testVoice(voiceSettings);
    } catch (error) {
      console.error('AI voice test failed:', error);
    } finally {
      isTesting = false;
    }
  }
  
  function getVoiceDisplayName(voice: AIVoice): string {
    return `${voice.name} (${voice.gender})`;
  }
  
  function getVoiceGroup(voice: AIVoice): string {
    if (voice.language.startsWith('en-US')) return 'US English';
    if (voice.language.startsWith('en-GB')) return 'British English';
    if (voice.language.startsWith('en-')) return 'English';
    return 'Other';
  }
  
  $: groupedVoices = aiVoices.reduce((groups, voice) => {
    const group = getVoiceGroup(voice);
    if (!groups[group]) groups[group] = [];
    groups[group].push(voice);
    return groups;
  }, {} as Record<string, AIVoice[]>);
  
  $: sortedGroups = Object.keys(groupedVoices).sort((a, b) => {
    if (a === 'US English') return -1;
    if (b === 'US English') return 1;
    if (a === 'British English') return -1;
    if (b === 'British English') return 1;
    return a.localeCompare(b);
  });
</script>

<div class="space-y-4">
  <!-- AI Voice Toggle -->
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <label for="ai-voice-toggle" class="block text-sm font-medium">Use AI Voice</label>
      <button 
        id="ai-voice-toggle"
        class="px-3 py-1 rounded text-sm {useAIVoice ? 'bg-green-600' : 'bg-gray-600'}"
        on:click={() => {
          settings.update(s => ({ ...s, useAIVoice: !s.useAIVoice }));
        }}
      >
        {useAIVoice ? 'ON' : 'OFF'}
      </button>
    </div>
    <p class="text-xs text-blue-200">
      AI voices provide higher quality and more natural speech than browser TTS
    </p>
  </div>

  {#if useAIVoice}
    <!-- AI Voice Selection -->
    <div class="space-y-2">
      <label for="ai-voice-select" class="block text-sm font-medium">AI Voice Selection</label>
      
      {#if isLoading}
        <div class="text-sm text-gray-500">Loading AI voices...</div>
      {:else if !voicesLoaded || aiVoices.length === 0}
        <div class="text-sm text-red-500">
          Failed to load AI voices. Check your internet connection or try refreshing.
        </div>
        <button 
          on:click={loadAIVoices}
          class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Retry
        </button>
      {:else}
        <select 
          id="ai-voice-select"
          value={aiVoiceId || ''}
          on:change={(e) => {
            const target = e.target as HTMLSelectElement;
            if (target) {
              settings.update(s => ({ ...s, aiVoiceId: target.value || undefined }));
            }
          }}
          class="w-full p-2 rounded bg-gray-800 text-white border-gray-600"
        >
          {#each sortedGroups as group}
            <optgroup label={group}>
              {#each groupedVoices[group] as voice}
                <option value={voice.id}>
                  {getVoiceDisplayName(voice)}
                </option>
              {/each}
            </optgroup>
          {/each}
        </select>
        
        <div class="flex items-center gap-2">
          <button 
            type="button"
            on:click={testAIVoice}
            disabled={!aiVoiceId || isTesting}
            class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test AI Voice'}
          </button>
          <span class="text-xs text-green-200">"{testText}"</span>
        </div>
      {/if}
    </div>
    
    <!-- AI Voice Controls -->
    <div class="grid gap-4 md:grid-cols-3">
      <label for="ai-pitch-slider" class="space-y-2">
        <span class="block text-sm font-medium">Pitch: {aiVoicePitch}</span>
        <input 
          id="ai-pitch-slider"
          type="range" 
          min="-50" 
          max="50" 
          step="5" 
          value={aiVoicePitch}
          on:input={(e) => {
            const target = e.target as HTMLInputElement;
            if (target) {
              settings.update(s => ({ ...s, aiVoicePitch: parseInt(target.value) }));
            }
          }}
          class="w-full" 
        />
        <span class="text-xs text-green-200">Lower = deeper, Higher = squeakier</span>
      </label>
      
      <label for="ai-rate-slider" class="space-y-2">
        <span class="block text-sm font-medium">Speed: {aiVoiceRate}</span>
        <input 
          id="ai-rate-slider"
          type="range" 
          min="-50" 
          max="50" 
          step="5" 
          value={aiVoiceRate}
          on:input={(e) => {
            const target = e.target as HTMLInputElement;
            if (target) {
              settings.update(s => ({ ...s, aiVoiceRate: parseInt(target.value) }));
            }
          }}
          class="w-full" 
        />
        <span class="text-xs text-green-200">Slower = more dramatic, Faster = more energetic</span>
      </label>
      
      <label for="ai-volume-slider" class="space-y-2">
        <span class="block text-sm font-medium">Volume: {aiVoiceVolume}%</span>
        <input 
          id="ai-volume-slider"
          type="range" 
          min="0" 
          max="100" 
          step="5" 
          value={aiVoiceVolume}
          on:input={(e) => {
            const target = e.target as HTMLInputElement;
            if (target) {
              settings.update(s => ({ ...s, aiVoiceVolume: parseInt(target.value) }));
            }
          }}
          class="w-full" 
        />
        <span class="text-xs text-green-200">Volume level for AI voice</span>
      </label>
    </div>
  {/if}
</div>
