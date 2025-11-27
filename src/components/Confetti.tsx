import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  angle: number
  type: 'circle' | 'square' | 'triangle'
  color: string
}

interface ConfettiHandle {
  trigger: (x: number, y: number, count?: number) => void
}

const COLORS = [
  '#5b9cff',
  '#4a87ff',
  '#ff6b6b',
  '#ffd700',
  '#4ade80',
  '#a78bfa',
  '#06b6d4',
]

const Confetti = forwardRef<ConfettiHandle>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const nextIdRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const animateRef = useRef<(() => void) | null>(null)

  const addConfetti = (x: number, y: number, particleCount: number = 2) => {
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5)
      const velocity = 2 + Math.random() * 2
      const particle: Particle = {
        id: nextIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 1.5,
        life: 1,
        angle: Math.random() * Math.PI * 2,
        type: ['circle', 'square', 'triangle'][
          Math.floor(Math.random() * 3)
        ] as 'circle' | 'square' | 'triangle',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
      particlesRef.current.push(particle)
    }
  }

  useImperativeHandle(ref, () => ({
    trigger: (x: number, y: number, count: number = 4) => {
      addConfetti(x, y, count)
      if (!animationFrameRef.current && animateRef.current) {
        animationFrameRef.current = requestAnimationFrame(animateRef.current)
      }
    }
  }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctxRef.current = ctx

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const animate = () => {
      const particles = particlesRef.current

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]

        // Update physics
        p.vy += 0.1 // gravity
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.96 // air resistance
        p.life -= 0.018
        p.angle += 0.06

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        // Draw particle
        ctx.save()
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)

        if (p.type === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, 5, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.type === 'square') {
          ctx.fillRect(-5, -5, 10, 10)
        } else {
          // triangle
          ctx.beginPath()
          ctx.moveTo(0, -6)
          ctx.lineTo(6, 6)
          ctx.lineTo(-6, 6)
          ctx.closePath()
          ctx.fill()
        }

        ctx.restore()
      }

      if (particles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        animationFrameRef.current = null
      }
    }

    animateRef.current = animate

    const handleClick = (e: MouseEvent) => {
      // Ignore chat button and chat panel clicks
      const target = e.target as HTMLElement
      if (
        target.closest('#chatToggle') ||
        target.closest('[class*="ChatPanel"]') ||
        target.id === 'chatToggle'
      ) {
        return
      }

      const raceWidget = (e.target as HTMLElement).closest('.race-widget')
      
      // For race widget clicks, burst from the center of the widget
      if (raceWidget) {
        const rect = raceWidget.getBoundingClientRect()
        addConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2)
      } else {
        addConfetti(e.clientX, e.clientY)
      }

      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'block',
      }}
    />
  )
})

Confetti.displayName = 'Confetti'

export default Confetti
