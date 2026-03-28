import { useEffect, useRef } from 'react'
import { useGameStore } from '@/hooks/useGameStore'

interface Star {
  x: number
  y: number
  z: number
  r: number
  opacity: number
  speed: number
}

export default function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animFrameRef = useRef<number>(0)
  const { launchPhase } = useGameStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Generate stars
    const count = 300
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * canvas.width,
      r: Math.random() * 1.5 + 0.2,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.5 + 0.1,
    }))

    const isLaunching =
      launchPhase === 'ignition' || launchPhase === 'launched'
    const speedMultiplier = isLaunching ? 8 : 1

    const animate = () => {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Deep space gradient background
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height)
      )
      grad.addColorStop(0, '#040810')
      grad.addColorStop(0.4, '#030508')
      grad.addColorStop(1, '#020306')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Nebula wisps
      const nebulaGrad = ctx.createRadialGradient(
        canvas.width * 0.75,
        canvas.height * 0.3,
        0,
        canvas.width * 0.75,
        canvas.height * 0.3,
        canvas.width * 0.4
      )
      nebulaGrad.addColorStop(0, 'rgba(0, 50, 100, 0.06)')
      nebulaGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = nebulaGrad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const nebulaGrad2 = ctx.createRadialGradient(
        canvas.width * 0.2,
        canvas.height * 0.7,
        0,
        canvas.width * 0.2,
        canvas.height * 0.7,
        canvas.width * 0.35
      )
      nebulaGrad2.addColorStop(0, 'rgba(80, 0, 40, 0.05)')
      nebulaGrad2.addColorStop(1, 'transparent')
      ctx.fillStyle = nebulaGrad2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw stars
      starsRef.current.forEach((star) => {
        const sx = (star.x - canvas.width / 2) * (canvas.width / star.z) + canvas.width / 2
        const sy = (star.y - canvas.height / 2) * (canvas.width / star.z) + canvas.height / 2
        const size = star.r * (canvas.width / star.z) * 0.5

        if (sx < 0 || sx > canvas.width || sy < 0 || sy > canvas.height) {
          star.z = canvas.width
          star.x = Math.random() * canvas.width
          star.y = Math.random() * canvas.height
          return
        }

        // Star color (mostly white, some blue/orange tints)
        const hue = Math.random() > 0.95 ? 30 : Math.random() > 0.92 ? 200 : 0
        const sat = hue > 0 ? '60%' : '0%'
        ctx.beginPath()
        ctx.arc(sx, sy, Math.max(0.3, size), 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue}, ${sat}, 100%, ${star.opacity})`
        ctx.fill()

        // Star trail during launch
        if (isLaunching && size > 0.5) {
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          const trailLen = (canvas.width / star.z) * speedMultiplier * 3
          ctx.lineTo(sx + (sx - canvas.width / 2) * 0.02 * speedMultiplier, sy + trailLen * 0.5)
          ctx.strokeStyle = `hsla(${hue}, ${sat}, 100%, ${star.opacity * 0.3})`
          ctx.lineWidth = Math.max(0.2, size * 0.5)
          ctx.stroke()
        }

        // Move star
        star.z -= star.speed * speedMultiplier
        if (star.z <= 1) {
          star.z = canvas.width
          star.x = Math.random() * canvas.width
          star.y = Math.random() * canvas.height
        }
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [launchPhase])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
