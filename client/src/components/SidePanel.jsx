import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { FaChartBar, FaFutbol, FaTrophy, FaSignOutAlt, FaHome } from 'react-icons/fa'
import './SidePanel.css'

function SidePanel() {
  const { isLoggedIn, user, login, logout } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.token, res.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  if (isLoggedIn) {
    return (
      <aside className="side-panel">
        <div className="profile-avatar">
          {user?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <p className="profile-welcome">Welcome back,</p>
        <h3 className="profile-name">{user?.username}</h3>

        <nav className="profile-nav">
          <Link to ="/" className="profile-nav-link">
            <FaHome className="profile-nav-icon" /> Home
          </Link>
          <Link to="/my-predictions" className="profile-nav-link">
            <FaChartBar className="profile-nav-icon" /> My Predictions
          </Link>
          <Link to="/matches" className="profile-nav-link">
            <FaFutbol className="profile-nav-icon" /> Matches
          </Link>
          <Link to="/leaderboard" className="profile-nav-link">
            <FaTrophy className="profile-nav-icon" /> Leaderboard
          </Link>
        </nav>

        <button className="btn-logout" onClick={handleLogout}>
          <FaSignOutAlt style={{ marginRight: 8 }} /> Log Out
        </button>
      </aside>
    )
  }

  return (
    <aside className="side-panel">
      <h3 className="auth-panel-title">Sign In</h3>
      <p className="auth-panel-sub">Log in to make your predictions</p>

      {error && <div className="auth-panel-error">{error}</div>}

      <form onSubmit={handleLogin} className="auth-panel-form">
        <div className="panel-form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="panel-form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className="btn-panel-login" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="auth-panel-switch">
        No account? <Link to="/register">Register</Link>
      </p>
    </aside>
  )
}

export default SidePanel
