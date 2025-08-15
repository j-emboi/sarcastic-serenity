import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class LavaLampScene extends BaseScene {
  id = 'lavalamp';
  name = 'Lava Lamp';

  private lavaLampProgram: Program | null = null;
  private lavaLampMesh: Mesh | null = null;
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing OGL LavaLampScene');
    
    // Create lava lamp shader program
    this.lavaLampProgram = new Program(gl, {
      vertex: this.createLavaLampVertexShader(),
      fragment: this.createLavaLampFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] }
      }
    });

    this.addProgram(this.lavaLampProgram);

    // Create full-screen quad for lava lamp rendering
    const geometry = new Plane(gl, { width: 2, height: 2 });
    
    this.lavaLampMesh = new Mesh(gl, {
      geometry,
      program: this.lavaLampProgram
    });

    this.addMesh(this.lavaLampMesh);
    
    console.log('OGL LavaLampScene initialization complete');
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.lavaLampProgram) {
      this.lavaLampProgram.uniforms.time.value = this.time;
      this.lavaLampProgram.uniforms.audioLevel.value = audioLevel;
      this.lavaLampProgram.uniforms.serendipity.value = serendipity;
    }
  }

  private createLavaLampVertexShader(): string {
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

  private createLavaLampFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vTime;
      varying float vAudioLevel;
      varying float vSerendipity;
      
      // Noise functions for organic blob movement
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
      
      // Create organic blob
      vec3 createBlob(vec2 uv, float time, float blobIndex) {
        vec3 color = vec3(0.0);
        
        // Blob parameters
        float size = 0.15 + blobIndex * 0.05;
        float speed = 0.2 + blobIndex * 0.1;
        float amplitude = 0.05 + blobIndex * 0.02;
        
        // Blob center with organic movement
        vec2 blobCenter = vec2(
          0.5 + sin(time * speed + blobIndex) * amplitude,
          0.3 + sin(time * speed * 0.7 + blobIndex * 2.0) * amplitude * 0.5
        );
        
        // Add noise for organic shape
        vec2 noiseOffset = vec2(
          noise(uv * 3.0 + time * 0.5 + blobIndex),
          noise(uv * 3.0 + time * 0.7 + blobIndex + 10.0)
        );
        
        blobCenter += noiseOffset * 0.02;
        
        // Calculate distance from blob center
        float dist = length(uv - blobCenter);
        
        // Create organic blob shape
        float blob = smoothstep(size, 0.0, dist);
        
        // Add organic variation
        float variation = fbm(uv * 4.0 + time * 0.3 + blobIndex);
        blob *= 0.7 + variation * 0.6;
        
        // Create blob colors (warm lava colors)
        vec3 blobColor = vec3(
          0.8 + 0.2 * sin(blobIndex * 2.0),
          0.3 + 0.2 * sin(blobIndex * 1.5),
          0.1 + 0.1 * sin(blobIndex * 1.8)
        );
        
        // Add color variation
        blobColor += vec3(0.1) * sin(time * 0.5 + blobIndex + uv.y * 3.0);
        
        // Add glow effect
        float glow = smoothstep(size * 1.5, 0.0, dist);
        color = blobColor * blob + blobColor * glow * 0.4;
        
        return color;
      }
      
      // Create lava lamp container
      vec3 createContainer(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Container shape (oval)
        vec2 center = vec2(0.5, 0.5);
        vec2 containerSize = vec2(0.4, 0.8);
        
        // Calculate distance from container center
        vec2 normalizedPos = (uv - center) / containerSize;
        float dist = length(normalizedPos);
        
        // Container outline
        float container = smoothstep(1.0, 0.95, dist);
        
        // Container color (glass-like)
        vec3 containerColor = vec3(0.1, 0.1, 0.15);
        
        // Add glass reflection
        float reflection = smoothstep(0.0, 0.1, 1.0 - dist);
        reflection *= sin(uv.x * 10.0 + time * 0.5) * 0.5 + 0.5;
        
        color = containerColor * container + vec3(0.3) * reflection * 0.2;
        
        return color;
      }
      
      // Create heat distortion
      vec3 createHeatDistortion(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create heat waves
        for (int i = 0; i < 3; i++) {
          float wave = float(i);
          float frequency = 2.0 + wave * 2.0;
          float speed = 0.3 + wave * 0.2;
          float amplitude = 0.01 + wave * 0.005;
          
          // Heat wave distortion
          vec2 distortion = vec2(
            sin(uv.y * frequency + time * speed) * amplitude,
            cos(uv.x * frequency + time * speed * 0.8) * amplitude
          );
          
          // Apply distortion to UV
          vec2 distortedUv = uv + distortion;
          
          // Create heat color
          vec3 heatColor = vec3(
            0.1 + 0.05 * sin(wave * 2.0),
            0.05 + 0.03 * sin(wave * 1.5),
            0.05 + 0.02 * sin(wave * 1.8)
          );
          
          color += heatColor * 0.1;
        }
        
        return color;
      }
      
      // Create background glow
      vec3 createBackgroundGlow(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create warm background
        vec3 backgroundColor = vec3(0.05, 0.03, 0.02);
        
        // Add subtle movement
        float movement = noise(uv * 2.0 + time * 0.1);
        backgroundColor *= 0.8 + movement * 0.4;
        
        // Add gradient from bottom to top
        float gradient = smoothstep(0.0, 1.0, uv.y);
        backgroundColor *= 0.5 + gradient * 0.5;
        
        color = backgroundColor;
        
        return color;
      }
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Combine lava lamp effects
        vec3 background = createBackgroundGlow(uv, vTime);
        vec3 container = createContainer(uv, vTime);
        vec3 heatDistortion = createHeatDistortion(uv, vTime);
        
        // Create multiple blobs
        vec3 blobs = vec3(0.0);
        for (int i = 0; i < 6; i++) {
          float blob = float(i);
          blobs += createBlob(uv, vTime, blob);
        }
        
        // Mix effects based on audio level
        if (vAudioLevel < 0.2) {
          // Calm lava lamp - gentle movement
          color = background + container * 0.3 + blobs * 0.7 + heatDistortion * 0.1;
        } else if (vAudioLevel < 0.5) {
          // Moderate activity - more dynamic blobs
          color = background + container * 0.2 + blobs * 0.8 + heatDistortion * 0.2;
        } else {
          // High activity - intense lava lamp
          color = background + container * 0.1 + blobs * 0.9 + heatDistortion * 0.3;
        }
        
        // Add depth variation
        float depth = noise(uv * 3.0 + vTime * 0.05);
        color *= 0.8 + depth * 0.4;
        
        // Add audio-reactive brightness
        color *= 0.7 + vAudioLevel * 0.6;
        
        // Add serendipity variation
        color += vec3(0.02) * sin(vTime * 1.5 + uv.x * 20.0) * 
                 sin(vTime * 1.2 + uv.y * 15.0) * vSerendipity;
        
        // Add warm tint for lava lamp feel
        color += vec3(0.1, 0.05, 0.02) * 0.3;
        
        // Final output
        float alpha = length(color) * 0.9;
        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  destroy(): void {
    super.destroy();
  }
}
