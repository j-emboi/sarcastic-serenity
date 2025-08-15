<script lang="ts">
  import { onMount } from 'svelte';
  let { pattern = 'box', running = false } = $props<{ pattern?: 'box' | '478'; running?: boolean }>();
  let phase = 'inhale';
  let progress = 0; // 0..1
  let raf = 0;
  function dur() {
    return pattern === 'box' ? 4 : 4; // inhale length seconds
  }
  function hold1() { return pattern === 'box' ? 4 : 7; }
  function exhale() { return pattern === 'box' ? 4 : 8; }
  function hold2() { return pattern === 'box' ? 4 : 0; }

  let t0 = 0; let phaseDur = dur();
  function nextPhase() {
    phase = phase === 'inhale' ? 'hold1' : phase === 'hold1' ? 'exhale' : phase === 'exhale' ? 'hold2' : 'inhale';
    phaseDur = phase === 'inhale' ? dur() : phase === 'hold1' ? hold1() : phase === 'exhale' ? exhale() : hold2();
    t0 = performance.now();
  }

  function loop(t: number) {
    const elapsed = (t - t0) / 1000;
    progress = Math.min(1, phaseDur ? elapsed / phaseDur : 1);
    if (elapsed >= phaseDur) nextPhase();
    if (running) raf = requestAnimationFrame(loop);
  }

  onMount(() => {
    t0 = performance.now();
    phaseDur = dur();
    if (running) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  $effect(() => {
    // respond to prop changes in runes mode
    cancelAnimationFrame(raf);
    if (running) {
      phase = 'inhale';
      progress = 0;
      t0 = performance.now();
      phaseDur = dur();
      raf = requestAnimationFrame(loop);
    }
  });
</script>

<div class="mx-auto grid place-items-center">
  <div class="relative h-40 w-40">
    <div
      class="absolute inset-0 rounded-full border-2"
      style="transform: scale({0.8 + 0.4 * (phase === 'exhale' ? 1 - progress : progress)}); transition: transform 0.2s linear;"
    ></div>
  </div>
  <div class="mt-2 text-sm text-gray-500">{phase}</div>
  <div class="text-xs text-gray-400">{pattern === 'box' ? '4-4-4-4' : '4-7-8'}</div>
  
</div>


