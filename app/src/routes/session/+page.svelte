<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { settings } from '$lib/stores/settings';
  import { audioEngine } from '$lib/audio/engine';
  import { quoteManager } from '$lib/quotes';
  import type { AppSettings } from '$lib/stores/settings';
  
  let timeLeft = 60; // Start with 1 minute default
  let quote = '';
  let settingsValue: AppSettings | null = null;
  let speaking = false;
  let voiceReady = false;
  let releaseBg: (() => void) | null = null;
  let nextQuoteTimeout: number | null = null;
  let currentVolume = 0.4;
  let ended = false;
  let interval: number;

  // Audio level monitoring
  let currentAudioLevel = 0;

  onMount(() => {
    // Subscribe to settings
    const unsub = settings.subscribe(value => {
      settingsValue = value;
      // Update timeLeft when settings change
      if (value) {
        timeLeft = value.durationMinutes * 60;
      }
    });

    // Initialize audio engine
    audioEngine.ensureContext().then(() => {
      console.log('Audio engine initialized');
      
      // Start background audio
      audioEngine.startPreset('waves', currentVolume, 0.1);
      
      // Set up audio level callback
      audioEngine.setAudioLevelCallback((level: number) => {
        currentAudioLevel = level;
      });
    }).catch((error) => {
      console.error('Audio engine initialization error:', error);
    });

    // Schedule first quote
    const initialDelay = quoteManager.getInitialDelay();
    nextQuoteTimeout = window.setTimeout(() => {
      if (!ended) {
        scheduleNextQuote();
        scheduleNextQuoteWithJitter();
      }
    }, initialDelay);

    // Timer countdown
    interval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft -= 1;
        if (timeLeft === 0) {
          ended = true;
          audioEngine.stopAll();
          speechSynthesis.cancel();
          speaking = false;
          if (releaseBg) {
            releaseBg();
            releaseBg = null;
          }
          if (nextQuoteTimeout) {
            clearTimeout(nextQuoteTimeout);
            nextQuoteTimeout = null;
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (nextQuoteTimeout) {
        clearTimeout(nextQuoteTimeout);
      }
      audioEngine.removeAudioLevelCallback();
      unsub();
    };
  });

  function scheduleNextQuoteWithJitter() {
    if (!settingsValue || timeLeft <= 0 || ended) return;
    
    const delay = quoteManager.getNextQuoteTime();
    nextQuoteTimeout = window.setTimeout(() => {
      if (!ended) {
        scheduleNextQuote();
        scheduleNextQuoteWithJitter();
      }
    }, delay);
  }

  function scheduleNextQuote() {
    if (ended) return;
    
    const nextQuote = quoteManager.getQuote({
      persona: settingsValue?.persona || 'student',
      intensity: settingsValue?.roastIntensity || 2,
      profanity: 'off' // Default to allowing all quotes
    });
    if (nextQuote) {
      quote = nextQuote.text;
      
      if (voiceReady) {
        speaking = true;
        const utterance = new SpeechSynthesisUtterance(quote);
        utterance.rate = settingsValue?.voiceRate || 1.12;
        utterance.pitch = settingsValue?.voicePitch || 1.8;
        utterance.volume = 0.7;
        
        // Set the selected voice if available
        if (settingsValue?.voiceId && typeof speechSynthesis !== 'undefined') {
          const voices = speechSynthesis.getVoices();
          const selectedVoice = voices.find(v => v.voiceURI === settingsValue.voiceId);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }
        
        utterance.onend = () => {
          speaking = false;
        };
        
        utterance.onerror = () => {
          speaking = false;
        };
        
        speechSynthesis.speak(utterance);
      }
    }
  }

  function handleVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    currentVolume = parseFloat(target.value);
    
    // Update background audio volume
    audioEngine.setBackgroundVolume(currentVolume);
  }

  function handleVoiceToggle() {
    // Toggle voice on/off (simplified - just enable/disable TTS)
    voiceReady = !voiceReady;
  }

  function handleEndSession() {
    ended = true;
    audioEngine.stopAll();
    speechSynthesis.cancel();
    speaking = false;
    if (releaseBg) {
      releaseBg();
      releaseBg = null;
    }
    if (nextQuoteTimeout) {
      clearTimeout(nextQuoteTimeout);
      nextQuoteTimeout = null;
    }
    goto('/');
  }

  // Initialize voice when available
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.onvoiceschanged = () => {
      voiceReady = true;
    };
  }
</script>

<svelte:head>
  <title>Micro-Break - Sarcastic Serenity</title>
</svelte:head>

<section class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4 text-white">
  <div class="text-center space-y-8 max-w-2xl">
    <h1 class="text-4xl font-bold mb-8">🌊 Micro-Break</h1>
    
    <!-- Timer -->
    <div class="text-6xl font-mono font-bold mb-8">
      {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
    </div>

         <!-- Session Status -->
     {#if ended}
       <div class="text-2xl text-green-400 mb-8">
         Break Complete! 🎉
       </div>
     {:else}
       <div class="text-xl text-blue-300 mb-8">
         Take a moment to breathe and reset...
       </div>
     {/if}

    <!-- Audio Controls -->
    <div class="space-y-4 mb-8">
      <div class="flex items-center gap-4">
        <label class="text-sm">Volume:</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={currentVolume}
          on:input={handleVolumeChange}
          class="w-32"
        />
        <span class="text-sm">{Math.round(currentVolume * 100)}%</span>
      </div>

      <div class="flex items-center gap-4">
        <label class="text-sm">Voice Guidance:</label>
        <button 
          class="px-3 py-1 rounded text-sm {voiceReady ? 'bg-green-600' : 'bg-gray-600'}"
          on:click={handleVoiceToggle}
        >
          {voiceReady ? 'ON' : 'OFF'}
        </button>
      </div>

      <!-- Audio Level Indicator -->
      <div class="flex items-center gap-2 text-sm">
        <span>Audio Level:</span>
        <div class="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
          <div 
            class="h-full bg-blue-400 transition-all duration-100"
            style="width: {Math.round(currentAudioLevel * 100)}%"
          ></div>
        </div>
        <span class="w-8 text-xs">{Math.round(currentAudioLevel * 100)}%</span>
      </div>
    </div>

    <!-- Quote Display -->
    {#if quote}
      <div class="max-w-xl text-balance text-lg rounded-lg bg-white/10 p-6 shadow-lg backdrop-blur-sm">
        <p class="italic">"{quote}"</p>
        {#if speaking}
          <div class="text-sm text-blue-300 mt-2">🔊 Speaking...</div>
        {/if}
      </div>
    {/if}

         <!-- End Session Button -->
     <button 
       class="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
       on:click={handleEndSession}
     >
       End Break
     </button>
  </div>
</section>

