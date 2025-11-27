import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Trophy, Timer, CheckCircle2, XCircle } from 'lucide-react'

interface MathGameWidgetProps {
  gameData: {
    gameId: string
    problem: string
    startTime: number
    endTime: number
    leaderboard?: Array<{ username: string; time: number; correct?: boolean }>
  }
  onAnswer: (answer: number, elapsedTime?: number) => void
  completed?: boolean
  winner?: { username: string; time: number }
  leaderboard?: Array<{ username: string; time: number; correct?: boolean }>
}

export default function MathGameWidget({ gameData, onAnswer, completed, winner, leaderboard }: MathGameWidgetProps) {
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(5)
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [hasStarted, setHasStarted] = useState(false)
  const [adjustedEndTime, setAdjustedEndTime] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleStart = () => {
    setHasStarted(true)
    setAdjustedEndTime(Date.now() + 5000)
  }

  useEffect(() => {
    if (!hasStarted || !adjustedEndTime || hasSubmitted) return
    
    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((adjustedEndTime - now) / 1000))
      setTimeLeft(remaining)
    }, 100)
    return () => clearInterval(interval)
  }, [hasStarted, adjustedEndTime, hasSubmitted])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(answer)
    if (!isNaN(num) && adjustedEndTime && !hasSubmitted) {
      setHasSubmitted(true)
      // Calculate time elapsed since user clicked Start
      const elapsedTime = (Date.now() - (adjustedEndTime - 5000)) / 1000
      onAnswer(num, elapsedTime)
      // Optimistic UI update - actual validation comes from server
      // But for now we just clear/disable
    }
  }

  return (
    <Card className="w-full max-w-sm border-2 border-primary/10 shadow-lg overflow-hidden">
      <CardHeader className="bg-primary/5 pb-3 pt-3">
         <div className="flex justify-between items-center gap-2">
           <CardTitle className="text-lg font-bold flex items-center gap-2 m-0">
             <Trophy className="w-5 h-5 text-yellow-500" />
             Math Challenge
           </CardTitle>
           {hasStarted && !completed && (
             <div className={cn("flex items-center gap-1 text-sm font-mono font-medium px-2 py-1 rounded-md", 
               hasSubmitted 
                 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                 : timeLeft < 5 ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground")}>
               <Timer className="w-4 h-4" />
               {hasSubmitted ? "Submitted" : `${timeLeft}s`}
             </div>
           )}
         </div>
       </CardHeader>
      <CardContent className="pt-6">
         <div className="flex flex-col gap-6">
           {/* Challenge Section */}
           <div className="text-center">
             {completed && !hasStarted ? (
               // Show winner info when completed and user hasn't started
               <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                 {winner ? (
                   <>
                     <div>
                       <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-2 mx-auto">
                         <Trophy className="w-6 h-6 text-yellow-600" />
                       </div>
                       <p className="font-medium text-muted-foreground text-center">Winner</p>
                       <p className="text-xl font-bold text-primary text-center">{winner.username}</p>
                       <p className="text-sm text-muted-foreground text-center">Solved in {winner.time.toFixed(2)}s</p>
                     </div>
                   </>
                 ) : (
                   <>
                     <p className="text-sm text-muted-foreground mb-2">Challenge completed</p>
                     <div className="text-2xl font-bold tracking-wider font-mono py-3 bg-muted/30 rounded-xl">
                       {gameData.problem} = ?
                     </div>
                   </>
                 )}
               </div>
             ) : !hasStarted ? (
               <div className="flex flex-col items-center gap-4">
                 <div className="text-3xl font-bold tracking-wider font-mono py-4 bg-muted/30 rounded-xl blur-sm">
                   {gameData.problem} = ?
                 </div>
                 <Button onClick={handleStart} size="lg" className="w-full">
                   Start Challenge
                 </Button>
               </div>
             ) : (
               <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="text-3xl font-bold tracking-wider font-mono py-4 bg-muted/30 rounded-xl animate-in fade-in duration-300">
                   {hasSubmitted ? `${gameData.problem} = ${answer}` : `${gameData.problem} = ?`}
                 </div>
                 {!hasSubmitted && (
                   <div className="flex gap-2">
                     <Input
                       type="number"
                       value={answer}
                       onChange={(e) => setAnswer(e.target.value)}
                       placeholder="Answer"
                       className="text-center text-lg font-bold"
                       autoFocus
                     />
                     <Button type="submit" disabled={!answer}>
                       Submit
                     </Button>
                   </div>
                 )}
                 {hasSubmitted && (
                   <p className="text-sm text-muted-foreground text-center">Waiting for results...</p>
                 )}
               </form>
             )}
           </div>

           {/* Leaderboard Section */}
           {leaderboard && leaderboard.length > 0 && (
             <div className="border-t border-border/50 pt-4">
               <p className="text-xs font-semibold text-muted-foreground mb-3 px-2">Submissions</p>
               <div className="space-y-1 max-h-[200px] overflow-y-auto">
                 {leaderboard.map((entry, index) => (
                   <div 
                     key={index} 
                     className={cn(
                       "flex justify-between items-center px-3 py-1.5 rounded-lg text-sm transition-colors",
                       entry.correct 
                         ? "bg-green-50 dark:bg-green-900/20" 
                         : "bg-red-50 dark:bg-red-900/20"
                     )}
                   >
                     <div className="flex items-center gap-2">
                       <span className="font-bold text-muted-foreground w-6">{index + 1}</span>
                       <span className={cn(
                         "font-medium",
                         entry.correct ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                       )}>
                         {entry.username}
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-xs text-muted-foreground">{entry.time.toFixed(2)}s</span>
                       {entry.correct && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
                       {!entry.correct && <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
       </CardContent>
    </Card>
  )
}
