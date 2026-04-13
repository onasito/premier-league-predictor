import { Link } from 'react-router-dom'
import './HomePage.css'

function HomePage() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Premier League Predictor</h1>
        <p className="hero-subtitle">
          Pick the winners. Earn points. Climb the leaderboard.
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="btn-primary">Get Started</Link>
          <Link to="/leaderboard" className="btn-secondary">View Leaderboard</Link>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <span className="feature-icon">Soccer</span>
          <h3>Pick Winners</h3>
          <p>Choose who you think will win each Premier League match before kick-off.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">Points</span>
          <h3>Earn Points</h3>
          <p>Get 3 points for every correct prediction. Wrong pick? Back to zero.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">Trophy</span>
          <h3>Leaderboard</h3>
          <p>See how you stack up against other predictors each week.</p>
        </div>
      </div>
    </div>
  )
}

export default HomePage
