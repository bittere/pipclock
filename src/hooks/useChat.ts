import { useEffect, useRef, useState, useCallback } from 'react'

interface ChatMessage {
  id: string
  username?: string
  message?: string
  timestamp: number
  type?: 'message' | 'race_started' | 'math_game' | 'hangman_game'
  raceId?: string
  mathGameData?: {
    gameId: string
    problem: string
    startTime: number
    endTime: number
    completed?: boolean
    winner?: { username: string; time: number }
    leaderboard?: Array<{ username: string; time: number; correct?: boolean }>
  }
  hangmanGameData?: {
    gameId: string
    wordLength?: number
    maxWrongGuesses?: number
    guessedLetters?: string[]
    wrongGuesses?: number
    startTime: number
    word?: string
    hint?: string
    completed?: boolean
    winner?: string | null
    leaderboard?: Array<{ username: string; time: number; correct?: boolean }>
  }
}

export interface RaceEvent {
  type: 'race_started' | 'leaderboard_update' | 'race_ended'
  raceId: string
  targetText?: string
  leaderboard?: Array<{ username: string; cps: number; time: number }>
  winner?: { username: string; time: number }
}

export interface MathGameEvent {
  type: 'math_game_start' | 'math_game_leaderboard_update' | 'math_game_end' | 'math_game_won'
  gameId: string
  problem?: string
  leaderboard?: Array<{ username: string; time: number; correct?: boolean }>
  winner?: { username: string; time: number }
}

export interface HangmanGameEvent {
  type: 'hangman_game_start' | 'hangman_leaderboard_update' | 'hangman_game_end' | 'hangman_game_won'
  gameId: string
  word?: string
  hint?: string
  leaderboard?: Array<{ username: string; time: number; correct?: boolean }>
  winner?: { username: string; time: number }
}

