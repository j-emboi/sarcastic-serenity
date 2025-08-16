import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class WaveScene extends BaseScene {
  id = 'waves';
  name = 'Ocean Waves';

  private waveProgram: Program | null = null;
  private waveMesh: Mesh | null = null;
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing OGL WaveScene with FULL VIEWPORT dramatic animation');
    
    // Create wave shader program
    this.waveProgram = new Program(gl, {
      vertex: this.createWaveVertexShader(),
      fragment: this.createWaveFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] }
      }
    });

    this.addProgram(this.waveProgram);

    // Create full-screen quad for wave rendering - ensure it covers entire viewport
    // Use larger size to ensure full coverage
    const geometry = new Plane(gl, { width: 4, height: 4 });
    
    this.waveMesh = new Mesh(gl, {
      geometry,
      program: this.waveProgram
    });

    this.addMesh(this.waveMesh);
    
    console.log('OGL WaveScene initialization complete - full viewport coverage with 4x4 plane');
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.waveProgram) {
      this.waveProgram.uniforms.time.value = this.time * 0.001; // Convert to seconds
      this.waveProgram.uniforms.audioLevel.value = audioLevel;
      this.waveProgram.uniforms.serendipity.value = serendipity;
      
      // Debug logging every second
      if (Math.floor(this.time / 1000) % 1 === 0) {
        console.log('WaveScene update:', {
          time: this.time * 0.001,
          audioLevel,
          serendipity,
          deltaTime,
          'uniform_time': this.waveProgram.uniforms.time.value
        });
      }
    }
  }

  private createWaveVertexShader(): string {
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

  private createWaveFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vTime;
      varying float vAudioLevel;
      varying float vSerendipity;
      
      void main() {
        vec2 uv = vUv;
        
        // Simple moving ocean waves
        float wave1 = sin(vTime * 2.0 + uv.x * 8.0) * 0.5 + 0.5;
        float wave2 = sin(vTime * 1.5 + uv.x * 12.0) * 0.4 + 0.5;
        float wave3 = sin(vTime * 2.5 + uv.y * 6.0) * 0.3 + 0.5;
        
        // Combine waves
        float waveHeight = (wave1 + wave2 + wave3) / 3.0;
        
        // Ocean colors
        vec3 deepBlue = vec3(0.0, 0.3, 0.7);
        vec3 oceanBlue = vec3(0.0, 0.5, 0.9);
        vec3 lightBlue = vec3(0.4, 0.7, 1.0);
        
        // Create ocean color based on wave height
        vec3 color = mix(deepBlue, oceanBlue, waveHeight);
        color = mix(color, lightBlue, uv.y * 0.5);
        
        // Add some movement to the color
        color += vec3(0.1) * sin(vTime * 1.0 + uv.x * 10.0);
        color += vec3(0.05) * sin(vTime * 0.8 + uv.y * 8.0);
        
        // Ensure colors are bright and visible
        color = clamp(color, 0.0, 1.0);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  destroy(): void {
    super.destroy();
  }
}
