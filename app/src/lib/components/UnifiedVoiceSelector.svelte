<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settings';
  import { characterVoiceService } from '$lib/audio/characterVoiceService';
  
  let settingsValue: any = null;
  
  onMount(() => {
    const unsubscribe = settings.subscribe(value => {
      settingsValue = value;
    });
    
    return unsubscribe;
  });
  
  // Get values from settings store
  $: selectedCharacterId = settingsValue?.selectedVoiceId || 'sarcastic_narrator';
  
  let characterVoices: any[] = [];
  let voicesLoaded = false;
  let isLoading = false;
  let isTesting = false;
  
  onMount(async () => {
    await loadCharacterVoices();
  });
  
  async function loadCharacterVoices() {
    if (isLoading) return;
    
    isLoading = true;
    try {
      characterVoices = await characterVoiceService.getAvailableCharacterVoices();
      voicesLoaded = true;
      
      // Ensure we have the correct voice type and ID set
      if (settingsValue && (!settingsValue.selectedVoiceType || settingsValue.selectedVoiceType !== 'character')) {
        settings.update(s => ({ 
          ...s, 
          selectedVoiceType: 'character',
          selectedVoiceId: selectedCharacterId || 'sarcastic_narrator'
        }));
      }
    } catch (error) {
      console.error('Failed to load character voices:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function testCharacterVoice(characterId: string) {
    if (!characterId || isTesting) return;
    
    isTesting = true;
    try {
      await characterVoiceService.testCharacterVoice(characterId);
    } catch (error) {
      console.error('Character voice test failed:', error);
    } finally {
      isTesting = false;
    }
  }
</script>

<div class="space-y-4">
  <!-- Character Voice Selection -->
  <div class="space-y-2">
    <h3 class="text-sm font-medium">Character Voice</h3>
    
    {#if isLoading}
      <div class="text-sm text-gray-500">Loading character voices...</div>
    {:else if !voicesLoaded || characterVoices.length === 0}
      <div class="text-sm text-red-500">
        Failed to load character voices. Please try refreshing.
      </div>
      <button 
        on:click={loadCharacterVoices}
        class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
      >
        Retry
      </button>
    {:else}
      <select 
        value={selectedCharacterId || 'sarcastic_narrator'}
        on:change={(e) => {
          const target = e.target as HTMLSelectElement;
          if (target) {
            settings.update(s => ({ 
              ...s, 
              selectedVoiceType: 'character',
              selectedVoiceId: target.value || 'sarcastic_narrator'
            }));
          }
        }}
        class="w-full p-2 rounded bg-gray-800 text-white border-gray-600"
      >
        {#each characterVoices as voice}
          <option value={voice.id}>
            {voice.name}
          </option>
        {/each}
      </select>
      
      <div class="flex items-center gap-2">
        <button 
          type="button"
          on:click={() => testCharacterVoice(selectedCharacterId)}
          disabled={!selectedCharacterId || isTesting}
          class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Voice'}
        </button>
        <span class="text-xs text-blue-200">"Hey there, stress ball. Ready for some sarcastic serenity?"</span>
      </div>
    {/if}
  </div>
  
  <!-- Character Voice Details -->
  {#if selectedCharacterId}
    {@const selectedVoice = characterVoices.find((v: any) => v.id === selectedCharacterId)}
    {#if selectedVoice}
      <div class="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="font-semibold text-blue-200">🎭 {selectedVoice.name}</h4>
          <span class="text-xs text-blue-400">Character Voice</span>
        </div>
        
        <p class="text-sm text-blue-100">{selectedVoice.description}</p>
        
        <!-- Personality Traits -->
        <div class="space-y-2">
          <div class="text-xs text-blue-300">
            <div class="flex justify-between">
              <span>Enthusiasm</span>
              <span>{selectedVoice.personality.enthusiasm}%</span>
            </div>
            <div class="w-full bg-blue-800/30 rounded-full h-1.5">
              <div class="bg-blue-400 h-1.5 rounded-full" style="width: {selectedVoice.personality.enthusiasm}%"></div>
            </div>
          </div>
          
          <div class="text-xs text-blue-300">
            <div class="flex justify-between">
              <span>Sarcasm</span>
              <span>{selectedVoice.personality.sarcasm}%</span>
            </div>
            <div class="w-full bg-blue-800/30 rounded-full h-1.5">
              <div class="bg-blue-400 h-1.5 rounded-full" style="width: {selectedVoice.personality.sarcasm}%"></div>
            </div>
          </div>
          
          <div class="text-xs text-blue-300">
            <div class="flex justify-between">
              <span>Warmth</span>
              <span>{selectedVoice.personality.warmth}%</span>
            </div>
            <div class="w-full bg-blue-800/30 rounded-full h-1.5">
              <div class="bg-blue-400 h-1.5 rounded-full" style="width: {selectedVoice.personality.warmth}%"></div>
            </div>
          </div>
        </div>
        
        <!-- Voice Settings -->
        <div class="text-xs text-blue-300">
          <div><strong>Pitch:</strong> {selectedVoice.voiceSettings.pitch.toFixed(1)}</div>
          <div><strong>Rate:</strong> {selectedVoice.voiceSettings.rate.toFixed(1)}</div>
        </div>
      </div>
    {/if}
  {/if}
</div>
