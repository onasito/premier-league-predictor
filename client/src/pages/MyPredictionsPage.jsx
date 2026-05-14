import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import './MyPredictionsPage.css'

function MyPredictionsPage() {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { token, isLoggedIn } = useAuth()

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const res = await api.get('/predictions/my', {
          headers: { Authorization: token }
        })
        setPredictions(res.data)
      } catch (err) {
        setError('Failed to load predictions. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (isLoggedIn) {
      fetchPredictions()
    } else {
      setLoading(false)
    }
  }, [token, isLoggedIn])

  const totalPoints = predictions.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0)
  const correct = predictions.filter(p => p.pointsEarned === 3).length
  const settled = predictions.filter(p => p.pointsEarned !== null).length

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  function getOutcomeLabel(prediction) {
    if (prediction.predictedWinner === 'HOME') return prediction.match.homeTeam.name
    if (prediction.predictedWinner === 'AWAY') return prediction.match.awayTeam.name
    return 'Draw'
  }

  if (!isLoggedIn) return (
    <div className="mypredictions-status">
      <Link to="/login">Log in</Link> to see your predictions.
    </div>
  )

  if (loading) return <div className="mypredictions-status">Loading predictions...</div>
  if (error) return <div className="mypredictions-status error">{error}</div>
  if (predictions.length === 0) return (
    <div className="mypredictions-status">
      No predictions yet. <Link to="/matches">Make your first pick!</Link>
    </div>
  )

  return (
    <div className="mypredictions-page">
      <h1>My Predictions</h1>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{totalPoints}</span>
          <span className="stat-label">Total Points</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{predictions.length}</span>
          <span className="stat-label">Predictions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{settled > 0 ? `${correct}/${settled}` : '—'}</span>
          <span className="stat-label">Correct</span>
        </div>
      </div>

      <div className="predictions-list">
        {predictions.map(prediction => {
          const isCorrect = prediction.pointsEarned === 3
          const isWrong = prediction.pointsEarned === 0
          const isPending = prediction.pointsEarned === null

          return (
            <div key={prediction.id} className={`prediction-card ${isCorrect ? 'correct' : isWrong ? 'wrong' : ''}`}>
              <div className="prediction-match">
                <span className="prediction-teams">
                  {prediction.match.homeTeam.name} vs {prediction.match.awayTeam.name}
                </span>
                <span className="prediction-date">{formatDate(prediction.match.date)}</span>
              </div>

              <div className="prediction-details">
                <div className="prediction-pick">
                  Picked: <strong>{getOutcomeLabel(prediction)}</strong>
                </div>

                <div className="prediction-result">
                  {isPending ? (
                    <span className="badge pending">Pending</span>
                  ) : isCorrect ? (
                    <span className="badge correct">+3 pts</span>
                  ) : (
                    <span className="badge wrong">0 pts</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyPredictionsPage
