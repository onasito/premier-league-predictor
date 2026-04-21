import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

function Navbar() {
  const { isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">PL Predictor</Link>
      <div className="navbar-links">
        <Link to="/matches">Matches</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        {isLoggedIn && <Link to="/my-predictions">My Predictions</Link>}
        {isLoggedIn
          ? <button className="btn-login" onClick={handleLogout}>Logout</button>
          : <Link to="/login" className="btn-login">Login</Link>
        }
      </div>
    </nav>
  )
}

export default Navbar
