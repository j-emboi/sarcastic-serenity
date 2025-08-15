import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class WaveScene extends BaseScene {
  id = 'waves';
  name = 'Ocean Waves';

  private waveProgram: Program | null = null;
  private waveMesh: Mesh | null = null;
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing OGL WaveScene');
    
    // Create wave shader program
    this.waveProgram = new Program(gl, {
      vertex: this.createWaveVertexShader(),
      fragment: this.createWaveFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] }
      }
    });

    this.addProgram(this.waveProgram);

    // Create full-screen quad for wave rendering
    const geometry = new Plane(gl, { width: 2, height: 2 });
    
    this.waveMesh = new Mesh(gl, {
      geometry,
      program: this.waveProgram
    });

    this.addMesh(this.waveMesh);
    
    console.log('OGL WaveScene initialization complete');
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.waveProgram) {
      this.waveProgram.uniforms.time.value = this.time * 0.001; // Convert to seconds
      this.waveProgram.uniforms.audioLevel.value = audioLevel;
      this.waveProgram.uniforms.serendipity.value = serendipity;
      
      // Debug logging
      if (Math.floor(this.time / 1000) % 5 === 0) { // Log every 5 seconds
        console.log('WaveScene update:', {
          time: this.time * 0.001,
          audioLevel,
          serendipity
        });
      }
    }
  }

  private createWaveVertexShader(): string {
    return /* glsl */ `
      attribute vec3 position;
      attribute vec2 uv;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float time;
      uniform float audioLevel;
      uniform float serendipity;
      uniform vec2 resolution;
      
      varying vec2 vUv;
      varying float vTime;
      varying float vAudioLevel;
      varying float vSerendipity;
      
      void main() {
        vUv = uv;
        vTime = time;
        vAudioLevel = audioLevel;
        vSerendipity = serendipity;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private createWaveFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vTime;
      varying float vAudioLevel;
      varying float vSerendipity;
      
      // Noise functions for organic wave movement
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value;
      }
      
      // Simple and beautiful ocean waves based on the provided code
      vec3 createOceanWaves(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Ocean color palette - more vibrant
        vec3 aqua = vec3(0.2, 0.5, 0.8);
        vec3 blue = vec3(0.3, 0.5, 1.0);
        vec3 deepPurple = vec3(0.1, 0.2, 0.4);
        
        // Create water gradient with wave animation
        vec3 water = mix(aqua, deepPurple, (1.0 - uv.y) * 2.0 - 1.5 + sin(vTime * 3.0 + uv.x * 6.0) / 4.0);
        
        // Calculate wave height with multiple frequencies - much more visible
        float waveHeight = sin(vTime * 3.0 + uv.x * 3.0) / 2.0 + 0.5 + (sin(-vTime * 6.0 + uv.x * 12.0) / 8.0);
        
        // Add audio reactivity to wave height
        waveHeight += vAudioLevel * 0.2 * sin(vTime * 8.0 + uv.x * 8.0);
        
        // Determine if we're above or below the wave
        if (uv.y < waveHeight) {
          color = water;
        } else {
          color = blue;
        }
        
        return color;
      }
      
      // Create subtle surface tension effects
      vec3 createWaveStreams(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Add subtle surface tension using wave derivatives
        float tension = sin(time * 2.0 + uv.x * 20.0) * 0.02;
        tension += sin(time * 1.5 + uv.y * 15.0) * 0.01;
        
        // Very subtle color variation
        color = vec3(0.01, 0.02, 0.03) * tension;
        
        return color;
      }
      
      // Create subtle wave interference patterns
      vec3 createWaveInterference(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Add subtle interference using different wave frequencies
        float interference = sin(time * 1.2 + uv.x * 25.0) * sin(time * 0.8 + uv.y * 18.0) * 0.01;
        
        // Very subtle interference color
        color = vec3(0.01, 0.02, 0.03) * interference;
        
        return color;
      }
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Use the simple ocean waves as the main effect
        vec3 oceanWaves = createOceanWaves(uv, vTime);
        vec3 waveStreams = createWaveStreams(uv, vTime);
        vec3 interference = createWaveInterference(uv, vTime);
        
        // Combine effects with audio reactivity
        if (vAudioLevel < 0.2) {
          // Calm ocean - mostly main waves
          color = oceanWaves * 0.98 + waveStreams * 0.01 + interference * 0.01;
        } else if (vAudioLevel < 0.5) {
          // Moderate activity - add some surface tension
          color = oceanWaves * 0.95 + waveStreams * 0.03 + interference * 0.02;
        } else {
          // High activity - more dynamic surface
          color = oceanWaves * 0.92 + waveStreams * 0.05 + interference * 0.03;
        }
        
        // Add audio-reactive wave intensity
        float waveIntensity = 1.0 + vAudioLevel * 0.2;
        color *= waveIntensity;
        
        // Add very subtle serendipity variation
        color += vec3(0.002) * sin(vTime * 1.5 + uv.x * 60.0) * 
                 sin(vTime * 1.2 + uv.y * 55.0) * vSerendipity;
        
        // Final output with proper contrast
        float alpha = length(color) * 0.95;
        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  destroy(): void {
    super.destroy();
  }
}
