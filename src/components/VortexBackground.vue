<template>
  <canvas ref="canvasRef" class="vortex-bg"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()
let animId = 0

onMounted(() => {
  const canvas = canvasRef.value!
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
  if (!gl) return

  const vsrc = `
    attribute vec2 p;
    void main(){ gl_Position=vec4(p,0,1); }
  `
  const fsrc = `
    precision mediump float;
    uniform float t;
    uniform vec2 r;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
      float a=atan(uv.y,uv.x);
      float l=length(uv);
      float v=0.0;
      for(float i=1.0;i<4.0;i++){
        float s=i*.4+t*.15;
        v+=sin(a*i*3.0+s)*.5/(l*i*1.2);
        v+=cos(l*i*4.0-s*2.0)*.3/(i*.8);
      }
      v=abs(v);
      v=pow(v,1.4);

      vec3 orange=vec3(.93,.49,0.0);
      vec3 green=vec3(.098,.54,0.0);
      vec3 col=mix(green,orange,smoothstep(0.0,1.0,v));
      col=mix(vec3(0.02),col,v);
      col+=vec3(.04)*smoothstep(0.6,0.0,l);

      float glow=smoothstep(0.8,0.0,l)*.15;
      col+=vec3(0.098,.54,0.0)*glow;

      gl_FragColor=vec4(col,smoothstep(1.5,0.3,l)*.92);
    }
  `

  function compile(type: number, src: string) {
    const s = gl!.createShader(type)!
    gl!.shaderSource(s, src)
    gl!.compileShader(s)
    return s
  }

  const pg = gl.createProgram()!
  gl.attachShader(pg, compile(gl.VERTEX_SHADER, vsrc))
  gl.attachShader(pg, compile(gl.FRAGMENT_SHADER, fsrc))
  gl.linkProgram(pg)
  gl.useProgram(pg)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(pg, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const tLoc = gl.getUniformLocation(pg, 't')!
  const rLoc = gl.getUniformLocation(pg, 'r')!

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  let needsResize = true

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2)
    canvas!.width = canvas!.clientWidth * dpr
    canvas!.height = canvas!.clientHeight * dpr
    gl!.viewport(0, 0, canvas!.width, canvas!.height)
    needsResize = true
  }

  function draw(now: number) {
    if (needsResize) {
      gl!.uniform2f(rLoc, canvas!.width, canvas!.height)
      needsResize = false
    }
    gl!.clearColor(0, 0, 0, 0)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    gl!.uniform1f(tLoc, now * 0.001)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    animId = requestAnimationFrame(draw)
  }

  resize()
  animId = requestAnimationFrame(draw)
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
})
</script>

<style scoped>
.vortex-bg {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}
</style>
