import { Routes, Route } from 'react-router-dom'
import AnimatedBackground from './types/components/AnimatedBackground'
import Lobby from './pages/Lobby'
import Auth from './pages/Auth'
import Leaderboard from './pages/Leaderboard'
import GameRoom from './pages/GameRoom'

function App() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/room/:roomCode" element={<GameRoom />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
