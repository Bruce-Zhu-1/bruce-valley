import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';

const PINCH_THRESHOLD = 0.08;

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

const drawHand = (ctx, landmarks, width, height) => {
  ctx.clearRect(0, 0, width, height);
  
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#00ffff';
  
  HAND_CONNECTIONS.forEach(([i, j]) => {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  });

  ctx.fillStyle = '#ff00ff';
  ctx.shadowBlur = 0;
  landmarks.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
    ctx.fill();
  });
};

export default function Hide2() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const statusRef = useRef(null);
  const audioRef = useRef(null);
  const currentImgRef = useRef(null);
  const navigate = useNavigate();

  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let handLandmarker;
    let animationId;
    let stream;

    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("/wasm");
        if (!isMounted) return;

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
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
                statusRef.current.innerText = "捏合=Lucy | 耶=Jiang | 手枪=Heart | 张开=消散";
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

    const getDistance = (p1, p2) => {
      return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    };

    let lastVideoTime = -1;

    const renderLoop = () => {
      if (!isMounted) return;

      if (handLandmarker && videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        const startTimeMs = performance.now();
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

          const hudCanvas = canvasRef.current;
          const hudCtx = hudCanvas ? hudCanvas.getContext('2d') : null;

          if (statusRef.current) {
            if (!results.landmarks || results.landmarks.length === 0) {
              statusRef.current.innerText = "⚠️ 未检测到手势，请在镜头前举起单手";
              statusRef.current.style.color = '#888888';
              
              if (hudCtx) {
                hudCtx.clearRect(0, 0, 320, 240);
              }
              
              if (currentImgRef.current !== null) {
                currentImgRef.current = null;
                setActiveImage(null);
              }
            } else {
              const landmarks = results.landmarks[0];
              
              if (landmarks[0].x === 0 && landmarks[0].y === 0) {
                requestAnimationFrame(renderLoop);
                return;
              }

              if (hudCtx) {
                drawHand(hudCtx, landmarks, 320, 240);
              }

              const wrist = landmarks[0];
              
              const isExtended = (tip, mcp) => getDistance(wrist, landmarks[tip]) > getDistance(wrist, landmarks[mcp]);
              const isCurled = (tip, mcp) => getDistance(wrist, landmarks[tip]) < getDistance(wrist, landmarks[mcp]);

              const index = { tip: 8, mcp: 5 };
              const middle = { tip: 12, mcp: 9 };
              const ring = { tip: 16, mcp: 13 };
              const pinky = { tip: 20, mcp: 17 };

              const pinchDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
              const isPinching = pinchDist < PINCH_THRESHOLD;

              const isVictory = !isPinching && isExtended(index.tip, index.mcp) && isExtended(middle.tip, middle.mcp) && isCurled(ring.tip, ring.mcp) && isCurled(pinky.tip, pinky.mcp);

              const isGun = !isPinching && isExtended(index.tip, index.mcp) && isCurled(middle.tip, middle.mcp) && isCurled(ring.tip, ring.mcp) && isCurled(pinky.tip, pinky.mcp);

              let newImage = null;
              let statusText = "";
              let statusColor = "#00ffff";

              if (isPinching) {
                newImage = '/shapes/lucy.webp';
                statusText = "Lucy 记忆重构中...";
                statusColor = '#00ffff';
              } else if (isVictory) {
                newImage = '/shapes/tsy_jiang.webp';
                statusText = "Y 档案读取中...";
                statusColor = '#ff00ff';
              } else if (isGun) {
                newImage = '/shapes/heart(1).webp';
                statusText = "砰！击中你的心...";
                statusColor = '#ff3366';
              } else {
                newImage = null;
                statusText = "手掌张开：星辰消散";
                statusColor = '#00ff99';
              }

              statusRef.current.innerText = statusText;
              statusRef.current.style.color = statusColor;

              if (currentImgRef.current !== newImage) {
                currentImgRef.current = newImage;
                setActiveImage(newImage);
              }
            }
          }
        }
      } else if (statusRef.current && !handLandmarker) {
        statusRef.current.innerText = "正在连接赛博神经元...";
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    const handleExit = () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
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
      if (handLandmarker) {
        try { handLandmarker.close(); } catch (e) {}
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [navigate]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 99999,
      backgroundImage: 'url(/shapes/cyber1.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1
      }} />
      
      <audio 
        ref={audioRef}
        src="/music/I Really Want to Stay at Your House.mp3" 
        autoPlay 
        loop 
      />
      
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
          src={activeImage} 
          alt=""
          style={{
            maxHeight: '85vh',
            maxWidth: '85vw',
            objectFit: 'contain',
            opacity: activeImage ? 1 : 0,
            transform: activeImage ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.5s ease-out',
            filter: 'drop-shadow(0 0 30px rgba(0, 255, 255, 0.5)) drop-shadow(0 0 60px rgba(255, 0, 255, 0.3))',
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
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.4), 0 0 60px rgba(255, 0, 255, 0.2)',
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
          textShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.5)', 
          pointerEvents: 'none',
          letterSpacing: '2px',
          zIndex: 20
        }}
      >
        正在连接赛博神经元...
      </div>
    </div>
  );
}
