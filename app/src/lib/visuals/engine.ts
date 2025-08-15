import { Renderer, Camera, Program, Mesh, Plane, Box, Sphere, Transform } from 'ogl';

export interface VisualScene {
  id: string;
  name: string;
  init(gl: any): void; // Using any for OGL context compatibility
  update(deltaTime: number, audioLevel?: number, serendipity?: number): void;
  destroy(): void;
  getScene(): Transform;
}

export interface VisualEngineOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  audioLevel?: number;
  serendipity?: number;
}

export class VisualEngine {
  private renderer: Renderer | null = null;
  private camera: Camera | null = null;
  private scenes: Map<string, VisualScene> = new Map();
  private currentScene: VisualScene | null = null;
  private overlayScene: VisualScene | null = null; // New overlay scene
  private container: HTMLElement;
  private width: number;
  private height: number;
  private audioLevel: number = 0;
  private serendipity: number = 0.1;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsStartTime: number = 0;
  private currentFps: number = 0;

  constructor(options: VisualEngineOptions) {
    this.container = options.container;
    this.width = options.width || window.innerWidth;
    this.height = options.height || window.innerHeight;
    this.audioLevel = options.audioLevel || 0;
    this.serendipity = options.serendipity || 0.1;
  }

  async init(): Promise<boolean> {
    try {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) {
        console.warn('WebGL not supported, falling back to basic visuals');
        return false;
      }

      // Create OGL renderer with performance optimizations
      this.renderer = new Renderer({
        canvas,
        width: this.width,
        height: this.height,
        alpha: true,
        premultipliedAlpha: false,
        antialias: false, // Disable antialiasing for better performance
        dpr: Math.min(window.devicePixelRatio, 1.5), // Lower DPR for better performance
        powerPreference: 'high-performance', // Request high-performance GPU
      });

      // Create camera
      this.camera = new Camera(this.renderer.gl);
      this.camera.position.z = 5;

      // Add canvas to container
      this.container.appendChild(this.renderer.gl.canvas);

      // Handle resize
      window.addEventListener('resize', this.handleResize.bind(this));

      console.log('Visual engine initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize visual engine:', error);
      return false;
    }
  }

  private handleResize(): void {
    if (!this.renderer) return;

    // Use full viewport dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);
    
    if (this.camera) {
      this.camera.perspective({
        aspect: this.width / this.height,
      });
    }
    
    console.log('Visual engine resized to:', this.width, 'x', this.height);
  }

  addScene(scene: VisualScene): void {
    console.log('VisualEngine: Adding scene:', scene.name, 'with ID:', scene.id);
    this.scenes.set(scene.id, scene);
    if (this.renderer) {
      console.log('VisualEngine: Initializing scene with renderer');
      scene.init(this.renderer.gl);
    } else {
      console.log('VisualEngine: Renderer not ready, scene will be initialized later');
    }
    console.log('VisualEngine: Available scenes after adding:', Array.from(this.scenes.keys()));
  }

  setScene(sceneId: string): boolean {
    console.log('VisualEngine: Attempting to set scene:', sceneId);
    console.log('VisualEngine: Available scenes:', Array.from(this.scenes.keys()));
    
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      console.warn(`Scene ${sceneId} not found`);
      console.log('VisualEngine: Available scenes are:', Array.from(this.scenes.keys()));
      return false;
    }

    this.currentScene = scene;
    console.log(`Switched to scene: ${scene.name} (ID: ${sceneId})`);
    console.log('Available scenes:', Array.from(this.scenes.keys()));
    return true;
  }

  updateAudioLevel(level: number): void {
    this.audioLevel = Math.max(0, Math.min(1, level));
    // Only log audio updates occasionally to reduce console spam
    if (Math.random() < 0.01) { // ~1% chance = much less frequent
      console.log('VisualEngine audio level updated:', this.audioLevel.toFixed(3), 'Current scene:', this.currentScene?.name);
    }
  }

  updateSerendipity(level: number): void {
    this.serendipity = Math.max(0, Math.min(1, level));
  }

  start(): void {
    if (!this.renderer || !this.camera) {
      console.error('Visual engine not initialized');
      return;
    }

    this.lastTime = performance.now();
    this.animate();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(): void {
    if (!this.renderer || !this.camera) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30); // Cap at 30fps minimum, convert to seconds
    this.lastTime = currentTime;

    // FPS monitoring
    this.frameCount++;
    if (this.frameCount === 1) {
      this.fpsStartTime = currentTime;
    } else if (this.frameCount % 60 === 0) {
      const fps = 60 / ((currentTime - this.fpsStartTime) / 1000);
      this.currentFps = Math.round(fps);
      if (this.currentFps < 30) {
        console.warn(`Low FPS detected: ${this.currentFps}. Consider reducing visual complexity.`);
      }
      this.frameCount = 0;
    }

    // Update current scene
    if (this.currentScene) {
      this.currentScene.update(deltaTime, this.audioLevel, this.serendipity);
    }

    // Update overlay scene if present
    if (this.overlayScene) {
      this.overlayScene.update(deltaTime, this.audioLevel, this.serendipity);
    }

    // Only render if we have a valid scene
    if (this.currentScene && this.currentScene.getScene()) {
      this.renderer.render({
        scene: this.currentScene.getScene(),
        camera: this.camera,
      });
    } else {
      // Clear the canvas with transparent background if no scene
      const gl = this.renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Render overlay scene on top if present
    if (this.overlayScene && this.overlayScene.getScene()) {
      // Enable blending for overlay
      const gl = this.renderer.gl;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      this.renderer.render({
        scene: this.overlayScene.getScene(),
        camera: this.camera,
      });
      
      // Disable blending after overlay render
      gl.disable(gl.BLEND);
    }

    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  destroy(): void {
    this.stop();

    // Destroy all scenes
    this.scenes.forEach(scene => scene.destroy());
    this.scenes.clear();

    // Clean up renderer
    if (this.renderer) {
      this.renderer.gl.canvas.remove();
      this.renderer = null;
    }

    this.camera = null;
    this.currentScene = null;
  }

  getRenderer(): Renderer | null {
    return this.renderer;
  }

  getCurrentScene(): VisualScene | null {
    return this.currentScene;
  }

  setOverlayScene(sceneId: string): boolean {
    console.log('VisualEngine: Setting overlay scene:', sceneId);
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      console.warn(`Overlay scene ${sceneId} not found`);
      return false;
    }

    this.overlayScene = scene;
    console.log(`Overlay scene set to: ${scene.name} (ID: ${sceneId})`);
    return true;
  }

  clearOverlayScene(): void {
    console.log('VisualEngine: Clearing overlay scene');
    this.overlayScene = null;
  }

  getOverlayScene(): VisualScene | null {
    return this.overlayScene;
  }
}