import { Program, Mesh, Plane } from 'ogl';
import { BaseScene } from './BaseScene';
import type { BreathingPhase, BreathingAnimationType } from '../../breathing/types';

export class BreathingScene extends BaseScene {
  id = 'breathing';
  name = 'Breathing Guide';
  
  private breathingProgram: Program | null = null;
  private breathingCircle: Mesh | null = null;
  private progressRing: Mesh | null = null;
  private currentPhase: BreathingPhase = 'inhale';
  private timeRemaining: number = 4;
  private phaseDuration: number = 4;
  private currentAnimation: BreathingAnimationType = 'expanding-circle';
  protected time: number = 0;

  init(gl: any): void {
    console.log('Initializing BreathingScene...');
    
    try {
      // Create breathing circle shader program
      this.breathingProgram = new Program(gl, {
        vertex: this.createBreathingVertexShader(),
        fragment: this.createBreathingFragmentShader(),
        uniforms: {
          time: { value: 0 },
          phase: { value: 0 }, // 0=inhale, 1=hold, 2=exhale, 3=hold2
          timeRemaining: { value: 4 },
          phaseDuration: { value: 4 },
          progress: { value: 0 }, // 0 to 1 progress through current phase
          animationType: { value: 0 } // 0=expanding-circle, 1=wave-pulse, etc.
        }
      });

      console.log('Breathing shader program created:', {
        hasProgram: !!this.breathingProgram,
        uniforms: this.breathingProgram ? Object.keys(this.breathingProgram.uniforms) : []
      });

      // Create main breathing circle (single mesh) - positioned for overlay
      const circleGeometry = new Plane(gl, { width: 1.2, height: 1.2 }); // Larger for visibility
      this.breathingCircle = new Mesh(gl, {
        geometry: circleGeometry,
        program: this.breathingProgram!
      });
      
      // Position the breathing circle in the center area for overlay
      this.breathingCircle.position.x = 0.0; // Center horizontally
      this.breathingCircle.position.y = 0.0; // Center vertically
      this.breathingCircle.position.z = 0.5; // Closer to camera for visibility
      
      this.addMesh(this.breathingCircle);

      console.log('BreathingScene initialization complete - meshes created:', this.meshes.length);
    } catch (error) {
      console.error('Failed to initialize breathing scene with complex shader, using fallback:', error);
      
      // Fallback: simple shader
      this.breathingProgram = new Program(gl, {
        vertex: this.createBreathingVertexShader(),
        fragment: this.createSimpleFallbackShader(),
        uniforms: {
          time: { value: 0 },
          phase: { value: 0 },
          progress: { value: 0 }
        }
      });

      const circleGeometry = new Plane(gl, { width: 1.2, height: 1.2 });
      this.breathingCircle = new Mesh(gl, {
        geometry: circleGeometry,
        program: this.breathingProgram!
      });
      
      // Position for overlay
      this.breathingCircle.position.x = 0.0;
      this.breathingCircle.position.y = 0.0;
      this.breathingCircle.position.z = 0.5;
      
      this.addMesh(this.breathingCircle);
      
      console.log('BreathingScene fallback initialization complete');
    }
  }

  setAnimationType(animationType: BreathingAnimationType): void {
    this.currentAnimation = animationType;
    if (this.breathingProgram) {
      const animationNumber = this.getAnimationNumber(animationType);
      this.breathingProgram.uniforms.animationType.value = animationNumber;
      console.log('BreathingScene: Animation type changed to:', animationType, '(', animationNumber, ')');
    }
  }

  private getAnimationNumber(animationType: BreathingAnimationType): number {
    switch (animationType) {
      case 'expanding-circle': return 0;
      case 'wave-pulse': return 1;
      case 'particle-flow': return 2;
      case 'geometric-shapes': return 3;
      case 'nature-flower': return 4;
      case 'minimalist-lines': return 5;
      case 'ocean-waves': return 6;
      default: return 0;
    }
  }

  updateBreathingState(phase: BreathingPhase, timeRemaining: number, phaseDuration: number): void {
    this.currentPhase = phase;
    this.timeRemaining = timeRemaining;
    this.phaseDuration = phaseDuration;

    if (this.breathingProgram) {
      // Convert phase to number for shader
      const phaseNumber = this.getPhaseNumber(phase);
      const progress = 1 - (timeRemaining / phaseDuration);

      // Set shader uniforms
      this.breathingProgram.uniforms.phase.value = phaseNumber;
      this.breathingProgram.uniforms.timeRemaining.value = timeRemaining;
      this.breathingProgram.uniforms.phaseDuration.value = phaseDuration;
      this.breathingProgram.uniforms.progress.value = progress;

      console.log('=== BREATHING SCENE UPDATE ===');
      console.log('Phase:', phase);
      console.log('Phase Number:', phaseNumber);
      console.log('Time Remaining:', timeRemaining.toFixed(1));
      console.log('Phase Duration:', phaseDuration.toFixed(1));
      console.log('Progress:', progress.toFixed(2));
      console.log('Animation Type:', this.currentAnimation);
      console.log('=============================');
    } else {
      console.warn('BreathingScene: breathingProgram is null, cannot update state');
    }
  }

