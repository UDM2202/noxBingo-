import { useState, useEffect, useRef, useCallback } from 'react';
import { usePageMeta } from '../hooks/usePageMeta'
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

function Leaderboard() {
    usePageMeta(
  'NoxBingo Leaderboard — Top Solana Bingo Winners',
  "See who's winning the most OREN playing crypto bingo on NoxBingo, the Solana-powered bingo game with real money prizes."
)
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  // Multiple profile rows can change in the same instant (several
  // games finishing around the same time) — each one fires its own
  // realtime event, so without this a burst of wins would trigger a
  // burst of refetches. Debouncing collapses any such burst into one
  // refetch shortly after things settle.
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLeaderboard = useCallback(() => {
    return supabase.from('profiles')
      .select('username, games_played, games_won, total_winnings')
      .order('total_winnings', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setPlayers(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // Supabase Realtime subscribes to Postgres row changes over its
    // own WebSocket connection under the hood — this gets the
    // leaderboard live-updating without building a custom WebSocket
    // channel into the game server, which only ever handled
    // per-room game traffic, not a global, cross-room concern like
    // this. Requires Realtime to be enabled for the `profiles` table
    // in the Supabase dashboard (Database → Replication) and an RLS
    // policy that allows SELECT on it for the anon role — if the
    // initial fetch above already works for logged-out visitors,
    // that policy already exists.
    const channel = supabase
      .channel('leaderboard-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
          refetchTimerRef.current = setTimeout(() => {
            fetchLeaderboard();
          }, 400);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '2px solid #00E5FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FFD700', textAlign: 'center', letterSpacing: '0.05em', margin: 0 }}>Leaderboard</h1>
        {isLive && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#00FF88', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <motion.span
              style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00FF88' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            Live
          </span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <a href="/" style={{ color: '#5C5C9E', fontSize: '13px', textDecoration: 'none' }}>Back to Lobby</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 100px', padding: '10px 16px', color: '#5C5C9E', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span>#</span><span>Player</span><span>Played</span><span>Wins</span><span>Winnings</span>
        </div>
        {players.map((p, i) => (
          <motion.div key={p.username ?? i} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
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