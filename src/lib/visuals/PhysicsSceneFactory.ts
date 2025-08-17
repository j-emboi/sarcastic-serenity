import { Program, Mesh, Plane, Box, Sphere } from 'ogl';
import * as Matter from 'matter-js';
import type { PhysicsObject } from './WebGLSceneManager';

// Shader programs for different visual effects
const particleShader = {
  vertex: `
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: `
    precision highp float;
    varying vec2 vUv;
    uniform float time;
    uniform vec3 color;
    
    void main() {
      float alpha = 1.0 - length(vUv - vec2(0.5));
      alpha = smoothstep(0.0, 0.5, alpha);
      gl_FragColor = vec4(color, alpha * 0.8);
    }
  `
};

const fluidShader = {
  vertex: `
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float time;
    varying vec2 vUv;
    varying float vTime;
    
    void main() {
      vUv = uv;
      vTime = time;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: `
    precision highp float;
    varying vec2 vUv;
    varying float vTime;
    uniform vec3 color;
    
    void main() {
      float wave = sin(vUv.x * 10.0 + vTime) * 0.5 + 0.5;
      float alpha = smoothstep(0.0, 0.3, wave) * 0.6;
      gl_FragColor = vec4(color, alpha);
    }
  `
};

export class PhysicsSceneFactory {
  private static time = 0;

  static updateTime(deltaTime: number): void {
    this.time += deltaTime;
  }

  static createParticle(
    gl: WebGLRenderingContext,
    x: number = 0,
    y: number = 0,
    size: number = 0.2,
    color: [number, number, number] = [0.2, 0.6, 1.0]
  ): PhysicsObject {
    // Create physics body
    const body = Matter.Bodies.circle(x, y, size * 50, {
      restitution: 0.95, // Very high bounce (95%)
      friction: 0.01,    // Very low friction for maximum bouncing
      density: 0.001,
      frictionAir: 0.0001 // Extremely low air resistance
    });
    
    // Add some initial velocity for more dynamic movement
    Matter.Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 3,  // Random horizontal velocity
      y: (Math.random() - 0.5) * 3   // Random vertical velocity
    });
    
    // Add a small upward bias to keep particles bouncing
    if (Math.random() > 0.5) {
      Matter.Body.setVelocity(body, {
        x: body.velocity.x,
        y: body.velocity.y - 1  // Upward bias
      });
    }

    // Randomize color for variety
    const colors = [
      [0.2, 0.6, 1.0], // Blue
      [0.8, 0.3, 0.8], // Purple
      [0.3, 0.8, 0.4], // Green
      [1.0, 0.6, 0.2], // Orange
      [0.8, 0.2, 0.2]  // Red
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Create visual mesh
    const geometry = new Plane(gl);
    const program = new Program(gl, {
      vertex: particleShader.vertex,
      fragment: particleShader.fragment,
      uniforms: {
        time: { value: 0 },
        color: { value: randomColor }
      }
    });

    const mesh = new Mesh(gl, {
      geometry,
      program
    });

    mesh.scale.set(size, size, 1);

    return {
      body,
      mesh,
      type: 'particle'
    };
  }

  static createFluidParticle(
    gl: WebGLRenderingContext,
    x: number = 0,
    y: number = 0,
    size: number = 0.15,
    color: [number, number, number] = [0.2, 0.6, 0.9]
  ): PhysicsObject {
    // Create physics body with fluid-like properties
    const body = Matter.Bodies.circle(x, y, size * 40, {
      restitution: 0.3,
      friction: 0.8,
      density: 0.002,
      frictionAir: 0.1
    });

    // Create visual mesh with fluid shader
    const geometry = new Plane(gl);
    const program = new Program(gl, {
      vertex: fluidShader.vertex,
      fragment: fluidShader.fragment,
      uniforms: {
        time: { value: 0 },
        color: { value: color }
      }
    });

    const mesh = new Mesh(gl, {
      geometry,
      program
    });

    mesh.scale.set(size, size, 1);

    return {
      body,
      mesh,
      type: 'fluid'
    };
  }

  static createSoftBody(
    gl: WebGLRenderingContext,
    x: number = 0,
    y: number = 0,
    size: number = 0.2,
    color: [number, number, number] = [0.8, 0.4, 0.8]
  ): PhysicsObject {
    // Create physics body with soft body properties
    const body = Matter.Bodies.rectangle(x, y, size * 100, size * 100, {
      restitution: 0.6,
      friction: 0.3,
      density: 0.001,
      chamfer: { radius: 10 }
    });

    // Create visual mesh
    const geometry = new Box(gl);
    const program = new Program(gl, {
      vertex: particleShader.vertex,
      fragment: particleShader.fragment,
      uniforms: {
        time: { value: 0 },
        color: { value: color }
      }
    });

    const mesh = new Mesh(gl, {
      geometry,
      program
    });

    mesh.scale.set(size, size, size);

    return {
      body,
      mesh,
      type: 'softBody'
    };
  }

  static createParticleSystem(
    gl: WebGLRenderingContext,
    count: number = 20,
    bounds: { x: number; y: number; width: number; height: number },
    type: 'particle' | 'fluid' | 'softBody' = 'particle'
  ): PhysicsObject[] {
    const particles: PhysicsObject[] = [];
    
    // Scale the bounds to match the physics world scale (0.1)
    const scale = 0.1;
    const scaledBounds = {
      x: bounds.x * scale,
      y: bounds.y * scale,
      width: bounds.width * scale,
      height: bounds.height * scale
    };
    
    console.log('🎭 Creating particles with scaled bounds:', scaledBounds);
    
    for (let i = 0; i < count; i++) {
      const x = scaledBounds.x + Math.random() * scaledBounds.width;
      const y = scaledBounds.y + Math.random() * scaledBounds.height;
      const size = 0.05 + Math.random() * 0.1;
      
      let particle: PhysicsObject;
      
      switch (type) {
        case 'fluid':
          particle = this.createFluidParticle(gl, x, y, size);
          break;
        case 'softBody':
          particle = this.createSoftBody(gl, x, y, size);
          break;
        default:
          particle = this.createParticle(gl, x, y, size);
          break;
      }
      
      particles.push(particle);
    }
    
    return particles;
  }

  static createBoundary(
    x: number,
    y: number,
    width: number,
    height: number,
    isStatic: boolean = true
  ): Matter.Body {
    return Matter.Bodies.rectangle(x, y, width, height, {
      isStatic,
      render: {
        fillStyle: 'transparent',
        strokeStyle: 'transparent'
      }
    });
  }

  static updateShaders(deltaTime: number): void {
    this.updateTime(deltaTime);
  }
}
