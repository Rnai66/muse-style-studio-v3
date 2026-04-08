import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      gap: '1.5rem',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#c084fc',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.875rem',
        letterSpacing: '0.1em',
        fontFamily: 'Inter, sans-serif',
      }}>
        Loading…
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
