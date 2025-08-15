export class WebGLDiagnostic {
  static checkWebGLSupport(): {
    supported: boolean;
    context: string;
    vendor: string;
    renderer: string;
    version: string;
    extensions: string[];
    maxTextureSize: number;
    maxViewportDims: [number, number];
    errors: string[];
  } {
    const result = {
      supported: false,
      context: '',
      vendor: '',
      renderer: '',
      version: '',
      extensions: [] as string[],
      maxTextureSize: 0,
      maxViewportDims: [0, 0] as [number, number],
      errors: [] as string[]
    };

    try {
      // Check for WebGL2 first, then fallback to WebGL1
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) {
        result.errors.push('WebGL not supported in this browser');
        return result;
      }

      result.supported = true;
      result.context = gl instanceof WebGL2RenderingContext ? 'WebGL2' : 'WebGL1';
      
      // Get GPU information
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        result.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        result.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
      
      result.version = gl.getParameter(gl.VERSION);
      result.extensions = gl.getSupportedExtensions() || [];
      result.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      result.maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);

      // Test basic shader compilation
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      
      if (vertexShader && fragmentShader) {
        gl.shaderSource(vertexShader, `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `);
        
        gl.shaderSource(fragmentShader, `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          }
        `);
        
        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
          result.errors.push('Vertex shader compilation failed: ' + gl.getShaderInfoLog(vertexShader));
        }
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
          result.errors.push('Fragment shader compilation failed: ' + gl.getShaderInfoLog(fragmentShader));
        }
      }

      console.log('WebGL Diagnostic Results:', result);
      return result;
      
    } catch (error) {
      result.errors.push(`WebGL diagnostic failed: ${error}`);
      console.error('WebGL Diagnostic Error:', error);
      return result;
    }
  }

  static logPerformanceInfo(): void {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      console.error('WebGL not available for performance testing');
      return;
    }

    console.log('=== WebGL Performance Info ===');
    console.log('Context:', gl instanceof WebGL2RenderingContext ? 'WebGL2' : 'WebGL1');
    console.log('Max Texture Size:', gl.getParameter(gl.MAX_TEXTURE_SIZE));
    console.log('Max Viewport Dimensions:', gl.getParameter(gl.MAX_VIEWPORT_DIMS));
    console.log('Max Vertex Uniform Vectors:', gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
    console.log('Max Fragment Uniform Vectors:', gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
    console.log('Max Vertex Attributes:', gl.getParameter(gl.MAX_VERTEX_ATTRIBS));
    console.log('Max Vertex Uniform Components:', gl.getParameter(gl.MAX_VERTEX_UNIFORM_COMPONENTS));
    console.log('Max Fragment Uniform Components:', gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_COMPONENTS));
    console.log('Max Varying Vectors:', gl.getParameter(gl.MAX_VARYING_VECTORS));
    console.log('Max Combined Texture Image Units:', gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS));
    console.log('Max Vertex Texture Image Units:', gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS));
    console.log('Max Texture Image Units:', gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
    console.log('Max Renderbuffer Size:', gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
    console.log('================================');
  }
}
