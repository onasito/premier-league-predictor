import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import './HomePage.css'

function useMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint)
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth <= breakpoint) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return isMobile
}

function MobileLoginPrompt() {
  return (
    <div className="mobile-login-prompt">
      <div className="mobile-prompt-content">
        <span className="mobile-prompt-badge">2024 / 25</span>
        <h1 className="mobile-prompt-title">PL Predictor</h1>
        <p className="mobile-prompt-sub">Predict results. Track your score. Climb the leaderboard.</p>
        <div className="mobile-prompt-actions">
          <Link to="/login" className="btn-mobile-signin">Sign In</Link>
          <Link to="/register" className="btn-mobile-register">Create Account</Link>
        </div>
      </div>
    </div>
  )
}

function AnalyticsPanel({ table = [] }) {
  const top6 = table.slice(0, 6)
  const maxPoints = top6[0]?.points || 1

  const totalGoals = table.reduce((sum, t) => sum + t.goalsFor, 0)
  const totalPlayed = table.reduce((sum, t) => sum + t.playedGames, 0) / 2
  const goalsPerMatch = totalPlayed > 0 ? (totalGoals / totalPlayed).toFixed(2) : '—'

  return (
    <div className="analytics-panel">
      <div className="analytics-header">
        <span className="analytics-label">2025 / 26 Season</span>
        <h2 className="analytics-title">League Overview</h2>
      </div>

      <div className="analytics-stats">
        <div className="stat-card">
          <span className="stat-value">{Math.round(totalPlayed) || '—'}</span>
          <span className="stat-label">Matches Played</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalGoals || '—'}</span>
          <span className="stat-label">Total Goals</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{goalsPerMatch}</span>
          <span className="stat-label">Goals / Match</span>
        </div>
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Points — Top 6</h3>
        {top6.length === 0 ? (
          <p className="chart-note">Loading standings...</p>
        ) : (
          <div className="chart-bars">
            {top6.map(({ team, points }) => (
              <div key={team.id} className="bar-row">
                <span className="bar-team">{team.shortName || team.name}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(points / maxPoints) * 100}%` }} />
                </div>
                <span className="bar-value">{points}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HomePage() {
  const { isLoggedIn } = useAuth()
  const isMobile = useMobile()
  const [table, setTable] = useState([])

  useEffect(() => {
    async function fetchStandings() {
      try {
        const res = await api.get('/standings')
        setTable(res.data.table ?? [])
      } catch (err) {
        console.error('Failed to fetch standings:', err.message)
      }
    }
    fetchStandings()
  }, [])

  if (isMobile && !isLoggedIn) return <MobileLoginPrompt />

  return <AnalyticsPanel table={table} />
}

export default HomePage
