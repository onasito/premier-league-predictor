import { useEffect, useState } from 'react'
import api from '../api'
import './PowerRankingsPage.css'

function FormBadge({ result }) {
  return <span className={`form-badge form-${result.toLowerCase()}`}>{result}</span>
}

const MAX_CLIENT_RETRIES = 3
const RETRY_DELAY_MS = 8000

function PowerRankingsPage() {
  const [rankings, setRankings] = useState(null)
  const [warming, setWarming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    function attempt(retriesLeft) {
      api.get('/power-rankings')
        .then(res => { if (!cancelled) setRankings(res.data) })
        .catch(() => {
          if (cancelled) return
          if (retriesLeft > 0) {
            setWarming(true)
            setTimeout(() => attempt(retriesLeft - 1), RETRY_DELAY_MS)
          } else {
            setError('Could not load power rankings. Please try again later.')
          }
        })
    }

    attempt(MAX_CLIENT_RETRIES)
    return () => { cancelled = true }
  }, [])

  if (error) return <div className="pr-status error">{error}</div>
  if (rankings === null) return (
    <div className="pr-status">
      {warming ? 'ML service is warming up — please wait...' : 'Loading power rankings...'}
    </div>
  )

  return (
    <div className="pr-page">
      <h1>Power Rankings</h1>
      <p className="pr-subtitle">Based on {new Date().getFullYear() - 1}/{new Date().getFullYear()} season performance</p>

      <div className="pr-table">
        <div className="pr-header">
          <span className="pr-col-rank">#</span>
          <span className="pr-col-team">Team</span>
          <span className="pr-col-stat">GP</span>
          <span className="pr-col-stat">W</span>
          <span className="pr-col-stat">D</span>
          <span className="pr-col-stat">L</span>
          <span className="pr-col-stat">GD</span>
          <span className="pr-col-stat">PPG</span>
          <span className="pr-col-form">Form</span>
          <span className="pr-col-score">Score</span>
        </div>

        {rankings.map((team, index) => (
          <div key={team.team} className="pr-row">
            <span className="pr-col-rank">{index + 1}</span>
            <span className="pr-col-team">{team.team}</span>
            <span className="pr-col-stat muted">{team.gamesPlayed}</span>
            <span className="pr-col-stat">{team.wins}</span>
            <span className="pr-col-stat muted">{team.draws}</span>
            <span className="pr-col-stat muted">{team.losses}</span>
            <span className={`pr-col-stat ${team.goalDiff > 0 ? 'positive' : team.goalDiff < 0 ? 'negative' : ''}`}>
              {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
            </span>
            <span className="pr-col-stat">{team.ppg.toFixed(2)}</span>
            <span className="pr-col-form">
              {team.form.split('').map((r, i) => <FormBadge key={i} result={r} />)}
            </span>
            <span className="pr-col-score">{team.powerScore}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PowerRankingsPage
