<script lang="ts">
  import { onMount } from 'svelte';
  import { WebGLDiagnostic } from '$lib/visuals/webgl-diagnostic';

  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let animationId: number | null = null;
  let diagnosticResults: any = null;
  let testResults: string[] = [];

  onMount(() => {
    // Run diagnostics
    diagnosticResults = WebGLDiagnostic.checkWebGLSupport();
    WebGLDiagnostic.logPerformanceInfo();

    // Test basic WebGL functionality
    testBasicWebGL();
  });

  function testBasicWebGL() {
    if (!canvas) return;

    gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      testResults.push('❌ WebGL context not available');
      return;
    }

    testResults.push('✅ WebGL context created');
    testResults.push(`📊 Context: ${gl instanceof WebGL2RenderingContext ? 'WebGL2' : 'WebGL1'}`);

    // Test shader compilation
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      testResults.push('❌ Failed to create shaders');
      return;
    }

    // Simple vertex shader
    gl.shaderSource(vertexShader, `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `);

    // Animated fragment shader
    gl.shaderSource(fragmentShader, `
      precision mediump float;
      uniform float time;
      void main() {
        vec2 uv = gl_FragCoord.xy / vec2(400.0, 300.0);
        vec3 color = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0,2,4));
        gl_FragColor = vec4(color, 1.0);
      }
    `);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      testResults.push('❌ Vertex shader compilation failed: ' + gl.getShaderInfoLog(vertexShader));
      return;
    }

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      testResults.push('❌ Fragment shader compilation failed: ' + gl.getShaderInfoLog(fragmentShader));
      return;
    }

    testResults.push('✅ Shaders compiled successfully');

    // Create program
    const program = gl.createProgram();
    if (!program) {
      testResults.push('❌ Failed to create program');
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      testResults.push('❌ Program linking failed: ' + gl.getProgramInfoLog(program));
      return;
    }

    testResults.push('✅ Program linked successfully');

    // Create buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]), gl.STATIC_DRAW);

    // Get attributes and uniforms
    const positionLocation = gl.getAttribLocation(program, 'position');
    const timeLocation = gl.getUniformLocation(program, 'time');

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Start animation
    let startTime = Date.now();
    
    function animate() {
      const time = (Date.now() - startTime) * 0.001;
      gl.uniform1f(timeLocation, time);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      animationId = requestAnimationFrame(animate);
    }

    animate();
    testResults.push('✅ Animation started');
  }

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
      testResults.push('⏹️ Animation stopped');
    }
  }

  function restartAnimation() {
    stopAnimation();
    testResults = [];
    testBasicWebGL();
  }
</script>

<svelte:head>
  <title>WebGL Test</title>
</svelte:head>

<div class="container">
  <h1>WebGL Diagnostic Test</h1>
  
  <div class="test-section">
    <h2>Canvas Test</h2>
    <canvas 
      bind:this={canvas} 
      width="400" 
      height="300" 
      style="border: 1px solid #ccc; background: #000;"
    ></canvas>
    
    <div class="controls">
      <button on:click={restartAnimation}>Restart Test</button>
      <button on:click={stopAnimation}>Stop Animation</button>
    </div>
  </div>

  <div class="test-section">
    <h2>Diagnostic Results</h2>
    {#if diagnosticResults}
      <div class="results">
        <p><strong>WebGL Supported:</strong> {diagnosticResults.supported ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Context:</strong> {diagnosticResults.context}</p>
        <p><strong>Vendor:</strong> {diagnosticResults.vendor}</p>
        <p><strong>Renderer:</strong> {diagnosticResults.renderer}</p>
        <p><strong>Version:</strong> {diagnosticResults.version}</p>
        <p><strong>Max Texture Size:</strong> {diagnosticResults.maxTextureSize}</p>
        
        {#if diagnosticResults.errors.length > 0}
          <div class="errors">
            <h3>Errors:</h3>
            {#each diagnosticResults.errors as error}
              <p class="error">❌ {error}</p>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="test-section">
    <h2>Test Results</h2>
    <div class="results">
      {#each testResults as result}
        <p>{result}</p>
      {/each}
    </div>
  </div>

  <div class="test-section">
    <h2>Instructions</h2>
    <ol>
      <li>You should see an animated rainbow pattern above</li>
      <li>If you see a black screen, WebGL is not working</li>
      <li>Check the diagnostic results for any errors</li>
      <li>If this test works, the main app should work too</li>
    </ol>
  </div>

  <div class="test-section">
    <a href="/session" class="button">Back to Session</a>
  </div>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }

  .test-section {
    margin: 20px 0;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  .controls {
    margin: 10px 0;
  }

  .controls button {
    margin-right: 10px;
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .controls button:hover {
    background: #0056b3;
  }

  .results {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 4px;
  }

  .errors {
    margin-top: 10px;
  }

  .error {
    color: #dc3545;
    font-weight: bold;
  }

  .button {
    display: inline-block;
    padding: 10px 20px;
    background: #28a745;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }

  .button:hover {
    background: #218838;
  }
</style>
