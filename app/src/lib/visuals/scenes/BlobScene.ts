import { Program, Mesh, Sphere } from 'ogl';
import { BaseScene } from './BaseScene';

export class BlobScene extends BaseScene {
  id = 'blobs';
  name = 'Soft-Body Blobs';

  private blobProgram: Program | null = null;
  private blobs: Array<{
    mesh: Mesh;
    position: [number, number, number];
    scale: number;
    speed: number;
    phase: number;
  }> = [];

  init(gl: any): void {
    // Create blob shader program
    this.blobProgram = new Program(gl, {
      vertex: this.createBlobVertexShader(),
      fragment: this.createBlobFragmentShader(),
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        serendipity: { value: 0.1 },
        breathingPhase: { value: 0 } // 0-1 for inhale/exhale cycle
      }
    });

    this.addProgram(this.blobProgram);

    // Create multiple blobs
    const blobCount = 5;
    for (let i = 0; i < blobCount; i++) {
      const geometry = new Sphere(gl, { radius: 0.3 });
      
      const mesh = new Mesh(gl, {
        geometry,
        program: this.blobProgram
      });

      // Position blobs in a circle
      const angle = (i / blobCount) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 2;

      mesh.position.set(x, y, z);
      mesh.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4);

      this.blobs.push({
        mesh,
        position: [x, y, z],
        scale: 0.8 + Math.random() * 0.4,
        speed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      });

      this.addMesh(mesh);
    }
  }

  update(deltaTime: number, audioLevel: number = 0, serendipity: number = 0.1): void {
    this.time += deltaTime;

    if (this.blobProgram) {
      this.blobProgram.uniforms.time.value = this.time;
      this.blobProgram.uniforms.audioLevel.value = audioLevel;
      this.blobProgram.uniforms.serendipity.value = serendipity;
      
      // Create breathing cycle (4 seconds inhale, 4 seconds exhale)
      const breathingCycle = (this.time * 0.25) % 1.0;
      this.blobProgram.uniforms.breathingPhase.value = breathingCycle;
    }

    // Animate blobs
    this.blobs.forEach((blob, index) => {
      const breathingInfluence = Math.sin(this.time * 0.25) * 0.3 + 0.7;
      
      // Gentle floating motion
      const floatX = Math.sin(this.time * blob.speed + blob.phase) * 0.1;
      const floatY = Math.cos(this.time * blob.speed * 0.7 + blob.phase) * 0.1;
      const floatZ = Math.sin(this.time * blob.speed * 0.5 + blob.phase) * 0.05;

      blob.mesh.position.x = blob.position[0] + floatX;
      blob.mesh.position.y = blob.position[1] + floatY;
      blob.mesh.position.z = blob.position[2] + floatZ;

      // Scale based on breathing and audio
      const baseScale = blob.scale;
      const breathingScale = baseScale * (0.8 + breathingInfluence * 0.4);
      const audioScale = breathingScale * (1.0 + audioLevel * 0.3);
      const serendipityScale = audioScale * (1.0 + serendipity * 0.2);

      blob.mesh.scale.set(serendipityScale, serendipityScale, serendipityScale);

      // Rotate blobs slowly
      blob.mesh.rotation.x += deltaTime * 0.2;
      blob.mesh.rotation.y += deltaTime * 0.3;
    });
  }

  private createBlobVertexShader(): string {
    return /* glsl */ `
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;
      uniform float time;
      uniform float breathingPhase;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        vNormal = normalMatrix * normal;
        vPosition = position;
        
        // Add subtle vertex displacement for blob effect
        vec3 displacedPosition = position;
        float displacement = sin(time * 2.0 + position.x * 3.0) * 
                           sin(time * 1.5 + position.y * 3.0) * 
                           sin(time * 1.8 + position.z * 3.0) * 0.05;
        
        displacedPosition += normal * displacement * (0.5 + breathingPhase * 0.5);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
      }
    `;
  }

  private createBlobFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      
      uniform float time;
      uniform float audioLevel;
      uniform float serendipity;
      uniform float breathingPhase;
      
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        
        // Basic lighting
        float diffuse = max(dot(normal, lightDir), 0.0);
        float ambient = 0.3;
        float lighting = ambient + diffuse * 0.7;
        
        // Create gradient based on position
        vec3 color1 = vec3(0.2, 0.4, 0.8); // Blue
        vec3 color2 = vec3(0.4, 0.6, 0.9); // Light blue
        vec3 color3 = vec3(0.6, 0.8, 1.0); // Very light blue
        
        float gradient = (vPosition.y + 1.0) * 0.5;
        vec3 baseColor = mix(color1, color2, gradient);
        baseColor = mix(baseColor, color3, serendipity * 0.5);
        
        // Add breathing-based color variation
        float breathingColor = sin(breathingPhase * 3.14159) * 0.2 + 0.8;
        baseColor *= breathingColor;
        
        // Add audio-reactive highlights
        float audioHighlight = audioLevel * 0.5;
        baseColor += vec3(0.1, 0.2, 0.3) * audioHighlight;
        
        // Apply lighting
        vec3 finalColor = baseColor * lighting;
        
        // Add subtle transparency
        float alpha = 0.8 + audioLevel * 0.2;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;
  }
}
