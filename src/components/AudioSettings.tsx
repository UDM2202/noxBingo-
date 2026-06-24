import { motion, AnimatePresence } from 'framer-motion';
import type { VoicePreset } from '../hooks/useAudio';
import { VOICE_PRESETS } from '../hooks/useAudio';
interface AudioSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  voicePreset: VoicePreset;
  onChangeVoice: (preset: VoicePreset) => void;
  onPreviewVoice: (preset: VoicePreset) => void;
}
function AudioSettings({ isOpen, onClose, soundEnabled, onToggleSound, voicePreset, onChangeVoice, onPreviewVoice }: AudioSettingsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(11,11,69,0.8)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              backgroundColor: '#1A1A5E',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '440px',
              width: '100%',
              margin: '0 16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#8B8BD4',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                Audio Settings
              </h3>
              <button
                onClick={onClose}
                style={{
                  color: '#5C5C9E',
                  fontSize: '20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#5C5C9E')}
              >
                X
              </button>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>Sound Effects</span>
              <button
                onClick={onToggleSound}
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: soundEnabled ? '#00FF88' : '#3D3D7A',
                  transition: 'background-color 0.2s',
                }}
              >
                <motion.div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                  animate={{ left: soundEnabled ? '32px' : '4px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            <p style={{
              fontSize: '11px',
              color: '#5C5C9E',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}>
              Caller Voice
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}>
              {VOICE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onChangeVoice(preset.id)}
                  onDoubleClick={() => onPreviewVoice(preset.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '12px',
                    border: voicePreset === preset.id
                      ? '1px solid rgba(0,229,255,0.4)'
                      : '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: voicePreset === preset.id
                      ? 'rgba(0,229,255,0.08)'
                      : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{preset.emoji}</span>
                  <div>
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500, margin: '0 0 2px 0' }}>
                      {preset.label}
                    </p>
                    <p style={{ color: '#5C5C9E', fontSize: '11px', margin: 0 }}>
                      {preset.description}
                    </p>
                  </div>
                  {voicePreset === preset.id && (
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#00E5FF',
                        borderRadius: '50%',
                      }}
                      layoutId="activeVoice"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
            <p style={{
              color: '#5C5C9E',
              fontSize: '11px',
              marginTop: '16px',
              textAlign: 'center',
            }}>
              Double-click a voice to preview it
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default AudioSettings;
