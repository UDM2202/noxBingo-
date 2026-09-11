import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface CardBundle {
  id: string
  cardCount: number
  priceOren: number
  label: string
}

interface GameConfig {
  ballCap: number
  rakePercent: number
  bundles: CardBundle[]
  soloMultipliers: Record<string, number>
  noxBonusDisplay: number
}

interface Stats {
  totalUsers: number | null
  activeRooms: number
  activePlayers: number
}

function getToken(): string | null {
  return sessionStorage.getItem('noxbingo-admin-token')
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (res.status === 401) {
    sessionStorage.removeItem('noxbingo-admin-token')
    throw new Error('SESSION_EXPIRED')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

const sectionStyle: React.CSSProperties = {
  background: '#1A1A5E',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '14px',
  padding: '20px 24px',
  marginBottom: '20px',
}
const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#8B8BD4',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '6px',
  display: 'block',
}
const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: '#0B0B45',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
const saveButtonStyle: React.CSSProperties = {
  padding: '8px 20px',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  backgroundColor: '#0B0B45',
  border: '1px solid rgba(0,229,255,0.5)',
  borderRadius: '8px',
  color: '#00E5FF',
  cursor: 'pointer',
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const redirectToLogin = useCallback(() => navigate('/admin'), [navigate])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [configData, statsData] = await Promise.all([
        adminFetch('/admin/config'),
        adminFetch('/admin/stats'),
      ])
      setConfig(configData)
      setStats(statsData)
    } catch (err) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        redirectToLogin()
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [redirectToLogin])

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin()
      return
    }
    loadAll()
  }, [loadAll, redirectToLogin])

  async function saveConfig(partial: Partial<GameConfig>, successMessage: string) {
    setError(null)
    setSavedMessage(null)
    try {
      const updated = await adminFetch('/admin/config', {
        method: 'PUT',
        body: JSON.stringify(partial),
      })
      setConfig(updated)
      setSavedMessage(successMessage)
      setTimeout(() => setSavedMessage(null), 3000)
    } catch (err) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        redirectToLogin()
        return
      }
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('noxbingo-admin-token')
    navigate('/admin')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B8BD4' }}>
        Loading…
      </div>
    )
  }

  if (!config) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6464' }}>
        {error || 'Could not load config.'}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '32px 20px', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFD700' }}>NoxBingo Admin</h1>
        <button
          onClick={handleLogout}
          style={{ fontSize: '12px', color: '#FF6464', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </div>

      {error && <p style={{ color: '#FF6464', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
      {savedMessage && <p style={{ color: '#00FF88', fontSize: '13px', marginBottom: '16px' }}>{savedMessage}</p>}

      {/* Live stats */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '14px', color: '#00E5FF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Live Stats
        </h2>
        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <span style={labelStyle}>Total Users</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{stats?.totalUsers ?? '—'}</span>
          </div>
          <div>
            <span style={labelStyle}>Active Rooms</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{stats?.activeRooms ?? 0}</span>
          </div>
          <div>
            <span style={labelStyle}>Active Players</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{stats?.activePlayers ?? 0}</span>
          </div>
        </div>
        <button onClick={loadAll} style={{ ...saveButtonStyle, marginTop: '16px' }}>
          Refresh
        </button>
      </div>

      {/* Ball cap + rake */}
      <BallCapAndRakeSection config={config} onSave={saveConfig} />

      {/* Bundles */}
      <BundlesSection config={config} onSave={saveConfig} />

      {/* Nox bonus */}
      <NoxBonusSection config={config} onSave={saveConfig} />

      <p style={{ fontSize: '11px', color: '#5C5C9E', textAlign: 'center', marginTop: '24px' }}>
        Changes only apply to games created after saving — rooms already in progress keep the settings they started with.
      </p>
    </div>
  )
}

function BallCapAndRakeSection({
  config,
  onSave,
}: {
  config: GameConfig
  onSave: (partial: Partial<GameConfig>, msg: string) => void
}) {
  const [ballCap, setBallCap] = useState(config.ballCap)
  const [rakePercent, setRakePercent] = useState(config.rakePercent * 100)

  return (
    <div style={sectionStyle}>
      <h2 style={{ fontSize: '14px', color: '#00E5FF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Ball Cap & House Rake
      </h2>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Ball Cap (5–75)</label>
          <input
            type="number"
            min={5}
            max={75}
            value={ballCap}
            onChange={(e) => setBallCap(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>House Rake (%)</label>
          <input
            type="number"
            min={0}
            max={90}
            step={0.5}
            value={rakePercent}
            onChange={(e) => setRakePercent(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>
      <button
        onClick={() => onSave({ ballCap, rakePercent: rakePercent / 100 }, 'Ball cap and rake saved.')}
        style={saveButtonStyle}
      >
        Save
      </button>
    </div>
  )
}

function BundlesSection({
  config,
  onSave,
}: {
  config: GameConfig
  onSave: (partial: Partial<GameConfig>, msg: string) => void
}) {
  const [bundles, setBundles] = useState<CardBundle[]>(config.bundles)
  const [multipliers, setMultipliers] = useState<Record<string, number>>(config.soloMultipliers)

  function updateBundle(index: number, field: keyof CardBundle, value: string) {
    setBundles(prev =>
      prev.map((b, i) =>
        i === index
          ? { ...b, [field]: field === 'cardCount' || field === 'priceOren' ? Number(value) : value }
          : b
      )
    )
  }

  function updateMultiplier(bundleId: string, value: string) {
    setMultipliers(prev => ({ ...prev, [bundleId]: Number(value) }))
  }

  return (
    <div style={sectionStyle}>
      <h2 style={{ fontSize: '14px', color: '#00E5FF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Card Bundles & Solo Payout Multipliers
      </h2>
      {bundles.map((bundle, i) => (
        <div key={bundle.id} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '100px' }}>
            <label style={labelStyle}>Label</label>
            <input value={bundle.label} onChange={(e) => updateBundle(i, 'label', e.target.value)} style={inputStyle} />
          </div>
          <div style={{ width: '90px' }}>
            <label style={labelStyle}>Cards</label>
            <input
              type="number"
              min={1}
              value={bundle.cardCount}
              onChange={(e) => updateBundle(i, 'cardCount', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ width: '110px' }}>
            <label style={labelStyle}>Price (OREN)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={bundle.priceOren}
              onChange={(e) => updateBundle(i, 'priceOren', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ width: '110px' }}>
            <label style={labelStyle}>Solo Multiplier</label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={multipliers[bundle.id] ?? ''}
              onChange={(e) => updateMultiplier(bundle.id, e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      ))}
      <button
        onClick={() => onSave({ bundles, soloMultipliers: multipliers }, 'Bundles and multipliers saved.')}
        style={{ ...saveButtonStyle, marginTop: '8px' }}
      >
        Save
      </button>
    </div>
  )
}

function NoxBonusSection({
  config,
  onSave,
}: {
  config: GameConfig
  onSave: (partial: Partial<GameConfig>, msg: string) => void
}) {
  const [noxBonusDisplay, setNoxBonusDisplay] = useState(config.noxBonusDisplay)

  return (
    <div style={sectionStyle}>
      <h2 style={{ fontSize: '14px', color: '#00E5FF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Nox Bonus
      </h2>
      <p style={{ fontSize: '12px', color: '#5C5C9E', marginBottom: '12px' }}>
        This is a cosmetic, off-chain display bonus only — it does not currently pay real OREN.
      </p>
      <div style={{ maxWidth: '160px', marginBottom: '16px' }}>
        <label style={labelStyle}>Bonus Amount</label>
        <input
          type="number"
          min={0}
          value={noxBonusDisplay}
          onChange={(e) => setNoxBonusDisplay(Number(e.target.value))}
          style={inputStyle}
        />
      </div>
      <button onClick={() => onSave({ noxBonusDisplay }, 'Nox bonus amount saved.')} style={saveButtonStyle}>
        Save
      </button>
    </div>
  )
}

export default AdminDashboard