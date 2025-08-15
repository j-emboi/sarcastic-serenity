<script lang="ts">
  import { settings } from '$lib/stores/settings';
  import { goto } from '$app/navigation';
  import type { Persona, ProfanityLevel } from '$lib/stores/settings';
  import VoiceSelector from '$lib/components/VoiceSelector.svelte';
  import { BREATHING_ANIMATIONS, type BreathingAnimationType } from '$lib/breathing/types';
  
  let duration = 10;
  let persona: Persona = 'student';
  let intensity = 2;
  let profanity: ProfanityLevel = 'off'; // unsafe by default for preview
  let serendipity = 0.1;
  let breathing = false;
  let backgroundSrc = '';
  let ambientPreset: 'none' | 'waves' | 'rain' | 'birds' | 'pink' = 'waves';
  
  // Voice settings
  let voiceId: string | undefined = undefined;
  let voicePitch = 1.8;
  let voiceRate = 1.12;
  
  // Audio settings
  let backgroundVolume = 0.4;
  
  // Breathing animation settings
  let selectedBreathingAnimation: BreathingAnimationType = 'expanding-circle';
  let showAnimationPreview = false;

  async function startSession() {
    settings.set({
      durationMinutes: Number(duration),
      persona,
      roastIntensity: intensity,
      profanity,
      serendipity,
      breathingEnabled: breathing,
      breathingAnimation: selectedBreathingAnimation,
      backgroundVolume,
      backgroundSrc,
      ambientPreset,
      voiceId,
      voicePitch,
      voiceRate
    });
    // Ensure persistence before navigating (guards against hard reloads)
    try {
      localStorage.setItem(
        'sarcastic-serenity:settings',
        JSON.stringify({
          durationMinutes: Number(duration),
          persona,
          roastIntensity: intensity,
          profanity,
          serendipity,
          breathingEnabled: breathing,
          breathingAnimation: selectedBreathingAnimation,
          backgroundVolume,
          backgroundSrc,
          ambientPreset,
          voiceId,
          voicePitch,
          voiceRate
        })
      );
    } catch {}
    // try to unlock TTS on user gesture
    try {
      const unlock = new SpeechSynthesisUtterance(' ');
      unlock.volume = 0;
      speechSynthesis.speak(unlock);
    } catch {}
    await goto('/session');
  }
  
  function openAnimationPreview(): void {
    showAnimationPreview = true;
  }
  
  function closeAnimationPreview(): void {
    showAnimationPreview = false;
  }
  
  function previewAnimationStyle(animation: BreathingAnimationType): void {
    selectedBreathingAnimation = animation;
    closeAnimationPreview();
  }
</script>

