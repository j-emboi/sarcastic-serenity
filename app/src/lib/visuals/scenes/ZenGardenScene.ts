import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';

export class ZenGardenScene extends BaseScene {
  id = 'zengarden';
  name = 'Zen Garden';

  private zenGardenProgram: Program | null = null;
  private zenGardenMesh: Mesh | null = null;
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing OGL ZenGardenScene');
    
    // Create zen garden shader program
    this.zenGardenProgram = new Program(gl, {
      vertex: this.createZenGardenVertexShader(),
      fragment: this.createZenGardenFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        resolution: { value: [window.innerWidth, window.innerHeight] }
      }
    });

    this.addProgram(this.zenGardenProgram);

    // Create full-screen quad for zen garden rendering
    const geometry = new Plane(gl, { width: 2, height: 2 });
    
    this.zenGardenMesh = new Mesh(gl, {
      geometry,
      program: this.zenGardenProgram
    });

    this.addMesh(this.zenGardenMesh);
    
    console.log('OGL ZenGardenScene initialization complete');
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.zenGardenProgram) {
      this.zenGardenProgram.uniforms.time.value = this.time;
      this.zenGardenProgram.uniforms.audioLevel.value = audioLevel;
      this.zenGardenProgram.uniforms.serendipity.value = serendipity;
    }
  }

  private createZenGardenVertexShader(): string {
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

  private createZenGardenFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vTime;
      varying float vAudioLevel;
      varying float vSerendipity;
      
      // Noise functions for organic patterns
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
      
      // Create raked sand patterns
      vec3 createRakedSand(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Base sand color
        vec3 sandColor = vec3(0.8, 0.75, 0.6);
        
        // Create multiple rake patterns
        for (int i = 0; i < 5; i++) {
          float rake = float(i);
          float angle = rake * 0.3 + sin(time * 0.1 + rake) * 0.1;
          float spacing = 0.02 + rake * 0.01;
          
          // Create parallel lines
          vec2 rakeUv = vec2(
            uv.x * cos(angle) + uv.y * sin(angle),
            -uv.x * sin(angle) + uv.y * cos(angle)
          );
          
          // Create rake lines
          float rakeLine = sin(rakeUv.y * 50.0 + time * 0.2 + rake) * 0.5 + 0.5;
          rakeLine = smoothstep(0.4, 0.6, rakeLine);
          
          // Add variation to rake lines
          float variation = noise(uv * 10.0 + time * 0.1 + rake);
          rakeLine *= 0.7 + variation * 0.6;
          
          // Create depth effect
          float depth = rake * 0.1;
          sandColor += vec3(0.1) * rakeLine * depth;
        }
        
        // Add sand texture
        float sandTexture = fbm(uv * 20.0 + time * 0.05);
        sandColor *= 0.9 + sandTexture * 0.2;
        
        color = sandColor;
        
        return color;
      }
      
      // Create flowing water
      vec3 createFlowingWater(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Water area (bottom portion)
        float waterArea = smoothstep(0.7, 0.8, uv.y);
        
        if (waterArea > 0.0) {
          // Create water ripples
          for (int i = 0; i < 3; i++) {
            float ripple = float(i);
            float frequency = 3.0 + ripple * 2.0;
            float speed = 0.5 + ripple * 0.3;
            float amplitude = 0.02 + ripple * 0.01;
            
            // Create ripple effect
            float rippleEffect = sin(uv.x * frequency + time * speed) * 
                                cos(uv.y * frequency * 0.7 + time * speed * 0.8);
            
            rippleEffect *= amplitude;
            
            // Water color with ripples
            vec3 waterColor = vec3(
              0.1 + 0.1 * sin(ripple * 2.0),
              0.2 + 0.1 * sin(ripple * 1.5),
              0.3 + 0.1 * sin(ripple * 1.8)
            );
            
            color += waterColor * rippleEffect;
          }
          
          // Add water reflection
          float reflection = smoothstep(0.7, 0.9, uv.y);
          color += vec3(0.1, 0.15, 0.2) * reflection * 0.3;
        }
        
        return color;
      }
      
      // Create zen stones
      vec3 createZenStones(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create multiple stones
        for (int i = 0; i < 7; i++) {
          float stone = float(i);
          
          // Stone positions
          vec2 stonePos = vec2(
            0.2 + sin(stone * 1.5) * 0.3,
            0.3 + cos(stone * 1.2) * 0.2
          );
          
          // Add subtle movement
          stonePos += vec2(
            sin(time * 0.1 + stone) * 0.01,
            cos(time * 0.15 + stone) * 0.01
          );
          
          // Stone size
          float stoneSize = 0.05 + stone * 0.02;
          
          // Calculate distance from stone center
          float dist = length(uv - stonePos);
          
          // Create stone shape
          float stoneShape = smoothstep(stoneSize, 0.0, dist);
          
          // Add organic variation
          float variation = noise(uv * 8.0 + stone);
          stoneShape *= 0.8 + variation * 0.4;
          
          // Stone color (gray tones)
          vec3 stoneColor = vec3(
            0.4 + 0.2 * sin(stone * 2.0),
            0.4 + 0.2 * sin(stone * 1.5),
            0.4 + 0.2 * sin(stone * 1.8)
          );
          
          // Add stone shadow
          float shadow = smoothstep(stoneSize * 1.2, stoneSize, dist);
          shadow *= 0.3;
          
          color += stoneColor * stoneShape + vec3(0.1) * shadow;
        }
        
        return color;
      }
      
      // Create bamboo elements
      vec3 createBamboo(vec2 uv, float time) {
        vec3 color = vec3(0.0);
        
        // Create bamboo stalks
        for (int i = 0; i < 3; i++) {
          float bamboo = float(i);
          float xPos = 0.1 + bamboo * 0.3;
          
          // Bamboo stalk
          float stalk = smoothstep(0.02, 0.0, abs(uv.x - xPos));
          stalk *= smoothstep(0.0, 0.8, uv.y);
          
          // Bamboo color
          vec3 bambooColor = vec3(
            0.3 + 0.1 * sin(bamboo * 2.0),
            0.5 + 0.1 * sin(bamboo * 1.5),
            0.2 + 0.1 * sin(bamboo * 1.8)
          );
          
          // Add bamboo nodes
          float nodes = sin(uv.y * 15.0 + bamboo) * 0.5 + 0.5;
          nodes = smoothstep(0.4, 0.6, nodes);
          
          color += bambooColor * stalk * (0.7 + nodes * 0.3);
        }
        
        return color;
      }
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Combine zen garden elements
        vec3 rakedSand = createRakedSand(uv, vTime);
        vec3 flowingWater = createFlowingWater(uv, vTime);
        vec3 zenStones = createZenStones(uv, vTime);
        vec3 bamboo = createBamboo(uv, vTime);
        
        // Mix elements based on position
        float waterMask = smoothstep(0.7, 0.8, uv.y);
        float sandMask = 1.0 - waterMask;
        
        // Combine with proper layering
        color = rakedSand * sandMask + flowingWater * waterMask;
        color += zenStones;
        color += bamboo;
        
        // Add subtle atmospheric effects
        float atmosphere = noise(uv * 3.0 + vTime * 0.02);
        color *= 0.9 + atmosphere * 0.2;
        
        // Add audio-reactive subtlety
        if (vAudioLevel > 0.3) {
          // Add gentle wind effect to bamboo
          float wind = sin(vTime * 2.0 + uv.x * 10.0) * vAudioLevel * 0.1;
          color += vec3(0.02) * wind;
        }
        
        // Add serendipity variation
        color += vec3(0.01) * sin(vTime * 1.0 + uv.x * 15.0) * 
                 sin(vTime * 0.8 + uv.y * 12.0) * vSerendipity;
        
        // Add warm, peaceful tint
        color += vec3(0.05, 0.03, 0.02) * 0.2;
        
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
