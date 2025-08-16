<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settings';
  import { characterVoiceService, type CharacterVoice } from '$lib/audio/characterVoiceService';
  
  let settingsValue: any = null;
  
  onMount(() => {
    const unsubscribe = settings.subscribe(value => {
      settingsValue = value;
    });
    
    return unsubscribe;
  });
  
  // Get values from settings store
  $: useCharacterVoice = settingsValue?.useCharacterVoice || false;
  $: selectedCharacterId = settingsValue?.selectedCharacterId;
  
  let characterVoices: CharacterVoice[] = [];
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
      
      // Auto-select Mickey Mouse if none selected
      if (!selectedCharacterId && characterVoices.length > 0) {
        const mickeyVoice = characterVoices.find(v => v.id === 'mickey_mouse_1928');
        if (mickeyVoice) {
          settings.update(s => ({ ...s, selectedCharacterId: mickeyVoice.id }));
        }
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
  
  function getLegalStatusColor(status: string): string {
    switch (status) {
      case 'public_domain':
        return 'text-green-400';
      case 'creative_commons':
        return 'text-blue-400';
      case 'fair_use':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  }
  
  function getLegalStatusIcon(status: string): string {
    switch (status) {
      case 'public_domain':
        return '🆓';
      case 'creative_commons':
        return '📄';
      case 'fair_use':
        return '⚖️';
      default:
        return 'ℹ️';
    }
  }
</script>

<div class="space-y-4">
  <!-- Character Voice Toggle -->
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <label for="character-voice-toggle" class="block text-sm font-medium">Use Character Voice</label>
      <button 
        id="character-voice-toggle"
        class="px-3 py-1 rounded text-sm {useCharacterVoice ? 'bg-purple-600' : 'bg-gray-600'}"
        on:click={() => {
          settings.update(s => ({ ...s, useCharacterVoice: !s.useCharacterVoice }));
        }}
      >
        {useCharacterVoice ? 'ON' : 'OFF'}
      </button>
    </div>
    <p class="text-xs text-purple-200">
      Experience quotes with classic public domain character voices like Mickey Mouse (1928)!
    </p>
  </div>

  {#if useCharacterVoice}
    <!-- Character Voice Selection -->
    <div class="space-y-2">
      <label for="character-voice-select" class="block text-sm font-medium">Character Voice</label>
      
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
          id="character-voice-select"
          value={selectedCharacterId || ''}
          on:change={(e) => {
            const target = e.target as HTMLSelectElement;
            if (target) {
              settings.update(s => ({ ...s, selectedCharacterId: target.value || undefined }));
            }
          }}
          class="w-full p-2 rounded bg-gray-800 text-white border-gray-600"
        >
          {#each characterVoices as voice}
            <option value={voice.id}>
              {voice.name} - {voice.character}
            </option>
          {/each}
        </select>
        
        <div class="flex items-center gap-2">
          <button 
            type="button"
            on:click={() => testCharacterVoice(selectedCharacterId)}
            disabled={!selectedCharacterId || isTesting}
            class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Character Voice'}
          </button>
          <span class="text-xs text-purple-200">"Hot dog! This is going to be a swell session!"</span>
        </div>
      {/if}
    </div>
    
    <!-- Character Voice Details -->
    {#if selectedCharacterId}
      {@const selectedVoice = characterVoices.find(v => v.id === selectedCharacterId)}
      {#if selectedVoice}
        <div class="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-semibold text-purple-200">{selectedVoice.name}</h4>
            <span class="text-xs {getLegalStatusColor(selectedVoice.legalStatus)}">
              {getLegalStatusIcon(selectedVoice.legalStatus)} {selectedVoice.legalStatus.replace('_', ' ')}
            </span>
          </div>
          
          <p class="text-sm text-purple-100">{selectedVoice.description}</p>
          
          <div class="text-xs text-purple-300">
            <div><strong>Era:</strong> {selectedVoice.era}</div>
            <div><strong>Character:</strong> {selectedVoice.character}</div>
          </div>
          
          <!-- Personality Traits -->
          <div class="space-y-2">
            <div class="text-xs text-purple-300">
              <div class="flex justify-between">
                <span>Enthusiasm</span>
                <span>{selectedVoice.personality.enthusiasm}%</span>
              </div>
              <div class="w-full bg-purple-800/30 rounded-full h-1.5">
                <div class="bg-purple-400 h-1.5 rounded-full" style="width: {selectedVoice.personality.enthusiasm}%"></div>
              </div>
            </div>
            
            <div class="text-xs text-purple-300">
              <div class="flex justify-between">
                <span>Playfulness</span>
                <span>{selectedVoice.personality.playfulness}%</span>
              </div>
              <div class="w-full bg-purple-800/30 rounded-full h-1.5">
                <div class="bg-purple-400 h-1.5 rounded-full" style="width: {selectedVoice.personality.playfulness}%"></div>
              </div>
            </div>
            
            <div class="text-xs text-purple-300">
              <div class="flex justify-between">
                <span>Warmth</span>
                <span>{selectedVoice.personality.warmth}%</span>
              </div>
              <div class="w-full bg-purple-800/30 rounded-full h-1.5">
                <div class="bg-purple-400 h-1.5 rounded-full" style="width: {selectedVoice.personality.warmth}%"></div>
              </div>
            </div>
          </div>
          
          <!-- Voice Settings -->
          <div class="text-xs text-purple-300">
            <div><strong>Pitch:</strong> {selectedVoice.voiceSettings.pitch > 0 ? '+' : ''}{selectedVoice.voiceSettings.pitch}</div>
            <div><strong>Rate:</strong> {selectedVoice.voiceSettings.rate > 0 ? '+' : ''}{selectedVoice.voiceSettings.rate}</div>
            <div><strong>Volume:</strong> {selectedVoice.voiceSettings.volume}%</div>
          </div>
        </div>
      {/if}
    {/if}
    
    <!-- Legal Notice -->
    <div class="text-xs text-gray-400 bg-gray-800/50 p-3 rounded">
      <strong>Legal Notice:</strong> All character voices are based on public domain works from the 1920s-1930s era. 
      These voices are inspired by the golden age of animation and are legally safe to use. 
      No copyrighted characters or voices are being reproduced.
    </div>
  {/if}
</div>
