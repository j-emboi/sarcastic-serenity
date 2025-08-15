import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class AuroraScene extends BaseScene {
  id = 'aurora';
  name = 'Aurora Borealis';

  private auroraProgram: Program | null = null;
  private auroraMesh: Mesh | null = null;
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing OGL AuroraScene');
    
    // Create aurora shader program
    this.auroraProgram = new Program(gl, {
      vertex: this.createAuroraVertexShader(),
      fragment: this.createAuroraFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] }
      }
    });

    this.addProgram(this.auroraProgram);

    // Create full-screen quad for aurora rendering
    const geometry = new Plane(gl, { width: 2, height: 2 });
    
    this.auroraMesh = new Mesh(gl, {
      geometry,
      program: this.auroraProgram
    });

    this.addMesh(this.auroraMesh);
    
    console.log('OGL AuroraScene initialization complete');
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.auroraProgram) {
      this.auroraProgram.uniforms.time.value = this.time;
      this.auroraProgram.uniforms.audioLevel.value = audioLevel;
      this.auroraProgram.uniforms.serendipity.value = serendipity;
    }
  }

  private createAuroraVertexShader(): string {
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

  private createAuroraFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vTime;
      varying float vAudioLevel;
      varying float vSerendipity;
      
      // Noise functions for organic aurora movement
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
      
      // Create aurora ribbon
      vec3 createAuroraRibbon(vec2 uv, float time, float ribbonIndex) {
        vec3 color = vec3(0.0);
        
        // Aurora ribbon parameters
        float width = 0.02 + ribbonIndex * 0.01;
        float height = 0.8 + ribbonIndex * 0.1;
        float speed = 0.3 + ribbonIndex * 0.1;
        float amplitude = 0.1 + ribbonIndex * 0.05;
        
        // Create flowing ribbon path
        vec2 ribbonPath = vec2(
          uv.x + sin(uv.y * 3.0 + time * speed + ribbonIndex) * amplitude,
          uv.y
        );
        
        // Add organic movement with noise
        vec2 noiseOffset = vec2(
          noise(ribbonPath * 2.0 + time * 0.5 + ribbonIndex),
          noise(ribbonPath * 2.0 + time * 0.7 + ribbonIndex + 10.0)
        );
        
        ribbonPath += noiseOffset * 0.05;
        
        // Calculate distance from ribbon center
        float dist = abs(ribbonPath.x - 0.5);
        float ribbon = smoothstep(width, 0.0, dist);
        
        // Add vertical variation
        float verticalVar = sin(uv.y * 10.0 + time * 2.0 + ribbonIndex) * 0.5 + 0.5;
        ribbon *= verticalVar;
        
        // Create aurora colors (green to blue to purple)
        vec3 auroraColor = vec3(
          0.1 + 0.3 * sin(ribbonIndex * 2.0),
          0.4 + 0.4 * sin(ribbonIndex * 1.5),
          0.6 + 0.3 * sin(ribbonIndex * 1.8)
        );
        
        // Add color variation along the ribbon
        auroraColor += vec3(0.1) * sin(time * 0.5 + ribbonIndex + uv.y * 5.0);
        
        // Add glow effect
        float glow = smoothstep(width * 2.0, 0.0, dist);
        color = auroraColor * ribbon + auroraColor * glow * 0.3;
        
        return color;
      }
      
      // Create aurora curtain effect
      vec3 createAuroraCurtain(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create multiple aurora ribbons
        for (int i = 0; i < 8; i++) {
          float ribbon = float(i);
          float offset = ribbon * 0.15;
          
          // Position ribbons across the sky
          vec2 ribbonUv = vec2(
            mod(uv.x + offset + sin(time * 0.1 + ribbon) * 0.05, 1.0),
            uv.y
          );
          
          color += createAuroraRibbon(ribbonUv, time, ribbon);
        }
        
        return color;
      }
      
      // Create aurora particles
      vec3 createAuroraParticles(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create sparkle particles
        for (int i = 0; i < 50; i++) {
          float particle = float(i);
          
          // Particle position
          vec2 particlePos = vec2(
            hash(vec2(particle, 0.0)),
            hash(vec2(particle, 1.0))
          );
          
          // Add movement
          particlePos += vec2(
            sin(time * 0.2 + particle) * 0.01,
            cos(time * 0.3 + particle) * 0.01
          );
          
          // Calculate distance
          float dist = length(uv - particlePos);
          float particleSize = hash(vec2(particle, 2.0)) * 0.003 + 0.001;
          
          // Create particle glow
          float particleGlow = smoothstep(particleSize, 0.0, dist);
          particleGlow *= smoothstep(0.0, particleSize * 3.0, dist);
          
          // Add twinkling
          float twinkle = sin(time * 3.0 + particle * 10.0) * 0.5 + 0.5;
          particleGlow *= 0.3 + twinkle * 0.7;
          
          // Particle color
          vec3 particleColor = vec3(
            0.2 + 0.3 * hash(vec2(particle, 3.0)),
            0.5 + 0.4 * hash(vec2(particle, 4.0)),
            0.7 + 0.2 * hash(vec2(particle, 5.0))
          );
          
          color += particleColor * particleGlow * 0.5;
        }
        
        return color;
      }
      
      // Create atmospheric glow
      vec3 createAtmosphericGlow(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create gradient from horizon to sky
        float horizon = smoothstep(0.0, 0.3, uv.y);
        float sky = smoothstep(0.7, 1.0, uv.y);
        
        // Horizon glow
        vec3 horizonColor = vec3(0.1, 0.2, 0.4);
        color += horizonColor * horizon * 0.3;
        
        // Sky glow
        vec3 skyColor = vec3(0.05, 0.1, 0.2);
        color += skyColor * sky * 0.2;
        
        // Add subtle movement
        float movement = noise(uv * 3.0 + time * 0.1);
        color *= 0.8 + movement * 0.4;
        
        return color;
      }
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Combine aurora effects
        vec3 auroraCurtain = createAuroraCurtain(uv, vTime);
        vec3 auroraParticles = createAuroraParticles(uv, vTime);
        vec3 atmosphericGlow = createAtmosphericGlow(uv, vTime);
        
        // Mix effects based on audio level
        if (vAudioLevel < 0.2) {
          // Calm aurora - gentle movement
          color = auroraCurtain * 0.7 + auroraParticles * 0.2 + atmosphericGlow * 0.1;
        } else if (vAudioLevel < 0.5) {
          // Moderate activity - more dynamic
          color = auroraCurtain * 0.6 + auroraParticles * 0.3 + atmosphericGlow * 0.1;
        } else {
          // High activity - intense aurora
          color = auroraCurtain * 0.5 + auroraParticles * 0.4 + atmosphericGlow * 0.1;
        }
        
        // Add depth variation
        float depth = noise(uv * 2.0 + vTime * 0.05);
        color *= 0.7 + depth * 0.6;
        
        // Add audio-reactive brightness
        color *= 0.6 + vAudioLevel * 0.8;
        
        // Add serendipity variation
        color += vec3(0.02) * sin(vTime * 2.0 + uv.x * 25.0) * 
                 sin(vTime * 1.8 + uv.y * 20.0) * vSerendipity;
        
        // Add subtle green tint for aurora feel
        color += vec3(0.05, 0.1, 0.05) * 0.2;
        
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
