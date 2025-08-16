<script lang="ts">
  // Voice selector component - handles character voice selection
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
  let voiceSystemStatus: any = null;
  let consistencyTestResults: any = null;
  let isTestingConsistency = false;
  
  onMount(async () => {
    await loadCharacterVoices();
    await getVoiceSystemStatus();
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

  async function getVoiceSystemStatus() {
    try {
      voiceSystemStatus = characterVoiceService.getVoiceSystemStatus();
    } catch (error) {
      console.error('Failed to get voice system status:', error);
    }
  }

  async function testVoiceConsistency() {
    if (isTestingConsistency || !selectedCharacterId) return;
    
    isTestingConsistency = true;
    try {
      consistencyTestResults = await characterVoiceService.testVoiceConsistency(selectedCharacterId);
    } catch (error) {
      console.error('Failed to test voice consistency:', error);
      consistencyTestResults = { error: error.message };
    } finally {
      isTestingConsistency = false;
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
    {/if}
  </div>
  
  <!-- Character Voice Details -->
  {#if selectedCharacterId}
    {@const selectedVoice = characterVoices.find((v: any) => v.id === selectedCharacterId)}
    {#if selectedVoice}
      <div class="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="font-semibold text-blue-200">🎭 {selectedVoice.name}</h4>
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

  <!-- Voice System Testing (Debug) -->
  <div class="space-y-2">
    <h3 class="text-sm font-medium text-yellow-400">🔧 Voice System Testing</h3>
    
    <div class="space-y-2">
      <button 
        on:click={testVoiceConsistency}
        disabled={isTestingConsistency || !selectedCharacterId}
        class="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
      >
        {isTestingConsistency ? 'Testing...' : 'Test Voice Consistency'}
      </button>
      
      <button 
        on:click={getVoiceSystemStatus}
        class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
      >
        Get Voice System Status
      </button>
    </div>

    <!-- Voice System Status -->
    {#if voiceSystemStatus}
      <div class="bg-green-900/20 border border-green-600/30 rounded-lg p-3 space-y-2">
        <h4 class="text-sm font-semibold text-green-200">Voice System Status</h4>
        <div class="text-xs text-green-300 space-y-1">
          <div><strong>Voices Loaded:</strong> {voiceSystemStatus.voicesLoaded ? '✅' : '❌'}</div>
          <div><strong>Voice Cache Size:</strong> {voiceSystemStatus.voiceCacheSize}</div>
          <div><strong>Available Voices:</strong> {voiceSystemStatus.availableVoices}</div>
          <div><strong>Character Voices:</strong> {voiceSystemStatus.characterVoices.length}</div>
        </div>
        
        {#if voiceSystemStatus.cachedVoices.length > 0}
          <div class="text-xs text-green-300">
            <div><strong>Cached Voices:</strong></div>
            {#each voiceSystemStatus.cachedVoices as cached}
              <div class="ml-2">• {cached.characterId}: {cached.voiceName} ({cached.voiceLang})</div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Consistency Test Results -->
    {#if consistencyTestResults}
      <div class="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 space-y-2">
        <h4 class="text-sm font-semibold text-yellow-200">Voice Consistency Test</h4>
        {#if consistencyTestResults.error}
          <div class="text-xs text-red-300">❌ {consistencyTestResults.error}</div>
        {:else}
          <div class="text-xs text-yellow-300 space-y-1">
            <div><strong>Character:</strong> {consistencyTestResults.character.name}</div>
            <div><strong>Consistent:</strong> {consistencyTestResults.isConsistent ? '✅' : '❌'}</div>
            <div><strong>Total Voices:</strong> {consistencyTestResults.totalVoices}</div>
            <div><strong>English Voices:</strong> {consistencyTestResults.englishVoices}</div>
            
            {#if consistencyTestResults.cachedVoice}
              <div><strong>Cached Voice:</strong> {consistencyTestResults.cachedVoice.name} ({consistencyTestResults.cachedVoice.lang})</div>
            {/if}
            
            {#if consistencyTestResults.freshVoice}
              <div><strong>Fresh Voice:</strong> {consistencyTestResults.freshVoice.name} ({consistencyTestResults.freshVoice.lang})</div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
