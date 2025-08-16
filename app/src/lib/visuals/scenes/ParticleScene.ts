import { Program, Mesh, Plane, Geometry, Transform } from 'ogl';
import { BaseScene } from './BaseScene';
import * as Matter from 'matter-js';

export type AnimationType = 
  | 'flowing-particles'
  | 'wave-patterns'
  | 'spiral-galaxy'
  | 'fireworks'
  | 'floating-particles'
  | 'cosmic-dust'
  | 'energy-field';

interface PhysicsParticle {
  body: Matter.Body;
  color: { r: number; g: number; b: number };
  life: number;
  maxLife: number;
  type: 'particle' | 'spark' | 'bubble';
}

export class ParticleScene extends BaseScene {
  id = 'particles';
  name = 'Physics Particles';

  private particleProgram: Program | null = null;
  private particleMesh: Mesh | null = null;
  protected time: number = 0;
  private currentAnimation: AnimationType = 'flowing-particles';
  private animationId: number | null = null;

  // Physics engine components
  private engine: Matter.Engine | null = null;
  private world: Matter.World | null = null;
  private render: Matter.Render | null = null;
  private particles: PhysicsParticle[] = [];
  private bounds: Matter.Body[] = [];
  private forces: Matter.Body[] = [];

  // Physics settings
  private readonly MAX_PARTICLES = 200;
  private readonly PARTICLE_RADIUS = 3;
  private readonly GRAVITY = { x: 0, y: 0.1, scale: 0.001 };
  private readonly WIND_FORCE = { x: 0.02, y: 0 };

  init(gl: any): void {
    console.log('Initializing Physics-Based ParticleScene');
    
    // Initialize Matter.js physics engine
    this.engine = Matter.Engine.create({
      gravity: this.GRAVITY
    });
    this.world = this.engine.world;

    // Create invisible boundaries
    this.createBoundaries();

    // Create force fields
    this.createForceFields();

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
    
    // Start physics simulation
    this.startPhysicsSimulation();
    
    console.log('Physics-Based ParticleScene initialization complete');
  }

  private createBoundaries(): void {
    if (!this.world) return;

    const canvas = { width: window.innerWidth, height: window.innerHeight };
    const thickness = 50;

    // Create invisible walls
    const walls = [
      // Top wall
      Matter.Bodies.rectangle(canvas.width / 2, -thickness / 2, canvas.width, thickness, { isStatic: true }),
      // Bottom wall
      Matter.Bodies.rectangle(canvas.width / 2, canvas.height + thickness / 2, canvas.width, thickness, { isStatic: true }),
      // Left wall
      Matter.Bodies.rectangle(-thickness / 2, canvas.height / 2, thickness, canvas.height, { isStatic: true }),
      // Right wall
      Matter.Bodies.rectangle(canvas.width + thickness / 2, canvas.height / 2, thickness, canvas.height, { isStatic: true })
    ];

    walls.forEach(wall => {
      wall.render.visible = false; // Make walls invisible
      this.bounds.push(wall);
      if (this.world) {
        Matter.World.add(this.world, wall);
      }
    });
  }

  private createForceFields(): void {
    if (!this.world) return;

    const canvas = { width: window.innerWidth, height: window.innerHeight };

    // Create attractive force fields
    const forceFields = [
      { x: canvas.width * 0.25, y: canvas.height * 0.25, strength: 0.0001 },
      { x: canvas.width * 0.75, y: canvas.height * 0.75, strength: 0.0001 },
      { x: canvas.width * 0.5, y: canvas.height * 0.5, strength: 0.00005 }
    ];

    forceFields.forEach(field => {
      const forceBody = Matter.Bodies.circle(field.x, field.y, 1, { 
        isStatic: true,
        isSensor: true,
        render: { visible: false }
      });
      
      // Add custom force field data
      (forceBody as any).forceField = {
        strength: field.strength,
        position: { x: field.x, y: field.y }
      };
      
      this.forces.push(forceBody);
      if (this.world) {
        Matter.World.add(this.world, forceBody);
      }
    });
  }

