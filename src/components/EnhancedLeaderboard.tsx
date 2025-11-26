interface LeaderboardEntry {
  username: string
  score: number
}

interface EnhancedLeaderboardProps {
  leaderboard: LeaderboardEntry[]
  isActive: boolean
  currentUsername?: string
}

export default function EnhancedLeaderboard({
  leaderboard,
  isActive,
  currentUsername,
}: EnhancedLeaderboardProps) {
  const getMedalEmoji = (index: number): string => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return ''
  }

  const getRankColor = (index: number): string => {
    if (index === 0) return 'linear-gradient(135deg, #ffd700, #ffed4e)'
    if (index === 1) return 'linear-gradient(135deg, #c0c0c0, #e8e8e8)'
    if (index === 2) return 'linear-gradient(135deg, #cd7f32, #e8b575)'
    return 'linear-gradient(135deg, #5b9cff, #4a87ff)'
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-color)',
            margin: 0,
          }}
        >
          Leaderboard
        </h3>
        {isActive && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'linear-gradient(90deg, #5b9cff, #4a87ff)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'white',
              animation: 'pulse 2s ease-in-out infinite',
              boxShadow: '0 4px 12px rgba(91, 156, 255, 0.4)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                background: 'white',
                borderRadius: '50%',
                animation: 'pulse 1s ease-in-out infinite',
              }}
            />
            LIVE
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {leaderboard.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '12px',
                animation: 'bounce 2s infinite',
              }}
            >
              🏁
            </div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>
              Waiting for racers...
            </div>
          </div>
        ) : (
          leaderboard.map((entry, index) => {
            const isCurrentUser = currentUsername && entry.username === currentUsername
            return (
            <div
              key={`${entry.username}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background:
                  isCurrentUser
                    ? 'linear-gradient(135deg, rgba(91, 156, 255, 0.15), rgba(91, 156, 255, 0.08))'
                    : index === 0
                      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 237, 78, 0.05))'
                      : 'rgba(91, 156, 255, 0.05)',
                borderRadius: '16px',
                border:
                  isCurrentUser
                    ? '2px solid rgba(91, 156, 255, 0.4)'
                    : index === 0
                      ? '2px solid rgba(255, 215, 0, 0.3)'
                      : '1px solid rgba(91, 156, 255, 0.1)',
                animation: `slide-in-right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${
                  index * 0.1
                }s both`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                boxShadow:
                  isCurrentUser
                    ? '0 0 20px rgba(91, 156, 255, 0.4)'
                    : index === 0
                      ? '0 4px 20px rgba(255, 215, 0, 0.2)'
                      : 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'translateX(4px) scale(1.02)'
                el.style.boxShadow = '0 8px 24px rgba(91, 156, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'translateX(0) scale(1)'
                el.style.boxShadow =
                    isCurrentUser
                      ? '0 0 20px rgba(91, 156, 255, 0.4)'
                      : index === 0
                        ? '0 4px 20px rgba(255, 215, 0, 0.2)'
                        : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    background: getRankColor(index),
                    fontSize: index <= 2 ? '20px' : '16px',
                    fontWeight: 700,
                    color: index <= 2 ? '#1a1a1f' : 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    animation:
                      index === 0 ? 'pulse-slow 3s ease-in-out infinite' : 'none',
                  }}
                >
                  {getMedalEmoji(index) || `#${index + 1}`}
                </div>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-color)',
                  }}
                >
                  {entry.username}
                </span>
              </div>

              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #5b9cff, #667eea)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {entry.score.toFixed(2)}
                <span
                  style={{
                    fontSize: '14px',
                    marginLeft: '4px',
                    opacity: 0.7,
                  }}
                >
                  CPS
                </span>
              </div>
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}
