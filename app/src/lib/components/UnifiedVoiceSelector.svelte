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
  
  let isTesting = false;
  
  onMount(() => {
    // Always set Mickey Mouse as the voice
    settings.update(s => ({ 
      ...s, 
      selectedVoiceType: 'character',
      selectedVoiceId: 'mickey_mouse_1928'
    }));
  });
  
  async function testMickeyVoice() {
    if (isTesting) return;
    
    isTesting = true;
    try {
      const testText = "Hot dog! This is going to be a swell session!";
      await characterVoiceService.speakWithCharacter(testText, 'mickey_mouse_1928');
    } catch (error) {
      console.error('Mickey voice test failed:', error);
    } finally {
      isTesting = false;
    }
  }
</script>

<div class="space-y-4">
  <!-- Mickey Mouse Voice -->
  <div class="space-y-2">
    <h3 class="text-sm font-medium">Voice Selection</h3>
    
    <div class="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-purple-200">🎭 Mickey Mouse (1928)</h4>
        <span class="text-xs text-green-400">🆓 Public Domain</span>
      </div>
      
      <p class="text-sm text-purple-100">
        Classic Steamboat Willie era Mickey Mouse - cheerful, squeaky, and full of wonder!
      </p>
      
      <div class="text-xs text-purple-300">
        <div><strong>Era:</strong> 1928 (Public Domain)</div>
        <div><strong>Character:</strong> Mickey Mouse</div>
        <div><strong>Legal Status:</strong> Public Domain</div>
      </div>
      
      <!-- Personality Traits -->
      <div class="space-y-2">
        <div class="text-xs text-purple-300">
          <div class="flex justify-between">
            <span>Enthusiasm</span>
            <span>90%</span>
          </div>
          <div class="w-full bg-purple-800/30 rounded-full h-1.5">
            <div class="bg-purple-400 h-1.5 rounded-full" style="width: 90%"></div>
          </div>
        </div>
        
        <div class="text-xs text-purple-300">
          <div class="flex justify-between">
            <span>Playfulness</span>
            <span>95%</span>
          </div>
          <div class="w-full bg-purple-800/30 rounded-full h-1.5">
            <div class="bg-purple-400 h-1.5 rounded-full" style="width: 95%"></div>
          </div>
        </div>
        
        <div class="text-xs text-purple-300">
          <div class="flex justify-between">
            <span>Warmth</span>
            <span>85%</span>
          </div>
          <div class="w-full bg-purple-800/30 rounded-full h-1.5">
            <div class="bg-purple-400 h-1.5 rounded-full" style="width: 85%"></div>
          </div>
        </div>
      </div>
      
      <!-- Voice Settings -->
      <div class="text-xs text-purple-300">
        <div><strong>Pitch:</strong> +25 (Squeaky)</div>
        <div><strong>Rate:</strong> -10 (Character)</div>
        <div><strong>Volume:</strong> 85%</div>
      </div>
      
      <!-- Test Button -->
      <div class="flex items-center gap-2 pt-2">
        <button 
          type="button"
          on:click={testMickeyVoice}
          disabled={isTesting}
          class="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Mickey Voice'}
        </button>
        <span class="text-xs text-purple-200">"Hot dog! This is going to be a swell session!"</span>
      </div>
    </div>
    
    <!-- Legal Notice -->
    <div class="text-xs text-gray-400 bg-gray-800/50 p-3 rounded">
      <strong>Legal Notice:</strong> Mickey Mouse voice is based on the public domain Steamboat Willie era (1928). 
      This voice is inspired by the golden age of animation and is legally safe to use. 
      No copyrighted characters or voices are being reproduced.
    </div>
  </div>
</div>
