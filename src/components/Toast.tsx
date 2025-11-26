export default function Toast() {
  return (
    <div
      id="toastNotification"
      className="select-none"
      style={{
        position: 'fixed',
        bottom: '40px',
        right: '40px',
        background: 'rgba(58, 58, 63, 0.9)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '16px',
        opacity: 0,
        transform: 'translateY(120%) scale(0.75)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 10000,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        pointerEvents: 'none',
        maxWidth: '320px',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Message</div>
      <div style={{ fontSize: '14px', opacity: 0.95 }}>Content</div>
    </div>
  )
}
