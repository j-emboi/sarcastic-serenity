import { Transform, Program, Mesh, Plane, Box, Sphere } from 'ogl';
import type { VisualScene } from '../engine';

export abstract class BaseScene extends Transform implements VisualScene {
  abstract id: string;
  abstract name: string;
  
  protected meshes: Mesh[] = [];
  protected programs: Program[] = [];
  protected time: number = 0;

  constructor() {
    super();
  }

  abstract init(gl: any): void;
  abstract update(deltaTime: number, audioLevel?: number, serendipity?: number): void;

  destroy(): void {
    // Clean up meshes
    this.meshes.forEach(mesh => {
      if (mesh.geometry) {
        // OGL doesn't have removeAttribute, just let it be garbage collected
      }
      if (mesh.program) {
        mesh.program.remove();
      }
    });

    // Clean up programs
    this.programs.forEach(program => {
      program.remove();
    });

    // Clear arrays
    this.meshes = [];
    this.programs = [];
  }

  protected addMesh(mesh: Mesh): void {
    this.meshes.push(mesh);
    this.addChild(mesh);
  }

  protected addProgram(program: Program): void {
    this.programs.push(program);
  }

  getScene(): Transform {
    return this;
  }

  protected createBasicVertexShader(): string {
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

  protected createBasicFragmentShader(): string {
    return /* glsl */ `
      precision highp float;
      
      varying vec2 vUv;
      uniform float time;
      uniform float audioLevel;
      uniform float serendipity;
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.1, 0.2, 0.3);
        gl_FragColor = vec4(color, 0.5);
      }
    `;
  }
}
