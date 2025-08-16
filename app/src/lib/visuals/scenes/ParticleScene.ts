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
  name = 'Physics Particles';

  private particleProgram: Program | null = null;
  private particleMesh: Mesh | null = null;
  protected time: number = 0;
  private currentAnimation: AnimationType = 'flowing-particles';

  init(gl: any): void {
    console.log('Initializing Simple ParticleScene');
    
    // Create simple particle shader program
    this.particleProgram = new Program(gl, {
      vertex: this.createParticleVertexShader(),
      fragment: this.createParticleFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] }
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
    
    console.log('Simple ParticleScene initialization complete');
  }

  setAnimationType(type: AnimationType): void {
    console.log('ParticleScene: Switching to animation type:', type);
    this.currentAnimation = type;
  }

  getAnimationTypes(): { type: AnimationType; name: string; description: string }[] {
    return [
      { type: 'flowing-particles', name: 'Flowing Particles', description: 'Simple flowing particle streams' },
      { type: 'wave-patterns', name: 'Wave Patterns', description: 'Organic wave interference patterns' },
      { type: 'spiral-galaxy', name: 'Spiral Galaxy', description: 'Spiral galaxy formation' },
      { type: 'fireworks', name: 'Fireworks', description: 'Simple particle explosions' },
      { type: 'floating-particles', name: 'Floating Particles', description: 'Calming floating particles' },
      { type: 'cosmic-dust', name: 'Cosmic Dust', description: 'Floating cosmic particles' },
      { type: 'energy-field', name: 'Energy Field', description: 'Electric energy field' }
    ];
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
      
      // Simple noise function
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Create multiple moving particles
        for (int i = 0; i < 20; i++) {
          float fi = float(i);
          
          // Particle position with movement
          vec2 particlePos = vec2(
            mod(fi * 0.1 + vTime * 0.5, 1.0),
            mod(fi * 0.15 + vTime * 0.3, 1.0)
          );
          
          // Add some variation
          particlePos += vec2(
            sin(vTime * 2.0 + fi * 0.5) * 0.1,
            cos(vTime * 1.5 + fi * 0.7) * 0.1
          );
          
          // Calculate distance to particle
          float dist = length(uv - particlePos);
          float radius = 0.05;
          
          // Create soft particle
          float particle = smoothstep(radius, 0.0, dist);
          
          // Add glow
          float glow = smoothstep(radius * 2.0, 0.0, dist) * 0.3;
          
          // Particle color based on index
          vec3 particleColor = vec3(
            0.2 + 0.3 * sin(fi * 0.5),
            0.4 + 0.4 * sin(fi * 0.7),
            0.6 + 0.3 * sin(fi * 0.3)
          );
          
          color += particleColor * (particle + glow);
        }
        
        // Add background gradient
        vec3 bgColor = mix(
          vec3(0.05, 0.1, 0.2),
          vec3(0.1, 0.2, 0.3),
          uv.y
        );
        
        color += bgColor * 0.3;
        
        // Add audio reactivity
        if (vAudioLevel > 0.0) {
          color += vec3(0.2, 0.4, 0.6) * vAudioLevel * sin(vTime * 5.0 + uv.x * 10.0);
        }
        
        // Add serendipity variation
        color += vec3(0.1) * sin(vTime * 2.0 + uv.x * 20.0) * 
                 sin(vTime * 1.8 + uv.y * 15.0) * vSerendipity;
        
        // Add some moving waves
        float wave1 = sin(vTime * 1.0 + uv.x * 8.0) * 0.1;
        float wave2 = sin(vTime * 0.8 + uv.y * 6.0) * 0.1;
        color += vec3(0.1, 0.2, 0.3) * (wave1 + wave2);
        
        // Ensure colors are bright and visible
        color = clamp(color, 0.0, 1.0);
        
        // Add some brightness
        color = color * 1.2;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  destroy(): void {
    super.destroy();
  }
}