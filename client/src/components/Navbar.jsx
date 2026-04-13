import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">PL Predictor</Link>
      <div className="navbar-links">
        <Link to="/matches">Matches</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/login" className="btn-login">Login</Link>
      </div>
    </nav>
  )
}

export default Navbar
