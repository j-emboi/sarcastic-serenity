import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class WaveScene extends BaseScene {
  id = 'waves';
  name = 'Ocean Waves';

  private waveProgram: Program | null = null;
  private waveMesh: Mesh | null = null;
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing OGL WaveScene with FULL VIEWPORT dramatic animation');
    
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

    // Create full-screen quad for wave rendering - ensure it covers entire viewport
    // Use larger size to ensure full coverage
    const geometry = new Plane(gl, { width: 4, height: 4 });
    
    this.waveMesh = new Mesh(gl, {
      geometry,
      program: this.waveProgram
    });

    this.addMesh(this.waveMesh);
    
    console.log('OGL WaveScene initialization complete - full viewport coverage with 4x4 plane');
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.waveProgram) {
      this.waveProgram.uniforms.time.value = this.time * 0.001; // Convert to seconds
      this.waveProgram.uniforms.audioLevel.value = audioLevel;
      this.waveProgram.uniforms.serendipity.value = serendipity;
      
      // Debug logging every second
      if (Math.floor(this.time / 1000) % 1 === 0) {
        console.log('WaveScene update:', {
          time: this.time * 0.001,
          audioLevel,
          serendipity,
          deltaTime,
          'uniform_time': this.waveProgram.uniforms.time.value
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
      
      // Noise function for organic movement
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
      
      // Particle-based ocean effect
      void main() {
        vec2 uv = vUv;
        
        // Create multiple particle layers
        float particles1 = 0.0;
        float particles2 = 0.0;
        float particles3 = 0.0;
        
        // Layer 1: Fast moving particles
        for(int i = 0; i < 20; i++) {
          float fi = float(i);
          vec2 pos = vec2(
            mod(fi * 7.0 + vTime * 2.0, 1.0),
            mod(fi * 13.0 + vTime * 1.5, 1.0)
          );
          float dist = length(uv - pos);
          particles1 += smoothstep(0.1, 0.0, dist) * 0.5;
        }
        
        // Layer 2: Medium speed particles
        for(int i = 0; i < 15; i++) {
          float fi = float(i);
          vec2 pos = vec2(
            mod(fi * 11.0 + vTime * 1.0, 1.0),
            mod(fi * 17.0 + vTime * 0.8, 1.0)
          );
          float dist = length(uv - pos);
          particles2 += smoothstep(0.15, 0.0, dist) * 0.4;
        }
        
        // Layer 3: Slow moving particles
        for(int i = 0; i < 10; i++) {
          float fi = float(i);
          vec2 pos = vec2(
            mod(fi * 19.0 + vTime * 0.5, 1.0),
            mod(fi * 23.0 + vTime * 0.3, 1.0)
          );
          float dist = length(uv - pos);
          particles3 += smoothstep(0.2, 0.0, dist) * 0.3;
        }
        
        // Combine particle layers
        float totalParticles = particles1 + particles2 + particles3;
        
        // Create flowing water effect
        vec2 flow = vec2(
          noise(uv * 3.0 + vTime * 0.5),
          noise(uv * 3.0 + vTime * 0.7 + 100.0)
        );
        
        // Ocean colors
        vec3 deepBlue = vec3(0.0, 0.2, 0.6);
        vec3 oceanBlue = vec3(0.0, 0.5, 0.8);
        vec3 lightBlue = vec3(0.4, 0.7, 1.0);
        vec3 white = vec3(1.0, 1.0, 1.0);
        
        // Create base ocean color
        vec3 color = mix(deepBlue, oceanBlue, uv.y);
        color = mix(color, lightBlue, flow.x * 0.3);
        
        // Add particle effects
        color = mix(color, white, totalParticles * 0.8);
        
        // Add flowing water movement
        color += vec3(0.1) * sin(vTime * 3.0 + uv.x * 10.0 + flow.x * 5.0);
        color += vec3(0.1) * sin(vTime * 2.0 + uv.y * 8.0 + flow.y * 5.0);
        
        // Add wave ripples
        float ripple = sin(vTime * 4.0 + length(uv - vec2(0.5)) * 20.0) * 0.1;
        color += vec3(0.1) * ripple;
        
        // Audio reactivity - make particles more intense
        if (vAudioLevel > 0.0) {
          float audioBoost = vAudioLevel * 3.0;
          color += vec3(0.3) * audioBoost * sin(vTime * 8.0 + uv.x * 15.0);
          color += vec3(0.2) * audioBoost * sin(vTime * 6.0 + uv.y * 12.0);
          
          // Add more particles with audio
          for(int i = 0; i < 5; i++) {
            float fi = float(i);
            vec2 pos = vec2(
              mod(fi * 29.0 + vTime * 4.0, 1.0),
              mod(fi * 31.0 + vTime * 3.0, 1.0)
            );
            float dist = length(uv - pos);
            color += vec3(0.2) * audioBoost * smoothstep(0.05, 0.0, dist);
          }
        }
        
        // Add some sparkle
        float sparkle = sin(vTime * 10.0 + uv.x * 50.0) * sin(vTime * 8.0 + uv.y * 40.0) * 0.1;
        color += vec3(0.1) * sparkle;
        
        // Ensure colors are bright and saturated
        color = clamp(color, 0.0, 1.0);
        
        // Add brightness boost
        color = color * 1.2;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  destroy(): void {
    super.destroy();
  }
}
