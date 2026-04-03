import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ArSpace() {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
          linear-gradient(90deg, rgba(0,255,255,0.02) 1px, transparent 1px),
          linear-gradient(rgba(0,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 50px 50px, 50px 50px',
        pointerEvents: 'none'
      }} />

      <div style={{
        textAlign: 'center',
        zIndex: 10
      }}>
        <h1 style={{
          color: '#00ffff',
          fontSize: '48px',
          fontWeight: 'bold',
          textShadow: '0 0 30px #00ffff',
          marginBottom: '20px'
        }}>
          AR SPACE
        </h1>
        <p style={{
          color: '#888',
          fontSize: '16px',
          marginBottom: '40px'
        }}>
          生物鉴权成功 · 正在进入增强现实空间
        </p>

        <div style={{
          padding: '20px 40px',
          background: 'rgba(0, 255, 255, 0.1)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '12px',
          color: '#00ffff',
          fontSize: '14px'
        }}>
          🚧 AR 空间正在建设中...
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(0, 255, 255, 0.5)',
          borderRadius: '6px',
          color: '#00ffff',
          fontSize: '12px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'rgba(0, 255, 255, 0.2)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'rgba(0, 0, 0, 0.8)';
        }}
      >
        [返回主页]
      </button>
    </div>
  );
}
