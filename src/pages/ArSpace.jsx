import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@google/model-viewer';

export default function ArSpace() {
  const navigate = useNavigate();
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const handleModelLoad = () => {
    setModelLoaded(true);
    console.log('[ARSpace] 3D模型加载完成');
  };

  const handleProgress = (event) => {
    const progress = event.detail?.totalProgress || 0;
    setLoadProgress(Math.round(progress * 100));
  };

  const handleExit = () => {
    navigate('/');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      overflow: 'hidden',
      fontFamily: 'monospace'
    }}>
      <style>{`
        @keyframes breathe {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1);
            border-color: rgba(0, 255, 255, 0.8);
          }
          50% { 
            box-shadow: 0 0 40px rgba(0, 255, 255, 0.8), inset 0 0 30px rgba(0, 255, 255, 0.2);
            border-color: rgba(0, 255, 255, 1);
          }
        }
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.4); }
          50% { text-shadow: 0 0 15px rgba(0, 255, 255, 1), 0 0 30px rgba(0, 255, 255, 0.6); }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        model-viewer {
          --poster-color: transparent;
        }
        model-viewer::part(default-progress-bar) {
          display: none;
        }
        .ar-button {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          padding: 16px 32px;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid rgba(0, 255, 255, 0.8);
          border-radius: 8px;
          color: #00ffff;
          font-family: monospace;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 2px;
          cursor: pointer;
          animation: breathe 2s ease-in-out infinite;
          transition: all 0.3s ease;
          text-transform: uppercase;
        }
        .ar-button:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 60px rgba(0, 255, 255, 1);
        }
        .progress-container {
          position: absolute;
          bottom: 120px;
          left: 50%;
          transform: translateX(-50%);
          width: 300px;
          max-width: 80%;
        }
        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(0, 255, 255, 0.2);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ffff, #00ff88);
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
        }
        .progress-text {
          text-align: center;
          color: #00ffff;
          font-size: 12px;
          margin-top: 8px;
          animation: pulse 1s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          linear-gradient(90deg, rgba(0,255,255,0.02) 1px, transparent 1px),
          linear-gradient(rgba(0,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
        animation: 'scanLine 3s linear infinite',
        opacity: 0.5,
        zIndex: 2,
        pointerEvents: 'none'
      }} />

      <model-viewer
        src="/AR_resources/2b.glb"
        ios-src="/AR_resources/2b.usdz"
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="2"
        environment-image="neutral"
        exposure="1"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent'
        }}
        onLoad={handleModelLoad}
        onProgress={handleProgress}
      >
        <button 
          slot="ar-button" 
          className="ar-button"
          style={{ display: modelLoaded ? 'block' : 'none' }}
        >
          [ 激活 3D 投影 / ACTIVATE AR ]
        </button>

        {!modelLoaded && (
          <div slot="progress-bar" className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="progress-text">
              正在加载 3D 实体模型... {loadProgress}%
            </div>
          </div>
        )}
      </model-viewer>

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        padding: '12px 20px',
        background: 'rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        borderRadius: '6px',
        color: modelLoaded ? '#00ff88' : '#00ffff',
        fontSize: '12px',
        fontFamily: 'monospace',
        letterSpacing: '1px',
        zIndex: 10,
        animation: modelLoaded ? 'textGlow 2s ease-in-out infinite' : 'pulse 1s ease-in-out infinite'
      }}>
        {modelLoaded ? '[ 状态：生物密钥匹配成功 / ENTITY LOADED ]' : `[ 状态：正在加载模型... ${loadProgress}% ]`}
      </div>

      <button
        onClick={handleExit}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          background: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 68, 68, 0.5)',
          borderRadius: '6px',
          color: '#ff4444',
          fontSize: '12px',
          fontFamily: 'monospace',
          letterSpacing: '1px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          zIndex: 10
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'rgba(255, 68, 68, 0.2)';
          e.target.style.borderColor = '#ff4444';
          e.target.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.5)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'rgba(0, 0, 0, 0.7)';
          e.target.style.borderColor = 'rgba(255, 68, 68, 0.5)';
          e.target.style.boxShadow = 'none';
        }}
      >
        [ 终止链接 / EXIT ]
      </button>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(0, 255, 255, 0.2)',
        borderRadius: '4px',
        color: 'rgba(0, 255, 255, 0.6)',
        fontSize: '10px',
        fontFamily: 'monospace',
        letterSpacing: '1px',
        zIndex: 10
      }}>
        AR SPACE v1.0 | WebGL + WebXR
      </div>

      {modelLoaded && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '4px',
          color: '#00ff88',
          fontSize: '10px',
          fontFamily: 'monospace',
          letterSpacing: '1px',
          zIndex: 10
        }}>
          拖拽旋转 | 双指缩放 | 点击AR按钮投影
        </div>
      )}
    </div>
  );
}
