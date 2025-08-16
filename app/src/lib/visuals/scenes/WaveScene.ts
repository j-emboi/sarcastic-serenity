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
        
        // DRAMATIC wave animation with MORE waves and FASTER movement
        float wave1 = sin(vTime * 20.0 + uv.x * 15.0) * 0.5 + 0.5;
        float wave2 = sin(vTime * 15.0 + uv.x * 20.0) * 0.4 + 0.5;
        float wave3 = sin(vTime * 25.0 + uv.y * 12.0) * 0.5 + 0.5;
        float wave4 = sin(vTime * 12.0 + uv.x * 18.0 + uv.y * 15.0) * 0.3 + 0.5;
        float wave5 = sin(vTime * 18.0 + uv.x * 25.0) * 0.4 + 0.5;
        float wave6 = sin(vTime * 22.0 + uv.y * 20.0) * 0.3 + 0.5;
        float wave7 = sin(vTime * 16.0 + uv.x * 12.0 + uv.y * 18.0) * 0.4 + 0.5;
        float wave8 = sin(vTime * 30.0 + uv.x * 30.0) * 0.2 + 0.5;
        
        // Combine ALL waves for maximum dramatic effect
        float waveHeight = (wave1 + wave2 + wave3 + wave4 + wave5 + wave6 + wave7 + wave8) / 8.0;
        
        // SUPER BRIGHT, HIGH CONTRAST colors
        vec3 color1 = vec3(0.0, 1.0, 1.0);  // Pure cyan
        vec3 color2 = vec3(0.0, 0.0, 1.0);  // Pure blue
        vec3 color3 = vec3(1.0, 1.0, 1.0);  // Pure white
        vec3 color4 = vec3(0.0, 0.5, 1.0);  // Sky blue
        
        // Create dramatic color changes with high contrast
        vec3 color = mix(color1, color2, waveHeight);
        color = mix(color, color3, sin(vTime * 8.0 + uv.y * 10.0) * 0.5 + 0.5);
        color = mix(color, color4, sin(vTime * 12.0 + uv.x * 15.0) * 0.5 + 0.5);
        
        // Add INTENSE pulsing effect
        color += vec3(0.5) * sin(vTime * 15.0) * 0.5 + 0.5;
        
        // Add moving stripes that are very obvious at full viewport
        color += vec3(0.4) * sin(vTime * 25.0 + uv.x * 25.0);
        color += vec3(0.3) * sin(vTime * 20.0 + uv.y * 20.0);
        
        // Add diagonal moving patterns
        color += vec3(0.2) * sin(vTime * 18.0 + uv.x * 20.0 + uv.y * 15.0);
        
        // Add more complex wave patterns
        color += vec3(0.3) * sin(vTime * 14.0 + uv.x * 22.0) * sin(vTime * 10.0 + uv.y * 18.0);
        color += vec3(0.2) * sin(vTime * 16.0 + uv.x * 28.0) * cos(vTime * 12.0 + uv.y * 25.0);
        
        // Audio reactivity - EXTREMELY obvious
        if (vAudioLevel > 0.0) {
          color += vec3(0.8) * vAudioLevel * sin(vTime * 35.0 + uv.x * 30.0);
          color += vec3(0.6) * vAudioLevel * sin(vTime * 25.0 + uv.y * 25.0);
        }
        
        // Ensure colors are bright and saturated
        color = clamp(color, 0.0, 1.0);
        
        // Add some brightness boost
        color = color * 1.2;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  destroy(): void {
    super.destroy();
  }
}
