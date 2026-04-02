import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';

const IMAGES = [
  '/shapes/lucy_depth.webp',
  '/shapes/lucy_fade1.webp',
  '/shapes/lucy_color.webp',
  '/shapes/lucy_depth2.webp',
  '/shapes/lucy_fade2.webp',
  '/shapes/lucy_color2.webp'
];

export default function Hide3() {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const imgWrapperRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const statusRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  const currentIndexRef = useRef(0);
  const headStateRef = useRef('neutral');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let faceLandmarker;
    let animationId;
    let stream;

    let blinkStartTime = 0;
    let wasBlinking = false;
    let wasMouthOpen = false;

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
                statusRef.current.innerText = "[锚点锁定] 连接稳定：Lucy 观测中";
              }
            }
          };
        }
      } catch (error) {
        if (isMounted && statusRef.current) {
          statusRef.current.innerText = "[信号中断] 请保持面部正对终端";
        }
      }
    };

    const drawFaceMesh = (ctx, landmarks, width, height) => {
      ctx.clearRect(0, 0, width, height);
      
      landmarks.forEach((point, i) => {
        ctx.fillStyle = `hsl(${(i / 478) * 360}, 100%, 60%)`;
        ctx.shadowBlur = 2;
        ctx.shadowColor = `hsl(${(i / 478) * 360}, 100%, 60%)`;
        ctx.fillRect(point.x * width, point.y * height, 2, 2);
      });
    };

    const getD = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const triggerGlitchTransition = () => {
      if (imgWrapperRef.current) {
        imgWrapperRef.current.classList.add('glitch-transition');
        setTimeout(() => {
          if (imgWrapperRef.current) {
            imgWrapperRef.current.classList.remove('glitch-transition');
          }
        }, 500);
      }
    };

    const triggerSignalReorganization = (triggerType) => {
      currentIndexRef.current = (currentIndexRef.current + 3) % 6;
      setCurrentIndex(currentIndexRef.current);
      
      if (statusRef.current) {
        const prefix = triggerType === 'blink' ? '[视界闭合]' : '[声门共振]';
        statusRef.current.innerText = `${prefix} 神经连接重组：同步中...`;
        statusRef.current.style.color = '#00ff88';
      }
      
      triggerGlitchTransition();
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
              statusRef.current.innerText = "[信号中断] 请保持面部正对终端";
              statusRef.current.style.color = '#888888';
              
              if (hudCtx) {
                hudCtx.clearRect(0, 0, 480, 360);
              }
            } else {
              const landmarks = results.faceLandmarks[0];

              if (hudCtx) {
                drawFaceMesh(hudCtx, landmarks, 480, 360);
              }

              const nose = landmarks[1];
              const topHead = landmarks[10];
              const chin = landmarks[152];
              const leftCheek = landmarks[234];
              const rightCheek = landmarks[454];

              const pitchRatio = getD(nose, topHead) / getD(nose, chin);
              const yawRatio = getD(nose, leftCheek) / getD(nose, rightCheek);

              const isNext = pitchRatio < 0.65 || yawRatio > 1.5;
              const isPrev = pitchRatio > 1.45 || yawRatio < 0.65;

              if (isNext) {
                if (headStateRef.current !== 'next') {
                  currentIndexRef.current = (currentIndexRef.current + 1) % 6;
                  headStateRef.current = 'next';
                  if (statusRef.current) {
                    statusRef.current.innerText = "[仰角偏移] 状态前移：深度校准";
                    statusRef.current.style.color = '#00ffff';
                  }
                }
              } else if (isPrev) {
                if (headStateRef.current !== 'prev') {
                  currentIndexRef.current = (currentIndexRef.current - 1 + 6) % 6;
                  headStateRef.current = 'prev';
                  if (statusRef.current) {
                    statusRef.current.innerText = "[俯角沉降] 状态倒回：记忆回溯";
                    statusRef.current.style.color = '#ff00ff';
                  }
                }
              } else if (pitchRatio >= 0.75 && pitchRatio <= 1.35 && yawRatio >= 0.8 && yawRatio <= 1.2) {
                if (headStateRef.current !== 'neutral') {
                  headStateRef.current = 'neutral';
                  if (statusRef.current) {
                    statusRef.current.innerText = "[锚点锁定] 连接稳定：Lucy 观测中";
                    statusRef.current.style.color = '#00ffff';
                  }
                }
              }

              const targetSrc = IMAGES[currentIndexRef.current];
              if (imgRef.current && !imgRef.current.src.includes(targetSrc)) {
                imgRef.current.src = targetSrc;
              }

              const rotateY = (0.5 - nose.x) * 40;
              const rotateX = (nose.y - 0.5) * 40;

              if (imgRef.current) {
                imgRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
              }

              const eyeTop = landmarks[159];
              const eyeBottom = landmarks[145];
              const eyeHeight = Math.abs(eyeTop.y - eyeBottom.y);
              const isBlinking = eyeHeight < 0.008;

              if (isBlinking && !wasBlinking) {
                blinkStartTime = performance.now();
              } else if (!isBlinking && wasBlinking && blinkStartTime > 0) {
                const duration = performance.now() - blinkStartTime;
                
                if (duration > 400) {
                  triggerSignalReorganization('blink');
                }
                blinkStartTime = 0;
              }
              wasBlinking = isBlinking;

              const mouthTop = landmarks[13];
              const mouthBottom = landmarks[14];
              const mouthDist = Math.hypot(mouthTop.x - mouthBottom.x, mouthTop.y - mouthBottom.y);
              const isMouthOpen = mouthDist > 0.025;

              if (!isMouthOpen && wasMouthOpen) {
                triggerSignalReorganization('mouth');
              }
              wasMouthOpen = isMouthOpen;
            }
          }
        }
      } else if (statusRef.current && !faceLandmarker) {
        statusRef.current.innerText = "[神经握手] 正在建立连接...";
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
      try {
        if (statusRef.current) {
          statusRef.current.innerText = "[神经握手] 正在建立连接...";
        }

        await initMediaPipe();
        
        if (!isMounted) return;

        renderLoop();
      } catch (error) {
        if (isMounted && statusRef.current) {
          console.error(error);
          statusRef.current.innerText = `[连接异常] ${error.message}`;
        }
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
      backgroundColor: 'black',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes verticalBreathing {
          0%, 100% { 
            transform: translateY(0px); 
            filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.3)); 
          }
          50% { 
            transform: translateY(-15px); 
            filter: drop-shadow(0 0 35px rgba(0, 255, 255, 0.7)); 
          }
        }
        
        @keyframes glitch {
          0% { 
            filter: brightness(1) blur(0px);
            transform: translate(0, 0) scale(1);
          }
          20% { 
            filter: brightness(3) blur(2px);
            transform: translate(-5px, 3px) scale(1.02);
          }
          40% { 
            filter: brightness(0.5) blur(1px);
            transform: translate(5px, -3px) scale(0.98);
          }
          60% { 
            filter: brightness(2) blur(3px);
            transform: translate(-3px, -5px) scale(1.01);
          }
          80% { 
            filter: brightness(1.5) blur(1px);
            transform: translate(3px, 5px) scale(0.99);
          }
          100% { 
            filter: brightness(1) blur(0px);
            transform: translate(0, 0) scale(1);
          }
        }
        
        .breathing-wrapper {
          animation: verticalBreathing 4s ease-in-out infinite;
        }
        
        .breathing-wrapper.glitch-transition {
          animation: glitch 0.5s ease-out;
        }
        
        .main-image {
          transition: transform 0.1s ease-out;
          will-change: transform;
        }
      `}</style>
      
      <audio 
        ref={audioRef}
        src="/music/I%20Really%20Want%20to%20Stay%20at%20Your%20House.mp3" 
        autoPlay 
        loop 
      />
      
      <div 
        ref={containerRef}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}
      >
        <div 
          ref={imgWrapperRef}
          className="breathing-wrapper"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img 
            ref={imgRef}
            className="main-image"
            src={IMAGES[0]}
            alt="Face Tracking"
            style={{
              maxHeight: '80vh',
              maxWidth: '80vw',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '480px',
        height: '360px',
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
          width={480}
          height={360}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '480px',
            height: '360px',
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
        gap: '6px',
        zIndex: 20
      }}>
        {IMAGES.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: idx === currentIndexRef.current ? '#00ff88' : 'rgba(0, 255, 255, 0.3)',
              boxShadow: idx === currentIndexRef.current ? '0 0 8px #00ff88' : 'none',
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
          pointerEvents: 'none',
          letterSpacing: '2px',
          zIndex: 20
        }}
      >
        [神经握手] 正在建立连接...
      </div>
    </div>
  );
}
