import { Renderer, Camera, Program, Mesh, Plane, Box } from 'ogl';
import * as Matter from 'matter-js';

// Custom Scene class for OGL compatibility
class Scene {
  children: any[] = [];
  
  addChild(child: any) {
    this.children.push(child);
  }
  
  removeChild(child: any) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }
  
  updateMatrixWorld() {
    // Update matrix world for all children
    this.children.forEach(child => {
      if (child.updateMatrixWorld) {
        child.updateMatrixWorld();
      }
    });
  }
  
  traverse(callback: (child: any) => void) {
    // Traverse all children and call the callback
    this.children.forEach(child => {
      callback(child);
      if (child.traverse) {
        child.traverse(callback);
      }
    });
  }
}

export interface AudioData {
  frequency: number[];
  amplitude: number;
  bass: number;
  mid: number;
  treble: number;
}

export interface PhysicsObject {
  body: Matter.Body;
  mesh: Mesh;
  type: 'particle' | 'fluid' | 'softBody';
}

export class WebGLSceneManager {
  private renderer: Renderer;
  private scene: Scene;
  private camera: Camera;
  private canvas: HTMLCanvasElement | null = null;
  private physics: Matter.Engine;
  private physicsObjects: PhysicsObject[] = [];
  private isRunning = false;
  private animationFrameId: number | null = null;
  
  // Performance monitoring
  private frameCount = 0;
  private lastTime = 0;
  private fps = 60;
  private qualityLevel = 1.0; // 1.0 = full quality, 0.5 = half quality
  
  // Energy boost system
  private energyBoostTimer = 0;
  private energyBoostInterval = 3000; // Boost every 3 seconds (less frequent)
  
  // Audio reactivity
  private audioData: AudioData = {
    frequency: new Array(64).fill(0),
    amplitude: 0,
    bass: 0,
    mid: 0,
    treble: 0
  };
  
  // Physics bounds storage
  private physicsBounds: { left: number; right: number; top: number; bottom: number } | null = null;

