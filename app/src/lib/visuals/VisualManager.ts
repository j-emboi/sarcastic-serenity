import { WebGLSceneManager, type AudioData } from './WebGLSceneManager';
import { PhysicsSceneFactory } from './PhysicsSceneFactory';
import { AudioVisualBridge } from './AudioVisualBridge';

export type SceneType = 'particles' | 'fluid' | 'softBody' | 'mixed';

export interface VisualConfig {
  sceneType: SceneType;
  particleCount: number;
  audioReactivity: boolean;
  quality: 'low' | 'medium' | 'high';
}

export class VisualManager {
  private sceneManager: WebGLSceneManager;
  private audioBridge: AudioVisualBridge;
  private canvas: HTMLCanvasElement | null = null;
  private isInitialized = false;
  private currentScene: SceneType = 'particles';
  private config: VisualConfig;

  constructor(config: Partial<VisualConfig> = {}) {
    this.sceneManager = new WebGLSceneManager();
    this.audioBridge = new AudioVisualBridge();
    this.config = {
      sceneType: 'particles',
      particleCount: 30,
      audioReactivity: true,
      quality: 'medium',
      ...config
    };
  }

  async init(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      this.canvas = canvas;
      
      // Initialize WebGL scene manager
      await this.sceneManager.init(canvas);
      
      // Initialize audio bridge
      await this.audioBridge.connect();
      
      this.isInitialized = true;
      console.log('🎨 Visual Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Visual Manager:', error);
      return false;
    }
  }

  start(): void {
    if (!this.isInitialized) {
      console.warn('⚠️ Visual Manager not initialized, cannot start');
      return;
    }

    this.sceneManager.start();
    console.log('🎬 Visual Manager started');
  }

  stop(): void {
    this.sceneManager.stop();
    console.log('⏹️ Visual Manager stopped');
  }

  setScene(sceneType: SceneType): void {
    if (!this.isInitialized) return;

    this.currentScene = sceneType;
    this.clearScene();
    this.createScene(sceneType);
    
    console.log(`🎭 Scene changed to: ${sceneType}`);
  }

  private clearScene(): void {
    // Clear all existing physics objects
    const stats = this.sceneManager.getPerformanceStats();
    for (let i = 0; i < stats.objectCount; i++) {
      // This is a simplified approach - in practice, we'd track objects better
      // For now, we'll recreate the scene entirely
    }
  }

  private createScene(sceneType: SceneType): void {
    if (!this.canvas) return;

    const bounds = {
      x: -this.canvas.width / 2,
      y: -this.canvas.height / 2,
      width: this.canvas.width,
      height: this.canvas.height
    };

    // Create boundaries
    const leftBoundary = PhysicsSceneFactory.createBoundary(
      bounds.x - 50, bounds.y + bounds.height / 2, 100, bounds.height
    );
    const rightBoundary = PhysicsSceneFactory.createBoundary(
      bounds.x + bounds.width + 50, bounds.y + bounds.height / 2, 100, bounds.height
    );
    const topBoundary = PhysicsSceneFactory.createBoundary(
      bounds.x + bounds.width / 2, bounds.y - 50, bounds.width, 100
    );
    const bottomBoundary = PhysicsSceneFactory.createBoundary(
      bounds.x + bounds.width / 2, bounds.y + bounds.height + 50, bounds.width, 100
    );

    // Add boundaries to physics world
    // Note: We'll need to modify the scene manager to handle boundaries properly

    // Create particles based on scene type
    let particles;
    switch (sceneType) {
      case 'fluid':
        particles = PhysicsSceneFactory.createParticleSystem(
          this.config.particleCount,
          bounds,
          'fluid'
        );
        break;
      case 'softBody':
        particles = PhysicsSceneFactory.createParticleSystem(
          this.config.particleCount,
          bounds,
          'softBody'
        );
        break;
      case 'mixed':
        // Create a mix of different particle types
        const fluidParticles = PhysicsSceneFactory.createParticleSystem(
          Math.floor(this.config.particleCount / 3),
          bounds,
          'fluid'
        );
        const softParticles = PhysicsSceneFactory.createParticleSystem(
          Math.floor(this.config.particleCount / 3),
          bounds,
          'softBody'
        );
        const regularParticles = PhysicsSceneFactory.createParticleSystem(
          this.config.particleCount - fluidParticles.length - softParticles.length,
          bounds,
          'particle'
        );
        particles = [...fluidParticles, ...softParticles, ...regularParticles];
        break;
      default:
        particles = PhysicsSceneFactory.createParticleSystem(
          this.config.particleCount,
          bounds,
          'particle'
        );
        break;
    }

    // Add particles to scene
    particles.forEach(particle => {
      this.sceneManager.addPhysicsObject(particle);
    });
  }

  updateAudioData(audioData: AudioData): void {
    if (this.config.audioReactivity) {
      this.sceneManager.updateAudioData(audioData);
    }
  }

  connectToAudioContext(audioContext: AudioContext, sourceNode: AudioNode): boolean {
    return this.audioBridge.connectToAudioContext(audioContext, sourceNode);
  }

  getPerformanceStats() {
    return this.sceneManager.getPerformanceStats();
  }

  setConfig(config: Partial<VisualConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Recreate scene if needed
    if (this.isInitialized && config.sceneType) {
      this.setScene(config.sceneType);
    }
  }

  destroy(): void {
    this.stop();
    this.audioBridge.disconnect();
    this.sceneManager.destroy();
    this.isInitialized = false;
    console.log('🧹 Visual Manager destroyed');
  }
}
