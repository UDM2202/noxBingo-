import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

function Lobby() {
  const navigate = useNavigate();
  const [isInitiating, setIsInitiating] = useState(false);

  function handleInitiate() {
    setIsInitiating(true);
    // Brief delay for the animation to play
    setTimeout(() => {
      navigate('/room/new');
    }, 600);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Ambient glow behind title */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-neon-primary rounded-full blur-[120px] opacity-[0.04] pointer-events-none" />

      <motion.div
        className="text-center relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Decorative top line */}
        <motion.div
          className="w-24 h-px mx-auto mb-8"
          style={{
            background: 'linear-gradient(90deg, transparent, #00F0FF, #FFD700, #00F0FF, transparent)',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1.2 }}
        />

        {/* Main title */}
        <motion.h1
          className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
        >
          <span
            className="bg-gradient-to-r from-neon-primary via-white to-gold bg-clip-text text-transparent"
            style={{
              backgroundSize: '200% 100%',
              backgroundPosition: '0% 50%',
            }}
          >
            NOX
          </span>
          <span
            className="bg-gradient-to-r from-gold via-neon-primary to-neon-primary bg-clip-text text-transparent"
            style={{
              backgroundSize: '200% 100%',
              backgroundPosition: '0% 50%',
            }}
          >
            BINGO
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-gray-400 tracking-[0.3em] uppercase mb-16 font-light"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          Enter the Void
        </motion.p>

        {/* Initiate button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="relative inline-block"
        >
          {/* Button outer glow */}
          <div className="absolute inset-0 bg-neon-primary rounded-lg blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-300" />

          <motion.button
  onClick={handleInitiate}
  disabled={isInitiating}
  style={{
    position: 'relative',
    padding: '4px 8px',
    fontSize: '18px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    backgroundColor: '#1A2335',
    border: '1px solid rgba(0,240,255,0.5)',
    borderRadius: '16px',
    color: '#00F0FF',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    opacity: isInitiating ? 0.5 : 1,
  }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  animate={
    isInitiating
      ? {
          borderColor: ['rgba(0,240,255,0.5)', 'rgba(0,240,255,1)', 'rgba(0,240,255,0.5)'],
          boxShadow: [
            '0 0 10px rgba(0,240,255,0.2)',
            '0 0 40px rgba(0,240,255,0.5)',
            '0 0 10px rgba(0,240,255,0.2)',
          ],
        }
      : {}
  }
  transition={
    isInitiating
      ? { duration: 0.4, repeat: 1 }
      : { duration: 0.2 }
  }
>
  {isInitiating ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ width: '8px', height: '8px', backgroundColor: '#00F0FF', borderRadius: '50%' }} />
      INITIATING...
    </span>
  ) : (
    'INITIATE GAME'
  )}
</motion.button>
        </motion.div>

        {/* Bottom decorative elements */}
        <motion.div
          className="mt-20 flex items-center justify-center gap-6 text-xs text-gray-600 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-neon-primary/50 rounded-full" />
            75-Ball
          </span>
          <span className="text-gray-700">•</span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-neon-primary/50 rounded-full" />
            3 Cards
          </span>
          <span className="text-gray-700">•</span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-neon-primary/50 rounded-full" />
            Auto-Daub
          </span>
        </motion.div>

        {/* Subtle grid lines in background */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            mask: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMask: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          }}
        />
      </motion.div>
    </div>
  );
}

export default Lobby;