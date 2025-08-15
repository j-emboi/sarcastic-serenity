import { Program, Mesh, Plane, Geometry, Transform } from 'ogl';
import { BaseScene } from './BaseScene';

export type AnimationType = 
  | 'flowing-particles'
  | 'wave-patterns'
  | 'spiral-galaxy'
  | 'fireworks'
  | 'floating-particles'
  | 'cosmic-dust'
  | 'energy-field';

export class ParticleScene extends BaseScene {
  id = 'particles';
  name = 'Flowing Particles';

  private particleProgram: Program | null = null;
  private particleMesh: Mesh | null = null;
  protected time: number = 0;
  private currentAnimation: AnimationType = 'flowing-particles';
  private animationId: number | null = null;

  init(gl: any): void {
    console.log('Initializing OGL ParticleScene with animation:', this.currentAnimation);
    
    // Create particle shader program
    this.particleProgram = new Program(gl, {
      vertex: this.createParticleVertexShader(),
      fragment: this.createParticleFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] },
        animationType: { value: 0 }, // 0 = flowing-particles, 1 = wave-patterns, etc.
        particleCount: { value: 1000 }
      }
    });

    this.addProgram(this.particleProgram);

    // Create full-screen quad for particle rendering
    const geometry = new Plane(gl, { width: 2, height: 2 });
    
    this.particleMesh = new Mesh(gl, {
      geometry,
      program: this.particleProgram
    });

    this.addMesh(this.particleMesh);
    
    console.log('OGL ParticleScene initialization complete');
  }

  setAnimationType(type: AnimationType): void {
    console.log('ParticleScene: Switching to animation type:', type);
    this.currentAnimation = type;
    
    // Update shader uniform for animation type
    if (this.particleProgram) {
      const animationIndex = this.getAnimationIndex(type);
      this.particleProgram.uniforms.animationType.value = animationIndex;
    }
  }

  getAnimationTypes(): { type: AnimationType; name: string; description: string }[] {
    return [
      { type: 'flowing-particles', name: 'Flowing Particles', description: 'Smooth flowing particle streams' },
      { type: 'wave-patterns', name: 'Wave Patterns', description: 'Organic wave interference patterns' },
      { type: 'spiral-galaxy', name: 'Spiral Galaxy', description: 'Spiral galaxy formation' },
      { type: 'fireworks', name: 'Fireworks', description: 'Gentle, calming particle expansion' },
      { type: 'floating-particles', name: 'Floating Particles', description: 'Calming ocean wave patterns' },
      { type: 'cosmic-dust', name: 'Cosmic Dust', description: 'Floating cosmic particles' },
      { type: 'energy-field', name: 'Energy Field', description: 'Electric energy field' }
    ];
  }

  private getAnimationIndex(type: AnimationType): number {
    const types = ['flowing-particles', 'wave-patterns', 'spiral-galaxy', 'fireworks', 'floating-particles', 'cosmic-dust', 'energy-field'];
    return types.indexOf(type);
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.particleProgram) {
      this.particleProgram.uniforms.time.value = this.time;
      this.particleProgram.uniforms.audioLevel.value = audioLevel;
      this.particleProgram.uniforms.serendipity.value = serendipity;
    }
  }

  private createParticleVertexShader(): string {
    return /* glsl */ `
      attribute vec3 position;
      attribute vec2 uv;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float time;
      uniform float audioLevel;
      uniform float serendipity;
      uniform vec2 resolution;
      uniform int animationType;
      
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

  private createParticleFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vTime;
      varying float vAudioLevel;
      varying float vSerendipity;
      
      // Noise functions for organic movement
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
      
      // Create flowing particle streams
      vec3 createFlowingParticles(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create multiple particle streams
        for (int i = 0; i < 8; i++) {
          float stream = float(i);
          
          // Stream position and movement
          vec2 streamPos = vec2(
            mod(uv.x + time * 0.3 + stream * 0.1, 1.0),
            mod(uv.y + time * 0.2 + stream * 0.15, 1.0)
          );
          
          // Add organic flow with noise
          vec2 flow = vec2(
            noise(streamPos * 4.0 + time * 0.5),
            noise(streamPos * 4.0 + time * 0.7 + 10.0)
          );
          
          streamPos += flow * 0.1;
          
          // Create particle trail
          float trail = 0.0;
          for (int j = 0; j < 5; j++) {
            float offset = float(j) * 0.02;
            vec2 trailPos = streamPos + vec2(offset, offset);
            trail += smoothstep(0.0, 0.1, 1.0 - length(trailPos - uv));
          }
          
          // Particle color based on stream
          vec3 particleColor = vec3(
            0.2 + 0.3 * sin(stream * 0.8),
            0.4 + 0.4 * sin(stream * 1.2),
            0.6 + 0.3 * sin(stream * 0.6)
          );
          
          // Add audio reactivity
          particleColor *= 0.8 + vAudioLevel * 0.4;
          
          color += particleColor * trail * 0.3;
        }
        
        return color;
      }
      
      // Create wave patterns
      vec3 createWavePatterns(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Multiple wave layers
        for (int i = 0; i < 3; i++) {
          float layer = float(i);
          float frequency = 2.0 + layer * 2.0;
          float amplitude = 0.1 + layer * 0.05;
          float speed = 0.5 + layer * 0.3;
          
          // Create wave
          float wave = sin(uv.x * frequency + time * speed) * 
                      cos(uv.y * frequency * 0.7 + time * speed * 0.8);
          
          // Add noise for organic feel
          wave += noise(uv * 3.0 + time * 0.5) * 0.2;
          
          // Wave color
          vec3 waveColor = vec3(
            0.1 + 0.2 * sin(layer * 2.0),
            0.3 + 0.3 * sin(layer * 1.5),
            0.5 + 0.2 * sin(layer * 1.8)
          );
          
          color += waveColor * wave * amplitude;
        }
        
        return color;
      }
      
      // Create spiral galaxy
      vec3 createSpiralGalaxy(vec2 uv, float time) {
        vec2 center = vec2(0.5);
        vec2 pos = uv - center;
        
        // Convert to polar coordinates
        float angle = atan(pos.y, pos.x);
        float radius = length(pos);
        
        // Create spiral arms
        float spiral = sin(angle * 4.0 + radius * 10.0 + time * 0.5);
        spiral += sin(angle * 6.0 - radius * 8.0 + time * 0.3);
        
        // Add noise for galaxy texture
        float galaxyNoise = fbm(pos * 2.0 + time * 0.2);
        
        // Create galaxy color
        vec3 galaxyColor = vec3(
          0.1 + 0.2 * galaxyNoise,
          0.2 + 0.3 * galaxyNoise,
          0.4 + 0.3 * galaxyNoise
        );
        
        // Apply spiral pattern
        float intensity = smoothstep(0.0, 0.3, radius) * 
                         smoothstep(0.8, 0.0, radius) * 
                         (0.5 + spiral * 0.5);
        
        return galaxyColor * intensity;
      }
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Choose animation based on uniform
        if (vAudioLevel < 0.1) {
          // Default to flowing particles
          color = createFlowingParticles(uv, vTime);
        } else if (vAudioLevel < 0.3) {
          // Mix flowing particles and waves
          color = mix(
            createFlowingParticles(uv, vTime),
            createWavePatterns(uv, vTime),
            0.5
          );
        } else {
          // Higher audio = more dynamic
          color = mix(
            createWavePatterns(uv, vTime),
            createSpiralGalaxy(uv, vTime),
            0.7
          );
        }
        
        // Add subtle pulsing
        float pulse = sin(vTime * 1.5) * 0.1 + 0.9;
        color *= pulse;
        
        // Add serendipity variation
        color += vec3(0.05) * sin(vTime * 2.0 + uv.x * 20.0) * 
                 sin(vTime * 1.8 + uv.y * 15.0) * vSerendipity;
        
        // Final output with smooth alpha
        float alpha = length(color) * 0.8;
        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    super.destroy();
  }
}