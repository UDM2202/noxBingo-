import { motion, AnimatePresence } from 'framer-motion';

interface CountdownOverlayProps {
  value: number;
}

function CountdownOverlay({ value }: CountdownOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(10,15,26,0.95), rgba(10,15,26,0.98))',
      }}
    >
      {/* Outer decorative rings */}
      <motion.div
        className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-neon-primary/10"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-48 h-48 md:w-60 md:h-60 rounded-full border border-neon-primary/5"
        animate={{ 
          scale: [1.1, 1, 1.1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Number */}
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          className="relative z-10 text-center"
          initial={{ scale: 2.5, opacity: 0, filter: 'blur(8px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          exit={{ scale: 0.5, opacity: 0, filter: 'blur(4px)' }}
          transition={{ 
            duration: 0.5, 
            ease: [0.25, 0.1, 0.25, 1], // Custom cubic bezier for snap
          }}
        >
          <span
            className="text-[10rem] md:text-[12rem] font-bold leading-none select-none"
            style={{
              background: 'linear-gradient(180deg, #00F0FF 0%, #00F0FF40 60%, #0A0F1A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {value}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Label below */}
      <motion.p
        className="absolute bottom-1/4 text-sm tracking-[0.4em] uppercase text-gray-500 font-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {value === 0 ? 'Deploying...' : 'Get Ready'}
      </motion.p>

      {/* Particle dots around the number */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-neon-primary/40 rounded-full"
          style={{
            top: `${50 + 30 * Math.sin((i / 12) * Math.PI * 2)}%`,
            left: `${50 + 30 * Math.cos((i / 12) * Math.PI * 2)}%`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
}

export default CountdownOverlay;