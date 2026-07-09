import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function SlideOver({ isOpen, onClose, title, subtitle, children, footer }: SlideOverProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'flex-end' }}>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ width: '100%', maxWidth: '520px', backgroundColor: 'white', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }} className="responsive-padding-sm">
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{title}</h2>
                  {subtitle && <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>{subtitle}</p>}
                </div>
                <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent' }} className="hover:bg-gray-100">
                  <X size={20} color="#9ca3af" />
                </button>
              </div>
              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto' }} className="responsive-padding-sm">
                {children}
              </div>
              {/* Footer */}
              {footer && (
                <div style={{ borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }} className="responsive-padding-sm">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
