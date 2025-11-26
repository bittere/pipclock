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
    <div className="text-9xl font-bold text-[var(--text-color)] mb-16 font-variant-numeric-tabular tracking-tighter transition-all">
      {time}
    </div>
  )
}
