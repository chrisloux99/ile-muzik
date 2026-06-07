<template>
  <div class="logo3d" :class="[`logo3d--${size}`]">
    <canvas ref="canvasRef" class="logo3d__canvas"></canvas>
    <div class="logo3d__scene">
      <div class="logo3d__text">
        <span class="logo3d__letter logo3d__letter--i">i</span>
        <span class="logo3d__letter logo3d__letter--L">L</span>
        <span class="logo3d__letter logo3d__letter--3">3</span>
        <span class="logo3d__dash">-</span>
        <span class="logo3d__letter logo3d__letter--M">M</span>
        <span class="logo3d__letter logo3d__letter--u">u</span>
        <span class="logo3d__letter logo3d__letter--z">z</span>
        <span class="logo3d__letter logo3d__letter--i2">i</span>
        <span class="logo3d__letter logo3d__letter--K">K</span>
      </div>
      <div class="logo3d__tagline">Sound of Zambia</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{ size?: 'sm' | 'md' | 'lg' | 'xl' }>()

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

    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
      float a=atan(uv.y,uv.x);
      float l=length(uv);

      float v=0.0;
      for(float i=1.0;i<4.0;i++){
        float s=i*.4+t*.2;
        v+=sin(a*i*3.0+s)*.5/(l*i*1.2);
        v+=cos(l*i*4.0-s*2.0)*.3/(i*.8);
      }
      v=abs(v);
      v=pow(v,1.3);

      vec3 orange=vec3(.93,.49,0.0);
      vec3 green=vec3(.098,.54,0.0);
      vec3 red=vec3(.87,.13,.06);
      vec3 col=mix(green,orange,smoothstep(0.0,0.8,v));
      col=mix(col,red,smoothstep(0.6,1.2,v));
      col=mix(vec3(0.02),col,v);

      float glow=smoothstep(0.6,0.0,l)*.2;
      col+=vec3(.098,.54,0.0)*glow;

      float alpha=smoothstep(1.2,0.2,l)*.7*v;
      alpha=max(alpha, smoothstep(0.4,0.0,l)*.15);

      gl_FragColor=vec4(col,alpha);
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

