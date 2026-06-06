import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks?: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning';
  showRemarks?: boolean;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger', showRemarks }: ConfirmDialogProps) {
  const [remarks, setRemarks] = useState('');

  const isDanger = variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', backgroundColor: isDanger ? '#fff1f2' : '#fef3c7',
          }}
        >
          <AlertTriangle size={24} color={isDanger ? '#e11d48' : '#d97706'} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>{message}</p>
        {showRemarks && (
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add remarks (optional)..."
            rows={3}
            style={{ width: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '8px 12px', fontSize: '14px', marginBottom: '16px', resize: 'none', outline: 'none' }}
          />
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: '#374151', background: 'white', border: '1px solid #d1d5db', borderRadius: '12px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(remarks); onClose(); setRemarks(''); }}
            style={{
              padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer',
              backgroundColor: isDanger ? '#e11d48' : '#d97706',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
