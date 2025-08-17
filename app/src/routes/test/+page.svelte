<script lang="ts">
  console.log('🧪 Test page script loading...');
  
  import { onMount } from 'svelte';
  
  onMount(() => {
    console.log('🧪 Test page onMount executed!');
    alert('Test page is working!');
  });
</script>

<svelte:head>
  <title>Test Page</title>
</svelte:head>

<div class="min-h-screen bg-black text-white flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-4xl mb-4">🧪 Test Page</h1>
    <p class="text-xl">If you see this, basic routing works!</p>
    <p class="text-sm mt-4">Check console for debug messages</p>
  </div>
</div>
