import { useState, useEffect, useRef, useCallback } from 'react'
import Clock from './components/Clock'
import ChatPanel from './components/ChatPanel'
import CpsDisplay from './components/CpsDisplay'
import Toast from './components/Toast'
import { useChat, RaceEvent } from './hooks/useChat'

function App() {
  const [isDark, setIsDark] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [cps, setCps] = useState(0)
  const clickCountRef = useRef(0)
  const cpsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const raceRef = useRef<any>(null)

  // Initialize chat at app level (only once per app)
  const chatContext = useChat(
    useCallback((event: RaceEvent) => {
      if (event.type === 'race_started' && raceRef.current) {
        raceRef.current.startRace(event.raceId!)
      } else if (event.type === 'leaderboard_update' && raceRef.current) {
        raceRef.current.updateLeaderboard(event.leaderboard || [])
      }
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

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
      if (cpsIntervalRef.current) {
        clearInterval(cpsIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="w-screen h-screen bg-[var(--bg-color)] text-[var(--text-color)] overflow-hidden transition-colors">
      <CpsDisplay cps={cps} />
      <Toast />
      
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} chatContext={chatContext} setRaceRef={setRaceRef} />
      
      <div className="flex flex-col items-center justify-center h-full">
        <Clock />
        
        <div className="flex gap-4 items-center">
          <button
            id="pipButton"
            className="px-9 py-4 text-lg font-medium bg-[var(--button-bg)] text-[var(--button-text)] rounded-3xl cursor-pointer transition-all hover:bg-[var(--button-hover)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"/>
            </svg>
            Picture in Picture
          </button>

          <button
            onClick={toggleTheme}
            className="w-12 h-12 p-3.5 rounded-full bg-[var(--button-bg)] text-[var(--button-text)] cursor-pointer transition-all hover:bg-[var(--button-hover)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center shadow-md hover:shadow-lg"
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
        onClick={() => setChatOpen(!chatOpen)}
        id="chatToggle"
        className="fixed bottom-10 left-10 w-16 h-16 rounded-full bg-[var(--button-bg)] text-[var(--button-text)] cursor-pointer transition-all hover:shadow-xl shadow-lg flex items-center justify-center z-[998]"
        aria-label="Toggle Chat"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <span id="notificationBadge" className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>
      </button>

      <canvas id="clockCanvas" width="1280" height="720" className="fixed -top-[9999px] -left-[9999px]"></canvas>
      <video id="pipVideo" autoPlay muted className="hidden"></video>
    </div>
  )
}

export default App
