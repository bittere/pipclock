interface InlineRaceLeaderboardProps {
  raceId: string
  leaderboard: Array<{ username: string; score: number }>
  maxEntries?: number
  currentUsername?: string
}

export default function InlineRaceLeaderboard({
  raceId,
  leaderboard,
  maxEntries = 5,
  currentUsername,
}: InlineRaceLeaderboardProps) {
  const displayLeaderboard = leaderboard.slice(0, maxEntries)

  if (displayLeaderboard.length === 0) {
    return null
  }

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px 16px',
        background: 'rgba(91, 156, 255, 0.08)',
        borderRadius: '12px',
        border: '1px solid rgba(91, 156, 255, 0.15)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            background: '#34c759',
            borderRadius: '50%',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        Race Results
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayLeaderboard.map((entry, index) => {
          const isCurrentUser = currentUsername && entry.username === currentUsername
          return (
          <div
            key={`${raceId}-${entry.username}-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background:
                isCurrentUser
                  ? 'rgba(91, 156, 255, 0.15)'
                  : index === 0
                    ? 'rgba(255, 215, 0, 0.1)'
                    : 'rgba(91, 156, 255, 0.04)',
              borderRadius: '8px',
              border:
                isCurrentUser
                  ? '2px solid rgba(91, 156, 255, 0.4)'
                  : index === 0
                    ? '1px solid rgba(255, 215, 0, 0.2)'
                    : '1px solid rgba(91, 156, 255, 0.08)',
              animation: `slide-in-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${
                index * 0.05
              }s both`,
              fontSize: '13px',
              boxShadow: isCurrentUser ? '0 0 12px rgba(91, 156, 255, 0.3)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  background:
                    index === 0
                      ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
                      : index === 1
                        ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)'
                        : index === 2
                          ? 'linear-gradient(135deg, #cd7f32, #e8b575)'
                          : 'linear-gradient(135deg, #5b9cff, #4a87ff)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: index <= 2 ? '#1a1a1f' : 'white',
                  flexShrink: 0,
                }}
              >
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              <span
                style={{
                  fontWeight: 500,
                  color: 'var(--text-color)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '140px',
                }}
              >
                {entry.username}
              </span>
            </div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #5b9cff, #667eea)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                flexShrink: 0,
              }}
            >
              {entry.score.toFixed(2)}
            </span>
          </div>
          )
        })}
      </div>

      {leaderboard.length > maxEntries && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          +{leaderboard.length - maxEntries} more
        </div>
      )}
    </div>
  )
}
