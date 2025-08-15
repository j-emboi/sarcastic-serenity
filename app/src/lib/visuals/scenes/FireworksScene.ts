import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class FireworksScene extends BaseScene {
  id = 'fireworks';
  name = 'Fireworks';

  private fireworksProgram: Program | null = null;
  private fireworksMesh: Mesh | null = null;
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing OGL FireworksScene');
    
    // Create fireworks shader program
    this.fireworksProgram = new Program(gl, {
      vertex: this.createFireworksVertexShader(),
      fragment: this.createFireworksFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] }
      }
    });

    this.addProgram(this.fireworksProgram);

    // Create full-screen quad for fireworks rendering
    const geometry = new Plane(gl, { width: 2, height: 2 });
    
    this.fireworksMesh = new Mesh(gl, {
      geometry,
      program: this.fireworksProgram
    });

    this.addMesh(this.fireworksMesh);
    
    console.log('OGL FireworksScene initialization complete');
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.fireworksProgram) {
      this.fireworksProgram.uniforms.time.value = this.time;
      this.fireworksProgram.uniforms.audioLevel.value = audioLevel;
      this.fireworksProgram.uniforms.serendipity.value = serendipity;
    }
  }

  private createFireworksVertexShader(): string {
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

  private createFireworksFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vTime;
      varying float vAudioLevel;
      varying float vSerendipity;
      
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
      
      // Create a single firework
      vec3 createFirework(vec2 uv, vec2 launchPos, float launchTime, float explosionTime, vec3 color) {
        vec3 result = vec3(0.0);
        
        // Phase 1: Launch trajectory
        if (vTime < explosionTime) {
          float launchPhase = (vTime - launchTime) / (explosionTime - launchTime);
          
          // Parabolic trajectory
          float height = launchPhase * 0.8; // Max height
          float horizontal = (launchPhase - 0.5) * 0.1; // Slight arc
          
          vec2 rocketPos = launchPos + vec2(horizontal, height);
          
          // Rocket trail
          float trailLength = 0.05;
          float trail = smoothstep(0.0, trailLength, 1.0 - length(uv - rocketPos));
          trail *= (1.0 - launchPhase) * 2.0; // Fade trail as rocket rises
          
          // Rocket glow
          float glow = smoothstep(0.0, 0.02, 1.0 - length(uv - rocketPos));
          glow *= (1.0 - launchPhase) * 3.0;
          
          result = color * (trail + glow);
        }
        // Phase 2: Explosion
        else {
          float explosionPhase = (vTime - explosionTime) / 2.0; // 2 second explosion
          
          if (explosionPhase < 1.0) {
            // Explosion center
            vec2 explosionCenter = launchPos + vec2(0.0, 0.8);
            
            // Create multiple explosion patterns
            for (int i = 0; i < 8; i++) {
              float angle = float(i) * 3.14159 * 2.0 / 8.0;
              float speed = 0.3 + float(i) * 0.1;
              
              // Particle trajectory
              vec2 particleDir = vec2(cos(angle), sin(angle));
              vec2 particlePos = explosionCenter + particleDir * explosionPhase * speed;
              
              // Particle glow
              float particleGlow = smoothstep(0.0, 0.02, 1.0 - length(uv - particlePos));
              particleGlow *= (1.0 - explosionPhase) * 2.0; // Fade over time
              
              // Add some randomness
              float random = noise(particlePos * 10.0 + float(i));
              particleGlow *= 0.5 + random * 0.5;
              
              // Color variation
              vec3 particleColor = color + vec3(random * 0.3);
              
              result += particleColor * particleGlow;
            }
            
            // Add sparkles
            for (int i = 0; i < 20; i++) {
              float sparkleAngle = float(i) * 3.14159 * 2.0 / 20.0;
              float sparkleSpeed = 0.2 + float(i) * 0.05;
              
              vec2 sparkleDir = vec2(cos(sparkleAngle), sin(sparkleAngle));
              vec2 sparklePos = explosionCenter + sparkleDir * explosionPhase * sparkleSpeed;
              
              float sparkle = smoothstep(0.0, 0.01, 1.0 - length(uv - sparklePos));
              sparkle *= (1.0 - explosionPhase) * 3.0;
              sparkle *= sin(vTime * 10.0 + float(i)) * 0.5 + 0.5; // Twinkle
              
              result += color * sparkle * 0.5;
            }
          }
        }
        
        return result;
      }
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Create multiple fireworks
        vec3 fireworkColors[5];
        fireworkColors[0] = vec3(1.0, 0.3, 0.1); // Orange
        fireworkColors[1] = vec3(1.0, 1.0, 0.2); // Yellow
        fireworkColors[2] = vec3(0.2, 0.8, 1.0); // Cyan
        fireworkColors[3] = vec3(1.0, 0.2, 0.8); // Magenta
        fireworkColors[4] = vec3(0.2, 1.0, 0.3); // Green
        
        // Launch positions (ground level)
        vec2 launchPositions[5];
        launchPositions[0] = vec2(0.2, 0.95);
        launchPositions[1] = vec2(0.8, 0.95);
        launchPositions[2] = vec2(0.5, 0.95);
        launchPositions[3] = vec2(0.3, 0.95);
        launchPositions[4] = vec2(0.7, 0.95);
        
        // Timing for each firework
        float baseTime = vTime * 0.3; // Slower timing for relaxation
        float launchInterval = 2.0; // 2 seconds between launches
        
        for (int i = 0; i < 5; i++) {
          float fireworkTime = baseTime + float(i) * launchInterval;
          float launchTime = floor(fireworkTime / launchInterval) * launchInterval;
          float explosionTime = launchTime + 1.5; // 1.5 seconds to reach explosion
          
          // Add some randomness to timing
          float randomOffset = noise(vec2(float(i), vTime * 0.1)) * 0.5;
          launchTime += randomOffset;
          explosionTime += randomOffset;
          
          color += createFirework(uv, launchPositions[i], launchTime, explosionTime, fireworkColors[i]);
        }
        
        // Add audio reactivity
        color *= 0.8 + vAudioLevel * 0.4;
        
        // Add subtle background glow
        float backgroundGlow = noise(uv * 2.0 + vTime * 0.1) * 0.1;
        color += vec3(0.05, 0.1, 0.2) * backgroundGlow;
        
        // Add serendipity variation
        color += vec3(0.02) * sin(vTime * 3.0 + uv.x * 30.0) * 
                 sin(vTime * 2.5 + uv.y * 25.0) * vSerendipity;
        
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
