import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class MarblingScene extends BaseScene {
  id = 'marbling';
  name = 'Marbling';

  private marblingProgram: Program | null = null;
  private marblingMesh: Mesh | null = null;

  init(gl: any): void {
    // Create marbling shader program
    this.marblingProgram = new Program(gl, {
      vertex: this.createMarblingVertexShader(),
      fragment: this.createMarblingFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] }
      }
    });

    this.addProgram(this.marblingProgram);

    // Create plane geometry for marbling effect
    const geometry = new Plane(gl, { width: 2, height: 2 });
    
    this.marblingMesh = new Mesh(gl, {
      geometry,
      program: this.marblingProgram
    });

    this.addMesh(this.marblingMesh);
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.marblingProgram) {
      this.marblingProgram.uniforms.time.value = this.time;
      this.marblingProgram.uniforms.audioLevel.value = audioLevel;
      this.marblingProgram.uniforms.serendipity.value = serendipity;
    }
  }

  private createMarblingVertexShader(): string {
    return /* glsl */ `
      attribute vec3 position;
      attribute vec2 uv;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private createMarblingFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      uniform float time;
      uniform float audioLevel;
      uniform float serendipity;
      uniform vec2 resolution;
      
      // Noise functions
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value;
      }
      
      void main() {
        vec2 uv = vUv;
        
        // Create flowing motion
        float flow = sin(time * 0.5) * 0.5 + 0.5;
        vec2 flowOffset = vec2(
          sin(time * 0.3 + uv.y * 3.0) * 0.1,
          cos(time * 0.2 + uv.x * 2.0) * 0.1
        );
        
        // Audio-reactive distortion
        float audioDistortion = audioLevel * 0.3;
        vec2 distortedUv = uv + flowOffset * (1.0 + audioDistortion);
        
        // Create marbling pattern
        float pattern1 = fbm(distortedUv * 3.0 + time * 0.1);
        float pattern2 = fbm(distortedUv * 5.0 - time * 0.15 + vec2(10.0));
        float pattern3 = fbm(distortedUv * 7.0 + time * 0.08 + vec2(-5.0, 15.0));
        
        // Combine patterns with serendipity
        float marbling = mix(pattern1, pattern2, 0.5 + serendipity * 0.3);
        marbling = mix(marbling, pattern3, serendipity * 0.4);
        
        // Create color variations
        vec3 color1 = vec3(0.1, 0.3, 0.6); // Deep blue
        vec3 color2 = vec3(0.2, 0.5, 0.8); // Light blue
        vec3 color3 = vec3(0.4, 0.7, 0.9); // Sky blue
        
        vec3 color = mix(color1, color2, marbling);
        color = mix(color, color3, pattern3 * serendipity);
        
        // Add audio-reactive brightness
        float brightness = 1.0 + audioLevel * 0.5;
        color *= brightness;
        
        // Add subtle pulsing based on audio
        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        color *= pulse + audioLevel * 0.2;
        
        gl_FragColor = vec4(color, 0.8);
      }
    `;
  }
}
