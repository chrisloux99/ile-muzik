<template>
  <div class="cosmos">
    <canvas ref="canvas" class="cosmos__canvas"></canvas>
    <div class="cosmos__aurora"></div>
    <div class="cosmos__grid"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref<HTMLCanvasElement>()
let animId = 0

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  hue: number
  alpha: number
  life: number
  maxLife: number
}

onMounted(() => {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx || !canvas.value) return

  const resize = () => {
    canvas.value!.width = window.innerWidth
    canvas.value!.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const particles: Particle[] = []
  const maxParticles = 60

  function spawnParticle(): Particle {
    return {
      x: Math.random() * canvas.value!.width,
      y: Math.random() * canvas.value!.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      hue: Math.random() > 0.5 ? 260 : 190,
      alpha: Math.random() * 0.4 + 0.1,
      life: 0,
      maxLife: Math.random() * 400 + 200,
    }
  }

  for (let i = 0; i < maxParticles; i++) {
    particles.push(spawnParticle())
  }

  function draw() {
    if (!ctx || !canvas.value) return
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const alpha = (1 - dist / 150) * 0.08
          ctx.beginPath()
          ctx.strokeStyle = `hsla(${particles[i].hue}, 70%, 70%, ${alpha})`
          ctx.lineWidth = 0.5
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }

    // Draw and update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.life++

      const lifeRatio = p.life / p.maxLife
      const fade = lifeRatio < 0.1 ? lifeRatio * 10 : lifeRatio > 0.9 ? (1 - lifeRatio) * 10 : 1
      const alpha = p.alpha * fade

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue}, 70%, 75%, ${alpha})`
      ctx.fill()

      // Glow
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${alpha * 0.15})`
      ctx.fill()

      if (p.life >= p.maxLife || p.x < -20 || p.x > canvas.value.width + 20 || p.y < -20 || p.y > canvas.value.height + 20) {
        particles[i] = spawnParticle()
      }
    }

    animId = requestAnimationFrame(draw)
  }

  draw()

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
  })
})
</script>

<style scoped lang="scss">
.cosmos {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;

  &__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  &__aurora {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 20% 80%, rgba(120, 80, 255, 0.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(0, 229, 255, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse 50% 60% at 50% 50%, rgba(255, 171, 0, 0.03) 0%, transparent 40%);
    animation: auroraShift 20s ease-in-out infinite alternate;
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(120, 80, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(120, 80, 255, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%);
  }
}

@keyframes auroraShift {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
