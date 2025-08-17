<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settings';
  import { characterVoiceService } from '$lib/audio/characterVoiceService';
  
  let settingsValue: any = null;
  let characterVoices: any[] = [];
  let voicesLoaded = false;
  let isLoading = false;
  let isPreviewingVoice = false;
  let previewText = "Hello! I'm your sarcastic wellness companion. Ready for some savage self-reflection?";
  
  onMount(() => {
    const unsubscribe = settings.subscribe(value => {
      settingsValue = value;
    });
    return unsubscribe;
  });
  
  $: selectedCharacterId = settingsValue?.selectedVoiceId || 'sarcastic_narrator';
  
  onMount(async () => {
    await loadCharacterVoices();
  });
  
  async function loadCharacterVoices() {
    if (isLoading) return;
    isLoading = true;
    try {
      characterVoices = await characterVoiceService.getAvailableCharacterVoices();
      voicesLoaded = true;
      
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

  async function previewVoice(characterId: string) {
    if (isPreviewingVoice) return;
    isPreviewingVoice = true;
    try {
      await characterVoiceService.speakWithCharacter(previewText, characterId);
      const checkInterval = setInterval(() => {
        if (!characterVoiceService.isCurrentlyPlaying()) {
          clearInterval(checkInterval);
          isPreviewingVoice = false;
        }
      }, 100);
    } catch (error) {
      console.error('Failed to preview voice:', error);
      isPreviewingVoice = false;
    }
  }

  function selectVoice(characterId: string) {
    settings.update(s => ({ 
      ...s, 
      selectedVoiceType: 'character',
      selectedVoiceId: characterId
    }));
  }

  function getVoiceIcon(characterId: string): string {
    const icons: Record<string, string> = {
      'sarcastic_narrator': '🎭',
      'cheerful_host': '🌟',
      'wise_mentor': '🧙‍♂️',
      'comedic_sidekick': '🤡',
      'dramatic_announcer': '🎪',
      'smooth_operator': '🕴️',
      'energetic_coach': '💪'
    };
    return icons[characterId] || '🎤';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center space-y-2">
    <h3 class="text-lg font-semibold text-gray-200">Choose Your Voice Companion</h3>
    <p class="text-sm text-gray-400">Select a character voice that matches your mood and personality</p>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span class="ml-3 text-gray-400">Loading voices...</span>
    </div>
  {:else if !voicesLoaded || characterVoices.length === 0}
    <div class="text-center py-8 space-y-4">
      <div class="text-red-400 text-lg">⚠️</div>
      <div class="text-red-300">Failed to load character voices</div>
      <button 
        on:click={loadCharacterVoices}
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  {:else}
    <!-- Voice Selection Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each characterVoices as voice}
        {#if selectedCharacterId === voice.id}
          <div 
            class="relative group cursor-pointer transition-all duration-300 hover:scale-105 border-2 rounded-xl p-4 ring-2 ring-blue-500 bg-gray-800/50 border-blue-500"
            on:click={() => selectVoice(voice.id)}
          >
            <!-- Selection Indicator -->
            <div class="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              ✓
            </div>

            <!-- Voice Header -->
            <div class="flex items-center space-x-3 mb-3">
              <div class="text-2xl">{getVoiceIcon(voice.id)}</div>
              <div class="flex-1">
                <h4 class="font-semibold text-gray-200">{voice.name}</h4>
                <p class="text-xs text-gray-400">{voice.voicePreferences.gender} • {voice.voicePreferences.age}</p>
              </div>
            </div>

            <!-- Description -->
            <p class="text-sm text-gray-300 mb-4 leading-relaxed">{voice.description}</p>

            <!-- Personality Traits -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">Enthusiasm</span>
                <span class="text-gray-300">{voice.personality.enthusiasm}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                {#if voice.personality.enthusiasm > 70}
                  <div class="h-2 rounded-full transition-all duration-300 bg-green-500" style="width: {voice.personality.enthusiasm}%"></div>
                {:else if voice.personality.enthusiasm > 40}
                  <div class="h-2 rounded-full transition-all duration-300 bg-yellow-500" style="width: {voice.personality.enthusiasm}%"></div>
                {:else}
                  <div class="h-2 rounded-full transition-all duration-300 bg-blue-500" style="width: {voice.personality.enthusiasm}%"></div>
                {/if}
              </div>

              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">Sarcasm</span>
                <span class="text-gray-300">{voice.personality.sarcasm}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                {#if voice.personality.sarcasm > 70}
                  <div class="h-2 rounded-full transition-all duration-300 bg-purple-500" style="width: {voice.personality.sarcasm}%"></div>
                {:else if voice.personality.sarcasm > 40}
                  <div class="h-2 rounded-full transition-all duration-300 bg-orange-500" style="width: {voice.personality.sarcasm}%"></div>
                {:else}
                  <div class="h-2 rounded-full transition-all duration-300 bg-gray-500" style="width: {voice.personality.sarcasm}%"></div>
                {/if}
              </div>

              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">Warmth</span>
                <span class="text-gray-300">{voice.personality.warmth}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                {#if voice.personality.warmth > 70}
                  <div class="h-2 rounded-full transition-all duration-300 bg-pink-500" style="width: {voice.personality.warmth}%"></div>
                {:else if voice.personality.warmth > 40}
                  <div class="h-2 rounded-full transition-all duration-300 bg-red-500" style="width: {voice.personality.warmth}%"></div>
                {:else}
                  <div class="h-2 rounded-full transition-all duration-300 bg-indigo-500" style="width: {voice.personality.warmth}%"></div>
                {/if}
              </div>
            </div>

            <!-- Voice Settings -->
            <div class="flex justify-between text-xs text-gray-400 mb-4">
              <span>Pitch: {voice.voiceSettings.pitch.toFixed(1)}</span>
              <span>Rate: {voice.voiceSettings.rate.toFixed(1)}</span>
            </div>

            <!-- Preview Button -->
            <button
              on:click|stopPropagation={() => previewVoice(voice.id)}
              disabled={isPreviewingVoice}
              class="w-full py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isPreviewingVoice ? 'Playing...' : '🎵 Preview Voice'}
            </button>
          </div>
        {:else}
          <div 
            class="relative group cursor-pointer transition-all duration-300 hover:scale-105 border-2 rounded-xl p-4 bg-gray-800/30 border-gray-700"
            on:click={() => selectVoice(voice.id)}
          >
            <!-- Voice Header -->
            <div class="flex items-center space-x-3 mb-3">
              <div class="text-2xl">{getVoiceIcon(voice.id)}</div>
              <div class="flex-1">
                <h4 class="font-semibold text-gray-200">{voice.name}</h4>
                <p class="text-xs text-gray-400">{voice.voicePreferences.gender} • {voice.voicePreferences.age}</p>
              </div>
            </div>

            <!-- Description -->
            <p class="text-sm text-gray-300 mb-4 leading-relaxed">{voice.description}</p>

            <!-- Personality Traits -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">Enthusiasm</span>
                <span class="text-gray-300">{voice.personality.enthusiasm}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                {#if voice.personality.enthusiasm > 70}
                  <div class="h-2 rounded-full transition-all duration-300 bg-green-500" style="width: {voice.personality.enthusiasm}%"></div>
                {:else if voice.personality.enthusiasm > 40}
                  <div class="h-2 rounded-full transition-all duration-300 bg-yellow-500" style="width: {voice.personality.enthusiasm}%"></div>
                {:else}
                  <div class="h-2 rounded-full transition-all duration-300 bg-blue-500" style="width: {voice.personality.enthusiasm}%"></div>
                {/if}
              </div>

              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">Sarcasm</span>
                <span class="text-gray-300">{voice.personality.sarcasm}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                {#if voice.personality.sarcasm > 70}
                  <div class="h-2 rounded-full transition-all duration-300 bg-purple-500" style="width: {voice.personality.sarcasm}%"></div>
                {:else if voice.personality.sarcasm > 40}
                  <div class="h-2 rounded-full transition-all duration-300 bg-orange-500" style="width: {voice.personality.sarcasm}%"></div>
                {:else}
                  <div class="h-2 rounded-full transition-all duration-300 bg-gray-500" style="width: {voice.personality.sarcasm}%"></div>
                {/if}
              </div>

              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">Warmth</span>
                <span class="text-gray-300">{voice.personality.warmth}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                {#if voice.personality.warmth > 70}
                  <div class="h-2 rounded-full transition-all duration-300 bg-pink-500" style="width: {voice.personality.warmth}%"></div>
                {:else if voice.personality.warmth > 40}
                  <div class="h-2 rounded-full transition-all duration-300 bg-red-500" style="width: {voice.personality.warmth}%"></div>
                {:else}
                  <div class="h-2 rounded-full transition-all duration-300 bg-indigo-500" style="width: {voice.personality.warmth}%"></div>
                {/if}
              </div>
            </div>

            <!-- Voice Settings -->
            <div class="flex justify-between text-xs text-gray-400 mb-4">
              <span>Pitch: {voice.voiceSettings.pitch.toFixed(1)}</span>
              <span>Rate: {voice.voiceSettings.rate.toFixed(1)}</span>
            </div>

            <!-- Preview Button -->
            <button
              on:click|stopPropagation={() => previewVoice(voice.id)}
              disabled={isPreviewingVoice}
              class="w-full py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isPreviewingVoice ? 'Playing...' : '🎵 Preview Voice'}
            </button>
          </div>
        {/if}
      {/each}
    </div>

    <!-- Selected Voice Details -->
    {#if selectedCharacterId && characterVoices.find((v: any) => v.id === selectedCharacterId)}
      <div class="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-xl">
        <div class="flex items-center space-x-3 mb-3">
          <div class="text-2xl">{getVoiceIcon(selectedCharacterId)}</div>
          <div>
            <h4 class="font-semibold text-blue-200">{characterVoices.find((v: any) => v.id === selectedCharacterId).name}</h4>
            <p class="text-sm text-blue-300">Currently Selected</p>
          </div>
        </div>
        <p class="text-sm text-blue-100 mb-3">{characterVoices.find((v: any) => v.id === selectedCharacterId).description}</p>
        
        <!-- Voice Preview Text -->
        <div class="space-y-2">
          <label class="text-xs text-blue-300 font-medium">Preview Text:</label>
          <textarea
            bind:value={previewText}
            class="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 resize-none"
            rows="2"
            placeholder="Enter text to preview the voice..."
          ></textarea>
          <button
            on:click={() => previewVoice(selectedCharacterId)}
            disabled={isPreviewingVoice}
            class="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPreviewingVoice ? 'Playing...' : '🎵 Preview'}
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
