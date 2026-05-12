import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import SidePanel from './components/SidePanel'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MatchesPage from './pages/MatchesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import MyPredictionsPage from './pages/MyPredictionsPage'
import './App.css'

const NO_PANEL = ['/login', '/register']

function Layout() {
  const { pathname } = useLocation()
  const showPanel = !NO_PANEL.includes(pathname)

  return (
    <>
      <Navbar />
      <div className={showPanel ? 'app-layout' : ''}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/my-predictions" element={<MyPredictionsPage />} />
        </Routes>
        {showPanel && <SidePanel />}
      </div>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
}

export default App
