import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Trophy, Clock, HelpCircle } from 'lucide-react'
import { cn } from "@/lib/utils"

interface HangmanWidgetProps {
  gameData: {
    gameId: string
    word?: string
    hint?: string
    startTime: number
    completed?: boolean
    winner?: string | null
    leaderboard?: Array<{ username: string; time: number; correct?: boolean }>
  }
  onComplete: (result: { gameId: string, time: number, correct: boolean }) => void
  currentUsername?: string
}

export default function HangmanWidget({ gameData, onComplete, currentUsername }: HangmanWidgetProps) {
  const [guessedLetters, setGuessedLetters] = useState<string[]>([])
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [isWon, setIsWon] = useState(false)
  const [isLost, setIsLost] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [fullWordGuess, setFullWordGuess] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const maxWrongGuesses = 6
  const word = gameData.word || ''
  const hint = gameData.hint || ''

  useEffect(() => {
    // Reset state when gameId changes
    setGuessedLetters([])
    setWrongGuesses(0)
    setIsWon(false)
    setIsLost(false)
    setSubmitted(false)
    setElapsed(0)
    setFullWordGuess('')
  }, [gameData.gameId])

  useEffect(() => {
    if (gameData.completed) {
      // If game is already completed globally (e.g. reloaded page), show state
      // But for individual game, we track local completion
    }

    if (!submitted && !isWon && !isLost) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - gameData.startTime)
      }, 100)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameData.startTime, submitted, isWon, isLost])

  const handleGuess = (letter: string) => {
    if (isWon || isLost || submitted) return

    const upper = letter.toUpperCase()
    if (guessedLetters.includes(upper)) return

    const newGuessed = [...guessedLetters, upper]
    setGuessedLetters(newGuessed)

    if (!word.includes(upper)) {
      const newWrong = wrongGuesses + 1
      setWrongGuesses(newWrong)
      if (newWrong >= maxWrongGuesses) {
        handleGameOver(false)
      }
    } else {
      const allGuessed = word.split('').every(char => newGuessed.includes(char))
      if (allGuessed) {
        handleGameOver(true)
      }
    }
  }

  const handleFullWordGuess = (e: React.FormEvent) => {
    e.preventDefault()
    if (isWon || isLost || submitted || !fullWordGuess) return

    if (fullWordGuess.toUpperCase() === word) {
      // Fill in all letters
      setGuessedLetters([...new Set([...guessedLetters, ...word.split('')])])
      handleGameOver(true)
    } else {
      // Penalty? Or just wrong guess? Let's count as a wrong guess
      const newWrong = wrongGuesses + 1
      setWrongGuesses(newWrong)
      setFullWordGuess('')
      if (newWrong >= maxWrongGuesses) {
        handleGameOver(false)
      }
    }
  }

  const handleGameOver = (won: boolean) => {
    if (submitted) return
    setIsWon(won)
    setIsLost(!won)
    setSubmitted(true)
    if (timerRef.current) clearInterval(timerRef.current)
    
    onComplete({
      gameId: gameData.gameId,
      time: Date.now() - gameData.startTime,
      correct: won
    })
  }

  // Keyboard layout
  const keyboard = [
    "QWERTYUIOP",
    "ASDFGHJKL",
    "ZXCVBNM"
  ]

  // SVG Drawing parts
  const drawGallows = () => (
    <g className="stroke-foreground/50" strokeWidth="4" fill="none">
      <line x1="10" y1="190" x2="150" y2="190" />
      <line x1="80" y1="190" x2="80" y2="20" />
      <line x1="80" y1="20" x2="200" y2="20" />
      <line x1="200" y1="20" x2="200" y2="50" />
    </g>
  )

  const drawHead = () => <circle cx="200" cy="80" r="30" className="stroke-foreground" strokeWidth="4" fill="none" />
  const drawBody = () => <line x1="200" y1="110" x2="200" y2="170" className="stroke-foreground" strokeWidth="4" />
  const drawLeftArm = () => <line x1="200" y1="130" x2="170" y2="160" className="stroke-foreground" strokeWidth="4" />
  const drawRightArm = () => <line x1="200" y1="130" x2="230" y2="160" className="stroke-foreground" strokeWidth="4" />
  const drawLeftLeg = () => <line x1="200" y1="170" x2="180" y2="210" className="stroke-foreground" strokeWidth="4" />
  const drawRightLeg = () => <line x1="200" y1="170" x2="220" y2="210" className="stroke-foreground" strokeWidth="4" />

  const parts = [drawHead, drawBody, drawLeftArm, drawRightArm, drawLeftLeg, drawRightLeg]

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{(elapsed / 1000).toFixed(1)}s</span>
          </div>
          {hint && (
            <div className="flex items-center gap-1 text-xs bg-secondary/50 px-2 py-1 rounded">
              <HelpCircle className="w-3 h-3" />
              {hint}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {/* Drawing Area */}
          <div className="relative w-1/2 h-60 bg-background/30 rounded-lg flex items-center justify-center">
             <svg width="240" height="220" viewBox="0 0 240 220" className="w-full h-full">
               {drawGallows()}
               {wrongGuesses > 0 && parts.slice(0, wrongGuesses).map((Part, i) => <Part key={i} />)}
             </svg>
          </div>

          {/* Word Display */}
          <div className="w-1/2 flex flex-col justify-center gap-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {word.split('').map((char, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-8 h-10 flex items-center justify-center border-b-2 text-xl font-bold transition-all",
                    guessedLetters.includes(char) ? "border-primary text-primary" : "border-muted-foreground text-transparent",
                    (isLost && !guessedLetters.includes(char)) && "text-destructive border-destructive"
                  )}>
                    {guessedLetters.includes(char) || isLost ? char : '_'}
                  </div>
                </div>
              ))}
            </div>

            {/* Full Word Guess Input */}
            {!submitted && (
              <form onSubmit={handleFullWordGuess} className="flex gap-2">
                <Input 
                  value={fullWordGuess}
                  onChange={(e) => setFullWordGuess(e.target.value)}
                  placeholder="Guess full word..."
                  className="h-8 text-xs"
                  maxLength={word.length}
                />
                <Button type="submit" size="sm" variant="secondary" className="h-8 px-2" disabled={!fullWordGuess}>
                  Guess
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Status Message */}
        {submitted && (
          <div className={cn(
            "text-center font-bold p-2 rounded animate-in fade-in zoom-in duration-300 flex flex-col gap-1",
            isWon ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
          )}>
            <div>{isWon ? "You escaped!" : "Game Over!"}</div>
            {isLost && <div className="text-sm font-normal text-foreground/80">The word was: <span className="font-bold text-foreground">{word}</span></div>}
          </div>
        )}

        {/* Keyboard */}
        {!submitted && (
          <div className="flex flex-col gap-1 items-center mt-2">
            {keyboard.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.split('').map(char => {
                  const isGuessed = guessedLetters.includes(char)
                  const isWrong = isGuessed && !word.includes(char)
                  return (
                    <button
                      key={char}
                      onClick={() => handleGuess(char)}
                      disabled={isGuessed}
                      className={cn(
                        "w-8 h-10 rounded text-sm font-bold transition-all active:scale-95",
                        isGuessed 
                          ? isWrong 
                            ? "bg-destructive/20 text-destructive cursor-not-allowed"
                            : "bg-primary/20 text-primary cursor-not-allowed"
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      )}
                    >
                      {char}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {gameData.leaderboard && gameData.leaderboard.length > 0 && (
          <div className="mt-4 border-t pt-2">
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" />
              Leaderboard
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {gameData.leaderboard.map((entry, i) => (
                <div key={i} className="flex justify-between text-xs items-center bg-secondary/20 p-1 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-4">{i + 1}.</span>
                    <span className={cn(entry.username === currentUsername && "font-bold text-primary")}>
                      {entry.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(entry.correct ? "text-green-500" : "text-red-500")}>
                      {entry.correct ? "Won" : "Lost"}
                    </span>
                    <span className="font-mono">{(entry.time / 1000).toFixed(2)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
