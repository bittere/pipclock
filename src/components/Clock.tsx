import { useState, useEffect } from 'react'

export default function Clock() {
  const [time, setTime] = useState('00:00')

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setTime(`${hours}:${minutes}`)
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className="font-bold text-[var(--text-color)] mb-[60px] transition-all select-none"
      style={{
        fontSize: '140px',
        fontWeight: 700,
        letterSpacing: '-4px',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        color: 'var(--text-color)',
      }}
    >
      {time}
    </div>
  )
}
