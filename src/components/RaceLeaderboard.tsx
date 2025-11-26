interface RaceLeaderboardProps {
  isActive: boolean
  leaderboard: Array<{ username: string; score: number }>
  onClose: () => void
}

export default function RaceLeaderboard({
  isActive,
  leaderboard,
  onClose,
}: RaceLeaderboardProps) {
  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] transition-opacity ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className="bg-[var(--panel-bg)] border border-[var(--chat-border)] rounded-lg p-6 w-96 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">CPS Race</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-color)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {leaderboard.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] py-4">
              Waiting for scores...
            </div>
          ) : (
            leaderboard.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[var(--input-bg)] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[var(--accent)] w-8">
                    #{index + 1}
                  </span>
                  <span className="font-medium">{entry.username}</span>
                </div>
                <span className="text-lg font-bold text-[var(--accent)]">
                  {entry.score.toFixed(2)} CPS
                </span>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-[#4a87ff] text-white rounded-lg font-medium hover:-translate-y-0.5 transition-all"
        >
          {isActive ? 'Close' : 'Done'}
        </button>
      </div>
    </div>
  )
}
