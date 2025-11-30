import { useEffect, useState } from 'react'

interface ClockProps {
  showSeconds?: boolean
  currentTime: Date
}

export default function Clock({ showSeconds = false, currentTime }: ClockProps) {
  const [time, setTime] = useState('00:00')

  useEffect(() => {
    const hours = String(currentTime.getHours()).padStart(2, '0')
    const minutes = String(currentTime.getMinutes()).padStart(2, '0')
    const seconds = String(currentTime.getSeconds()).padStart(2, '0')
    setTime(showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`)
  }, [currentTime, showSeconds])

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
