<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { settings } from '$lib/stores/settings';
  import { audioEngine } from '$lib/audio/engine';
  import { quoteManager } from '$lib/quotes';
  import { VisualEngine } from '$lib/visuals/engine';
  import { SceneManager } from '$lib/visuals/sceneManager';
  import { WebGLDiagnostic } from '$lib/visuals/webgl-diagnostic';
  import { BreathingPacer } from '$lib/breathing/pacer';
  import { BreathingAudio } from '$lib/audio/breathing';
  import { BREATHING_PATTERNS, type BreathingPattern, type BreathingPhase, type BreathingAnimationType } from '$lib/breathing/types';
  import type { AppSettings } from '$lib/stores/settings';
  import type { AnimationType } from '$lib/visuals/scenes/ParticleScene';
  
  let timeLeft = 10 * 60;
  let quote = '';
  let settingsValue: AppSettings | null = null;
  let speaking = false;
  let voiceReady = false;
  let releaseBg: (() => void) | null = null;
  let nextQuoteTimeout: number | null = null;
  let currentVolume = 0.4;

  // Breathing pacer
  let breathingPacer: BreathingPacer | null = null;
  let breathingAudio: BreathingAudio | null = null;
  let isBreathingActive = false;
  let currentBreathingPhase: BreathingPhase = 'inhale';
  let breathingTimeRemaining = 4;
  let breathingCycleCount = 1;
  let selectedBreathingPattern: BreathingPattern = BREATHING_PATTERNS[0];
  let selectedBreathingAnimation: BreathingAnimationType = 'expanding-circle';
  let selectedParticleAnimation: AnimationType = 'flowing-particles';

  // Breathing pacer functions
  function initializeBreathingPacer(): void {
    const context = audioEngine.getContext();
    const masterGain = audioEngine.getMasterGain();
    
    if (!context || !masterGain) {
      console.warn('Audio context not ready for breathing pacer');
      return;
    }

    // Create breathing audio system
    breathingAudio = new BreathingAudio(context, masterGain);

    // Create breathing pacer with callbacks
    breathingPacer = new BreathingPacer(selectedBreathingPattern, {
      onPhaseChange: (phase: BreathingPhase) => {
        currentBreathingPhase = phase;
        breathingAudio?.playPhaseTransition(phase);
        
        // Breathing scene updates removed - keeping only audio guidance
      },
      onCycleComplete: (cycle: number) => {
        breathingCycleCount = cycle;
      },
      onSessionComplete: () => {
        isBreathingActive = false;
      },
      onTimeUpdate: (timeRemaining: number, phase: BreathingPhase) => {
        breathingTimeRemaining = timeRemaining;
        currentBreathingPhase = phase;
        
        // Breathing scene updates removed - keeping only audio guidance
      }
    });
  }

  function startBreathing(): void {
    if (!breathingPacer) {
      initializeBreathingPacer();
    }
    
    if (breathingPacer) {
      breathingPacer.start();
      isBreathingActive = true;
    }
  }

  function stopBreathing(): void {
    if (breathingPacer) {
      breathingPacer.stop();
      isBreathingActive = false;
    }
  }

  function setBreathingPattern(pattern: BreathingPattern): void {
    selectedBreathingPattern = pattern;
    if (breathingPacer) {
      breathingPacer.setPattern(pattern);
    }
  }

  function setBreathingAnimation(animation: BreathingAnimationType): void {
    selectedBreathingAnimation = animation;
    // Animation selection kept for future use if needed
    console.log('Breathing animation selected:', animation);
  }

  function setParticleAnimation(animation: AnimationType): void {
    selectedParticleAnimation = animation;
    console.log('Switching to particle animation:', animation);
    
    // First ensure we're on the particle scene
    if (visualEngine) {
      const success = visualEngine.setScene('particles');
      if (success) {
        console.log('Successfully switched to particle scene');
        
        // Then update the animation type
        setTimeout(() => {
          const scene = visualEngine.getCurrentScene();
          if (scene?.id === 'particles') {
            const particleScene = scene as any;
            if (particleScene.setAnimationType) {
              particleScene.setAnimationType(animation);
              console.log('Animation type updated successfully to:', animation);
            }
          }
        }, 100); // Small delay to ensure scene is initialized
      } else {
        console.log('Failed to switch to particle scene');
      }
    }
  }

  function getPhaseDuration(phase: BreathingPhase): number {
    switch (phase) {
      case 'inhale': return selectedBreathingPattern.inhale;
      case 'hold': return selectedBreathingPattern.hold;
      case 'exhale': return selectedBreathingPattern.exhale;
      case 'hold2': return selectedBreathingPattern.hold2 || 0;
      default: return 4;
    }
  }

  // TTS helpers
  function getVoice(): SpeechSynthesisVoice | null {
    const list = speechSynthesis.getVoices();
    if (!list || list.length === 0) return null;
    
    // Use selected voice if available
    if (settingsValue?.voiceId) {
      const selectedVoice = list.find(v => v.voiceURI === settingsValue.voiceId);
      if (selectedVoice) return selectedVoice;
    }
    
    // Fallback to preferred English childlike voices if present
    const preferred = list.find((v) => /en/i.test(v.lang) && /(child|junior|boy|girl)/i.test(v.name));
    return preferred ?? list.find((v) => /en/i.test(v.lang)) ?? list[0];
  }

  function speak(text: string) {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      
      // Use user's voice settings or fallback to defaults
      utter.pitch = settingsValue?.voicePitch ?? 1.8;
      utter.rate = settingsValue?.voiceRate ?? 1.12;
      
      const v = getVoice();
      if (v) utter.voice = v;
      
      utter.onstart = () => {
        speaking = true;
        releaseBg = audioEngine.duckBackground(0.45);
      };
      utter.onend = () => {
        speaking = false;
        releaseBg?.();
        releaseBg = null;
      };
      speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('TTS failed', e);
    }
  }

  let interval: any;
  let ended = false;
  
  // Visual engine
  let visualEngine: VisualEngine | null = null;
  let sceneManager: SceneManager | null = null;
  let visualContainer: HTMLElement;
  let currentAudioLevel: number = 0;
  
  onMount(() => {
    // Run WebGL diagnostics
    console.log('=== Running WebGL Diagnostics ===');
    const webglInfo = WebGLDiagnostic.checkWebGLSupport();
    WebGLDiagnostic.logPerformanceInfo();
    
    if (!webglInfo.supported) {
      console.error('WebGL is not supported on this system!');
      alert('WebGL is not supported on this system. Visual effects will not work.');
    } else if (webglInfo.errors.length > 0) {
      console.warn('WebGL has some issues:', webglInfo.errors);
    } else {
      console.log('WebGL is working correctly');
    }
    
    // Load settings
    const unsub = settings.subscribe((v) => {
      settingsValue = v;
      // Update timeLeft when settings are loaded
      if (v) {
        timeLeft = v.durationMinutes * 60;
      }
    });
    
    // Set initial timeLeft with default value
    timeLeft = 10 * 60;
    
    // Reset quote manager for new session
    quoteManager.resetSession();
    
    // Warm voices list
    speechSynthesis.onvoiceschanged = () => {
      voiceReady = true;
    };
    
    // Initialize breathing pacer if enabled
    if (settingsValue?.breathingEnabled) {
      initializeBreathingPacer();
    }
    
    // Set up real-time audio level monitoring
    audioEngine.setAudioLevelCallback((level: number) => {
      currentAudioLevel = level;
      if (visualEngine) {
        visualEngine.updateAudioLevel(level);
      }
    });
    
    audioEngine
      .ensureContext()
      .then(async () => {
        const vol = settingsValue?.backgroundVolume ?? 0.4;
        const serendipity = settingsValue?.serendipity ?? 0.1;
        currentVolume = vol;
        
        // Update visual engine with serendipity
        if (visualEngine) {
          visualEngine.updateSerendipity(serendipity);
        }
        if (settingsValue?.backgroundSrc) {
          await audioEngine.loadAndLoopBackground(settingsValue.backgroundSrc, vol).catch(() => {});
          return;
        }
        const preset = settingsValue?.ambientPreset ?? 'waves';
        // Handle 'none' case by not starting any background audio
        if (preset !== 'none') {
          // Use procedural presets instead of static files to avoid licensing/download issues
          await audioEngine.startPreset(preset, vol, serendipity).catch(() => {});
        }
      })
      .catch((error) => {
        console.error('Audio engine error:', error);
      });
    
    // Initialize visual engine
    if (visualContainer) {
      try {
        visualEngine = new VisualEngine({
          container: visualContainer,
          width: window.innerWidth,
          height: window.innerHeight
        });
        
        visualEngine.init().then((visualInitSuccess) => {
          if (visualInitSuccess && visualEngine) {
            // Create scene manager and add all scenes to visual engine
            const renderer = visualEngine.getRenderer();
            if (!renderer) {
              console.error('Visual engine renderer not available');
              return;
            }
            
            sceneManager = new SceneManager(renderer.gl);
            
            // Add all scenes from scene manager to visual engine
            const availableScenes = sceneManager.getAvailableScenes();
            availableScenes.forEach(scene => {
              if (visualEngine) {
                visualEngine.addScene(scene);
              }
            });
            
            // Set initial scene to waves for a calming experience
            const waveScene = availableScenes.find(scene => scene.id === 'waves');
            const fireworksScene = availableScenes.find(scene => scene.id === 'fireworks');
            const firstScene = availableScenes[0];
            if (waveScene && visualEngine) {
              console.log('Setting initial scene to waves:', waveScene.id, waveScene.name);
              visualEngine.setScene(waveScene.id);
            } else if (fireworksScene && visualEngine) {
              console.log('Falling back to fireworks:', fireworksScene.id, fireworksScene.name);
              visualEngine.setScene(fireworksScene.id);
            } else if (firstScene && visualEngine) {
              console.log('Falling back to first scene:', firstScene.id, firstScene.name);
              visualEngine.setScene(firstScene.id);
            }
            
            // Start the visual engine
            if (visualEngine) {
              visualEngine.start();
            }
          } else {
            console.warn('Visual engine failed to initialize, continuing without visuals');
          }
        }).catch((error) => {
          console.error('Visual engine initialization error:', error);
        });
      } catch (error) {
        console.error('Failed to create visual engine:', error);
      }
    }
    
    // Schedule first quote with shorter initial delay
    const initialDelay = quoteManager.getInitialDelay();
    nextQuoteTimeout = window.setTimeout(() => {
      if (!ended) {
        scheduleNextQuote();
        // Schedule the next quote
        scheduleNextQuoteWithJitter();
      }
    }, initialDelay);
    
    interval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft -= 1;
        if (timeLeft === 0) {
          ended = true;
          audioEngine.stopAll();
          // Stop TTS immediately when session ends
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
      if (sceneManager) {
        sceneManager.destroy();
      }
      // Clean up audio level monitoring
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
        // Schedule the next quote
        scheduleNextQuoteWithJitter();
      }
    }, delay);
  }

  function scheduleNextQuote() {
    if (!settingsValue || timeLeft <= 0 || ended) {
      return;
    }
    const q = quoteManager.getQuote({
      persona: settingsValue.persona,
      intensity: settingsValue.roastIntensity,
      profanity: settingsValue.profanity
    });
    if (q) {
      quote = q.text;
      speak(quote);
      // Mark that we just spoke a quote
      quoteManager.markQuoteSpoken();
    }
  }

  function startVoice() {
    // user gesture unlocks audio; begin the quote chain
    if (!ended) scheduleNextQuote();
  }



  function updateVolume(newVolume: number) {
    currentVolume = newVolume;
    audioEngine.setBackgroundVolume(newVolume);
    
    // Update visual engine with audio level
    if (sceneManager) {
      sceneManager.updateAudioLevel(newVolume);
    }
  }

  function endSession() {
    ended = true;
    audioEngine.stopAll();
    // Stop TTS immediately when session ends
    speechSynthesis.cancel();
    speaking = false;
    if (releaseBg) {
      releaseBg();
      releaseBg = null;
    }
    window.location.href = '/';
  }
