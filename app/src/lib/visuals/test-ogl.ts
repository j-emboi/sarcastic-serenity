// Test file to verify OGL imports
import { Transform, Program, Mesh, Plane, Box, Sphere, Renderer, Camera } from 'ogl';

console.log('OGL imports successful!');
console.log('Available classes:', { Transform, Program, Mesh, Plane, Box, Sphere, Renderer, Camera });

export function testOGL() {
  const transform = new Transform();
  console.log('Transform created successfully:', transform);
  return true;
}