  private startPhysicsSimulation(): void {
    if (!this.engine) return;

    // Run physics simulation
    const runPhysics = () => {
      if (this.engine) {
        Matter.Engine.update(this.engine, 1000 / 60); // 60 FPS physics
      }
      this.updateParticles();
      this.animationId = requestAnimationFrame(runPhysics);
    };

    runPhysics();
  }

  private updateParticles(): void {
    // Update particle lifetimes and remove dead particles
    this.particles = this.particles.filter(particle => {
      particle.life -= 1;
      return particle.life > 0;
    });

    // Apply force fields to particles
    this.particles.forEach(particle => {
      this.forces.forEach(force => {
        if ((force as any).forceField) {
          const field = (force as any).forceField;
          const distance = Matter.Vector.magnitude(
            Matter.Vector.sub(particle.body.position, field.position)
          );
          
          if (distance > 0) {
            const forceVector = Matter.Vector.normalise(
              Matter.Vector.sub(field.position, particle.body.position)
            );
            const forceMagnitude = field.strength / (distance * distance);
            
            Matter.Body.applyForce(particle.body, particle.body.position, {
              x: forceVector.x * forceMagnitude,
              y: forceVector.y * forceMagnitude
            });
          }
        }
      });

      // Apply wind force
      Matter.Body.applyForce(particle.body, particle.body.position, this.WIND_FORCE);
    });

    // Spawn new particles based on animation type
    this.spawnParticles();
  }

  private spawnParticles(): void {
    if (this.particles.length >= this.MAX_PARTICLES) return;

    const canvas = { width: window.innerWidth, height: window.innerHeight };
    const spawnRate = 2; // particles per frame

    for (let i = 0; i < spawnRate; i++) {
      if (this.particles.length >= this.MAX_PARTICLES) break;

      const particle = this.createParticle();
      if (particle) {
        this.particles.push(particle);
        if (this.world) {
          Matter.World.add(this.world, particle.body);
        }
      }
    }
  }

