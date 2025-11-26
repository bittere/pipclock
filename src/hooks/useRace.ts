import { useRef, useState, useCallback } from 'react'

interface RaceLeaderboard {
  username: string
  score: number
}

export function useRace(sendCommand: (command: any) => void) {
  const [activeRaceId, setActiveRaceId] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<RaceLeaderboard[]>([])
  const clickCountRef = useRef(0)
  const raceStartRef = useRef<number | null>(null)
  const submitIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startRace = useCallback((raceId: string) => {
    setActiveRaceId(raceId)
    clickCountRef.current = 0
    raceStartRef.current = Date.now()

    // Submit score every 100ms during race
    submitIntervalRef.current = setInterval(() => {
      if (raceStartRef.current) {
        const elapsed = (Date.now() - raceStartRef.current) / 1000
        const score = Math.round((clickCountRef.current / elapsed) * 100) / 100

        sendCommand({
          type: 'submit_score',
          raceId,
          score,
        })
      }
    }, 100)

    // Auto-stop after 60 seconds
    setTimeout(() => {
      endRace()
    }, 60000)
  }, [sendCommand])

  const endRace = useCallback(() => {
    if (submitIntervalRef.current) {
      clearInterval(submitIntervalRef.current)
      submitIntervalRef.current = null
    }
    setActiveRaceId(null)
    raceStartRef.current = null
    clickCountRef.current = 0
  }, [])

  const recordClick = useCallback(() => {
    if (activeRaceId && raceStartRef.current) {
      clickCountRef.current++
    }
  }, [activeRaceId])

  const updateLeaderboard = useCallback((newLeaderboard: RaceLeaderboard[]) => {
    setLeaderboard(newLeaderboard)
  }, [])

  return {
    activeRaceId,
    leaderboard,
    startRace,
    endRace,
    recordClick,
    updateLeaderboard,
    clickCount: clickCountRef.current,
  }
}
