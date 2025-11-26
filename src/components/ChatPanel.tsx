import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat, RaceEvent } from '../hooks/useChat'
import { useRace } from '../hooks/useRace'
import RaceLeaderboard from './RaceLeaderboard'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  chatContext: any
  setRaceRef: (race: any) => void
}

export default function ChatPanel({ isOpen, onClose, chatContext, setRaceRef }: ChatPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [raceActive, setRaceActive] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { isConnected, messages = [], onlineCount, sendMessage, sendCommand, clearChat, error, username } = chatContext
  const race = useRace(sendCommand)
  
  // Update parent's race ref
  useEffect(() => {
    setRaceRef(race)
  }, [race, setRaceRef])

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
    }
  }

  return (
    <div
      className={`fixed left-0 top-0 bottom-0 w-[500px] bg-[var(--chat-bg)] backdrop-blur-[20px] border-r border-[var(--chat-border)] shadow-lg flex flex-col transition-transform z-[999] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-[var(--chat-border)]">
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">{username}</div>
          <h2 className="text-lg font-semibold">Global Chat</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-[var(--text-secondary)]">{onlineCount} online</span>
          </div>
        </div>
        <button
          id="closeChat"
          onClick={onClose}
          className="p-2 hover:bg-[var(--input-bg)] rounded-lg transition-colors"
          aria-label="Close Chat"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      {/* Status */}
      {!isConnected && (
        <div className="px-4 py-2 text-sm text-[var(--text-secondary)] border-b border-[var(--chat-border)]">
          {error || 'Connecting...'}
        </div>
      )}

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-[var(--chat-border)]">
        <input
          type="text"
          id="chatSearch"
          placeholder="Search messages..."
          className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--chat-border)] text-[var(--text-color)] placeholder-[var(--text-secondary)] text-sm focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="group">
            {msg.type === 'race_started' ? (
              <div className="flex items-center justify-center py-2">
                <div className="w-full max-w-xs bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] rounded-2xl p-0.5">
                  <div className="bg-[var(--panel-bg)] rounded-[15px] px-6 py-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        <h3 className="text-lg font-bold text-[var(--text-color)]">CPS Race</h3>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      A race has started! Click below to join and compete.
                    </p>
                    <button
                      onClick={() => {
                        if (race.startRace) {
                          race.startRace(msg.raceId)
                          setRaceActive(true)
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[var(--accent)] to-[#4a87ff] text-white font-semibold rounded-xl text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      Join Race
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-[var(--accent)]">{msg.username}</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-color)] mt-1 break-words">{msg.message}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="px-6 py-6 border-t border-[var(--chat-border)] bg-[var(--panel-bg)]">
        <div className="flex gap-3 items-center">
          <div className="relative" ref={dropdownRef}>
            <button
              id="plusButton"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-11 h-11 rounded-2xl bg-[var(--input-bg)] border border-[var(--chat-border)] text-[var(--text-color)] cursor-pointer transition-all hover:bg-opacity-80 flex items-center justify-center flex-shrink-0"
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

          <input
            type="text"
            id="chatInput"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for newline)"
            maxLength={500}
            className="flex-1 min-w-0 px-5 py-3.5 border border-[var(--chat-border)] rounded-[18px] bg-[var(--input-bg)] text-[var(--text-color)] placeholder-[var(--text-secondary)] text-base focus:outline-none focus:border-[var(--accent)] focus:shadow-sm"
          />
          <button
            id="sendButton"
            onClick={handleSend}
            className="px-7 py-3.5 rounded-[18px] bg-gradient-to-r from-[var(--accent)] to-[#4a87ff] text-white font-medium text-base cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap flex-shrink-0 shadow-lg hover:shadow-xl"
          >
            Send
          </button>
        </div>
      </div>

      <RaceLeaderboard
        isActive={raceActive}
        leaderboard={race.leaderboard}
        onClose={() => setRaceActive(false)}
      />
    </div>
  )
}
