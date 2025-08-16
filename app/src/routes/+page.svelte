<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { settings, initSettingsFromStorage, getAvailablePersonas } from '$lib/stores/settings';
  import VoiceSelector from '$lib/components/VoiceSelector.svelte';
  import type { AppSettings } from '$lib/stores/settings';

  let settingsValue: AppSettings | null = null;

  onMount(() => {
    initSettingsFromStorage();
    const unsub = settings.subscribe(value => {
      settingsValue = value;
    });

    return () => unsub();
  });

  function startSession() {
    goto('/session');
  }
</script>

<svelte:head>
  <title>Sarcastic Serenity - Relaxation App</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4 text-white">
  <div class="text-center space-y-8 max-w-2xl">
    <h1 class="text-5xl font-bold mb-4">🌊 Sarcastic Serenity</h1>
    <p class="text-xl text-blue-200 mb-8">
      Micro-wellness moments with a touch of sarcasm
    </p>

    <!-- Features Overview -->
    <div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white/5 backdrop-blur-sm rounded-lg p-4">
        <div class="text-3xl mb-2">🌊</div>
        <h3 class="font-semibold mb-2">Calming Audio</h3>
        <p class="text-sm text-gray-300">Ocean waves, rain, and other relaxing sounds</p>
      </div>
      
      <div class="bg-white/5 backdrop-blur-sm rounded-lg p-4">
        <div class="text-3xl mb-2">🎭</div>
        <h3 class="font-semibold mb-2">Sarcastic Quotes</h3>
        <p class="text-sm text-gray-300">Witty, calming quotes with a touch of humor</p>
      </div>
      
      <div class="bg-white/5 backdrop-blur-sm rounded-lg p-4">
        <div class="text-3xl mb-2">⏱️</div>
        <h3 class="font-semibold mb-2">Micro-Moments</h3>
        <p class="text-sm text-gray-300">Quick 1-3 minute sessions for instant calm</p>
      </div>
    </div>

    <!-- Session Settings -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-6">
      <h2 class="text-2xl font-semibold">Session Settings</h2>
      
             <!-- Duration -->
       <div class="space-y-2">
         <label for="duration-select" class="block text-sm font-medium">Session Duration</label>
         <select 
           id="duration-select"
           value={settingsValue?.durationMinutes || 1}
           on:change={(e) => {
             const target = e.target as HTMLSelectElement;
             if (settingsValue && target) {
               settings.update(s => ({ ...s, durationMinutes: parseInt(target.value) }));
             }
           }}
           class="w-full p-2 rounded bg-gray-800 text-white"
         >
           <option value={1}>1 minute</option>
           <option value={2}>2 minutes</option>
           <option value={3}>3 minutes</option>
         </select>
       </div>

             <!-- Persona -->
       <div class="space-y-2">
         <label for="persona-select" class="block text-sm font-medium">Persona</label>
         <select 
           id="persona-select"
           value={settingsValue?.persona || 'student'}
           on:change={(e) => {
             const target = e.target as HTMLSelectElement;
             if (settingsValue && target) {
               settings.update(s => ({ ...s, persona: target.value as any }));
             }
           }}
           class="w-full p-2 rounded bg-gray-800 text-white"
         >
           {#each getAvailablePersonas() as persona}
             <option value={persona.value}>{persona.label}</option>
           {/each}
         </select>
       </div>

       <!-- Roast Intensity -->
       <div class="space-y-2">
         <label for="sarcasm-select" class="block text-sm font-medium">Sarcasm Level</label>
         <select 
           id="sarcasm-select"
           value={settingsValue?.roastIntensity || 4}
           on:change={(e) => {
             const target = e.target as HTMLSelectElement;
             if (settingsValue && target) {
               settings.update(s => ({ ...s, roastIntensity: parseInt(target.value) }));
             }
           }}
           class="w-full p-2 rounded bg-gray-800 text-white"
         >
           <option value={0}>Gentle</option>
           <option value={1}>Mild</option>
           <option value={2}>Moderate</option>
           <option value={3}>Spicy</option>
           <option value={4}>Nuclear</option>
         </select>
       </div>



      <!-- Voice Settings -->
      <VoiceSelector />
    </div>

         <!-- Start Session Button -->
     <button 
       class="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition-colors"
       on:click={startSession}
     >
       Take a Micro-Break
     </button>
  </div>
</div>
