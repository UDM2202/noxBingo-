import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAudio } from '../hooks/useAudio';

function Lobby() {
  const navigate = useNavigate();
  const [isInitiating, setIsInitiating] = useState(false);
  const { play } = useAudio();

  function handleInitiate() {
    setIsInitiating(true);
    play('gameStart');
    setTimeout(() => {
      navigate('/room/new');
    }, 600);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-neon-primary rounded-full blur-[120px] opacity-[0.04] pointer-events-none" />

      <motion.div
        className="text-center relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="w-24 h-px mx-auto mb-8"
          style={{
            background: 'linear-gradient(90deg, transparent, #00E5FF, #FFD700, #00E5FF, transparent)',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1.2 }}
        />

        <motion.h1
          className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
        >
          <span
            className="bg-gradient-to-r from-[#5C5C9E] via-[#8B8BD4] to-gold bg-clip-text text-transparent"
            style={{
              backgroundSize: '200% 100%',
              backgroundPosition: '0% 50%',
            }}
          >
            NOX
          </span>
          <span
            className="bg-gradient-to-r from-gold via-[#8B8BD4] to-[#5C5C9E] bg-clip-text text-transparent"
            style={{
              backgroundSize: '200% 100%',
              backgroundPosition: '0% 50%',
            }}
          >
            BINGO
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-[#5C5C9E] tracking-[0.3em] uppercase mb-16 font-light"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          Enter the Void
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-neon-primary rounded-lg blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-300" />

          <motion.button
            onClick={handleInitiate}
            disabled={isInitiating}
            style={{
              position: 'relative',
              padding: '4px 8px',
              margin: '8px',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              backgroundColor: '#1A1A5E',
              border: '1px solid rgba(0,229,255,0.5)',
              borderRadius: '16px',
              color: '#00E5FF',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              opacity: isInitiating ? 0.5 : 1,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={
              isInitiating
                ? {
                    borderColor: ['rgba(0,229,255,0.5)', 'rgba(0,229,255,1)', 'rgba(0,229,255,0.5)'],
                    boxShadow: [
                      '0 0 10px rgba(0,229,255,0.2)',
                      '0 0 40px rgba(0,229,255,0.5)',
                      '0 0 10px rgba(0,229,255,0.2)',
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
                <span style={{ width: '8px', height: '8px', backgroundColor: '#00E5FF', borderRadius: '50%' }} />
                INITIATING...
              </span>
            ) : (
              'INITIATE GAME'
            )}
          </motion.button>
        </motion.div>

        <motion.div
          className="mt-20 flex items-center justify-center gap-6 text-xs tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <span className="flex items-center gap-2 text-[#5C5C9E]">
            <span className="w-1 h-1 bg-neon-primary/50 rounded-full" />
            75-Ball
          </span>
          <span className="text-[#3D3D7A]">•</span>
          <span className="flex items-center gap-2 text-[#5C5C9E]">
            <span className="w-1 h-1 bg-neon-primary/50 rounded-full" />
            3 Cards
          </span>
          <span className="text-[#3D3D7A]">•</span>
          <span className="flex items-center gap-2 text-[#5C5C9E]">
            <span className="w-1 h-1 bg-neon-primary/50 rounded-full" />
            Auto-Daub
          </span>
        </motion.div>

        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)
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