<section class="mx-auto max-w-3xl p-6 space-y-6">
  <h1 class="text-2xl font-bold">Sarcastic Serenity</h1>
  <div class="grid gap-4 md:grid-cols-2">
    <label class="space-y-2">
      <span class="block text-sm font-medium">Duration (minutes): {duration}</span>
      <input type="range" min="1" max="120" step="1" bind:value={duration} class="w-full" />
    </label>
    <label class="space-y-2">
      <span class="block text-sm font-medium">Persona</span>
      <select bind:value={persona} class="w-full rounded border p-2">
        <option value="student">Student</option>
        <option value="working_adult">Working adult</option>
        <option value="creator">Creator</option>
      </select>
    </label>
    <label class="space-y-2">
      <span class="block text-sm font-medium">Roast intensity</span>
      <input type="range" min="0" max="4" bind:value={intensity} class="w-full" />
    </label>
    <label class="space-y-2">
      <span class="block text-sm font-medium">Profanity</span>
      <select bind:value={profanity} class="w-full rounded border p-2">
        <option value="off">Unsafe (default)</option>
        <option value="medium">Medium</option>
        <option value="strict">Strict</option>
      </select>
    </label>
    <label class="space-y-2">
      <span class="block text-sm font-medium">Serendipity: {Math.round(serendipity * 100)}%</span>
      <input type="range" min="0" max="1" step="0.05" bind:value={serendipity} class="w-full" />
      <span class="text-xs text-gray-500">Controls random ambient effects: wave crashes, rain droplets, bird chirps, etc.</span>
    </label>
    <label class="space-y-2">
      <span class="block text-sm font-medium">Background Volume: {Math.round(backgroundVolume * 100)}%</span>
      <input type="range" min="0" max="1" step="0.1" bind:value={backgroundVolume} class="w-full" />
    </label>
    <label class="space-y-2 md:col-span-2">
      <span class="block text-sm font-medium">Background loop (optional)</span>
      <input type="text" placeholder="/audio/loop.mp3" bind:value={backgroundSrc} class="w-full rounded border p-2" />
      <span class="text-xs text-gray-500">Place a small CC0 audio file in <code>app/static/audio/</code> and set its path here (e.g., /audio/loop.mp3). Leave empty to disable.</span>
    </label>
    <label class="space-y-2 md:col-span-2">
      <span class="block text-sm font-medium">Preset ambience</span>
      <select bind:value={ambientPreset} class="w-full rounded border p-2">
        <option value="waves">Waves</option>
        <option value="rain">Rain</option>
        <option value="birds">Birds</option>
        <option value="pink">Pink noise</option>
        <option value="none">None</option>
      </select>
      <span class="text-xs text-gray-500">Use a built-in preset or your own file path above.</span>
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" bind:checked={breathing} />
      <span>Enable breathing pacer</span>
    </label>
  </div>
  
  <!-- Breathing Animation Settings (only shown when breathing is enabled) -->
  {#if breathing}
    <div class="border-t pt-6">
      <h2 class="text-lg font-semibold mb-4">🫁 Breathing Animation</h2>
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-2">Animation Style</label>
            <select 
              bind:value={selectedBreathingAnimation} 
              class="w-full rounded border p-2"
            >
              {#each BREATHING_ANIMATIONS as animation}
                <option value={animation.type}>{animation.name}</option>
              {/each}
            </select>
          </div>
          <button 
            class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            on:click={openAnimationPreview}
          >
            👁️ Preview Current Style
          </button>
        </div>
        <p class="text-sm text-gray-600">
          Choose your preferred visual style for the breathing guide. Each animation provides a unique experience to help you focus on your breath.
        </p>
      </div>
    </div>
  {/if}
  
  <!-- Voice Settings Section -->
  <div class="border-t pt-6">
    <h2 class="text-lg font-semibold mb-4">🎤 Voice Settings</h2>
    <VoiceSelector 
      bind:voiceId 
      bind:voicePitch 
      bind:voiceRate 
    />
  </div>
  
  <button class="rounded bg-indigo-600 px-4 py-2 text-white" on:click={startSession}>Start</button>
</section>

<!-- Animation Preview Modal -->
{#if showAnimationPreview}
  <div class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" on:click={closeAnimationPreview}>
    <div class="bg-white rounded-lg p-4 shadow-xl max-w-sm w-full mx-4" on:click|stopPropagation>
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold">
          {#each BREATHING_ANIMATIONS as animation}
            {#if animation.type === selectedBreathingAnimation}
              {animation.name}
            {/if}
          {/each}
        </h3>
        <button 
          class="text-gray-500 hover:text-gray-700 text-xl"
          on:click={closeAnimationPreview}
        >
          ×
        </button>
      </div>
      
      <!-- Live Animation Preview -->
      <div class="w-full h-48 bg-gray-50 rounded border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
        <div class="text-center">
          <div class="text-4xl mb-2">
            {#if selectedBreathingAnimation === 'expanding-circle'}
              ⭕
            {:else if selectedBreathingAnimation === 'wave-pulse'}
              🌊
            {:else if selectedBreathingAnimation === 'particle-flow'}
              ✨
            {:else if selectedBreathingAnimation === 'geometric-shapes'}
              🔷
            {:else if selectedBreathingAnimation === 'nature-flower'}
              🌸
            {:else if selectedBreathingAnimation === 'minimalist-lines'}
              ➖
            {:else if selectedBreathingAnimation === 'ocean-waves'}
              🌊
            {/if}
          </div>
          <p class="text-sm text-gray-600">Live Animation Preview</p>
          <p class="text-xs text-gray-400 mt-1">Breathing cycle simulation</p>
        </div>
      </div>
      
      <p class="text-sm text-gray-600 mb-3">
        {#each BREATHING_ANIMATIONS as animation}
          {#if animation.type === selectedBreathingAnimation}
            {animation.description}
          {/if}
        {/each}
      </p>
    </div>
  </div>
{/if}
