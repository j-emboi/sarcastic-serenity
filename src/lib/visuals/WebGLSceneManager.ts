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
  private energyBoostInterval = 1000; // Boost every 1 second
  
  // Audio reactivity
  private audioData: AudioData = {
    frequency: new Array(64).fill(0),
    amplitude: 0,
    bass: 0,
    mid: 0,
    treble: 0
  };

  constructor() {
    this.physics = Matter.Engine.create({
      gravity: { x: 0, y: -0.1, scale: 0.001 }  // Much lighter gravity
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
      
      // Scale the bounds to match the visual scaling (0.01) used in updatePhysicsObjects
      const scale = 0.01;
      const bounds = {
        left: -canvas.width * scale / 2,
        right: canvas.width * scale / 2,
        top: -canvas.height * scale / 2,
        bottom: canvas.height * scale / 2
      };
      
      console.log('🎨 Physics bounds (scaled):', bounds);
      console.log('🎨 Canvas dimensions for bounds:', canvas.width, 'x', canvas.height);
      
      // Add invisible boundaries with proper positioning (scaled)
      const wallThickness = 50 * scale;
      const leftWall = Matter.Bodies.rectangle(bounds.left - wallThickness, 0, wallThickness * 2, canvas.height * scale * 2, { isStatic: true });
      const rightWall = Matter.Bodies.rectangle(bounds.right + wallThickness, 0, wallThickness * 2, canvas.height * scale * 2, { isStatic: true });
      const topWall = Matter.Bodies.rectangle(0, bounds.top - wallThickness, canvas.width * scale * 2, wallThickness * 2, { isStatic: true });
      const bottomWall = Matter.Bodies.rectangle(0, bounds.bottom + wallThickness, canvas.width * scale * 2, wallThickness * 2, { isStatic: true });
      
      Matter.Composite.add(this.physics.world, [leftWall, rightWall, topWall, bottomWall]);
      console.log('🎨 Added physics boundaries for particle containment');

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

    // Render scene
    this.renderer.render({ scene: this.scene, camera: this.camera });

    // Performance monitoring
    this.updatePerformance(deltaTime);

    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private updatePhysicsObjects(): void {
    this.physicsObjects.forEach(obj => {
      if (obj.body && obj.mesh) {
        // Update mesh position from physics body
        obj.mesh.position.x = obj.body.position.x * 0.01; // Scale down for visual
        obj.mesh.position.y = obj.body.position.y * 0.01;
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
    // Boost energy of ALL particles to maintain continuous movement
    this.physicsObjects.forEach(obj => {
      if (obj.body && obj.body.velocity) {
        const speed = Math.sqrt(obj.body.velocity.x ** 2 + obj.body.velocity.y ** 2);
        
        // Always add some energy, more if moving slowly
        const boostMultiplier = speed < 3 ? 6 : 2;
        
        Matter.Body.setVelocity(obj.body, {
          x: obj.body.velocity.x + (Math.random() - 0.5) * boostMultiplier,
          y: obj.body.velocity.y + (Math.random() - 0.5) * boostMultiplier
        });
      }
    });
    console.log('⚡ Boosted particle energy');
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
