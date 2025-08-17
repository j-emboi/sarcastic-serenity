<script lang="ts">
  console.log('📄 Session page script loading...');
  
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { settings } from '$lib/stores/settings';
  
  import { quoteManager } from '$lib/quotes';
  import { aiVoiceService } from '$lib/audio/aiVoiceService';
  import { characterVoiceService } from '$lib/audio/characterVoiceService';
  import { VisualManager } from '$lib/visuals/VisualManager';
  import type { AppSettings } from '$lib/stores/settings';

  console.log('📄 Session page imports completed');
  
  let timeLeft = 60; // Start with 1 minute default
  let quote = '';
  let settingsValue: AppSettings | null = null;
  let speaking = false;

  let releaseBg: (() => void) | null = null;
  let nextQuoteTimeout: number | null = null;

  let ended = false;
  let interval: number;

  // WebGL Visual System
  let visualManager: VisualManager;
  let canvas: HTMLCanvasElement;
  
  // Function to force canvas full screen
  function forceCanvasFullScreen() {
    if (canvas) {
      // Use CSS pixels for consistency (don't mix with device pixel ratio)
      const fullWidth = window.innerWidth;
      const fullHeight = window.innerHeight;
      
      // Force update BOTH HTML attributes AND CSS styles with !important
      canvas.setAttribute('width', fullWidth.toString());
      canvas.setAttribute('height', fullHeight.toString());
      canvas.width = fullWidth;
      canvas.height = fullHeight;
      canvas.style.setProperty('width', fullWidth + 'px', 'important');
      canvas.style.setProperty('height', fullHeight + 'px', 'important');
      canvas.style.setProperty('position', 'fixed', 'important');
      canvas.style.setProperty('top', '0', 'important');
      canvas.style.setProperty('left', '0', 'important');
      canvas.style.setProperty('z-index', '1', 'important');
      
      // Force a reflow to ensure changes take effect
      canvas.offsetHeight;
      
      console.log('🎨 Forced canvas full screen immediately:', fullWidth, 'x', fullHeight);
      console.log('🎨 Canvas style size:', fullWidth, 'x', fullHeight);
      console.log('🎨 Canvas attributes after update:', canvas.getAttribute('width'), 'x', canvas.getAttribute('height'));
      console.log('🎨 Canvas computed style:', getComputedStyle(canvas).width, 'x', getComputedStyle(canvas).height);
    }
  }
  let isVisualSystemReady = false;



  onMount(() => {
    console.log('🚀 Session page onMount started!');
    console.log('🚀 Current URL:', window.location.href);
    console.log('🚀 Page pathname:', window.location.pathname);
    
    // Stop any currently playing preview voice TTS immediately when session starts
    speechSynthesis.cancel();
    characterVoiceService.stop();
    aiVoiceService.stop();

    // Subscribe to settings
    const unsub = settings.subscribe(value => {
      settingsValue = value;
      // Update timeLeft when settings change
      if (value) {
        timeLeft = value.durationMinutes * 60;
      }
    });

    // Force canvas full screen immediately
    forceCanvasFullScreen();
    
    // Initialize timer and quote system
    console.log('⏰ Initializing timer and quote system...');
    
    // Start the countdown timer
    const timerInterval = setInterval(() => {
      if (timeLeft > 0 && !ended) {
        timeLeft--;
        console.log('⏰ Timer tick:', timeLeft, 'seconds remaining');
      } else if (timeLeft <= 0 && !ended) {
        console.log('⏰ Session ended by timer');
        ended = true;
        clearInterval(timerInterval);
        if (visualManager) {
          visualManager.stop();
          visualManager.destroy();
        }
        // Navigate back to main page
        goto('/');
      }
    }, 1000);
    
    // Start the quote system
    console.log('🎤 Starting quote system...');
    scheduleNextQuoteWithJitter();
    
    // Initialize WebGL Visual System after a short delay to ensure canvas is ready
    console.log('🎨 Setting up WebGL initialization timeout...');
    setTimeout(async () => {
      console.log('🎨 Checking canvas availability...');
      console.log('Canvas element:', canvas);
      if (canvas) {
        console.log('🎨 Canvas found, setting dimensions...');
        // Force canvas to full screen immediately
        forceCanvasFullScreen();
        console.log('🎨 Canvas dimensions set to:', canvas.width, 'x', canvas.height);
        await initializeVisualSystem();
      } else {
        console.error('❌ Canvas element not found after timeout!');
      }
    }, 100);
    
          // Add window resize handler to keep canvas full screen
      const handleResize = () => {
        if (canvas) {
          // Use CSS pixels for consistency (don't mix with device pixel ratio)
          const fullWidth = window.innerWidth;
          const fullHeight = window.innerHeight;
          
          // Force update BOTH HTML attributes AND CSS styles with !important
          canvas.setAttribute('width', fullWidth.toString());
          canvas.setAttribute('height', fullHeight.toString());
          canvas.width = fullWidth;
          canvas.height = fullHeight;
          canvas.style.setProperty('width', fullWidth + 'px', 'important');
          canvas.style.setProperty('height', fullHeight + 'px', 'important');
          canvas.style.setProperty('position', 'fixed', 'important');
          canvas.style.setProperty('top', '0', 'important');
          canvas.style.setProperty('left', '0', 'important');
          canvas.style.setProperty('z-index', '1', 'important');
          
          // Force a reflow to ensure changes take effect
          canvas.offsetHeight;
          
          console.log('🎨 Canvas resized to:', fullWidth, 'x', fullHeight);
          console.log('🎨 Canvas style size:', fullWidth, 'x', fullHeight);
          console.log('🎨 Canvas attributes after resize:', canvas.getAttribute('width'), 'x', canvas.getAttribute('height'));
          console.log('🎨 Canvas computed style:', getComputedStyle(canvas).width, 'x', getComputedStyle(canvas).height);
        }
      };
    
          window.addEventListener('resize', handleResize);
      
      // Add a monitoring interval to ensure canvas stays full screen (but less aggressive)
      const canvasMonitor = setInterval(() => {
        if (canvas) {
          const currentWidth = parseInt(canvas.getAttribute('width') || '0');
          const currentHeight = parseInt(canvas.getAttribute('height') || '0');
          const expectedWidth = window.innerWidth;
          const expectedHeight = window.innerHeight;
          
          // Force update if canvas is zero or significantly wrong
          if (currentWidth === 0 || currentHeight === 0 || 
              Math.abs(currentWidth - expectedWidth) > 10 || 
              Math.abs(currentHeight - expectedHeight) > 10) {
            console.log('🎨 Canvas size mismatch detected, forcing update...');
            forceCanvasFullScreen();
          }
        }
      }, 1000); // Check every second to catch zero dimensions quickly
      
      // Clean up monitor on component destroy
      return () => {
        clearInterval(canvasMonitor);
        window.removeEventListener('resize', handleResize);
      };



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
          // Stop visual system when session ends
          if (visualManager) {
            visualManager.stop();
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (nextQuoteTimeout) {
        clearTimeout(nextQuoteTimeout);
      }
      if (visualManager) {
        visualManager.stop();
        visualManager.destroy();
      }
      unsub();
    };
  });

  async function initializeVisualSystem() {
    console.log('🎨 Starting WebGL Visual System initialization...');
    console.log('Canvas element:', canvas);
    console.log('Canvas dimensions:', canvas?.width, 'x', canvas?.height);
    
    if (!canvas) {
      console.error('❌ Canvas element not found!');
      return;
    }
    
    // Force canvas to full screen size
    const fullWidth = window.innerWidth;
    const fullHeight = window.innerHeight;
    
    canvas.width = fullWidth;
    canvas.height = fullHeight;
    canvas.style.width = fullWidth + 'px';
    canvas.style.height = fullHeight + 'px';
    
    console.log('🎨 Forced canvas to full screen:', fullWidth, 'x', fullHeight);
    
    try {
      visualManager = new VisualManager({
        sceneType: 'particles',
        particleCount: 20,
        audioReactivity: true,
        quality: 'high'
      });
      
      console.log('🎨 Visual Manager created, initializing...');
      isVisualSystemReady = await visualManager.init(canvas);
      console.log('🎨 Initialization result:', isVisualSystemReady);
      
      if (isVisualSystemReady) {
        console.log('🎨 WebGL Visual System started for session');
        
        // Add a small delay to ensure canvas is fully updated before starting
        setTimeout(() => {
          console.log('🎨 Starting Visual Manager after canvas update delay...');
          visualManager.start();
        }, 500);
      } else {
        console.warn('⚠️ WebGL Visual System failed to initialize');
      }
    } catch (error) {
      console.error('❌ Failed to initialize WebGL Visual System:', error);
      console.error('Error details:', error);
    }
  }

  function scheduleNextQuoteWithJitter() {
    if (!settingsValue || timeLeft <= 0 || ended) return;
    
    // Don't schedule new quotes if we're currently speaking
    if (speaking) {
      console.log('🎤 Currently speaking, will retry in 1 second...');
      // Wait a bit and try again
      nextQuoteTimeout = window.setTimeout(() => {
        if (!ended) {
          scheduleNextQuoteWithJitter();
        }
      }, 1000); // Check again in 1 second
      return;
    }
    
    const delay = quoteManager.getNextQuoteTime();
    console.log('🎤 Scheduling next quote in', delay, 'ms');
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

<section class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4 text-white relative">
  <!-- WebGL Canvas Background -->
  <canvas 
    bind:this={canvas}
    class="absolute inset-0 w-full h-full pointer-events-none"
    style="z-index: 1; width: 100vw !important; height: 100vh !important; position: fixed !important; top: 0 !important; left: 0 !important;"
  ></canvas>
  
  <div class="text-center space-y-8 max-w-2xl relative" style="z-index: 2;">
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

