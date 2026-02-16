import React from 'react';

interface Props {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#fee',
        border: '2px solid #fcc',
        borderRadius: '6px',
        padding: '1rem 1.25rem',
        maxWidth: '500px',
        minWidth: '300px',
        zIndex: 1001,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      {/* Error Icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#c00"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      {/* Message */}
      <div style={{ flex: 1, color: '#900', fontSize: '0.95rem' }}>
        <strong>Error:</strong> {message}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#c00',
          cursor: 'pointer',
          fontSize: '1.25rem',
          lineHeight: 1,
          padding: '0.25rem',
          marginLeft: '0.5rem',
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-1rem);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