</script>

<section class="flex h-screen flex-col items-center justify-center gap-6 p-6 text-center relative overflow-hidden">
  <!-- Visual container -->
  <div 
    bind:this={visualContainer}
    class="absolute inset-0 z-0 w-full h-full"
    style="pointer-events: none; width: 100vw; height: 100vh;"
  ></div>
  
  <!-- Content overlay -->
  <div class="relative z-10 w-full">
  <div class="flex w-full max-w-3xl items-center justify-between">
    <h2 class="text-xl font-semibold">Session running</h2>
    <div class="flex items-center gap-4">
      <label class="flex items-center gap-2 text-sm">
        <span>Volume:</span>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          bind:value={currentVolume} 
          on:input={() => updateVolume(currentVolume)}
          class="w-20"
        />
        <span class="w-8 text-xs">{Math.round(currentVolume * 100)}%</span>
      </label>
      <div class="flex gap-2">
        <button class="rounded bg-white px-3 py-1 text-sm text-black shadow" on:click={endSession}>End session</button>
      </div>
    </div>
  </div>
  
  <!-- Compact Breathing Controls -->
  <div class="mt-4 flex items-center gap-3 p-2 bg-gray-50 rounded">
    <select 
      class="rounded border px-2 py-1 text-sm"
      bind:value={selectedBreathingPattern}
      on:change={() => setBreathingPattern(selectedBreathingPattern)}
    >
      <optgroup label="🛌 Relaxation">
        {#each BREATHING_PATTERNS.filter(p => p.category === 'relaxation') as pattern}
          <option value={pattern}>{pattern.name}</option>
        {/each}
      </optgroup>
      <optgroup label="⚡ Energy">
        {#each BREATHING_PATTERNS.filter(p => p.category === 'energy') as pattern}
          <option value={pattern}>{pattern.name}</option>
        {/each}
      </optgroup>
      <optgroup label="🎯 Focus">
        {#each BREATHING_PATTERNS.filter(p => p.category === 'focus') as pattern}
          <option value={pattern}>{pattern.name}</option>
        {/each}
      </optgroup>
      <optgroup label="😴 Sleep">
        {#each BREATHING_PATTERNS.filter(p => p.category === 'sleep') as pattern}
          <option value={pattern}>{pattern.name}</option>
        {/each}
      </optgroup>
      <optgroup label="😌 Stress Relief">
        {#each BREATHING_PATTERNS.filter(p => p.category === 'stress-relief') as pattern}
          <option value={pattern}>{pattern.name}</option>
        {/each}
      </optgroup>
    </select>
    
    {#if !isBreathingActive}
      <button 
        class="rounded bg-teal-500 px-3 py-1 text-sm text-white shadow" 
        on:click={startBreathing}
      >
        Start
      </button>
    {:else}
      <button 
        class="rounded bg-red-500 px-3 py-1 text-sm text-white shadow" 
        on:click={stopBreathing}
      >
        Stop
      </button>
    {/if}
    
    {#if isBreathingActive}
      <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">🫁 {currentBreathingPhase}</span>
    {/if}
  </div>
  

  
    <!-- OGL Scene Selector -->
  <div class="mt-4 flex items-center justify-center gap-4">
    <label class="text-sm text-gray-300">Visual Scene:</label>
    <select 
      class="rounded border px-2 py-1 text-sm bg-gray-800 text-white"
      on:change={(e) => {
        if (visualEngine && e.target instanceof HTMLSelectElement) {
          const sceneId = e.target.value;
          console.log('Switching to scene:', sceneId);
          visualEngine.setScene(sceneId);
        }
      }}
    >
      <option value="waves">Ocean Waves</option>
      <option value="aurora">Aurora Borealis</option>
      <option value="lavalamp">Lava Lamp</option>
      <option value="zengarden">Zen Garden</option>
      <option value="fireworks">Fireworks</option>
      <option value="cosmic">Cosmic Galaxy</option>
      <option value="particles">Flowing Particles</option>
      <option value="marbling">Marbling</option>
      <option value="blob">Blob</option>
      <option value="breathing">Breathing Guide</option>
    </select>
  </div>
  
  <div class="text-5xl tabular-nums">{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
  
  <!-- Audio level indicator -->
  <div class="flex items-center gap-2 text-sm text-gray-400">
    <span>Audio Level:</span>
    <div class="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
      <div 
        class="h-full bg-blue-400 transition-all duration-100"
        style="width: {Math.round(currentAudioLevel * 100)}%"
      ></div>
    </div>
    <span class="w-8 text-xs">{Math.round(currentAudioLevel * 100)}%</span>
  </div>
  
  <!-- Audio status indicator -->
  <div class="text-xs text-gray-500">
    Audio Status: {currentAudioLevel > 0.01 ? '🔊 Active' : '🔇 Silent'}
    {#if currentAudioLevel > 0.01}
      <span class="text-green-500"> - Particles should be reacting!</span>
    {/if}
  </div>
  
  {#if quote}
    <div class="max-w-xl text-balance text-lg rounded-lg bg-white/85 p-4 shadow">
      {quote}
    </div>
  {/if}
  </div>
</section>

