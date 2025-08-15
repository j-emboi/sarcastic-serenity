import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class WaveScene extends BaseScene {
  id = 'waves';
  name = 'Ocean Waves';

  private waveProgram: Program | null = null;
  private waveMesh: Mesh | null = null;
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing OGL WaveScene with DRAMATIC animation');
    
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

    // Create full-screen quad for wave rendering
    const geometry = new Plane(gl, { width: 2, height: 2 });
    
    this.waveMesh = new Mesh(gl, {
      geometry,
      program: this.waveProgram
    });

    this.addMesh(this.waveMesh);
    
    console.log('OGL WaveScene initialization complete');
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
        
        // DRAMATIC wave animation - much faster and more visible
        float wave1 = sin(vTime * 5.0 + uv.x * 8.0) * 0.5 + 0.5;
        float wave2 = sin(vTime * 3.0 + uv.x * 12.0) * 0.3 + 0.5;
        float wave3 = sin(vTime * 7.0 + uv.y * 6.0) * 0.4 + 0.5;
        
        // Combine waves for dramatic effect
        float waveHeight = (wave1 + wave2 + wave3) / 3.0;
        
        // Very bright, contrasting colors
        vec3 color1 = vec3(0.0, 0.8, 1.0);  // Bright cyan
        vec3 color2 = vec3(0.0, 0.2, 0.8);  // Deep blue
        vec3 color3 = vec3(0.5, 0.9, 1.0);  // Light blue
        
        // Create dramatic color changes
        vec3 color = mix(color1, color2, waveHeight);
        color = mix(color, color3, sin(vTime * 2.0 + uv.y * 4.0) * 0.5 + 0.5);
        
        // Add pulsing effect
        color += vec3(0.3) * sin(vTime * 4.0) * 0.5 + 0.5;
        
        // Add moving stripes
        color += vec3(0.2) * sin(vTime * 6.0 + uv.x * 15.0);
        
        // Audio reactivity - very obvious
        if (vAudioLevel > 0.0) {
          color += vec3(0.5) * vAudioLevel * sin(vTime * 10.0 + uv.x * 25.0);
        }
        
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