  private getPhaseNumber(phase: BreathingPhase): number {
    switch (phase) {
      case 'inhale': return 0;
      case 'hold': return 1;
      case 'exhale': return 2;
      case 'hold2': return 3;
      default: return 0;
    }
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.breathingProgram) {
      this.breathingProgram.uniforms.time.value = this.time;
      
      // Debug logging (every 60 frames = ~1 second at 60fps)
      if (Math.random() < 0.016) { // ~1/60 chance
        console.log('BreathingScene update:', {
          time: this.time.toFixed(2),
          phase: this.currentPhase,
          timeRemaining: this.timeRemaining.toFixed(1),
          animationType: this.currentAnimation,
          hasProgram: !!this.breathingProgram,
          meshCount: this.meshes.length
        });
      }
    } else {
      console.warn('BreathingScene: breathingProgram is null!');
    }
  }

  private createBreathingVertexShader(): string {
    return /* glsl */ `
      attribute vec3 position;
      attribute vec2 uv;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float time;
      uniform float phase;
      uniform float timeRemaining;
      uniform float phaseDuration;
      uniform float progress;
      
      varying vec2 vUv;
      varying float vPhase;
      varying float vProgress;
      
      void main() {
        vUv = uv;
        vPhase = phase;
        vProgress = progress;
        
        // No scaling in vertex shader - keep geometry static
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private createBreathingFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vPhase;
      varying float vProgress;
      
      uniform float time;
      uniform float animationType;
      
      // Helper functions
      float smoothStep(float edge0, float edge1, float x) {
        float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
      }
      
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        
        // Base breathing animation - scale circle radius based on phase
        float baseRadius = 0.4;
        float breathingRadius = baseRadius;
        
        // Phase-based radius calculation
        if (vPhase == 0.0) { // Inhale
          breathingRadius = baseRadius + vProgress * 0.15;
        } else if (vPhase == 1.0) { // Hold
          breathingRadius = baseRadius + 0.15;
        } else if (vPhase == 2.0) { // Exhale
          breathingRadius = baseRadius + 0.15 - vProgress * 0.15;
        } else if (vPhase == 3.0) { // Hold2
          breathingRadius = baseRadius;
        }
        
        vec3 finalColor = vec3(0.0);
        float alpha = 0.0;
        
        // Animation type selection
        if (animationType == 0.0) {
          // EXPANDING CIRCLE - Enhanced with glow and smooth transitions
          float circleEdge = smoothStep(breathingRadius - 0.02, breathingRadius, dist);
          float glowEdge = smoothStep(breathingRadius + 0.05, breathingRadius, dist);
          
          vec3 phaseColors[4];
          phaseColors[0] = vec3(0.2, 0.6, 1.0); // Blue for inhale
          phaseColors[1] = vec3(0.2, 0.8, 0.4); // Green for hold
          phaseColors[2] = vec3(0.8, 0.3, 0.8); // Purple for exhale
          phaseColors[3] = vec3(1.0, 0.6, 0.2); // Orange for hold2
          
          vec3 mainColor = phaseColors[int(vPhase)];
          vec3 glowColor = mainColor * 0.6;
          
          finalColor = mix(glowColor, mainColor, circleEdge);
          alpha = 1.0 - circleEdge + glowEdge * 0.3;
          
        } else if (animationType == 1.0) {
          // WAVE PULSE - Ripple effects
          float waveCount = 3.0;
          float waveSpeed = 2.0;
          float waveAmplitude = 0.05;
          
          float wave = 0.0;
          for (float i = 0.0; i < waveCount; i++) {
            float wavePhase = time * waveSpeed + i * 2.0;
            float waveRadius = breathingRadius + sin(wavePhase) * waveAmplitude;
            wave += smoothStep(waveRadius - 0.02, waveRadius, dist) * (1.0 - i / waveCount);
          }
          
          vec3 waveColor = vec3(0.3, 0.7, 1.0);
          finalColor = waveColor * wave;
          alpha = wave;
          
        } else if (animationType == 2.0) {
          // PARTICLE FLOW - Dynamic particle effects
          float particleCount = 50.0;
          float particleSize = 0.02;
          float flowSpeed = 3.0;
          
          float particleSum = 0.0;
          for (float i = 0.0; i < particleCount; i++) {
            float angle = i * 6.28 / particleCount + time * flowSpeed;
            float radius = breathingRadius + sin(time * 2.0 + i) * 0.05;
            vec2 particlePos = center + vec2(cos(angle), sin(angle)) * radius;
            float particleDist = distance(vUv, particlePos);
            particleSum += smoothStep(particleSize, 0.0, particleDist);
          }
          
          vec3 particleColor = vec3(0.8, 0.4, 1.0);
          finalColor = particleColor * particleSum;
          alpha = particleSum;
          
        } else if (animationType == 3.0) {
          // GEOMETRIC SHAPES - Abstract geometric patterns
          float shapeRotation = time * 0.5;
          vec2 rotatedUv = vec2(
            (vUv.x - 0.5) * cos(shapeRotation) - (vUv.y - 0.5) * sin(shapeRotation) + 0.5,
            (vUv.x - 0.5) * sin(shapeRotation) + (vUv.y - 0.5) * cos(shapeRotation) + 0.5
          );
          
          float shape = abs(sin(rotatedUv.x * 10.0 + time)) + abs(sin(rotatedUv.y * 10.0 + time));
          float shapeRadius = breathingRadius + sin(time * 3.0) * 0.05;
          
          if (dist < shapeRadius) {
            vec3 shapeColor = vec3(0.2, 0.8, 0.6);
            finalColor = shapeColor * (0.5 + 0.5 * sin(shape + time));
            alpha = 1.0;
          }
          
        } else if (animationType == 4.0) {
          // NATURE FLOWER - Flower blooming effect
          float petalCount = 8.0;
          float petalAngle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float petalIndex = mod(petalAngle / 6.28 * petalCount, 1.0);
          
          float petalShape = sin(petalIndex * 3.14159) * 0.5 + 0.5;
          float petalRadius = breathingRadius * (0.8 + petalShape * 0.4);
          
          if (dist < petalRadius) {
            vec3 flowerColor = vec3(1.0, 0.3, 0.6);
            finalColor = flowerColor * (0.7 + 0.3 * sin(time + petalIndex * 6.28));
            alpha = 1.0;
          }
          
        } else if (animationType == 5.0) {
          // MINIMALIST LINES - Clean, zen-like experience
          float lineCount = 12.0;
          float lineAngle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float lineIndex = mod(lineAngle / 6.28 * lineCount, 1.0);
          
          float lineWidth = 0.01;
          float lineRadius = breathingRadius * (0.9 + sin(time + lineIndex * 6.28) * 0.1);
          
          float lineDist = abs(dist - lineRadius);
          if (lineDist < lineWidth && dist < breathingRadius + 0.1) {
            vec3 lineColor = vec3(0.9, 0.9, 0.9);
            finalColor = lineColor;
            alpha = 1.0 - lineDist / lineWidth;
          }
          
        } else if (animationType == 6.0) {
          // OCEAN WAVES - Soothing wave patterns
          float waveFrequency = 8.0;
          float waveSpeed = 1.5;
          float waveHeight = 0.03;
          
          float wave = sin(dist * waveFrequency - time * waveSpeed) * waveHeight;
          float waveRadius = breathingRadius + wave;
          
          if (dist < waveRadius + 0.05) {
            vec3 oceanColor = vec3(0.2, 0.5, 0.8);
            float waveIntensity = 1.0 - smoothStep(waveRadius - 0.02, waveRadius, dist);
            finalColor = oceanColor * waveIntensity;
            alpha = waveIntensity;
          }
        }
        
        // Apply breathing-based color transitions
        vec3 phaseColors[4];
        phaseColors[0] = vec3(0.2, 0.6, 1.0); // Blue for inhale
        phaseColors[1] = vec3(0.2, 0.8, 0.4); // Green for hold
        phaseColors[2] = vec3(0.8, 0.3, 0.8); // Purple for exhale
        phaseColors[3] = vec3(1.0, 0.6, 0.2); // Orange for hold2
        
        vec3 phaseColor = phaseColors[int(vPhase)];
        finalColor = mix(finalColor, phaseColor, 0.3);
        
        // Fallback: if no animation is selected or something goes wrong, show a simple circle
        if (alpha == 0.0) {
          if (dist < breathingRadius) {
            finalColor = phaseColor;
            alpha = 0.8; // Slightly transparent for overlay
          }
        }
        
        // Add subtle background for overlay visibility
        float backgroundAlpha = 0.0;
        if (dist < breathingRadius + 0.1) {
          backgroundAlpha = 0.1 * (1.0 - smoothStep(breathingRadius, breathingRadius + 0.1, dist));
        }
        
        // Combine main animation with background
        vec3 finalColorWithBg = mix(finalColor, vec3(0.1, 0.1, 0.1), backgroundAlpha);
        float finalAlpha = max(alpha, backgroundAlpha);
        
        gl_FragColor = vec4(finalColorWithBg, finalAlpha);
      }
    `;
  }

  private createSimpleFallbackShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      varying float vPhase;
      varying float vProgress;
      
      uniform float time;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        
        // Simple breathing circle - always visible for testing
        float baseRadius = 0.3;
        float breathingRadius = baseRadius + sin(time) * 0.1;
        
        vec3 color = vec3(1.0, 0.0, 0.0); // Bright red for testing
        
        if (dist < breathingRadius) {
          gl_FragColor = vec4(color, 1.0); // Fully opaque for testing
        } else {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      }
    `;
  }

  destroy(): void {
    super.destroy();
    console.log('BreathingScene destroyed');
  }
}
