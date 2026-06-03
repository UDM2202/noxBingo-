import { Routes, Route } from 'react-router-dom'
import AnimatedBackground from './components/AnimatedBackground'
import Lobby from './pages/Lobby'
import GameRoom from './pages/GameRoom'

function App() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/room/:roomCode" element={<GameRoom />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
