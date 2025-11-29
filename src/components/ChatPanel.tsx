import { useState, useEffect, useRef } from 'react'
import RaceLeaderboard from './RaceLeaderboard'
import InlineRaceLeaderboard from './InlineRaceLeaderboard'
import EnhancedRaceWidget from './EnhancedRaceWidget'
import MathGameWidget from './MathGameWidget'
import HangmanWidget from './HangmanWidget'
import ClickParticle from './ClickParticle'
import GiphyPicker from './GiphyPicker'
import '../styles/animations.css'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Smile, Image as ImageIcon, MoreVertical, Trash2, Trophy, Search, X, Send, Calculator, Skull } from 'lucide-react'
import { cn } from "@/lib/utils"
import EmojiPicker from './EmojiPicker'
import RichTextEditor, { type RichTextEditorRef } from './RichTextEditor'
import MessageRenderer from './MessageRenderer'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  chatContext: any
  setRaceRef: (race: any) => void
  onRaceStatusChange: (isActive: boolean) => void
  confettiRef: React.RefObject<any>
  giphyApiKey?: string
}

export default function ChatPanel({ isOpen, onClose, chatContext, setRaceRef, onRaceStatusChange, confettiRef, giphyApiKey = 'rk1c3YOVOC4X9WH9KrczWwMgMrGaZatd' }: ChatPanelProps) {
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [raceActive, setRaceActive] = useState(false)
  const [showGiphyPicker, setShowGiphyPicker] = useState(false)
  const [activeRaces, setActiveRaces] = useState<Map<string, { clickCount: number; progress: number; raceStartTime?: number; remaining?: number }>>(new Map())
  const [completedRaces, setCompletedRaces] = useState<Map<string, { finalCps: number; clickCount: number; completedAt: number }>>(new Map())
  const [particles, setParticles] = useState<Array<{ x: number; y: number; id: number }>>([])
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([])
  const [raceLeaderboards, setRaceLeaderboards] = useState<Map<string, Array<{ username: string; score: number }>>>(new Map())
  const raceClickCountRef = useRef<Map<string, number>>(new Map())
  const raceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const raceIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const editorRef = useRef<RichTextEditorRef>(null)
  
  const { isConnected, messages = [], onlineCount, sendMessage, sendCommand, clearChat, error, username } = chatContext || {}
  
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
    : messages.filter((msg: any) => {
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

  const hasContent = message.trim().length > 0 || message.includes('<img')

  const handleSend = () => {
    if (hasContent && username) {
      // If message is just empty HTML tags, don't send
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = message
      if (tempDiv.textContent?.trim() === '' && !message.includes('<img')) {
        return
      }

      sendMessage(username, message)
      setMessage('')
    }
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
        confettiRef.current.trigger(rect.left + rect.width / 2, rect.top + rect.height / 2, 6)
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

  const onEmojiClick = (emojiData: any) => {
    // Insert emoji into Tiptap editor using its API
    if (editorRef.current) {
      editorRef.current.insertText(emojiData.emoji)
    }
  }

  const handleGifSelect = (gifUrl: string, _gifId: string) => {
    // Send GIF directly as a message
    if (username) {
      const gifText = `[GIF](${gifUrl})`
      sendMessage(username, gifText)
      setShowGiphyPicker(false)
    }
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-0 bottom-0 flex flex-col z-[999] select-none w-[500px] bg-sidebar/95 backdrop-blur-xl border-r border-border shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-muted-foreground">{username}</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/50 border border-border/50">
              <span className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", isConnected ? "text-green-500 bg-green-500" : "text-red-500 bg-red-500")} />
              <span className="text-xs font-medium text-muted-foreground">{onlineCount} online</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Global Chat</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-muted">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Status */}
      {!isConnected && (
        <div className="px-6 py-2 text-sm text-muted-foreground bg-muted/30 border-b border-border/50">
          {error || 'Connecting...'}
        </div>
      )}

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="pl-9 pr-9 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4 relative">
        <div className="flex flex-col pb-4">
          {filteredMessages.length === 0 && searchQuery && (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              No messages match "{searchQuery}"
            </div>
          )}
          {filteredMessages.map((msg: any, index: number) => {
            const isUserMessage = msg.username === username || previousNicknames.includes(msg.username || '')
            const prevMsg = filteredMessages[index - 1]
            
            // Check if should group with previous message
            const isGrouped = prevMsg && 
              prevMsg.username === msg.username && 
              prevMsg.type === 'message' && 
              msg.type === 'message' &&
              (msg.timestamp - prevMsg.timestamp < 5 * 60 * 1000) // 5 minutes grouping window

            return (
              <div 
                key={msg.id} 
                className={cn(
                  "group flex animate-in slide-in-from-bottom-2 duration-300", 
                  msg.type === 'race_started' || msg.type === 'math_game' ? 'justify-start mt-4' : isUserMessage ? 'justify-end' : 'justify-start',
                  isGrouped ? "mt-1" : "mt-4"
                )}
              >
                {msg.type === 'race_started' ? (
                  <div className="w-full max-w-sm">
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
                ) : msg.type === 'math_game' && msg.mathGameData ? (
                   <div className="w-full max-w-sm">
                     <MathGameWidget
                       gameData={msg.mathGameData}
                       onAnswer={(answer, elapsedTime) => sendCommand({ type: 'submit_math_answer', gameId: msg.mathGameData!.gameId, answer, elapsedTime })}
                       completed={msg.mathGameData.completed}
                       winner={msg.mathGameData.winner}
                       leaderboard={msg.mathGameData.leaderboard}
                     />
                   </div>
                 ) : msg.type === 'hangman_game' && msg.hangmanGameData ? (
                   <div className="w-full max-w-sm">
                     <HangmanWidget
                       gameData={msg.hangmanGameData}
                       onComplete={(result) => sendCommand({ type: 'submit_hangman_result', ...result })}
                       currentUsername={username}
                     />
                   </div>
                 ) : (
                   <div className={cn("flex flex-col gap-1 max-w-[85%]", isUserMessage ? "items-end" : "items-start")}>
                     {!isUserMessage && !isGrouped && (
                       <div className="flex items-baseline gap-2 px-1">
                         <span className="text-xs font-semibold text-primary">{msg.username}</span>
                         <span className="text-[10px] text-muted-foreground">
                           {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                       </div>
                     )}
                     <div className={cn(
                       "px-4 py-2.5 rounded-2xl text-sm break-words shadow-sm whitespace-pre-wrap relative",
                       isUserMessage 
                         ? "bg-primary text-primary-foreground rounded-br-none" 
                         : "bg-muted text-foreground rounded-bl-none",
                       isGrouped && isUserMessage && "rounded-tr-md rounded-br-md",
                       isGrouped && !isUserMessage && "rounded-tl-md rounded-bl-md"
                     )}>
                       {msg.message && msg.message.includes('[GIF](') ? (
                         // Parse and render GIF messages
                         <div className="flex flex-col gap-2">
                           {msg.message.split(/(\[GIF\]\([^)]+\))/g).map((part: string, idx: number) => {
                             const gifMatch = part.match(/\[GIF\]\(([^)]+)\)/)
                             if (gifMatch) {
                               return (
                                 <img 
                                   key={idx}
                                   src={gifMatch[1]} 
                                   alt="GIF" 
                                   className="rounded-lg max-w-full h-auto"
                                   loading="lazy"
                                 />
                               )
                             }
                             return part && <MessageRenderer key={idx} content={part} />
                           })}
                         </div>
                       ) : (
                         <MessageRenderer content={msg.message} />
                       )}
                     </div>
                     {/* Show timestamp on hover for grouped messages, or always for last message in group */}
                     {isUserMessage && !isGrouped && (
                       <span className="text-[10px] text-muted-foreground px-1">
                         {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     )}
                   </div>
                 )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-sidebar border-t border-border/50">
        <div className="flex gap-2 items-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0 mb-1">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start" side="top">
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => sendCommand({ type: 'init_race' })}>
                <Trophy className="w-4 h-4" />
                Start CPS Race
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => sendCommand({ type: 'init_math_game' })}>
                <Calculator className="w-4 h-4" />
                Start Math Game
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => sendCommand({ type: 'init_hangman_game' })}>
                <Skull className="w-4 h-4" />
                Start Hangman
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearChat}>
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </Button>
            </PopoverContent>
          </Popover>

          <div className="flex-1 relative bg-muted/50 rounded-2xl border border-transparent focus-within:border-primary/20 focus-within:bg-background transition-all">
            <RichTextEditor
              ref={editorRef}
              value={message}
              onChange={setMessage}
              onSubmit={handleSend}
              placeholder="Message..."
              className="min-h-[44px]"
            />
            
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                      <Smile className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none shadow-lg bg-background w-auto" align="start" side="top" sideOffset={70} style={{ animation: 'none', marginLeft: '75px' }}>
                    <EmojiPicker onEmojiClick={(emoji) => onEmojiClick({ emoji })} />
                  </PopoverContent>
                </Popover>
                <Popover open={showGiphyPicker} onOpenChange={setShowGiphyPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none shadow-lg bg-background w-auto" align="start" side="top" sideOffset={70} style={{ animation: 'none' }}>
                    <GiphyPicker onGifSelect={handleGifSelect} apiKey={giphyApiKey} />
                  </PopoverContent>
                </Popover>
              </div>
              <Button 
                onClick={handleSend} 
                size="icon" 
                className={cn("h-8 w-8 rounded-full transition-all", hasContent ? "opacity-100 scale-100" : "opacity-0 scale-90")}
                disabled={!hasContent}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
    </div>
  )
}
