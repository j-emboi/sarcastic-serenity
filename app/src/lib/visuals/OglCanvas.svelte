<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Renderer, Geometry, Program, Mesh } from 'ogl';
  let canvas: HTMLCanvasElement;
  let renderer: Renderer;
  let raf = 0;
  let program: Program;
  let mesh: Mesh;
  let gl: WebGLRenderingContext | WebGL2RenderingContext;
  let sceneIdx = 0;

  const scenes = [
    // Marble flow-like
    `precision highp float; uniform float u_time; uniform vec2 u_res; 
     float hash(vec2 p){return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453);} 
     float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); 
       float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
       vec2 u=f*f*(3.-2.*f); return mix(a,b,u.x)+ (c-a)*u.y*(1.-u.x)+ (d-b)*u.x*u.y; }
     void main(){ vec2 uv=gl_FragCoord.xy/u_res; vec2 p=uv*3.0; 
       float t=u_time*0.1; 
       float n=0.0; 
       for(int i=0;i<5;i++){ n += 0.5/float(i+1)*noise(p + t*vec2(0.6,0.4)); p*=1.6; }
       float c=0.5+0.5*sin(6.283*(n)+t*2.0);
       gl_FragColor=vec4(vec3(c*0.8 + 0.2*uv.y),1.0); }`,
    // Soft blobs/metaballs (fake with sin bands)
    `precision highp float; uniform float u_time; uniform vec2 u_res; 
     void main(){ vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.; uv.x*=u_res.x/u_res.y; 
       float t=u_time*0.8; 
       vec2 p1=vec2(sin(t*0.7), cos(t*0.9))*0.5; 
       vec2 p2=vec2(sin(t*1.3+1.0), cos(t*1.1+2.0))*0.6; 
       float d=0.35/length(uv-p1)+0.35/length(uv-p2); 
       float c=smoothstep(0.9,1.1,d); 
       gl_FragColor=vec4(mix(vec3(0.05,0.1,0.15), vec3(0.9,0.6,0.8), c),1.0); }`,
    // Kaleidoscope vibes
    `precision highp float; uniform float u_time; uniform vec2 u_res; 
     vec2 rot(vec2 p,float a){float c=cos(a), s=sin(a); return mat2(c,-s,s,c)*p;} 
     void main(){ vec2 uv=(gl_FragCoord.xy/u_res)-0.5; uv.x*=u_res.x/u_res.y; 
       float t=u_time*0.4; uv=rot(uv,t*0.5); uv=abs(mod(uv*4.0,1.0)-0.5); 
       float v=sin(10.0*uv.x)+cos(10.0*uv.y)+sin(10.0*(uv.x+uv.y+t)); 
       v = 0.5+0.5*sin(v*0.7+t*2.0); gl_FragColor=vec4(vec3(v),1.0);} `
  ];

  function makeProgram(idx: number) {
    const { width, height } = canvas.getBoundingClientRect();
    const geometry = new Geometry(gl as any, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) }
    });
    program = new Program(gl as any, {
      vertex: `attribute vec2 position; void main(){ gl_Position = vec4(position,0.0,1.0);} `,
      fragment: scenes[idx % scenes.length],
      uniforms: { u_time: { value: 0 }, u_res: { value: [width, height] } }
    });
    mesh = new Mesh(gl as any, { geometry, program });
  }

  onMount(() => {
    renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio, 2) });
    gl = renderer.gl;
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    makeProgram(sceneIdx);

    const loop = (t: number) => {
      program.uniforms.u_time.value = t * 0.001;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      program.uniforms.u_res.value = [w, h];
    };
    window.addEventListener('resize', onResize);

    const change = () => {
      sceneIdx = (sceneIdx + 1) % scenes.length;
      makeProgram(sceneIdx);
    };
    const sceneTimer = setInterval(change, 15000);

    onDestroy(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      clearInterval(sceneTimer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    });
  });
</script>

<canvas bind:this={canvas} class="fixed inset-0 -z-10 h-screen w-screen"></canvas>


