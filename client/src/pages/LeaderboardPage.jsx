import { useEffect, useState } from 'react'
import api from '../api'
import './LeaderboardPage.css'

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await api.get('/leaderboard')
        setLeaderboard(res.data)
      } catch (err) {
        setError('Failed to load leaderboard. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) return <div className="leaderboard-status">Loading leaderboard...</div>
  if (error) return <div className="leaderboard-status error">{error}</div>
  if (leaderboard.length === 0) return <div className="leaderboard-status">No predictions made yet.</div>

  return (
    <div className="leaderboard-page">
      <h1>Leaderboard</h1>
      <p className="leaderboard-subtitle">Ranked by total points earned</p>

      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <span className="col-rank">Rank</span>
          <span className="col-user">Player</span>
          <span className="col-predictions">Predictions</span>
          <span className="col-points">Points</span>
        </div>

        {leaderboard.map((user, index) => (
          <div key={user.username} className={`leaderboard-row ${index < 3 ? `top-${index + 1}` : ''}`}>
            <span className="col-rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
            </span>
            <span className="col-user">{user.username}</span>
            <span className="col-predictions">{user.predictionsCount}</span>
            <span className="col-points">{user.totalPoints} pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LeaderboardPage
