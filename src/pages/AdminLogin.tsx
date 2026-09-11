import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Incorrect password.')
        return
      }
      const { token } = await res.json()
      // Session only, on purpose — an admin token shouldn't quietly
      // persist across browser restarts on a shared machine.
      sessionStorage.setItem('noxbingo-admin-token', token)
      navigate('/admin/dashboard')
    } catch {
      setError('Could not reach the server. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#1A1A5E',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '32px',
        }}
      >
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#FFD700',
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          Admin Access
        </h1>
        <p style={{ fontSize: '13px', color: '#8B8BD4', textAlign: 'center', marginBottom: '24px' }}>
          NoxBingo control panel
        </p>

        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '14px 16px',
            backgroundColor: '#0B0B45',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: '16px',
          }}
        />

        {error && (
          <p style={{ color: '#FF6464', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            backgroundColor: '#0B0B45',
            border: '1px solid rgba(0,229,255,0.5)',
            borderRadius: '10px',
            color: loading || !password ? '#3A3A6E' : '#00E5FF',
            cursor: loading || !password ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Checking…' : 'Sign In'}
        </button>
      </motion.form>
    </div>
  )
}

export default AdminLogin