<style scoped lang="scss">
.logo3d {
  perspective: 800px;
  display: inline-block;
  position: relative;

  &--sm { width: 160px; height: 55px; }
  &--md { width: 260px; height: 75px; }
  &--lg { width: 420px; height: 105px; }
  &--xl { width: 540px; height: 135px; }

  &__canvas {
    position: absolute;
    inset: -20px;
    width: calc(100% + 40px);
    height: calc(100% + 40px);
    z-index: 0;
    pointer-events: none;
  }

  &__scene {
    position: relative;
    z-index: 1;
    transform-style: preserve-3d;
    animation: logoFloat 4s ease-in-out infinite;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &__text {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    display: flex;
    align-items: baseline;
    letter-spacing: -0.03em;
    transform-style: preserve-3d;
    position: relative;
  }

  &__letter {
    display: inline-block;
    transform-style: preserve-3d;
    animation: letterSlam 0.6s cubic-bezier(0.17, 0.67, 0.24, 1.2) both;
    position: relative;

    &::before {
      content: attr(data-char);
      position: absolute;
      inset: 0;
      transform: translateZ(-6px);
      opacity: 0.35;
      filter: blur(1px);
    }

    &--i  {
      animation-delay: 0s;
      color: #1aff00;
      text-shadow:
        0 1px 0 #0a7a00,
        0 2px 0 #065200,
        0 3px 0 #043a00,
        0 4px 0 #022800,
        0 5px 12px rgba(0,0,0,0.5),
        0 0 30px rgba(26,255,0,0.4);
    }
    &--L {
      animation-delay: 0.05s;
      color: #00ff6e;
      text-shadow:
        0 1px 0 #009942,
        0 2px 0 #006630,
        0 3px 0 #004d24,
        0 4px 0 #003318,
        0 5px 12px rgba(0,0,0,0.5),
        0 0 30px rgba(0,255,110,0.4);
    }
    &--3 {
      animation-delay: 0.1s;
      background: linear-gradient(180deg, #ff8800 0%, #ff4400 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 1px 0 #992600) drop-shadow(0 2px 0 #661a00) drop-shadow(0 3px 0 #4d1300) drop-shadow(0 5px 12px rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(255,136,0,0.6));
    }
    &--M {
      animation-delay: 0.18s;
      color: #1aff00;
      text-shadow:
        0 1px 0 #0a7a00,
        0 2px 0 #065200,
        0 3px 0 #043a00,
        0 4px 0 #022800,
        0 5px 12px rgba(0,0,0,0.5),
        0 0 30px rgba(26,255,0,0.4);
    }
    &--u {
      animation-delay: 0.23s;
      color: #ff6600;
      text-shadow:
        0 1px 0 #993d00,
        0 2px 0 #662900,
        0 3px 0 #4d1f00,
        0 4px 0 #331500,
        0 5px 12px rgba(0,0,0,0.5),
        0 0 30px rgba(255,102,0,0.4);
    }
    &--z {
      animation-delay: 0.28s;
      color: #00ff6e;
      text-shadow:
        0 1px 0 #009942,
        0 2px 0 #006630,
        0 3px 0 #004d24,
        0 4px 0 #003318,
        0 5px 12px rgba(0,0,0,0.5),
        0 0 30px rgba(0,255,110,0.4);
    }
    &--i2 {
      animation-delay: 0.33s;
      color: #ff6600;
      text-shadow:
        0 1px 0 #993d00,
        0 2px 0 #662900,
        0 3px 0 #4d1f00,
        0 4px 0 #331500,
        0 5px 12px rgba(0,0,0,0.5),
        0 0 30px rgba(255,102,0,0.4);
    }
    &--K {
      animation-delay: 0.38s;
      color: #ff2200;
      text-shadow:
        0 1px 0 #b31800,
        0 2px 0 #7a1100,
        0 3px 0 #520b00,
        0 4px 0 #330700,
        0 5px 12px rgba(0,0,0,0.5),
        0 0 30px rgba(255,34,0,0.5);
    }

    &:hover {
      animation: letterSmash 0.3s ease;
      transform: translateZ(30px) scale(1.15) rotateY(12deg);
    }
  }

  &__dash {
    display: inline-block;
    color: var(--zambia-orange);
    margin: 0 0.05em;
    font-weight: 900;
    animation: letterSlam 0.6s cubic-bezier(0.17, 0.67, 0.24, 1.2) 0.14s both;
    text-shadow:
      0 1px 0 #993d00,
      0 2px 0 #662900,
      0 3px 8px rgba(0,0,0,0.4),
      0 0 15px rgba(239,125,0,0.3);
  }

  &__tagline {
    font-family: 'Inter', sans-serif;
    font-size: 0.65em;
    font-weight: 400;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: rgba(239,125,0,0.55);
    margin-top: 2px;
    animation: fadeIn 0.8s ease 0.6s both;
  }

  &--sm &__text { font-size: 1.5rem; }
  &--sm &__tagline { font-size: 0.55rem; letter-spacing: 0.25em; }
  &--md &__text { font-size: 2.4rem; }
  &--md &__tagline { font-size: 0.65rem; }
  &--lg &__text { font-size: 3.8rem; }
  &--lg &__tagline { font-size: 0.8rem; }
  &--xl &__text { font-size: 5.2rem; }
  &--xl &__tagline { font-size: 0.95rem; }
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0) rotateX(5deg); }
  50% { transform: translateY(-4px) rotateX(-3deg); }
}

@keyframes letterSlam {
  0% { transform: translateZ(-80px) rotateX(90deg); opacity: 0; }
  50% { transform: translateZ(10px) rotateX(-5deg); opacity: 1; }
  100% { transform: translateZ(0) rotateX(0); opacity: 1; }
}

@keyframes letterSmash {
  0% { transform: translateZ(0) scale(1); }
  40% { transform: translateZ(40px) scale(1.2) rotateY(20deg); }
  100% { transform: translateZ(0) scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
