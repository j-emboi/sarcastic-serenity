<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { settings } from '$lib/stores/settings';
  
  import { quoteManager } from '$lib/quotes';
  import { aiVoiceService } from '$lib/audio/aiVoiceService';
  import { characterVoiceService } from '$lib/audio/characterVoiceService';
  import type { AppSettings } from '$lib/stores/settings';
  
  let timeLeft = 60; // Start with 1 minute default
  let quote = '';
  let settingsValue: AppSettings | null = null;
  let speaking = false;

  let releaseBg: (() => void) | null = null;
  let nextQuoteTimeout: number | null = null;

  let ended = false;
  let interval: number;



  onMount(() => {
    // Subscribe to settings
    const unsub = settings.subscribe(value => {
      settingsValue = value;
      // Update timeLeft when settings change
      if (value) {
        timeLeft = value.durationMinutes * 60;
      }
    });



    // Schedule first quote
    const initialDelay = quoteManager.getInitialDelay();
    nextQuoteTimeout = window.setTimeout(() => {
      if (!ended) {
        scheduleNextQuote();
      }
    }, initialDelay);

    // Timer countdown
    interval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft -= 1;
        if (timeLeft === 0) {
          ended = true;
          speechSynthesis.cancel();
          aiVoiceService.stop();
          characterVoiceService.stop();
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
      unsub();
    };
  });

  function scheduleNextQuoteWithJitter() {
    if (!settingsValue || timeLeft <= 0 || ended) return;
    
    // Don't schedule new quotes if we're currently speaking
    if (speaking) {
      // Wait a bit and try again
      nextQuoteTimeout = window.setTimeout(() => {
        if (!ended) {
          scheduleNextQuoteWithJitter();
        }
      }, 1000); // Check again in 1 second
      return;
    }
    
    const delay = quoteManager.getNextQuoteTime();
    nextQuoteTimeout = window.setTimeout(() => {
      if (!ended) {
        scheduleNextQuote();
      }
    }, delay);
  }

  async function scheduleNextQuote() {
    if (ended || speaking) return; // Don't generate new quotes if already speaking
    
    const nextQuote = quoteManager.getQuote({
      persona: settingsValue?.persona || 'student',
      intensity: settingsValue?.roastIntensity || 4,
      profanity: 'off' // Default to allowing all quotes
    });
    if (nextQuote) {
      quote = nextQuote.text;
      
      // Always speak the quote (voice is always enabled)
      speaking = true;
      
      try {
        if (settingsValue?.selectedVoiceType === 'character' && settingsValue?.selectedVoiceId) {
          // Use Character Voice
          await characterVoiceService.speakWithCharacter(quote, settingsValue.selectedVoiceId);
          
          // Character voice service handles its own completion
          const checkInterval = setInterval(() => {
            if (!characterVoiceService.isCurrentlyPlaying()) {
              clearInterval(checkInterval);
              speaking = false;
              if (!ended) {
                scheduleNextQuoteWithJitter();
              }
            }
          }, 100);
          
        } else if (settingsValue?.selectedVoiceType === 'ai' && settingsValue?.selectedVoiceId) {
          // Use AI Voice
          const aiSettings = {
            voiceId: settingsValue.selectedVoiceId,
            pitch: settingsValue.aiVoicePitch || 0,
            rate: settingsValue.aiVoiceRate || 0,
            volume: settingsValue.aiVoiceVolume || 80
          };
          
          await aiVoiceService.speak(quote, aiSettings);
          
          // AI voice service handles its own completion, so we need to check periodically
          const checkInterval = setInterval(() => {
            if (!aiVoiceService.isCurrentlyPlaying()) {
              clearInterval(checkInterval);
              speaking = false;
              if (!ended) {
                scheduleNextQuoteWithJitter();
              }
            }
          }, 100);
          
        } else {
          // Use Browser TTS (Fallback)
          const utterance = new SpeechSynthesisUtterance(quote);
          utterance.rate = settingsValue?.voiceRate || 1.0;
          utterance.pitch = settingsValue?.voicePitch || 1.0;
          utterance.volume = 0.7;
          
          // Set the selected voice if available
          if (settingsValue && settingsValue.selectedVoiceId && typeof speechSynthesis !== 'undefined') {
            const voices = speechSynthesis.getVoices();
            const voiceId = settingsValue.selectedVoiceId;
            const selectedVoice = voices.find(v => v.voiceURI === voiceId);
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
          }
          
          utterance.onend = () => {
            speaking = false;
            if (!ended) {
              scheduleNextQuoteWithJitter();
            }
          };
          
          utterance.onerror = () => {
            speaking = false;
            if (!ended) {
              scheduleNextQuoteWithJitter();
            }
          };
          
          speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error('Failed to speak quote:', error);
        speaking = false;
        if (!ended) {
          scheduleNextQuoteWithJitter();
        }
      }
    }
  }





  function handleEndSession() {
    ended = true;
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



    <!-- Quote Display - Fixed height to prevent layout shifts -->
    <div class="max-w-xl text-balance text-lg rounded-lg bg-white/10 p-6 shadow-lg backdrop-blur-sm min-h-[120px] flex items-center justify-center">
      {#if quote}
        <p class="italic">"{quote}"</p>
      {:else}
        <p class="text-gray-400 italic">Waiting for wisdom...</p>
      {/if}
    </div>

         <!-- End Session Button -->
     <button 
       class="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
       on:click={handleEndSession}
     >
       End Break
     </button>
  </div>
</section>