  constructor() {
    this.physics = Matter.Engine.create({
      gravity: { x: 0, y: -0.05, scale: 0.001 }  // Very light gravity to keep particles floating
    });
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      console.log('🎨 Initializing WebGL Scene Manager...');
      this.canvas = canvas; // Store canvas reference
      
      // Force canvas to full viewport dimensions immediately
      const targetWidth = window.innerWidth;
      const targetHeight = window.innerHeight;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.setAttribute('width', targetWidth.toString());
      canvas.setAttribute('height', targetHeight.toString());
      canvas.style.setProperty('width', '100vw', 'important');
      canvas.style.setProperty('height', '100vh', 'important');
      
      // Force reflow to ensure dimensions are updated
      canvas.offsetHeight;
      
      console.log('🎨 Canvas dimensions after enforcement:', canvas.width, 'x', canvas.height);
      console.log('🎨 Canvas client dimensions:', canvas.clientWidth, 'x', canvas.clientHeight);
      
      // Canvas dimensions already set above, just verify
      console.log('🎨 Verifying canvas dimensions:', canvas.width, 'x', canvas.height);
      
      // Also update the renderer canvas reference
      if (this.renderer && this.renderer.canvas) {
        this.renderer.canvas.width = targetWidth;
        this.renderer.canvas.height = targetHeight;
        console.log('🎨 Updated renderer canvas to:', this.renderer.canvas.width, 'x', this.renderer.canvas.height);
      }
      
      // Update renderer size to match canvas
      if (this.renderer) {
        this.renderer.setSize(targetWidth, targetHeight);
        console.log('🎨 Updated renderer size to:', targetWidth, 'x', targetHeight);
      }
      
      console.log('🎨 Updated canvas dimensions to:', canvas.width, 'x', canvas.height);
      console.log('🎨 Updated canvas style to:', canvas.style.width, 'x', canvas.style.height);
      console.log('🎨 Updated canvas attributes to:', canvas.getAttribute('width'), 'x', canvas.getAttribute('height'));

      // Initialize OGL renderer with simpler parameters
      console.log('🎨 Creating OGL Renderer with canvas:', canvas);
      console.log('🎨 Canvas element type:', typeof canvas);
      console.log('🎨 Canvas element:', canvas);
      console.log('🎨 Final canvas dimensions before renderer creation:', canvas.width, 'x', canvas.height);
      this.renderer = new Renderer({
        canvas: canvas
      });
      console.log('🎨 OGL Renderer created successfully');

      // Create scene and camera
      console.log('🎨 Creating Scene...');
      this.scene = new Scene();
      console.log('🎨 Creating Camera...');
      this.camera = new Camera();
      
      // Position camera to view the entire scene properly
      const aspect = canvas.width / canvas.height;
      const distance = 10; // Fixed reasonable distance for particle viewing
      this.camera.position.z = distance;
      
      console.log('🎨 Scene and Camera created successfully');
      console.log('🎨 Camera position:', this.camera.position);
      console.log('🎨 Camera distance:', distance);
      console.log('🎨 Canvas aspect ratio:', aspect);

      // Skip background for now - focus on basic WebGL functionality
      console.log('🎨 Skipping background creation for now');

      // Set up renderer
      this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      // OGL renderer doesn't have setClearColor - background is handled by the scene

      // Create physics boundaries for particle containment
      // Force canvas dimensions one more time before calculating bounds
      const fullWidth = window.innerWidth;
      const fullHeight = window.innerHeight;
      
      canvas.width = fullWidth;
      canvas.height = fullHeight;
      canvas.setAttribute('width', fullWidth.toString());
      canvas.setAttribute('height', fullHeight.toString());
      canvas.offsetHeight; // Force reflow
      
      console.log('🎨 Final canvas dimensions before physics bounds:', canvas.width, 'x', canvas.height);
      
      // Use a larger scale for physics world to give particles more room to move
      const scale = 0.2; // Larger scale = more room for particles to move
      const bounds = {
        left: -canvas.width * scale / 2,
        right: canvas.width * scale / 2,
        top: -canvas.height * scale / 2,
        bottom: canvas.height * scale / 2
      };
      
      // Store the physics bounds for consistent containment
      this.physicsBounds = bounds;
      
      console.log('🎨 Physics bounds (scaled):', bounds);
      console.log('🎨 Canvas dimensions for bounds:', canvas.width, 'x', canvas.height);
      
      // Add invisible boundaries with proper positioning (scaled)
      // Make boundaries much thicker and positioned more aggressively
      const wallThickness = 200 * scale; // Much thicker walls
      const leftWall = Matter.Bodies.rectangle(bounds.left - wallThickness, 0, wallThickness * 2, canvas.height * scale * 2, { 
        isStatic: true,
        render: { fillStyle: 'transparent' }
      });
      const rightWall = Matter.Bodies.rectangle(bounds.right + wallThickness, 0, wallThickness * 2, canvas.height * scale * 2, { 
        isStatic: true,
        render: { fillStyle: 'transparent' }
      });
      const topWall = Matter.Bodies.rectangle(0, bounds.top - wallThickness, canvas.width * scale * 2, wallThickness * 2, { 
        isStatic: true,
        render: { fillStyle: 'transparent' }
      });
      const bottomWall = Matter.Bodies.rectangle(0, bounds.bottom + wallThickness, canvas.width * scale * 2, wallThickness * 2, { 
        isStatic: true,
        render: { fillStyle: 'transparent' }
      });
      
      Matter.Composite.add(this.physics.world, [leftWall, rightWall, topWall, bottomWall]);
      console.log('🎨 Added physics boundaries for particle containment');
      console.log('🎨 Wall positions - Left:', bounds.left - wallThickness, 'Right:', bounds.right + wallThickness, 'Top:', bounds.top - wallThickness, 'Bottom:', bounds.bottom + wallThickness);

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        this.handleResize(canvas);
      });
      resizeObserver.observe(canvas);

      console.log('🎨 WebGL Scene Manager initialized successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Failed to initialize WebGL Scene Manager:', error);
      return Promise.reject(error);
    }
  }

  private handleResize(canvas: HTMLCanvasElement): void {
    // Force canvas to full viewport dimensions
    const fullWidth = window.innerWidth;
    const fullHeight = window.innerHeight;
    
    canvas.width = fullWidth;
    canvas.height = fullHeight;
    canvas.setAttribute('width', fullWidth.toString());
    canvas.setAttribute('height', fullHeight.toString());
    canvas.style.setProperty('width', '100vw', 'important');
    canvas.style.setProperty('height', '100vh', 'important');
    
    // Force reflow
    canvas.offsetHeight;
    
    const width = fullWidth; // Use full viewport dimensions
    const height = fullHeight;
    
    console.log('🎨 Canvas resized to:', width, 'x', height);
    console.log('🎨 Canvas style size:', canvas.style.width, 'x', canvas.style.height);
    console.log('🎨 Canvas attributes after resize:', canvas.getAttribute('width'), 'x', canvas.getAttribute('height'));
    console.log('🎨 Canvas computed style:', getComputedStyle(canvas).width, 'x', getComputedStyle(canvas).height);
    
    this.renderer.setSize(width, height);
    this.camera.perspective({
      aspect: width / height
    });
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
    
    console.log('🎬 WebGL Scene Manager started');
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('⏹️ WebGL Scene Manager stopped');
  }

  private animate(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update physics with capped delta time (max 16.667ms for 60fps)
    const cappedDeltaTime = Math.min(deltaTime, 16.667);
    Matter.Engine.update(this.physics, cappedDeltaTime);

    // Update visual objects
    this.updatePhysicsObjects();
    
    // Energy boost system - periodically boost particle energy
    this.energyBoostTimer += cappedDeltaTime;
    if (this.energyBoostTimer >= this.energyBoostInterval) {
      this.boostParticleEnergy();
      this.energyBoostTimer = 0;
    }
    
    // Aggressive containment check - run every 60 frames (about once per second)
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.aggressiveContainmentCheck();
    }

    // Render scene
    this.renderer.render({ scene: this.scene, camera: this.camera });

    // Performance monitoring
    this.updatePerformance(deltaTime);

    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private updatePhysicsObjects(): void {
    // Use the stored physics bounds for consistent containment
    if (!this.physicsBounds) {
      console.warn('🎨 No physics bounds available for containment');
      return;
    }
    
    const bounds = this.physicsBounds;
    
    this.physicsObjects.forEach(obj => {
      if (obj.body && obj.mesh) {
        // Check if particle is outside bounds and bring it back with velocity reversal
        let wasContained = false;
        
        if (obj.body.position.x < bounds.left) {
          Matter.Body.setPosition(obj.body, { x: bounds.left + 2, y: obj.body.position.y });
          Matter.Body.setVelocity(obj.body, { x: Math.abs(obj.body.velocity.x), y: obj.body.velocity.y });
          wasContained = true;
        } else if (obj.body.position.x > bounds.right) {
          Matter.Body.setPosition(obj.body, { x: bounds.right - 2, y: obj.body.position.y });
          Matter.Body.setVelocity(obj.body, { x: -Math.abs(obj.body.velocity.x), y: obj.body.velocity.y });
          wasContained = true;
        }
        
        if (obj.body.position.y < bounds.top) {
          Matter.Body.setPosition(obj.body, { x: obj.body.position.x, y: bounds.top + 2 });
          Matter.Body.setVelocity(obj.body, { x: obj.body.velocity.x, y: Math.abs(obj.body.velocity.y) });
          wasContained = true;
        } else if (obj.body.position.y > bounds.bottom) {
          Matter.Body.setPosition(obj.body, { x: obj.body.position.x, y: bounds.bottom - 2 });
          Matter.Body.setVelocity(obj.body, { x: obj.body.velocity.x, y: -Math.abs(obj.body.velocity.y) });
          wasContained = true;
        }
        
        // Debug: Log when particles are contained
        if (wasContained) {
          console.log('🎯 Contained particle at position:', obj.body.position.x, obj.body.position.y);
        }
        
        // Update mesh position from physics body
        obj.mesh.position.x = obj.body.position.x * 0.2; // Scale down for visual (match physics scale)
        obj.mesh.position.y = obj.body.position.y * 0.2;
        obj.mesh.rotation.z = obj.body.angle;
      }
    });
  }

  private updatePerformance(deltaTime: number): void {
    this.frameCount++;
    
    // Calculate FPS every 60 frames
    if (this.frameCount % 60 === 0) {
      this.fps = 1000 / deltaTime;
      
      // Adjust quality based on performance
      if (this.fps < 30 && this.qualityLevel > 0.5) {
        this.qualityLevel = Math.max(0.5, this.qualityLevel - 0.1);
        console.log(`📉 Performance drop detected, reducing quality to ${this.qualityLevel}`);
      } else if (this.fps > 55 && this.qualityLevel < 1.0) {
        this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05);
        console.log(`📈 Performance good, increasing quality to ${this.qualityLevel}`);
      }
    }
  }

  updateAudioData(data: AudioData): void {
    this.audioData = data;
  }

  // Physics object management
  addPhysicsObject(obj: PhysicsObject): void {
    this.physicsObjects.push(obj);
    Matter.Composite.add(this.physics.world, obj.body);
    this.scene.addChild(obj.mesh);
  }

  removePhysicsObject(obj: PhysicsObject): void {
    const index = this.physicsObjects.indexOf(obj);
    if (index > -1) {
      this.physicsObjects.splice(index, 1);
      Matter.Composite.remove(this.physics.world, obj.body);
      this.scene.removeChild(obj.mesh);
    }
  }

  // Utility methods
  getPerformanceStats() {
    return {
      fps: Math.round(this.fps),
      qualityLevel: this.qualityLevel,
      objectCount: this.physicsObjects.length
    };
  }

  getGLContext(): WebGLRenderingContext | null {
    return this.renderer?.gl || null;
  }
  
  getCanvasWidth(): number {
    // Return the actual canvas width, not the renderer canvas width
    return this.canvas?.width || 0;
  }
  
  getCanvasHeight(): number {
    // Return the actual canvas height, not the renderer canvas height
    return this.canvas?.height || 0;
  }
  
  private boostParticleEnergy(): void {
    // Boost energy of slow particles only to maintain smooth movement
    this.physicsObjects.forEach(obj => {
      if (obj.body && obj.body.velocity) {
        const speed = Math.sqrt(obj.body.velocity.x ** 2 + obj.body.velocity.y ** 2);
        
        // Only boost particles that are moving very slowly
        if (speed < 2) {
          const boostMultiplier = 3; // Reduced intensity
          
          Matter.Body.setVelocity(obj.body, {
            x: obj.body.velocity.x + (Math.random() - 0.5) * boostMultiplier,
            y: obj.body.velocity.y + (Math.random() - 0.5) * boostMultiplier
          });
        }
      }
    });
    console.log('⚡ Boosted slow particle energy');
  }
  
  private aggressiveContainmentCheck(): void {
    // Use the stored physics bounds for consistent containment
    if (!this.physicsBounds) {
      console.warn('🎨 No physics bounds available for aggressive containment');
      return;
    }
    
    const bounds = this.physicsBounds;
    
    let containedCount = 0;
    this.physicsObjects.forEach(obj => {
      if (obj.body) {
        let needsContainment = false;
        
        // Check if particle is way outside bounds
        if (obj.body.position.x < bounds.left - 10 || obj.body.position.x > bounds.right + 10 ||
            obj.body.position.y < bounds.top - 10 || obj.body.position.y > bounds.bottom + 10) {
          
          // Teleport particle back to center of bounds
          Matter.Body.setPosition(obj.body, {
            x: (bounds.left + bounds.right) / 2,
            y: (bounds.top + bounds.bottom) / 2
          });
          
          // Give it a random velocity
          Matter.Body.setVelocity(obj.body, {
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 4
          });
          
          needsContainment = true;
          containedCount++;
        }
        
        if (needsContainment) {
          console.log('🚨 Aggressively contained runaway particle');
        }
      }
    });
    
    if (containedCount > 0) {
      console.log('🚨 Aggressive containment: brought back', containedCount, 'particles');
    }
  }

  destroy(): void {
    this.stop();
    
    // Clean up physics objects
    this.physicsObjects.forEach(obj => {
      this.scene.removeChild(obj.mesh);
    });
    this.physicsObjects = [];
    
    // Clean up physics engine
    Matter.Engine.clear(this.physics);
    
    console.log('🧹 WebGL Scene Manager destroyed');
  }
}
