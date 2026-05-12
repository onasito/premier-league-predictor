import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './MatchesPage.css'

function MatchesPage() {
  const [matches, setMatches] = useState([])
  const [myPredictions, setMyPredictions] = useState({})
  const [mlPredictions, setMlPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(null)

  const { token, isLoggedIn } = useAuth()

  useEffect(() => {
    async function fetchData() {
      try {
        const matchRes = await axios.get('http://localhost:5000/matches/upcoming')
        const matchList = matchRes.data.matches || []
        setMatches(matchList)

        // fetch ML prediction for each match
        const mlResults = {}
        await Promise.all(matchList.map(async (match) => {
          try {
            const res = await axios.get('http://localhost:5000/matches/prediction', {
              params: { homeTeam: match.homeTeam.name, awayTeam: match.awayTeam.name }
            })
            mlResults[match.id] = res.data
          } catch {
            mlResults[match.id] = null
          }
        }))
        setMlPredictions(mlResults)

        if (isLoggedIn) {
          try {
            const predRes = await axios.get('http://localhost:5000/predictions/my', {
              headers: { Authorization: token }
            })
            const predMap = {}
            predRes.data.forEach(p => { predMap[p.matchId] = p.predictedWinner })
            setMyPredictions(predMap)
          } catch (err) {
            console.error('Failed to load predictions:', err.message)
          }
        }
      } catch (err) {
        console.error('Failed to load matches:', err)
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

  function getMlLabel(ml, match) {
    if (!ml) return null
    if (ml.prediction === 'H') return `${match.homeTeam.shortName || match.homeTeam.name} to win`
    if (ml.prediction === 'A') return `${match.awayTeam.shortName || match.awayTeam.name} to win`
    return 'Draw'
  }

  function groupByDate(matches) {
    return matches.reduce((groups, match) => {
      const day = match.utcDate.split('T')[0]
      if (!groups[day]) groups[day] = []
      groups[day].push(match)
      return groups
    }, {})
  }

  function formatDay(dateStr) {
    const date = new Date(dateStr + 'T12:00:00')
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    if (dateStr === today) return 'Today'
    if (dateStr === tomorrow) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  if (loading) return <div className="matches-status">Loading matches...</div>
  if (error) return <div className="matches-status error">{error}</div>
  if (matches.length === 0) return <div className="matches-status">No matches scheduled in the next 7 days.</div>

  const grouped = groupByDate(matches)

  return (
    <div className="matches-page">
      <h1>Upcoming Matches</h1>

      {!isLoggedIn && (
        <p className="login-prompt">
          <a href="/login">Log in</a> to submit your predictions.
        </p>
      )}

      {Object.entries(grouped).map(([day, dayMatches]) => (
        <div key={day} className="match-day-group">
          <h2 className="match-day-header">{formatDay(day)}</h2>
          <div className="matches-list">
            {dayMatches.map(match => {
          const prediction = myPredictions[match.id]
          const isSubmitting = submitting === match.id
          const ml = mlPredictions[match.id]

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

              {ml && (
                <div className="ml-prediction">
                  <span className="ml-label">Model predicts:</span>
                  <span className="ml-pick">{getMlLabel(ml, match)}</span>
                  <span className="ml-probs">
                    H {ml.probabilities?.H}% · D {ml.probabilities?.D}% · A {ml.probabilities?.A}%
                  </span>
                </div>
              )}

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
      ))}
    </div>
  )
}

export default MatchesPage
