import { MarblingScene } from './scenes/MarblingScene';
import { BlobScene } from './scenes/BlobScene';
import { ParticleScene } from './scenes/ParticleScene';
import { BreathingScene } from './scenes/BreathingScene';
import { FireworksScene } from './scenes/FireworksScene';
import { WaveScene } from './scenes/WaveScene';
import { CosmicScene } from './scenes/CosmicScene';
import { AuroraScene } from './scenes/AuroraScene';
import { LavaLampScene } from './scenes/LavaLampScene';
import { ZenGardenScene } from './scenes/ZenGardenScene';
import type { VisualScene } from './engine';

export class SceneManager {
  private scenes: Map<string, VisualScene> = new Map();
  private currentScene: VisualScene | null = null;
  private gl: any;

  constructor(gl: any) {
    this.gl = gl;
    this.initializeScenes();
  }

  private initializeScenes(): void {
    console.log('Initializing visual scenes...');
    
    // Create all available scenes
    const marblingScene = new MarblingScene();
    const blobScene = new BlobScene();
    const particleScene = new ParticleScene();
    const breathingScene = new BreathingScene();
    const fireworksScene = new FireworksScene();
    const waveScene = new WaveScene();
    const cosmicScene = new CosmicScene();
    const auroraScene = new AuroraScene();
    const lavaLampScene = new LavaLampScene();
    const zenGardenScene = new ZenGardenScene();

    // Initialize each scene
    marblingScene.init(this.gl);
    blobScene.init(this.gl);
    particleScene.init(this.gl);
    breathingScene.init(this.gl);
    fireworksScene.init(this.gl);
    waveScene.init(this.gl);
    cosmicScene.init(this.gl);
    auroraScene.init(this.gl);
    lavaLampScene.init(this.gl);
    zenGardenScene.init(this.gl);

    // Add scenes to map
    this.scenes.set(marblingScene.id, marblingScene);
    this.scenes.set(blobScene.id, blobScene);
    this.scenes.set(particleScene.id, particleScene);
    this.scenes.set(breathingScene.id, breathingScene);
    this.scenes.set(fireworksScene.id, fireworksScene);
    this.scenes.set(waveScene.id, waveScene);
    this.scenes.set(cosmicScene.id, cosmicScene);
    this.scenes.set(auroraScene.id, auroraScene);
    this.scenes.set(lavaLampScene.id, lavaLampScene);
    this.scenes.set(zenGardenScene.id, zenGardenScene);

    console.log('Scenes initialized:', Array.from(this.scenes.keys()));
  }

  getAvailableScenes(): VisualScene[] {
    return Array.from(this.scenes.values());
  }

  getCurrentScene(): VisualScene | null {
    return this.currentScene;
  }

  switchToScene(sceneId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      console.warn(`Scene not found: ${sceneId}`);
      return false;
    }

    console.log(`Switching to scene: ${sceneId}`);
    this.currentScene = scene;
    return true;
  }

  updateAudioLevel(audioLevel: number): void {
    if (this.currentScene) {
      // Update the current scene with audio level (using 0 for deltaTime and default serendipity)
      this.currentScene.update(0, audioLevel, 0.1);
      // Only log occasionally to reduce console spam
      if (Math.random() < 0.01) { // ~1% chance = much less frequent
        console.log('SceneManager updating audio level:', audioLevel.toFixed(3));
      }
    }
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime, audioLevel, serendipity);
    }
  }

  getScene(): any {
    return this.currentScene?.getScene() || null;
  }

  destroy(): void {
    this.scenes.forEach(scene => {
      scene.destroy();
    });
    this.scenes.clear();
    this.currentScene = null;
  }
}
