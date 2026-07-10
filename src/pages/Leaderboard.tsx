import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
function Leaderboard() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('profiles')
      .select('username, games_played, games_won, total_winnings')
      .order('total_winnings', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setPlayers(data);
        setLoading(false);
      });
  }, []);
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '2px solid #00E5FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FFD700', textAlign: 'center', marginBottom: '32px', letterSpacing: '0.05em' }}>Leaderboard</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <a href="/" style={{ color: '#5C5C9E', fontSize: '13px', textDecoration: 'none' }}>Back to Lobby</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 100px', padding: '10px 16px', color: '#5C5C9E', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span>#</span><span>Player</span><span>Played</span><span>Wins</span><span>Winnings</span>
        </div>
        {players.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 100px', padding: '12px 16px', backgroundColor: i < 3 ? 'rgba(255,215,0,0.05)' : 'transparent', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', color: '#fff', fontSize: '14px', alignItems: 'center' }}>
            <span style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#5C5C9E', fontWeight: 700 }}>{i + 1}</span>
            <span style={{ fontWeight: 500 }}>{p.username || 'Anonymous'}</span>
            <span style={{ color: '#8B8BD4' }}>{p.games_played}</span>
            <span style={{ color: '#00FF88' }}>{p.games_won}</span>
            <span style={{ color: '#FFD700', fontFamily: 'monospace', fontWeight: 600 }}>{p.total_winnings.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
export default Leaderboard;
