interface CpsDisplayProps {
  cps: number
}

export default function CpsDisplay({ cps }: CpsDisplayProps) {
  return (
    <div
      className={`fixed z-[1000] pointer-events-none transition-all select-none ${
        cps > 0 ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        top: '20px',
        right: '20px',
        background: 'var(--cps-bg)',
        color: 'var(--cps-text)',
        padding: '12px 24px',
        borderRadius: '20px',
        fontWeight: 'bold',
        fontSize: '18px',
        transform: cps > 0 ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.8)',
        transitionDuration: '0.5s',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
        lineHeight: '1.4',
      }}
    >
      <div style={{ display: 'block', fontSize: '24px' }}>{cps}</div>
      <div style={{ display: 'block', fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>CPS</div>
    </div>
  )
}
