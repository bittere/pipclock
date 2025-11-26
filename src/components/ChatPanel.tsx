import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat, RaceEvent } from '../hooks/useChat'
import RaceLeaderboard from './RaceLeaderboard'
import InlineRaceLeaderboard from './InlineRaceLeaderboard'
import EnhancedRaceWidget from './EnhancedRaceWidget'
import ClickParticle from './ClickParticle'
import Confetti from './Confetti'
import '../styles/animations.css'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  chatContext: any
  setRaceRef: (race: any) => void
  onRaceStatusChange: (isActive: boolean) => void
}

export default function ChatPanel({ isOpen, onClose, chatContext, setRaceRef, onRaceStatusChange }: ChatPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [raceActive, setRaceActive] = useState(false)
  const [activeRaces, setActiveRaces] = useState<Map<string, { clickCount: number; progress: number; raceStartTime?: number; remaining?: number }>>(new Map())
  const [completedRaces, setCompletedRaces] = useState<Map<string, { finalCps: number; clickCount: number; completedAt: number }>>(new Map())
  const [particles, setParticles] = useState<Array<{ x: number; y: number; id: number }>>([])
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([])
  const [raceLeaderboards, setRaceLeaderboards] = useState<Map<string, Array<{ username: string; score: number }>>>(new Map())
  const raceClickCountRef = useRef<Map<string, number>>(new Map())
  const raceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const raceIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const confettiRef = useRef<any>(null)

  const { isConnected, messages = [], onlineCount, sendMessage, sendCommand, clearChat, error, username } = chatContext
  
  // Create race object with update function for App to use
  const race = {
    leaderboard,
    updateLeaderboard: (newLeaderboard: Array<{ username: string; score: number }>, raceId?: string) => {
      setLeaderboard(newLeaderboard)
      // Also update per-race leaderboard if raceId is provided
      if (raceId) {
        setRaceLeaderboards(prev => new Map(prev).set(raceId, newLeaderboard))
      }
    }
  }
  const [previousNicknames, setPreviousNicknames] = useState<string[]>([])

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim() === '' 
    ? messages 
    : messages.filter(msg => {
        const query = searchQuery.toLowerCase()
        const messageText = (msg.message || '').toLowerCase()
        const messageUsername = (msg.username || '').toLowerCase()
        return messageText.includes(query) || messageUsername.includes(query)
      })
  
  // Load previous nicknames from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('previousNicknames') || '[]')
    setPreviousNicknames(stored)
  }, [])
  
  // Update parent's race ref
  useEffect(() => {
    setRaceRef(race)
  }, [race, setRaceRef])

  // Notify parent when races become active/inactive
  useEffect(() => {
    onRaceStatusChange(activeRaces.size > 0)
  }, [activeRaces.size, onRaceStatusChange])

  // Track clicks during races
  useEffect(() => {
    if (activeRaces.size === 0) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Ignore chat button and chat panel clicks
      if (
        target.closest('#chatToggle') ||
        target.closest('[class*="ChatPanel"]') ||
        target.id === 'chatToggle'
      ) {
        return
      }

      // Add particle effect
      const id = Date.now() + Math.random()
      setParticles(prev => [...prev, { x: e.clientX, y: e.clientY, id }])
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== id))
      }, 600)

      // Increment click count for all active races
      for (const raceId of activeRaces.keys()) {
        raceClickCountRef.current.set(raceId, (raceClickCountRef.current.get(raceId) || 0) + 1)
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [activeRaces.size])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const handleSend = () => {
    if (message.trim() && username) {
      sendMessage(username, message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow Shift+Enter for newlines - textarea handles this natively
      e.currentTarget.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.currentTarget
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  const startRaceCountdown = (raceId: string) => {
    // Don't allow starting if race was just completed
    if (completedRaces.has(raceId)) {
      return
    }

    // Initialize race state and click count - start with 1 click already counted
    raceClickCountRef.current.set(raceId, 1)
    const raceStartTime = Date.now()
    const raceDuration = 5000 // 5 seconds
    
    setActiveRaces(prev => {
      const updated = new Map(prev).set(raceId, { clickCount: 1, progress: 0, raceStartTime })
      onRaceStatusChange(updated.size > 0)
      return updated
    })
    
    // Update progress every 50ms
    const intervalId = setInterval(() => {
      const clickCount = raceClickCountRef.current.get(raceId) || 1
      const elapsed = (Date.now() - raceStartTime) / 1000
      const remaining = Math.max(0, 5 - elapsed)
      const progress = (elapsed / 5) * 100
      
      setActiveRaces(prev => {
        const updated = new Map(prev)
        updated.set(raceId, {
          clickCount,
          progress: Math.min(100, progress),
          raceStartTime,
          remaining
        })
        return updated
      })
    }, 50)
    
    raceIntervalsRef.current.set(raceId, intervalId)
    
    // End race after 5 seconds
    const timerId = setTimeout(() => {
      const finalClicks = raceClickCountRef.current.get(raceId) || 0
      const finalCps = finalClicks / 5
      
      sendCommand({ type: 'submit_score', raceId, score: finalCps })
      
      // Trigger confetti on race end
      const raceWidget = document.querySelector('.race-widget')
      if (raceWidget && confettiRef.current) {
        const rect = raceWidget.getBoundingClientRect()
        confettiRef.current.trigger(rect.left + rect.width / 2, rect.top + rect.height / 2, 12)
      }
      
      // Mark race as completed (permanently)
      setCompletedRaces(prev => {
        const updated = new Map(prev)
        updated.set(raceId, { finalCps, clickCount: finalClicks, completedAt: Date.now() })
        return updated
      })
      
      // Remove from active races
      setActiveRaces(prev => {
        const updated = new Map(prev)
        updated.delete(raceId)
        onRaceStatusChange(updated.size > 0)
        return updated
      })

      // Show leaderboard after race completion
      setRaceActive(true)
      
      raceClickCountRef.current.delete(raceId)
      if (raceIntervalsRef.current.has(raceId)) {
        clearInterval(raceIntervalsRef.current.get(raceId)!)
        raceIntervalsRef.current.delete(raceId)
      }
    }, raceDuration)
    
    raceTimersRef.current.set(raceId, timerId)
  }

  return (
    <div
      className={`fixed left-0 top-0 bottom-0 flex flex-col z-[999] select-none`}
      style={{
        width: '500px',
        background: 'var(--chat-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--chat-border)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
    >
      {/* Header */}
      <div 
        className="flex items-start justify-between border-b border-[var(--chat-border)]"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(180deg, rgba(91, 156, 255, 0.05) 0%, transparent 100%)',
        }}
      >
        <div>
          <div 
            style={{
              fontSize: '15px',
              color: 'var(--text-color)',
              opacity: 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              lineHeight: 1.5,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              marginBottom: '12px',
            }}
          >
            {username}
          </div>
          <h2 
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-color)',
              letterSpacing: '-0.3px',
              lineHeight: 1.4,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              margin: 0,
            }}
          >
            Global Chat
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span 
              style={{
                width: '8px',
                height: '8px',
                background: isConnected ? '#34c759' : '#ff3b30',
                borderRadius: '50%',
                boxShadow: isConnected ? '0 0 8px rgba(52, 199, 89, 0.4)' : 'none',
              }}
            ></span>
            <span 
              style={{
                fontSize: '15px',
                color: 'var(--text-color)',
                opacity: 0.6,
                fontWeight: 500,
                lineHeight: 1.5,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              {onlineCount} online
            </span>
          </div>
        </div>
        <button
          id="closeChat"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-color)',
            opacity: 0.6,
            cursor: 'pointer',
            padding: '12px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: 'none',
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.background = 'var(--input-bg)'
            btn.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.background = 'transparent'
            btn.style.opacity = '0.6'
          }}
          aria-label="Close Chat"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      {/* Status */}
      {!isConnected && (
        <div 
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--chat-border)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {error || 'Connecting...'}
        </div>
      )}

      {/* Search Bar */}
      <div 
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--chat-border)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            id="chatSearch"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 16px',
              paddingRight: searchQuery ? '40px' : '16px',
              border: `2px solid ${searchQuery ? 'var(--accent)' : 'var(--chat-border)'}`,
              borderRadius: '16px',
              background: searchQuery ? 'rgba(91, 156, 255, 0.2)' : 'var(--input-bg)',
              color: 'var(--text-color)',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              boxShadow: searchQuery ? '0 0 12px 2px rgba(91, 156, 255, 0.4), 0 0 0 3px rgba(91, 156, 255, 0.15)' : 'none',
            }}
            onFocus={(e) => {
              const inp = e.currentTarget as HTMLInputElement
              if (!searchQuery) {
                inp.style.borderColor = 'var(--accent)'
                inp.style.boxShadow = '0 0 0 2px rgba(91, 156, 255, 0.1)'
              }
            }}
            onBlur={(e) => {
              const inp = e.currentTarget as HTMLInputElement
              if (!searchQuery) {
                inp.style.borderColor = 'var(--chat-border)'
                inp.style.boxShadow = 'none'
              }
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-color)',
                cursor: 'pointer',
                opacity: 0.6,
                fontSize: '18px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6'
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto chat-scroll"
        style={{
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {filteredMessages.length === 0 && searchQuery && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}
          >
            No messages match "{searchQuery}"
          </div>
        )}
        {filteredMessages.map((msg) => {
          const isUserMessage = msg.username === username || previousNicknames.includes(msg.username || '')
          
          return (
            <div key={msg.id} className={`group flex ${msg.type === 'race_started' ? 'justify-start' : isUserMessage ? 'justify-end' : 'justify-start'}`} style={{ animation: 'pop-in 0.2s ease-out' }}>
              {msg.type === 'race_started' ? (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <EnhancedRaceWidget
                    raceData={{ raceId: msg.raceId! }}
                    activeRace={activeRaces.has(msg.raceId!) ? {
                      raceId: msg.raceId!,
                      clickCount: activeRaces.get(msg.raceId!)?.clickCount || 0,
                      progress: activeRaces.get(msg.raceId!)?.progress || 0,
                      remaining: activeRaces.get(msg.raceId!)?.remaining || 5,
                    } : null}
                    completedRace={completedRaces.has(msg.raceId!) ? {
                      raceId: msg.raceId!,
                      finalCps: completedRaces.get(msg.raceId!)?.finalCps || 0,
                      clickCount: completedRaces.get(msg.raceId!)?.clickCount || 0,
                    } : null}
                    onStart={() => {
                      if (!activeRaces.has(msg.raceId!) && !completedRaces.has(msg.raceId!)) {
                        startRaceCountdown(msg.raceId!)
                      }
                    }}
                  />
                  {raceLeaderboards.has(msg.raceId!) && (
                    <InlineRaceLeaderboard
                      raceId={msg.raceId!}
                      leaderboard={raceLeaderboards.get(msg.raceId!) || []}
                      maxEntries={5}
                      currentUsername={username}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {!isUserMessage && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-[var(--accent)]">{msg.username}</span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  <div className={`text-sm break-words p-3 rounded-2xl w-fit ${isUserMessage ? 'bg-gradient-to-r from-[var(--accent)] to-[#4a87ff] text-white' : 'bg-[var(--input-bg)] text-[var(--text-color)]'}`}>
                    {msg.message}
                  </div>
                  {isUserMessage && (
                    <span className="text-xs text-[var(--text-secondary)] text-right">
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Input Area */}
      <div 
        className="border-t border-[var(--chat-border)]"
        style={{
          padding: '24px 28px',
          background: 'var(--panel-bg)',
        }}
      >
        <div className="flex gap-3 items-start">
          <div className="relative" ref={dropdownRef}>
            <button
              id="plusButton"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '22px',
                background: 'var(--input-bg)',
                border: '1px solid var(--chat-border)',
                color: 'var(--text-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement
                btn.style.opacity = '0.8'
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement
                btn.style.opacity = '1'
              }}
              aria-label="More actions"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            <div
              id="chatDropdown"
              className={`absolute bottom-16 left-0 bg-[var(--panel-bg)] border border-[var(--chat-border)] rounded-2xl flex flex-col gap-2 p-2 min-w-[160px] transition-all shadow-lg z-50 ${
                dropdownOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 translate-y-2'
              }`}
            >
              <button
                onClick={() => {
                    setDropdownOpen(false)
                    sendCommand({ type: 'init_race' })
                  }}
                className="px-4 py-3 rounded-lg bg-transparent text-[var(--text-color)] text-left text-sm cursor-pointer transition-all hover:bg-[var(--input-bg)] flex items-center gap-3"
              >
                <span>🏆</span>
                <span>Start CPS Race</span>
              </button>
              <button
              onClick={clearChat}
              className="px-4 py-3 rounded-lg bg-transparent text-[var(--text-color)] text-left text-sm cursor-pointer transition-all hover:bg-[var(--input-bg)] flex items-center gap-3"
              >
              <span>🗑️</span>
              <span>Clear Chat</span>
              </button>
            </div>
          </div>

          <textarea
            id="chatInput"
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            maxLength={500}
            rows={1}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '10px 16px',
              border: '1px solid var(--chat-border)',
              borderRadius: '16px',
              background: 'var(--input-bg)',
              color: 'var(--text-color)',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              resize: 'none',
              overflow: 'hidden',
              minHeight: '44px',
              maxHeight: '120px',
            }}
            onFocus={(e) => {
              const inp = e.currentTarget as HTMLTextAreaElement
              inp.style.borderColor = 'var(--accent)'
              inp.style.boxShadow = '0 0 0 2px rgba(91, 156, 255, 0.1)'
            }}
            onBlur={(e) => {
              const inp = e.currentTarget as HTMLTextAreaElement
              inp.style.borderColor = 'var(--chat-border)'
              inp.style.boxShadow = 'none'
            }}
          />
          <button
            id="sendButton"
            onClick={handleSend}
            style={{
              padding: '10px 16px',
              borderRadius: '16px',
              background: 'linear-gradient(90deg, var(--accent) 0%, #4a87ff 100%)',
              color: 'white',
              fontWeight: 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(91, 156, 255, 0.3)',
              border: 'none',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement
              btn.style.transform = 'translateY(-2px)'
              btn.style.boxShadow = '0 6px 16px rgba(91, 156, 255, 0.4)'
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement
              btn.style.transform = 'translateY(0)'
              btn.style.boxShadow = '0 4px 12px rgba(91, 156, 255, 0.3)'
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Particle Effects */}
      {particles.map(particle => (
        <ClickParticle key={particle.id} {...particle} />
      ))}

      <RaceLeaderboard
        isActive={raceActive}
        leaderboard={race.leaderboard}
        onClose={() => setRaceActive(false)}
        currentUsername={username}
      />
      
      <Confetti ref={confettiRef} />
    </div>
  )
}
