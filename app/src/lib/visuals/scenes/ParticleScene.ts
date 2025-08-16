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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: { r: number; g: number; b: number };
  size: number;
}

export class ParticleScene extends BaseScene {
  id = 'particles';
  name = 'Physics Particles';

  private particleProgram: Program | null = null;
  private particleMesh: Mesh | null = null;
  protected time: number = 0;
  private currentAnimation: AnimationType = 'flowing-particles';
  private animationId: number | null = null;

  // Pure JavaScript particle system
  private particles: Particle[] = [];
  private readonly MAX_PARTICLES = 100;
  private readonly GRAVITY = 0.1;
  private readonly WIND = 0.02;
  private readonly BOUNCE = 0.8;
  private readonly FRICTION = 0.99;

  init(gl: any): void {
    console.log('Initializing Pure WebGL ParticleScene');
    
    // Create particle shader program
    this.particleProgram = new Program(gl, {
      vertex: this.createParticleVertexShader(),
      fragment: this.createParticleFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] },
        particleCount: { value: this.MAX_PARTICLES }
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
    
    // Initialize particles
    this.initializeParticles();
    
    console.log('Pure WebGL ParticleScene initialization complete');
  }

  private initializeParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const canvas = { width: window.innerWidth, height: window.innerHeight };
    
    // Spawn position based on animation type
    let x: number, y: number, vx: number, vy: number;
    
    switch (this.currentAnimation) {
      case 'flowing-particles':
        x = Math.random() * canvas.width;
        y = -10;
        vx = (Math.random() - 0.5) * 2;
        vy = Math.random() * 3 + 1;
        break;
      case 'fireworks':
        x = canvas.width / 2 + (Math.random() - 0.5) * 100;
        y = canvas.height + 10;
        vx = (Math.random() - 0.5) * 8;
        vy = -Math.random() * 10 - 5;
        break;
      case 'spiral-galaxy':
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 200;
        x = canvas.width / 2 + Math.cos(angle) * radius;
        y = canvas.height / 2 + Math.sin(angle) * radius;
        const velocity = Math.random() * 3 + 1;
        vx = Math.cos(angle) * velocity;
        vy = Math.sin(angle) * velocity;
        break;
      default:
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        vx = (Math.random() - 0.5) * 4;
        vy = (Math.random() - 0.5) * 4;
    }

