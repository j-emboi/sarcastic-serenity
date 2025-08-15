import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class CosmicScene extends BaseScene {
  id = 'cosmic';
  name = 'Cosmic Galaxy';

  private cosmicProgram: Program | null = null;
  private cosmicMesh: Mesh | null = null;
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing OGL CosmicScene');
    
    // Create cosmic shader program
    this.cosmicProgram = new Program(gl, {
      vertex: this.createCosmicVertexShader(),
      fragment: this.createCosmicFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] }
      }
    });

    this.addProgram(this.cosmicProgram);

    // Create full-screen quad for cosmic rendering
    const geometry = new Plane(gl, { width: 2, height: 2 });
    
    this.cosmicMesh = new Mesh(gl, {
      geometry,
      program: this.cosmicProgram
    });

    this.addMesh(this.cosmicMesh);
    
    console.log('OGL CosmicScene initialization complete');
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.cosmicProgram) {
      this.cosmicProgram.uniforms.time.value = this.time;
      this.cosmicProgram.uniforms.audioLevel.value = audioLevel;
      this.cosmicProgram.uniforms.serendipity.value = serendipity;
    }
  }

  private createCosmicVertexShader(): string {
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

  private createCosmicFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vTime;
      varying float vAudioLevel;
      varying float vSerendipity;
      
      // Noise functions for cosmic effects
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
      
      // Create star field
      vec3 createStarField(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create multiple star layers
        for (int i = 0; i < 3; i++) {
          float layer = float(i);
          float density = 50.0 + layer * 30.0;
          float brightness = 0.3 + layer * 0.2;
          float twinkleSpeed = 1.0 + layer * 0.5;
          
          // Create star positions
          for (int j = 0; j < 100; j++) {
            float star = float(j);
            vec2 starPos = vec2(
              hash(vec2(star, 0.0)),
              hash(vec2(star, 1.0))
            );
            
            // Add some movement
            starPos += vec2(
              sin(time * 0.1 + star) * 0.001,
              cos(time * 0.15 + star) * 0.001
            );
            
            // Calculate distance to star
            float dist = length(uv - starPos);
            float starSize = hash(vec2(star, 2.0)) * 0.002 + 0.001;
            
            // Create star glow
            float starGlow = smoothstep(starSize, 0.0, dist);
            starGlow *= smoothstep(0.0, starSize * 2.0, dist);
            
            // Add twinkling
            float twinkle = sin(time * twinkleSpeed + star * 10.0) * 0.5 + 0.5;
            starGlow *= 0.5 + twinkle * 0.5;
            
            // Star color variation
            vec3 starColor = vec3(
              0.8 + 0.2 * hash(vec2(star, 3.0)),
              0.9 + 0.1 * hash(vec2(star, 4.0)),
              1.0
            );
            
            color += starColor * starGlow * brightness;
          }
        }
        
        return color;
      }
      
      // Create nebula clouds
      vec3 createNebula(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Multiple nebula layers
        for (int i = 0; i < 4; i++) {
          float layer = float(i);
          float scale = 2.0 + layer * 1.5;
          float speed = 0.1 + layer * 0.05;
          
          // Create nebula shape
          vec2 nebulaPos = uv * scale + vec2(
            sin(time * speed + layer) * 0.1,
            cos(time * speed * 0.8 + layer) * 0.1
          );
          
          float nebula = fbm(nebulaPos);
          nebula = smoothstep(0.3, 0.7, nebula);
          
          // Nebula colors
          vec3 nebulaColor = vec3(
            0.3 + 0.2 * sin(layer * 2.0),
            0.1 + 0.3 * sin(layer * 1.5),
            0.5 + 0.2 * sin(layer * 1.8)
          );
          
          // Add some variation
          nebulaColor += vec3(0.1) * sin(time * 0.5 + layer);
          
          color += nebulaColor * nebula * 0.3;
        }
        
        return color;
      }
      
      // Create cosmic dust
      vec3 createCosmicDust(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create flowing dust particles
        for (int i = 0; i < 5; i++) {
          float stream = float(i);
          
          // Dust stream path
          vec2 dustPath = vec2(
            mod(uv.x + time * 0.05 + stream * 0.2, 1.0),
            mod(uv.y + time * 0.03 + stream * 0.15, 1.0)
          );
          
          // Add noise for organic movement
          vec2 dustNoise = vec2(
            noise(dustPath * 3.0 + time * 0.2 + stream),
            noise(dustPath * 3.0 + time * 0.3 + stream + 10.0)
          );
          
          dustPath += dustNoise * 0.1;
          
          // Create dust trail
          float dust = 0.0;
          for (int j = 0; j < 6; j++) {
            float offset = float(j) * 0.015;
            vec2 dustPos = dustPath + vec2(offset, offset);
            dust += smoothstep(0.0, 0.05, 1.0 - length(uv - dustPos));
          }
          
          // Dust color
          vec3 dustColor = vec3(
            0.2 + 0.1 * sin(stream * 0.8),
            0.3 + 0.1 * sin(stream * 1.2),
            0.4 + 0.1 * sin(stream * 0.6)
          );
          
          color += dustColor * dust * 0.2;
        }
        
        return color;
      }
      
      // Create spiral galaxy
      vec3 createSpiralGalaxy(vec2 uv, float time) {
        vec2 center = vec2(0.5);
        vec2 pos = uv - center;
        
        // Convert to polar coordinates
        float angle = atan(pos.y, pos.x);
        float radius = length(pos);
        
        // Create multiple spiral arms
        float spiral = 0.0;
        for (int i = 0; i < 4; i++) {
          float arm = float(i);
          float armAngle = angle + arm * 3.14159 * 0.5;
          float armRadius = radius + sin(armAngle * 3.0 + time * 0.1) * 0.1;
          spiral += sin(armAngle * 4.0 + armRadius * 15.0 + time * 0.2 + arm);
        }
        
        // Add galaxy core with supermassive black hole effect
        float core = smoothstep(0.3, 0.0, radius);
        float blackHole = smoothstep(0.05, 0.0, radius);
        
        // Galaxy color with enhanced core
        vec3 galaxyColor = vec3(
          0.2 + 0.1 * core + 0.3 * blackHole,
          0.3 + 0.1 * core + 0.2 * blackHole,
          0.5 + 0.2 * core + 0.4 * blackHole
        );
        
        // Apply spiral pattern with enhanced intensity
        float intensity = smoothstep(0.0, 0.2, radius) * 
                         smoothstep(0.8, 0.0, radius) * 
                         (0.3 + spiral * 0.6);
        
        // Add accretion disk effect around black hole
        float accretionDisk = smoothstep(0.05, 0.15, radius) * 
                             smoothstep(0.25, 0.15, radius) * 
                             sin(angle * 20.0 + time * 3.0) * 0.5 + 0.5;
        
        intensity += accretionDisk * 0.3;
        
        return galaxyColor * intensity;
      }
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Combine cosmic effects
        vec3 starField = createStarField(uv, vTime);
        vec3 nebula = createNebula(uv, vTime);
        vec3 cosmicDust = createCosmicDust(uv, vTime);
        vec3 spiralGalaxy = createSpiralGalaxy(uv, vTime);
        
        // Mix effects based on audio level
        if (vAudioLevel < 0.2) {
          // Calm space - mostly stars and dust
          color = starField * 0.8 + cosmicDust * 0.2;
        } else if (vAudioLevel < 0.5) {
          // Moderate activity - add nebula
          color = starField * 0.6 + nebula * 0.3 + cosmicDust * 0.1;
        } else {
          // High activity - dynamic galaxy
          color = starField * 0.4 + nebula * 0.3 + spiralGalaxy * 0.3;
        }
        
        // Add depth variation
        float depth = noise(uv * 2.0 + vTime * 0.05);
        color *= 0.7 + depth * 0.6;
        
        // Add audio-reactive brightness
        color *= 0.6 + vAudioLevel * 0.8;
        
        // Add serendipity variation
        color += vec3(0.03) * sin(vTime * 1.5 + uv.x * 30.0) * 
                 sin(vTime * 1.2 + uv.y * 25.0) * vSerendipity;
        
        // Add subtle purple tint for cosmic feel
        color += vec3(0.1, 0.05, 0.2) * 0.2;
        
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
