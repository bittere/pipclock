import { useState, useEffect, useRef, useCallback } from 'react'
import Clock from './components/Clock'
import ChatPanel from './components/ChatPanel'
import CpsDisplay from './components/CpsDisplay'
import Toast from './components/Toast'
import Confetti from './components/Confetti'
import { useChat, RaceEvent } from './hooks/useChat'

function App() {
  const [isDark, setIsDark] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [cps, setCps] = useState(0)
  const [isRaceActive, setIsRaceActive] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasRaceNotification, setHasRaceNotification] = useState(false)
  const [isPipActive, setIsPipActive] = useState(false)
  const clickCountRef = useRef(0)
  const cpsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const raceRef = useRef<any>(null)
  const confettiRef = useRef<any>(null)
  const pipAnimationRef = useRef<number | null>(null)
  const unreadCountRef = useRef(0)
  const raceActiveRef = useRef(false)
  const frameCountRef = useRef(0)
  const hasRaceNotificationRef = useRef(false)

  // Initialize chat at app level (only once per app)
  const chatContext = useChat(
    useCallback((event: RaceEvent) => {
      if (event.type === 'leaderboard_update' && raceRef.current) {
        raceRef.current.updateLeaderboard(event.leaderboard || [], event.raceId)
      }
    }, []),
    undefined,
    useCallback(() => {
      if (!chatOpen) {
        setUnreadCount(prev => prev + 1)
      }
    }, [chatOpen]),
    useCallback(() => {
      setHasRaceNotification(true)
    }, [])
  )

  // Simple setter for race ref
  const setRaceRef = useCallback((r: any) => {
    raceRef.current = r
  }, [])

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light'
    setIsDark(theme === 'dark')
    updateTheme(theme === 'dark')
  }, [])

  // Keep ref in sync with unread count
  useEffect(() => {
    unreadCountRef.current = unreadCount
  }, [unreadCount])

  // Keep ref in sync with race active state
  useEffect(() => {
    raceActiveRef.current = isRaceActive
    if (isRaceActive) {
      setHasRaceNotification(true)
    } else {
      setHasRaceNotification(false)
    }
  }, [isRaceActive])

  // Keep ref in sync with race notification
  useEffect(() => {
    hasRaceNotificationRef.current = hasRaceNotification
  }, [hasRaceNotification])

  const updateTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
    updateTheme(newDark)
  }

  useEffect(() => {
    // Track clicks in a rolling 1-second window
    const clickTimestamps: number[] = []
    let lastVisibleTime = 0
    const cpsVisibleDuration = 2000 // Keep visible for 2 seconds after last click

    cpsIntervalRef.current = setInterval(() => {
      const now = Date.now()
      
      // Remove clicks older than 1 second
      while (clickTimestamps.length > 0 && now - clickTimestamps[0] > 1000) {
        clickTimestamps.shift()
      }
      
      // Add new clicks from this frame
      for (let i = 0; i < clickCountRef.current; i++) {
        clickTimestamps.push(now)
      }
      
      const cpsValue = clickTimestamps.length
      
      // Keep showing CPS if >= 4 or recently was >= 4
      if (cpsValue >= 4) {
        lastVisibleTime = now
        setCps(cpsValue)
      } else if (now - lastVisibleTime < cpsVisibleDuration) {
        setCps(cpsValue >= 4 ? cpsValue : 0)
      } else {
        setCps(0)
      }
      
      clickCountRef.current = 0
    }, 100)

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
      clickCountRef.current++
    }

    const handlePipExit = () => {
      setIsPipActive(false)
      if (pipAnimationRef.current) {
        cancelAnimationFrame(pipAnimationRef.current)
        pipAnimationRef.current = null
      }
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('leavepictureinpicture', handlePipExit)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('leavepictureinpicture', handlePipExit)
      if (cpsIntervalRef.current) {
        clearInterval(cpsIntervalRef.current)
      }
    }
  }, [])

  return (
    <div 
      className="w-screen h-screen overflow-hidden transition-colors select-none"
      style={{
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        animation: isRaceActive ? 'none' : 'none',
      }}
    >
      {!isRaceActive && <CpsDisplay cps={cps} />}
      
      {/* Race active indicator */}
      {isRaceActive && (
        <div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5b9cff] via-[#4a87ff] to-[#5b9cff] z-[1000]"
          style={{
            animation: 'race-shine 1.5s infinite',
            backgroundSize: '200% 100%',
            boxShadow: '0 0 20px rgba(91, 156, 255, 0.6)',
          }}
        />
      )}
      <Confetti ref={confettiRef} />
      <Toast />
      
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} chatContext={chatContext} setRaceRef={setRaceRef} onRaceStatusChange={setIsRaceActive} confettiRef={confettiRef} />
      
      <div 
        className="flex flex-col items-center justify-center h-full transition-all"
        style={{
          marginLeft: chatOpen ? '500px' : '0',
          transitionDuration: '0.4s',
          transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        <Clock />
        
        <div className="flex gap-4 items-center">
          <button
            id="pipButton"
            onClick={async () => {
               if (isPipActive) {
                 // Close PiP
                 try {
                   if (document.pictureInPictureElement) {
                     await document.exitPictureInPicture()
                   }
                   // Cancel animation
                   if (pipAnimationRef.current) {
                     cancelAnimationFrame(pipAnimationRef.current)
                     pipAnimationRef.current = null
                   }
                   // Stop video stream
                   const video = document.getElementById('pipVideo') as HTMLVideoElement
                   if (video && video.srcObject) {
                     const stream = video.srcObject as MediaStream
                     stream.getTracks().forEach(track => track.stop())
                     video.srcObject = null
                   }
                   setIsPipActive(false)
                 } catch (err) {
                   console.error('Failed to exit PiP:', err)
                 }
              } else {
                // Open PiP
                const canvas = document.getElementById('clockCanvas') as HTMLCanvasElement
                const video = document.getElementById('pipVideo') as HTMLVideoElement
                if (!canvas || !video) return
                
                try {
                   // Wait for all fonts to load
                   await document.fonts.ready
                   
                   // Set canvas size (this automatically clears it)
                   canvas.width = 1280
                   canvas.height = 720
                  
                  let lastTime = ''
                   let lastBgColor = ''
                   let lastTextColor = ''
                   let lastUnreadCount = unreadCountRef.current
                   let firstFrame = true
                   
                   // Function to draw the clock
                   const drawClock = () => {
                     const ctx = canvas.getContext('2d')
                     if (!ctx) return
                     
                     const now = new Date()
                     const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                     
                     // Read current theme colors from CSS variables
                     const styles = getComputedStyle(document.documentElement)
                     const bgColor = styles.getPropertyValue('--bg-color').trim()
                     const textColor = styles.getPropertyValue('--text-color').trim()
                     
                     // Always redraw on first frame, or if time changed, colors changed, or unread count changed
                     if (!firstFrame && time === lastTime && bgColor === lastBgColor && textColor === lastTextColor && unreadCountRef.current === lastUnreadCount) return
                     firstFrame = false
                     lastTime = time
                     lastBgColor = bgColor
                     lastTextColor = textColor
                     lastUnreadCount = unreadCountRef.current
                     
                     // Clear and fill background
                     ctx.fillStyle = bgColor
                     ctx.fillRect(0, 0, canvas.width, canvas.height)
                    
                    // Draw the time
                    ctx.fillStyle = textColor
                    ctx.font = '700 400px "Inter", -apple-system, BlinkMacSystemFont, sans-serif'
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(time, canvas.width / 2, canvas.height / 2)
                    
                    // Draw notification badge if there are unread messages or race notification
                    if (unreadCountRef.current > 0 || hasRaceNotificationRef.current) {
                      const badgeX = canvas.width - 120
                      const badgeY = 100
                      
                      if (hasRaceNotificationRef.current && (raceActiveRef.current || unreadCountRef.current === 0)) {
                        // Race notification - animated trophy/star badge
                        const pulseScale = 1 + Math.sin(frameCountRef.current * 0.1) * 0.1
                        const badgeRadius = 70 * pulseScale
                        
                        // Draw outer glow
                        ctx.fillStyle = 'rgba(255, 193, 7, 0.3)'
                        ctx.beginPath()
                        ctx.arc(badgeX, badgeY, badgeRadius + 20, 0, Math.PI * 2)
                        ctx.fill()
                        
                        // Draw main badge circle
                        ctx.fillStyle = '#ffc107'
                        ctx.beginPath()
                        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2)
                        ctx.fill()
                        
                        // Draw trophy icon
                        ctx.fillStyle = '#ffffff'
                        ctx.font = '700 100px Arial'
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'middle'
                        ctx.fillText('🏆', badgeX, badgeY)
                      } else {
                        // Message notification - pulsing red badge
                        const pulseScale = 1 + Math.sin(frameCountRef.current * 0.08) * 0.15
                        const badgeRadius = 60 * pulseScale
                        
                        // Draw pulsing glow
                        const glowAlpha = 0.3 + Math.sin(frameCountRef.current * 0.08) * 0.2
                        ctx.fillStyle = `rgba(255, 59, 48, ${glowAlpha})`
                        ctx.beginPath()
                        ctx.arc(badgeX, badgeY, badgeRadius + 15, 0, Math.PI * 2)
                        ctx.fill()
                        
                        // Draw main badge circle
                        ctx.fillStyle = '#ff3b30'
                        ctx.beginPath()
                        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2)
                        ctx.fill()
                        
                        // Draw notification count
                        ctx.fillStyle = '#ffffff'
                        ctx.font = '700 80px "Inter", -apple-system, BlinkMacSystemFont, sans-serif'
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'middle'
                        const badgeText = unreadCountRef.current > 9 ? '9+' : unreadCountRef.current.toString()
                        ctx.fillText(badgeText, badgeX, badgeY)
                      }
                    }
                  }
                  
                  // Stop any existing stream first
                  if (video.srcObject) {
                    const oldStream = video.srcObject as MediaStream
                    oldStream.getTracks().forEach(track => track.stop())
                  }
                  
                  // Draw initial frame synchronously
                  drawClock()
                  
                  // Create stream from canvas BEFORE animation starts
                  const stream = canvas.captureStream(30)
                  video.srcObject = stream
                  
                  // Start continuous animation after stream is created
                  const animate = () => {
                    frameCountRef.current++
                    drawClock()
                    pipAnimationRef.current = requestAnimationFrame(animate)
                  }
                  if (pipAnimationRef.current) {
                    cancelAnimationFrame(pipAnimationRef.current)
                  }
                  pipAnimationRef.current = requestAnimationFrame(animate)
                  
                  // Play the video to ensure stream flows
                  await video.play().catch(() => {
                    // Ignore play errors, video doesn't need to actually play
                  })
                  
                  // Wait for stream to have frames
                  await new Promise<void>((resolve) => {
                    setTimeout(resolve, 200)
                  })
                  
                  await video.requestPictureInPicture()
                  setIsPipActive(true)
                } catch (err) {
                  console.error('PiP failed:', err)
                }
              }
            }}
            className="flex items-center justify-center gap-2.5"
            style={{
              padding: '16px 36px',
              fontSize: '17px',
              fontWeight: 500,
              background: 'var(--button-bg)',
              color: 'var(--button-text)',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              letterSpacing: '-0.2px',
              lineHeight: 1.6,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement
              btn.style.background = 'var(--button-hover)'
              btn.style.transform = 'translateY(-2px)'
              btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement
              btn.style.background = 'var(--button-bg)'
              btn.style.transform = 'translateY(0)'
              btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"/>
            </svg>
            {isPipActive ? 'Exit Picture in Picture' : 'Picture in Picture'}
          </button>

          <button
            onClick={toggleTheme}
            style={{
              padding: '14px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'var(--button-bg)',
              color: 'var(--button-text)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement
              btn.style.background = 'var(--button-hover)'
              btn.style.transform = 'translateY(-2px)'
              btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement
              btn.style.background = 'var(--button-bg)'
              btn.style.transform = 'translateY(0)'
              btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        onClick={() => {
          setChatOpen(!chatOpen)
          if (!chatOpen) {
            setUnreadCount(0)
            setHasRaceNotification(false)
          }
        }}
        id="chatToggle"
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '40px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          padding: 0,
          background: 'var(--button-bg)',
          color: 'var(--button-text)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 998,
          border: 'none',
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)'
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'
        }}
        aria-label="Toggle Chat"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        {hasRaceNotification ? (
          <span id="notificationBadge" className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center text-lg" style={{ animation: 'pulse 1s infinite' }}>
            🏆
          </span>
        ) : unreadCount > 0 ? (
          <span id="notificationBadge" className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ animation: 'pulse 2s infinite' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      <canvas id="clockCanvas" width="1280" height="720" style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}></canvas>
      <video id="pipVideo" autoPlay muted style={{ display: 'none' }}></video>
    </div>
  )
}

export default App
