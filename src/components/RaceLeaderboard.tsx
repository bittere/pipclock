import EnhancedLeaderboard from './EnhancedLeaderboard'

interface RaceLeaderboardProps {
  isActive: boolean
  leaderboard: Array<{ username: string; score: number }>
  onClose: () => void
  currentUsername?: string
}

export default function RaceLeaderboard({
  isActive,
  leaderboard,
  onClose,
  currentUsername,
}: RaceLeaderboardProps) {
  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] transition-opacity select-none ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      style={{
        backdropFilter: isActive ? 'blur(4px)' : 'none',
        transitionDuration: '300ms',
      }}
    >
      <div
        className="bg-[var(--panel-bg)] border border-[var(--chat-border)] rounded-lg p-6 max-w-sm w-full shadow-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: isActive ? 'pop-in 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          boxShadow: isActive 
            ? '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px rgba(91, 156, 255, 0.2)'
            : '0 20px 40px rgba(0, 0, 0, 0.3)',
          transition: 'box-shadow 0.6s ease-in-out',
        }}
      >
        {/* Race active indicator */}
        {isActive && (
          <div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[#4a87ff] to-[var(--accent)]"
            style={{
              animation: 'race-shine 2s infinite',
              backgroundSize: '200% 100%',
            }}
          />
        )}

        <EnhancedLeaderboard 
          leaderboard={leaderboard}
          isActive={isActive}
          currentUsername={currentUsername}
        />

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-[#4a87ff] text-accent-foreground rounded-lg font-medium hover:-translate-y-0.5 transition-all relative overflow-hidden group active:scale-95 transition-transform"
          style={{
            boxShadow: isActive
              ? '0 4px 12px rgba(91, 156, 255, 0.4)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.boxShadow = '0 6px 16px rgba(91, 156, 255, 0.6)'
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.boxShadow = isActive
              ? '0 4px 12px rgba(91, 156, 255, 0.4)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isActive ? 'Close' : 'Done'}
        </button>
      </div>
    </div>
  )
}
