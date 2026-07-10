import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to lobby when user logs in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isLogin) {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      }
      // If no error, the useEffect above will redirect once user state updates
    } else {
      const result = await signUp(email, password, username);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess('Account created! Signing you in...');
        // Auto sign in after signup
        setTimeout(async () => {
          await signIn(email, password);
        }, 500);
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'absolute', top: '33%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '300px', background: '#00E5FF', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.04, pointerEvents: 'none' }} />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '380px', width: '100%' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#8B8BD4', textAlign: 'center', marginBottom: '32px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>

        {error && <p style={{ color: '#FF6464', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}
        {success && <p style={{ color: '#00FF88', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>{success}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLogin && (
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '14px 18px', backgroundColor: '#1A1A5E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '14px 18px', backgroundColor: '#1A1A5E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '14px 18px', backgroundColor: '#1A1A5E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          
          <motion.button type="submit" disabled={loading}
            style={{ padding: '14px', fontSize: '15px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#1A1A5E', border: '1px solid rgba(0,229,255,0.5)', borderRadius: '10px', color: '#00E5FF', cursor: 'pointer', marginTop: '8px', opacity: loading ? 0.5 : 1 }}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#5C5C9E' }}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: '#00E5FF', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: '12px' }}>
          <a href="/" style={{ color: '#5C5C9E', fontSize: '12px', textDecoration: 'none' }}>Play as guest</a>
        </p>
      </motion.div>
    </div>
  );
}

export default Auth;
