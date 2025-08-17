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
  private physics: Matter.Engine;
  private physicsObjects: PhysicsObject[] = [];
  private isRunning = false;
  private animationFrameId: number | null = null;
  
  // Performance monitoring
  private frameCount = 0;
  private lastTime = 0;
  private fps = 60;
  private qualityLevel = 1.0; // 1.0 = full quality, 0.5 = half quality
  
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
      gravity: { x: 0, y: -0.5, scale: 0.001 }
    });
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      console.log('🎨 Initializing WebGL Scene Manager...');
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('Canvas client dimensions:', canvas.clientWidth, 'x', canvas.clientHeight);

      // Ensure canvas has proper dimensions
      const targetWidth = canvas.clientWidth || window.innerWidth;
      const targetHeight = canvas.clientHeight || window.innerHeight;
      
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        // Also update the style dimensions to match
        canvas.style.width = targetWidth + 'px';
        canvas.style.height = targetHeight + 'px';
        console.log('🎨 Updated canvas dimensions to:', canvas.width, 'x', canvas.height);
        console.log('🎨 Updated canvas style to:', canvas.style.width, 'x', canvas.style.height);
      }

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
      this.camera.position.z = 5;
      console.log('🎨 Scene and Camera created successfully');

      // Skip background for now - focus on basic WebGL functionality
      console.log('🎨 Skipping background creation for now');

      // Set up renderer
      this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      // OGL renderer doesn't have setClearColor - background is handled by the scene

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
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
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