    return {
      x,
      y,
      vx,
      vy,
      life: 300 + Math.random() * 200,
      maxLife: 300 + Math.random() * 200,
      color: {
        r: 0.2 + Math.random() * 0.6,
        g: 0.4 + Math.random() * 0.4,
        b: 0.6 + Math.random() * 0.4
      },
      size: 3 + Math.random() * 5
    };
  }

  private updateParticles(): void {
    const canvas = { width: window.innerWidth, height: window.innerHeight };
    
    // Update existing particles
    this.particles = this.particles.filter(particle => {
      // Update life
      particle.life -= 1;
      if (particle.life <= 0) return false;
      
      // Apply physics
      particle.vy += this.GRAVITY; // Gravity
      particle.vx += this.WIND; // Wind
      
      // Apply friction
      particle.vx *= this.FRICTION;
      particle.vy *= this.FRICTION;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off boundaries
      if (particle.x < 0 || particle.x > canvas.width) {
        particle.vx *= -this.BOUNCE;
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      }
      if (particle.y < 0 || particle.y > canvas.height) {
        particle.vy *= -this.BOUNCE;
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));
      }
      
      return true;
    });
    
    // Spawn new particles to maintain count
    while (this.particles.length < this.MAX_PARTICLES) {
      this.particles.push(this.createParticle());
    }
  }

  setAnimationType(type: AnimationType): void {
    console.log('ParticleScene: Switching to animation type:', type);
    this.currentAnimation = type;
    
    // Clear existing particles and reinitialize
    this.initializeParticles();
  }

  getAnimationTypes(): { type: AnimationType; name: string; description: string }[] {
    return [
      { type: 'flowing-particles', name: 'Flowing Particles', description: 'Pure WebGL flowing particle streams' },
      { type: 'wave-patterns', name: 'Wave Patterns', description: 'Organic wave interference patterns' },
      { type: 'spiral-galaxy', name: 'Spiral Galaxy', description: 'Spiral galaxy formation with physics' },
      { type: 'fireworks', name: 'Fireworks', description: 'Pure WebGL particle explosions' },
      { type: 'floating-particles', name: 'Floating Particles', description: 'Calming floating particle physics' },
      { type: 'cosmic-dust', name: 'Cosmic Dust', description: 'Floating cosmic particles with gravity' },
      { type: 'energy-field', name: 'Energy Field', description: 'Electric energy field physics' }
    ];
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    // Update particle physics
    this.updateParticles();

    if (this.particleProgram) {
      this.particleProgram.uniforms.time.value = this.time;
      this.particleProgram.uniforms.audioLevel.value = audioLevel;
      this.particleProgram.uniforms.serendipity.value = serendipity;
      
      // Pass particle data to shader
      this.updateShaderWithParticleData();
    }
  }

  private updateShaderWithParticleData(): void {
    if (!this.particleProgram) return;

    // Convert particle data to shader uniforms
    const particlePositions: number[] = [];
    const particleColors: number[] = [];
    const particleLives: number[] = [];
    const particleSizes: number[] = [];

    this.particles.forEach(particle => {
      // Normalize positions to 0-1 range
      particlePositions.push(
        particle.x / window.innerWidth,
        particle.y / window.innerHeight
      );
      
      particleColors.push(
        particle.color.r,
        particle.color.g,
        particle.color.b
      );
      
      particleLives.push(particle.life / particle.maxLife);
      particleSizes.push(particle.size / 10); // Normalize size
    });

    // Pad arrays to fixed size for shader
    while (particlePositions.length < this.MAX_PARTICLES * 2) {
      particlePositions.push(0, 0);
    }
    while (particleColors.length < this.MAX_PARTICLES * 3) {
      particleColors.push(0, 0, 0);
    }
    while (particleLives.length < this.MAX_PARTICLES) {
      particleLives.push(0);
    }
    while (particleSizes.length < this.MAX_PARTICLES) {
      particleSizes.push(0);
    }

    // Update shader uniforms
    this.particleProgram.uniforms.particlePositions = { value: new Float32Array(particlePositions) };
    this.particleProgram.uniforms.particleColors = { value: new Float32Array(particleColors) };
    this.particleProgram.uniforms.particleLives = { value: new Float32Array(particleLives) };
    this.particleProgram.uniforms.particleSizes = { value: new Float32Array(particleSizes) };
    this.particleProgram.uniforms.particleCount = { value: this.particles.length };
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
      uniform int particleCount;
      
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
      
      uniform float particlePositions[200]; // MAX_PARTICLES * 2
      uniform float particleColors[300];    // MAX_PARTICLES * 3
      uniform float particleLives[100];     // MAX_PARTICLES
      uniform float particleSizes[100];     // MAX_PARTICLES
      uniform int particleCount;
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Render particles
        for (int i = 0; i < 100; i++) {
          if (i >= particleCount) break;
          
          vec2 particlePos = vec2(particlePositions[i * 2], particlePositions[i * 2 + 1]);
          vec3 particleColor = vec3(particleColors[i * 3], particleColors[i * 3 + 1], particleColors[i * 3 + 2]);
          float life = particleLives[i];
          float size = particleSizes[i];
          
          // Calculate distance to particle
          float dist = length(uv - particlePos);
          float radius = size * 0.02; // Particle radius based on size
          
          // Create soft particle
          float particle = smoothstep(radius, 0.0, dist) * life;
          
          // Add glow effect
          float glow = smoothstep(radius * 2.0, 0.0, dist) * life * 0.3;
          
          color += particleColor * (particle + glow);
        }
        
        // Add subtle background
        color += vec3(0.05, 0.1, 0.15) * 0.1;
        
        // Add audio reactivity
        if (vAudioLevel > 0.0) {
          color += vec3(0.1, 0.2, 0.3) * vAudioLevel * sin(vTime * 5.0 + uv.x * 10.0);
        }
        
        // Add serendipity variation
        color += vec3(0.02) * sin(vTime * 2.0 + uv.x * 20.0) * 
                 sin(vTime * 1.8 + uv.y * 15.0) * vSerendipity;
        
        // Final output
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Clear particles
    this.particles = [];
    
    super.destroy();
  }
}