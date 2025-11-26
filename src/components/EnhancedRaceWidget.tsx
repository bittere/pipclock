import React, { useState, useRef } from 'react'

interface Ripple {
  x: number
  y: number
  id: number
}

interface RaceState {
  raceId: string
  clickCount: number
  progress: number
  remaining: number
  raceStartTime?: number
}

interface CompletedRace {
  raceId: string
  finalCps: number
  clickCount: number
}

interface EnhancedRaceWidgetProps {
  raceData: { raceId: string }
  activeRace: RaceState | null
  completedRace: CompletedRace | null
  onStart: () => void
}

export default function EnhancedRaceWidget({
  raceData,
  activeRace,
  completedRace,
  onStart,
}: EnhancedRaceWidgetProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const widgetRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    // Don't allow clicks if race is completed
    if (completedRace?.raceId === raceData.raceId) {
      return
    }

    if (activeRace) {
      // Create ripple effect
      const rect = widgetRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now()

        setRipples((prev) => [...prev, { x, y, id }])
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id))
        }, 600)
      }
    } else if (!completedRace || completedRace.raceId !== raceData.raceId) {
      onStart()
    }
  }

  const isActive = activeRace?.raceId === raceData.raceId
  const isCompleted = completedRace?.raceId === raceData.raceId
  const clickCount = activeRace?.clickCount || 0
  const remaining = activeRace?.remaining || 5
  const progress = activeRace?.progress || 0
  const cps = remaining < 5 ? clickCount / (5 - remaining) : 0

  return (
    <div
      ref={widgetRef}
      onClick={handleClick}
      style={{
        background: isCompleted
          ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(100, 150, 255, 0.05) 100%)'
          : isActive
          ? 'linear-gradient(135deg, rgba(91, 156, 255, 0.2) 0%, rgba(100, 150, 255, 0.15) 100%)'
          : 'linear-gradient(135deg, rgba(91, 156, 255, 0.1) 0%, rgba(100, 150, 255, 0.05) 100%)',
        border: isCompleted
          ? '2px solid rgba(76, 175, 80, 0.4)'
          : isActive ? '2px solid rgba(91, 156, 255, 0.5)' : '2px solid rgba(91, 156, 255, 0.2)',
        borderRadius: '24px',
        padding: '28px',
        cursor: isCompleted ? 'not-allowed' : 'pointer',
        opacity: isCompleted ? 0.85 : 1,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        textAlign: 'center',
        minWidth: '300px',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: isCompleted
          ? '0 4px 12px rgba(76, 175, 80, 0.2)'
          : isActive
          ? '0 8px 32px rgba(91, 156, 255, 0.3), inset 0 0 60px rgba(91, 156, 255, 0.1)'
          : '0 4px 16px rgba(0, 0, 0, 0.1)',
        transform: isCompleted ? 'scale(1)' : isActive ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Background pulse effect when active */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(91, 156, 255, 0.15) 0%, transparent 70%)',
            animation: 'pulse-bg 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Click ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple-expand 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}

      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '20px',
          color: 'var(--text-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: '24px' }}>🏆</span>
        <span>CPS Race</span>
        {isActive && (
          <span
            style={{
              fontSize: '12px',
              background: 'linear-gradient(90deg, #ff4757, #ff6348)',
              color: 'white',
              padding: '3px 10px',
              borderRadius: '12px',
              fontWeight: 700,
              animation: 'pulse 1s ease-in-out infinite',
              boxShadow: '0 2px 8px rgba(255, 71, 87, 0.4)',
            }}
          >
            LIVE
          </span>
        )}
      </div>

      {isCompleted ? (
        <>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '20px',
              color: 'var(--text-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span style={{ fontSize: '24px' }}>✅</span>
            <span>Race Completed</span>
          </div>

          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #76c043 0%, #4caf50 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px',
              animation: 'score-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {completedRace!.finalCps.toFixed(2)}
          </div>

          <div
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
              fontWeight: 600,
              position: 'relative',
              zIndex: 1,
            }}
          >
            CPS
          </div>

          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              position: 'relative',
              zIndex: 1,
              opacity: 0.8,
            }}
          >
            {completedRace!.clickCount} total clicks
          </div>
        </>
      ) : isActive ? (
        <>
          <div
            key={clickCount}
            style={{
              fontSize: '72px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #5b9cff 0%, #4a87ff 50%, #667eea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px',
              animation: 'click-pop 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              zIndex: 1,
              letterSpacing: '-2px',
            }}
          >
            {clickCount}
          </div>

          <div
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              marginBottom: '20px',
              fontWeight: 600,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span
              style={{
                color: remaining < 2 ? '#ff4757' : 'var(--text-color)',
                fontSize: remaining < 2 ? '20px' : '16px',
                fontWeight: remaining < 2 ? 700 : 600,
                transition: 'all 0.2s ease',
              }}
            >
              {remaining.toFixed(1)}s
            </span>
            {' '}remaining
          </div>

          {/* Enhanced progress bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(128, 128, 128, 0.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: '100%',
                background:
                  remaining < 2
                    ? 'linear-gradient(90deg, #ff4757 0%, #ff6348 100%)'
                    : 'linear-gradient(90deg, #5b9cff 0%, #4a87ff 50%, #667eea 100%)',
                width: `${progress}%`,
                borderRadius: '4px',
                transition: 'width 0.05s linear, background 0.3s ease',
                boxShadow:
                  remaining < 2
                    ? '0 0 10px rgba(255, 71, 87, 0.6)'
                    : '0 0 10px rgba(91, 156, 255, 0.6)',
                position: 'relative',
              }}
            >
              {/* Shine effect on progress bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  animation: 'progress-shine 1.5s infinite',
                }}
              />
            </div>
          </div>

          {/* CPS calculation */}
          {remaining < 5 && (
            <div
              style={{
                marginTop: '16px',
                fontSize: '14px',
                color: 'var(--accent)',
                fontWeight: 600,
                animation: 'fade-in 0.3s ease-in',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {cps.toFixed(2)} CPS
            </div>
          )}
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #5b9cff 0%, #667eea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            START
          </div>
          <div
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              position: 'relative',
              zIndex: 1,
            }}
          >
            Click to begin 5s race
          </div>
        </>
      )}
    </div>
  )
}
