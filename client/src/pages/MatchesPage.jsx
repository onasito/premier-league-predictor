import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './MatchesPage.css'

function MatchesPage() {
  const [matches, setMatches] = useState([])
  const [myPredictions, setMyPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(null) // matchId currently being submitted

  const { token, isLoggedIn } = useAuth()

  useEffect(() => {
    async function fetchData() {
      try {
        const matchRes = await axios.get('http://localhost:5000/matches/upcoming')

        // backend returns raw API data or a message object if no matches today
        const matchList = matchRes.data.matches || []
        setMatches(matchList)

        // if logged in, also fetch the user's existing predictions
        if (isLoggedIn) {
          const predRes = await axios.get('http://localhost:5000/predictions/my', {
            headers: { Authorization: token }
          })
          // build a map of matchId -> predictedWinner for quick lookup
          const predMap = {}
          predRes.data.forEach(p => { predMap[p.matchId] = p.predictedWinner })
          setMyPredictions(predMap)
        }
      } catch (err) {
        setError('Failed to load matches. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isLoggedIn, token])

  async function handlePredict(match, outcome) {
    if (!isLoggedIn) return
    setSubmitting(match.id)

    try {
      await axios.post('http://localhost:5000/predictions', {
        matchId: match.id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        matchDate: match.utcDate,
        predictedWinner: outcome
      }, {
        headers: { Authorization: token }
      })

      setMyPredictions(prev => ({ ...prev, [match.id]: outcome }))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit prediction.')
    } finally {
      setSubmitting(null)
    }
  }

  function formatTime(utcDate) {
    return new Date(utcDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    })
  }

  if (loading) return <div className="matches-status">Loading matches...</div>
  if (error) return <div className="matches-status error">{error}</div>
  if (matches.length === 0) return <div className="matches-status">No matches scheduled for today.</div>

  return (
    <div className="matches-page">
      <h1>Today's Matches</h1>

      {!isLoggedIn && (
        <p className="login-prompt">
          <a href="/login">Log in</a> to submit your predictions.
        </p>
      )}

      <div className="matches-list">
        {matches.map(match => {
          const prediction = myPredictions[match.id]
          const isSubmitting = submitting === match.id

          return (
            <div key={match.id} className="match-card">
              <div className="match-meta">
                <span className="competition">{match.competition.name}</span>
                <span className="match-time">{formatTime(match.utcDate)}</span>
              </div>

              <div className="match-teams">
                <span className="team home">{match.homeTeam.name}</span>
                <span className="vs">vs</span>
                <span className="team away">{match.awayTeam.name}</span>
              </div>

              <div className="match-actions">
                {prediction ? (
                  <div className="prediction-made">
                    You picked: <strong>{prediction === 'HOME' ? match.homeTeam.name : prediction === 'AWAY' ? match.awayTeam.name : 'Draw'}</strong>
                  </div>
                ) : isLoggedIn ? (
                  <div className="predict-buttons">
                    <button
                      className="btn-predict home"
                      onClick={() => handlePredict(match, 'HOME')}
                      disabled={isSubmitting}
                    >
                      {match.homeTeam.shortName || match.homeTeam.name}
                    </button>
                    <button
                      className="btn-predict draw"
                      onClick={() => handlePredict(match, 'DRAW')}
                      disabled={isSubmitting}
                    >
                      Draw
                    </button>
                    <button
                      className="btn-predict away"
                      onClick={() => handlePredict(match, 'AWAY')}
                      disabled={isSubmitting}
                    >
                      {match.awayTeam.shortName || match.awayTeam.name}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MatchesPage
