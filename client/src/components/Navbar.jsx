import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaChartBar, FaFutbol, FaTrophy, FaBolt } from 'react-icons/fa'
import './Navbar.css'

function Navbar() {
  const { isLoggedIn, user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
    setDropdownOpen(false)
  }

  if (!isLoggedIn) return null

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">PL <span>Predictor</span></Link>

      <div className="navbar-right">
        <button
          className="navbar-avatar"
          onClick={() => setDropdownOpen(o => !o)}
        >
          {user?.username?.[0]?.toUpperCase() ?? '?'}
        </button>

        {dropdownOpen && (
          <>
            <div className="dropdown-backdrop" onClick={() => setDropdownOpen(false)} />
            <div className="navbar-dropdown">
              <span className="dropdown-username">{user?.username}</span>
              <Link to="/my-predictions" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                <FaChartBar /> My Predictions
              </Link>
              <Link to="/matches" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                <FaFutbol /> Matches
              </Link>
              <Link to="/leaderboard" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                <FaTrophy /> Leaderboard
              </Link>
              <Link to="/power-rankings" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                <FaBolt /> Power Rankings
              </Link>
              <button className="dropdown-logout" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