  private createParticle(): PhysicsParticle | null {
    const canvas = { width: window.innerWidth, height: window.innerHeight };
    
    // Spawn position based on animation type
    let spawnX: number, spawnY: number;
    
    switch (this.currentAnimation) {
      case 'flowing-particles':
        spawnX = Math.random() * canvas.width;
        spawnY = -this.PARTICLE_RADIUS;
        break;
      case 'fireworks':
        spawnX = canvas.width / 2 + (Math.random() - 0.5) * 100;
        spawnY = canvas.height + this.PARTICLE_RADIUS;
        break;
      case 'spiral-galaxy':
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 200;
        spawnX = canvas.width / 2 + Math.cos(angle) * radius;
        spawnY = canvas.height / 2 + Math.sin(angle) * radius;
        break;
      default:
        spawnX = Math.random() * canvas.width;
        spawnY = Math.random() * canvas.height;
    }

    // Create physics body
    const body = Matter.Bodies.circle(spawnX, spawnY, this.PARTICLE_RADIUS, {
      restitution: 0.8,
      friction: 0.1,
      density: 0.001,
      render: { visible: false }
    });

    // Initial velocity based on animation type
    switch (this.currentAnimation) {
      case 'flowing-particles':
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 2,
          y: Math.random() * 3 + 1
        });
        break;
      case 'fireworks':
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 8,
          y: -Math.random() * 10 - 5
        });
        break;
      case 'spiral-galaxy':
        const velocity = Math.random() * 3 + 1;
        const direction = Math.atan2(spawnY - canvas.height / 2, spawnX - canvas.width / 2);
        Matter.Body.setVelocity(body, {
          x: Math.cos(direction) * velocity,
          y: Math.sin(direction) * velocity
        });
        break;
      default:
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4
        });
    }

    // Particle properties
    const particle: PhysicsParticle = {
      body,
      color: {
        r: 0.2 + Math.random() * 0.6,
        g: 0.4 + Math.random() * 0.4,
        b: 0.6 + Math.random() * 0.4
      },
      life: 300 + Math.random() * 200,
      maxLife: 300 + Math.random() * 200,
      type: Math.random() > 0.7 ? 'spark' : 'particle'
    };

    return particle;
  }

  setAnimationType(type: AnimationType): void {
    console.log('ParticleScene: Switching to animation type:', type);
    this.currentAnimation = type;
    
    // Clear existing particles when switching animations
    this.clearParticles();
    
    // Adjust physics settings based on animation
    this.adjustPhysicsForAnimation(type);
  }

  private clearParticles(): void {
    if (this.world) {
      this.particles.forEach(particle => {
        Matter.World.remove(this.world, particle.body);
      });
    }
    this.particles = [];
  }

  private adjustPhysicsForAnimation(type: AnimationType): void {
    if (!this.engine) return;

    switch (type) {
      case 'flowing-particles':
        this.engine.gravity = { x: 0, y: 0.1 };
        this.WIND_FORCE.x = 0.02;
        break;
      case 'fireworks':
        this.engine.gravity = { x: 0, y: 0.2 };
        this.WIND_FORCE.x = 0;
        break;
      case 'spiral-galaxy':
        this.engine.gravity = { x: 0, y: 0 };
        this.WIND_FORCE.x = 0.01;
        break;
      default:
        this.engine.gravity = { x: 0, y: 0.05 };
        this.WIND_FORCE.x = 0.01;
    }
  }

  getAnimationTypes(): { type: AnimationType; name: string; description: string }[] {
    return [
      { type: 'flowing-particles', name: 'Flowing Particles', description: 'Physics-based flowing particle streams' },
      { type: 'wave-patterns', name: 'Wave Patterns', description: 'Organic wave interference patterns' },
      { type: 'spiral-galaxy', name: 'Spiral Galaxy', description: 'Spiral galaxy formation with physics' },
      { type: 'fireworks', name: 'Fireworks', description: 'Physics-based particle explosions' },
      { type: 'floating-particles', name: 'Floating Particles', description: 'Calming floating particle physics' },
      { type: 'cosmic-dust', name: 'Cosmic Dust', description: 'Floating cosmic particles with gravity' },
      { type: 'energy-field', name: 'Energy Field', description: 'Electric energy field physics' }
    ];
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

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

    // Convert particle physics data to shader uniforms
    const particlePositions: number[] = [];
    const particleColors: number[] = [];
    const particleLives: number[] = [];

    this.particles.forEach(particle => {
      // Normalize positions to 0-1 range
      particlePositions.push(
        particle.body.position.x / window.innerWidth,
        particle.body.position.y / window.innerHeight
      );
      
      particleColors.push(
        particle.color.r,
        particle.color.g,
        particle.color.b
      );
      
      particleLives.push(particle.life / particle.maxLife);
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

    // Update shader uniforms
    this.particleProgram.uniforms.particlePositions = { value: new Float32Array(particlePositions) };
    this.particleProgram.uniforms.particleColors = { value: new Float32Array(particleColors) };
    this.particleProgram.uniforms.particleLives = { value: new Float32Array(particleLives) };
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
      
      uniform float particlePositions[400]; // MAX_PARTICLES * 2
      uniform float particleColors[600];    // MAX_PARTICLES * 3
      uniform float particleLives[200];     // MAX_PARTICLES
      uniform int particleCount;
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Render physics-based particles
        for (int i = 0; i < 200; i++) {
          if (i >= particleCount) break;
          
          vec2 particlePos = vec2(particlePositions[i * 2], particlePositions[i * 2 + 1]);
          vec3 particleColor = vec3(particleColors[i * 3], particleColors[i * 3 + 1], particleColors[i * 3 + 2]);
          float life = particleLives[i];
          
          // Calculate distance to particle
          float dist = length(uv - particlePos);
          float radius = 0.02; // Particle radius
          
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
    
    // Clean up physics engine
    if (this.world) {
      this.clearParticles();
      this.bounds.forEach(bound => {
        Matter.World.remove(this.world, bound);
      });
      this.forces.forEach(force => {
        Matter.World.remove(this.world, force);
      });
    }
    
    super.destroy();
  }
}