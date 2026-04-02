import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';

const FACES = [
  '/shapes/face1.webp',
  '/shapes/face2.webp',
  '/shapes/face3.webp',
  '/shapes/face4.webp',
  '/shapes/face5.webp',
  '/shapes/face6.webp'
];

export default function Hide3() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const statusRef = useRef(null);
  const imageRef = useRef(null);
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let faceLandmarker;
    let animationId;
    let stream;

    let lastBlinkTime = 0;
    let wasBlinking = false;

    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("/wasm");
        if (!isMounted) return;

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1
        });
        if (!isMounted) return;

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            if (isMounted && videoRef.current) {
              videoRef.current.width = videoRef.current.videoWidth;
              videoRef.current.height = videoRef.current.videoHeight;
              videoRef.current.play();
              if (statusRef.current) {
                statusRef.current.innerText = "面部追踪已启动 | 双击眨眼切换图片";
              }
            }
          };
        }
      } catch (error) {
        if (isMounted && statusRef.current) {
          statusRef.current.innerText = "AI 初始化失败，请检查摄像头权限";
        }
      }
    };

    const drawFaceMesh = (ctx, landmarks, width, height) => {
      ctx.clearRect(0, 0, width, height);
      
      ctx.fillStyle = '#00ffff';
      ctx.shadowBlur = 3;
      ctx.shadowColor = '#00ffff';
      
      landmarks.forEach(point => {
        ctx.fillRect(point.x * width, point.y * height, 1.5, 1.5);
      });
    };

    let lastVideoTime = -1;

    const renderLoop = () => {
      if (!isMounted) return;

      if (faceLandmarker && videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        const startTimeMs = performance.now();
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = faceLandmarker.detectForVideo(videoRef.current, startTimeMs);

          const hudCanvas = canvasRef.current;
          const hudCtx = hudCanvas ? hudCanvas.getContext('2d') : null;

          if (statusRef.current) {
            if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
              statusRef.current.innerText = "⚠️ 未检测到面部，请正对镜头";
              statusRef.current.style.color = '#888888';
              
              if (hudCtx) {
                hudCtx.clearRect(0, 0, 320, 240);
              }
              
              if (imageRef.current) {
                imageRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
              }
              setIsFloating(false);
            } else {
              const landmarks = results.faceLandmarks[0];

              if (hudCtx) {
                drawFaceMesh(hudCtx, landmarks, 320, 240);
              }

              const nose = landmarks[1];
              const leftCheek = landmarks[234];
              const rightCheek = landmarks[454];

              const offsetX = (0.5 - nose.x) * 150;
              const offsetY = -(nose.y - 0.5) * 150;

              const faceWidth = Math.abs(leftCheek.x - rightCheek.x);
              const scale = 1.0 + (faceWidth - 0.3) * 3.0;

              if (imageRef.current) {
                imageRef.current.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${Math.max(0.5, scale)})`;
              }

              const zDiff = Math.abs(leftCheek.z - rightCheek.z);
              const isFacingCenter = zDiff < 0.02;
              setIsFloating(isFacingCenter);

              const eyeTop = landmarks[159];
              const eyeBottom = landmarks[145];
              const eyeHeight = Math.abs(eyeTop.y - eyeBottom.y);
              const isBlinking = eyeHeight < 0.008;

              if (isBlinking && !wasBlinking) {
                const now = Date.now();
                if (now - lastBlinkTime < 500) {
                  setCurrentIndex(prev => (prev + 1) % FACES.length);
                  statusRef.current.innerText = `👁️ 双击眨眼！切换到图 ${(currentIndex + 1) % FACES.length + 1}`;
                  statusRef.current.style.color = '#00ff88';
                  lastBlinkTime = 0;
                } else {
                  lastBlinkTime = now;
                }
              }
              wasBlinking = isBlinking;

              if (!isBlinking) {
                statusRef.current.innerText = `面部追踪中 | 图片 ${currentIndex + 1}/${FACES.length} | ${isFacingCenter ? '🎯 眼神锁定' : '👀 追踪中...'}`;
                statusRef.current.style.color = isFacingCenter ? '#00ff88' : '#00ffff';
              }
            }
          }
        }
      } else if (statusRef.current && !faceLandmarker) {
        statusRef.current.innerText = "正在连接面部神经网络...";
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    const handleExit = () => {
      isMounted = false;
      navigate('/');
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    (async () => {
      await initMediaPipe();
      if (isMounted) {
        renderLoop();
      }
    })();

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);

      if (animationId) cancelAnimationFrame(animationId);

      if (stream) stream.getTracks().forEach(track => track.stop());
      if (faceLandmarker) {
        try { faceLandmarker.close(); } catch (e) {}
      }
    };
  }, [navigate, currentIndex]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 99999,
      backgroundColor: '#000'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, rgba(0, 40, 60, 0.3) 0%, rgba(0, 0, 0, 0.9) 70%)',
        zIndex: 1
      }} />
      
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <img 
          ref={imageRef}
          src={FACES[currentIndex]} 
          alt=""
          className={isFloating ? 'face-float' : ''}
          style={{
            maxHeight: '80vh',
            maxWidth: '80vw',
            objectFit: 'contain',
            transition: 'transform 0.05s linear',
            filter: 'drop-shadow(0 0 30px rgba(0, 255, 255, 0.4)) drop-shadow(0 0 60px rgba(0, 255, 136, 0.2))',
            borderRadius: '8px'
          }}
        />
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '320px',
        height: '240px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid rgba(0, 255, 255, 0.5)',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.4), 0 0 60px rgba(0, 255, 136, 0.2)',
        zIndex: 30
      }}>
        <video 
          ref={videoRef} 
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            backgroundColor: '#111'
          }} 
          autoPlay 
          playsInline 
          muted
        />
        <canvas 
          ref={canvasRef}
          width={320}
          height={240}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '320px',
            height: '240px',
            transform: 'scaleX(-1)',
            pointerEvents: 'none'
          }}
        />
      </div>
      
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        right: '20px', 
        color: 'rgba(0, 255, 255, 0.6)', 
        fontFamily: 'monospace', 
        fontSize: '0.9rem',
        pointerEvents: 'none',
        zIndex: 20,
        textShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
      }}>
        [ESC] 退出
      </div>

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 20
      }}>
        {FACES.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: idx === currentIndex ? '#00ff88' : 'rgba(0, 255, 255, 0.3)',
              boxShadow: idx === currentIndex ? '0 0 10px #00ff88' : 'none',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
      
      <div 
        ref={statusRef}
        style={{ 
          position: 'absolute', 
          bottom: '40px', 
          width: '100%', 
          textAlign: 'center', 
          color: '#00ffff', 
          fontFamily: 'monospace', 
          fontSize: '1.2rem', 
          textShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 255, 136, 0.5)', 
          pointerEvents: 'none',
          letterSpacing: '2px',
          zIndex: 20
        }}
      >
        正在连接面部神经网络...
      </div>

      <style>{`
        @keyframes faceFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .face-float {
          animation: faceFloat 3s ease-in-out infinite !important;
        }
      `}</style>
    </div>
  );
}
