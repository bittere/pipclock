interface ClickParticleProps {
  x: number
  y: number
  id: number
}

export default function ClickParticle({ x, y, id }: ClickParticleProps) {
  return (
    <div
      key={id}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 9999,
        animation: 'particle-burst 0.6s ease-out forwards',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          background: 'linear-gradient(135deg, #5b9cff, #4a87ff)',
          borderRadius: '50%',
          boxShadow: '0 0 10px rgba(91, 156, 255, 0.6)',
        }}
      />
    </div>
  )
}