export function useChat(onRaceEvent?: (event: RaceEvent) => void, onUsernameReceived?: (username: string) => void, onNewMessage?: () => void, onRaceStarted?: () => void, onMathGameEvent?: (event: MathGameEvent) => void, onHangmanGameEvent?: (event: HangmanGameEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const onRaceEventRef = useRef(onRaceEvent)
  const onUsernameReceivedRef = useRef(onUsernameReceived)
  const onNewMessageRef = useRef(onNewMessage)
  const onRaceStartedRef = useRef(onRaceStarted)
  const onMathGameEventRef = useRef(onMathGameEvent)
  const onHangmanGameEventRef = useRef(onHangmanGameEvent)
  const initializingRef = useRef(false)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    // Update the refs when callbacks change
    onRaceEventRef.current = onRaceEvent
    onUsernameReceivedRef.current = onUsernameReceived
    onNewMessageRef.current = onNewMessage
    onRaceStartedRef.current = onRaceStarted
    onMathGameEventRef.current = onMathGameEvent
  }, [onRaceEvent, onUsernameReceived, onNewMessage, onRaceStarted, onMathGameEvent, onHangmanGameEvent])

  useEffect(() => {
    // Prevent double initialization in Strict Mode
    if (initializingRef.current || (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING))) {
      return
    }
    initializingRef.current = true

    let isMounted = true
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/chat`
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      if (isMounted) {
        setIsConnected(true)
        console.log('WebSocket connected')
        
        // Send register message to officially join
        ws.send(JSON.stringify({ type: 'register' }))
      }
    }
    
    ws.onmessage = (event) => {
      if (!isMounted) return
      
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }))
          return
        } else if (data.type === 'hangman_game_start') {
           console.log('hangman_game_start received', data);
           const hangmanMessage: ChatMessage = {
            id: `hangman-${data.gameId}`,
            timestamp: Date.now(),
            type: 'hangman_game',
            hangmanGameData: {
              gameId: data.gameId,
              word: data.word,
              hint: data.hint,
              startTime: data.startTime,
            }
          }
          setMessages(prev => [...(Array.isArray(prev) ? prev : []), hangmanMessage])
          onHangmanGameEventRef.current?.(data)
        } else if (data.type === 'message') {
          const message: ChatMessage = {
            id: `${Date.now()}-${Math.random()}`,
            username: data.username || 'Anonymous',
            message: data.text || data.message || '',
            timestamp: data.timestamp || Date.now()
          }
          setMessages(prev => [...(Array.isArray(prev) ? prev : []), message])
          onNewMessageRef.current?.()
        } else if (data.type === 'user_joined' || data.type === 'user_left' || data.type === 'user_count') {
          setOnlineCount(data.userCount || 0)
        } else if (data.type === 'history') {
           const messages = (data.messages || []).map((msg: any) => ({
             id: `${msg.timestamp}-${Math.random()}`,
             username: msg.username || 'Anonymous',
             message: msg.text || msg.message || '',
             timestamp: msg.timestamp || Date.now()
           }))
           
           // Consolidate math games by gameId (map start events, merge with end events)
           const mathGameMap = new Map<string, any>()
           for (const game of (data.mathGames || [])) {
             const gameId = game.gameId
             if (!mathGameMap.has(gameId)) {
               mathGameMap.set(gameId, {
                 id: `math-${gameId}`,
                 timestamp: game.startTime || Date.now(),
                 type: 'math_game',
                 mathGameData: {
                   gameId,
                   problem: game.problem || '',
                   startTime: game.startTime || Date.now(),
                   endTime: game.endTime || Date.now(),
                 }
               })
             }
             // Update with completion data if this is an end/won event
             if (game.type === 'math_game_won' || game.type === 'math_game_end') {
               const existing = mathGameMap.get(gameId)
               if (existing) {
                 existing.mathGameData.completed = true
                 if (game.winner) existing.mathGameData.winner = game.winner
                 if (game.leaderboard) existing.mathGameData.leaderboard = game.leaderboard
               }
             }
           }
           const mathGames = Array.from(mathGameMap.values())

            // Consolidate hangman games
            const hangmanGameMap = new Map<string, any>()
            for (const game of (data.hangmanGames || [])) {
              const gameId = game.gameId
              if (!hangmanGameMap.has(gameId)) {
                hangmanGameMap.set(gameId, {
                  id: `hangman-${gameId}`,
                  timestamp: game.startTime || Date.now(),
                  type: 'hangman_game',
                  hangmanGameData: {
                    gameId,
                    word: game.word,
                    hint: game.hint,
                    startTime: game.startTime || Date.now(),
                  }
                })
              }
              if (game.type === 'hangman_game_won') {
                 const existing = hangmanGameMap.get(gameId)
                 if (existing) {
                   existing.hangmanGameData.completed = true
                   existing.hangmanGameData.winner = game.winner
                 }
              }
            }
            const hangmanGames = Array.from(hangmanGameMap.values())
            
           // Merge and sort by timestamp
           const allMessages = [...messages, ...mathGames, ...hangmanGames].sort((a: any, b: any) => a.timestamp - b.timestamp)
           setMessages(allMessages)
        } else if (data.type === 'user_info') {
          // Receive username from server (server generates fun nicknames)
          setUsername(data.username)
          
          // Store nickname to localStorage for future sessions
          const storedNicknames = JSON.parse(localStorage.getItem('previousNicknames') || '[]')
          if (!storedNicknames.includes(data.username)) {
            storedNicknames.push(data.username)
            localStorage.setItem('previousNicknames', JSON.stringify(storedNicknames))
          }
          
          onUsernameReceivedRef.current?.(data.username)
        } else if (data.type === 'interactive_race') {
          // Add race started notification to messages
          const raceMessage: ChatMessage = {
            id: `race-${data.raceId}`,
            timestamp: Date.now(),
            type: 'race_started',
            raceId: data.raceId,
          }
          setMessages(prev => [...(Array.isArray(prev) ? prev : []), raceMessage])
          onRaceEventRef.current?.({
            type: 'race_started',
            raceId: data.raceId,
          })
          onRaceStartedRef.current?.()
        } else if (data.type === 'leaderboard_update') {
          onRaceEventRef.current?.({
            type: 'leaderboard_update',
            raceId: data.raceId,
            leaderboard: data.leaderboard,
          })
        } else if (data.type === 'hangman_leaderboard_update') {
           // Update leaderboard in real-time
           setMessages(prev => 
            (Array.isArray(prev) ? prev : []).map(msg => {
              if (msg.hangmanGameData?.gameId === data.gameId && msg.type === 'hangman_game') {
                return {
                    ...msg,
                    hangmanGameData: {
                      ...msg.hangmanGameData!,
                      leaderboard: data.leaderboard
                    }
                  }
              }
              return msg
            })
          )
          onHangmanGameEventRef.current?.(data)
        } else if (data.type === 'hangman_game_won') {
          setMessages(prev => 
            (Array.isArray(prev) ? prev : []).map(msg => {
              if (msg.hangmanGameData?.gameId === data.gameId && msg.type === 'hangman_game') {
                return {
                    ...msg,
                    hangmanGameData: {
                      ...msg.hangmanGameData!,
                      completed: true,
                      winner: data.winner,
                    }
                  }
              }
              return msg
            })
          )
          onHangmanGameEventRef.current?.(data)
        } else if (data.type === 'hangman_game_update') {
           console.log('hangman_game_update received', data);
           // Update local message state
           setMessages(prev => 
            (Array.isArray(prev) ? prev : []).map(msg => {
              if (msg.hangmanGameData?.gameId === data.gameId && msg.type === 'hangman_game') {
                return {
                    ...msg,
                    hangmanGameData: {
                      ...msg.hangmanGameData!,
                      guessedLetters: data.guessedLetters,
                      wrongGuesses: data.wrongGuesses,
                      lastGuess: data.lastGuess,
                      isCorrect: data.isCorrect,
                      guesser: data.guesser,
                    }
                  }
              }
              return msg
            })
          )
          onHangmanGameEventRef.current?.(data)
        } else if (data.type === 'hangman_game_end') { // Only handle end here, won is separate
          console.log('hangman_game_end received', data);
          setMessages(prev => 
            (Array.isArray(prev) ? prev : []).map(msg => {
              if (msg.hangmanGameData?.gameId === data.gameId && msg.type === 'hangman_game') {
                return {
                    ...msg,
                    hangmanGameData: {
                      ...msg.hangmanGameData!,
                      completed: true,
                      word: data.word,
                      guessedLetters: data.guessedLetters,
                      wrongGuesses: data.wrongGuesses,
                    }
                  }
              }
              return msg
            })
          )
          onHangmanGameEventRef.current?.(data)
        } else if (data.type === 'math_game_start') {
          // Add math game message to chat history
          const startTime = Date.now()
          const endTime = startTime + 5000 // 5 second duration
          const mathGameMessage: ChatMessage = {
            id: `math-${data.gameId}`,
            timestamp: startTime,
            type: 'math_game',
            mathGameData: {
              gameId: data.gameId,
              problem: data.problem,
              startTime: startTime,
              endTime: endTime,
            }
          }
          setMessages(prev => [...(Array.isArray(prev) ? prev : []), mathGameMessage])
          onMathGameEventRef.current?.(data)
        } else if (data.type === 'math_game_leaderboard_update') {
          // Update leaderboard in real-time
          setMessages(prev => 
            (Array.isArray(prev) ? prev : []).map(msg => {
              if (msg.mathGameData?.gameId === data.gameId && msg.type === 'math_game') {
                return {
                    ...msg,
                    mathGameData: {
                      ...msg.mathGameData!,
                      leaderboard: data.leaderboard
                    }
                  }
              }
              return msg
            })
          )
        } else if (data.type === 'math_game_end' || data.type === 'math_game_won') {
          // Update the math game message with completion data
          setMessages(prev => 
            (Array.isArray(prev) ? prev : []).map(msg => {
              if (msg.mathGameData?.gameId === data.gameId && msg.type === 'math_game') {
                return {
                    ...msg,
                    mathGameData: {
                      ...msg.mathGameData!,
                      completed: data.type === 'math_game_end' ? true : msg.mathGameData!.completed,
                      winner: data.winner || msg.mathGameData!.winner,
                    }
                  }
              }
              return msg
            })
          )
          onMathGameEventRef.current?.(data)
        }
      } catch (err) {
        console.error('Failed to parse message:', err, event.data)
      }
    }
    
    ws.onerror = (err) => {
      if (isMounted) {
        const errorMsg = `WebSocket error: ${wsUrl}`
        console.error(errorMsg, err)
        setError(errorMsg)
      }
    }
    
    ws.onclose = () => {
      if (isMounted) {
        setIsConnected(false)
        console.log('WebSocket disconnected')
      }
    }
    
    wsRef.current = ws

    // Send explicit disconnect message before unload
    const handleBeforeUnload = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'disconnect' }))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      isMounted = false
      initializingRef.current = false
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'disconnect' }))
      }
      ws.close()
    }
  }, [])

  const sendMessage = useCallback((username: string, message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        text: message,
        timestamp: Date.now()
      }))
    } else {
      console.warn('WebSocket not ready, readyState:', wsRef.current?.readyState)
    }
  }, [])

  const sendCommand = useCallback((command: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command))
    } else {
      console.warn('WebSocket not ready, readyState:', wsRef.current?.readyState)
    }
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
  }, [])

  return {
    isConnected,
    messages,
    onlineCount,
    sendMessage,
    sendCommand,
    clearChat,
    error,
    username,
    onUsernameReceived: (callback: (username: string) => void) => {
      onUsernameReceivedRef.current = callback
    }
  }
}
