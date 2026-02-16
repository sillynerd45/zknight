import React from 'react';

interface Props {
  progress: string;
}

export function ProofGenerationOverlay({ progress }: Props) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Spinner */}
          <div
            className="proof-spinner"
            style={{
              width: '64px',
              height: '64px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
            }}
          />

          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
            Generating Zero-Knowledge Proof
          </h3>

          <p style={{ color: '#666', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>
            {progress || 'Preparing circuit...'}
          </p>

          <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>
            This may take 5-15 seconds...
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .proof-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
}
