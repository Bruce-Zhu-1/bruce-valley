import React, { useEffect, useRef } from 'react';
import { FilesetResolver, FaceLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';
import { Face } from 'kalidokit';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

export default function Hide4() {
  const live2dContainerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const statusRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  const rigRef = useRef({ face: null, arm: undefined });
  const appRef = useRef(null);
  const modelRef = useRef(null);
  const dragRef = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });
  const scaleRef = useRef(0.35);

  useEffect(() => {
    let isMounted = true;
    let faceLandmarker;
    let handLandmarker;
    let animationId;
    let stream;

    const initLive2D = async () => {
      if (!window.PIXI || !window.PIXI.live2d) {
        console.error("Live2D 引擎未能成功加载，请检查 index.html 的 script 标签和网络环境！");
        if (statusRef.current) {
          statusRef.current.innerText = ">> 致命错误：Live2D 神经元未接入，请刷新重试";
          statusRef.current.style.color = "red";
        }
        return;
      }

      const app = new window.PIXI.Application({
        view: document.createElement('canvas'),
        transparent: true,
        autoStart: true,
        resizeTo: window
      });
      
      appRef.current = app;
      
      if (live2dContainerRef.current) {
        live2dContainerRef.current.appendChild(app.view);
      }

      try {
        const currentModel = await window.PIXI.live2d.Live2DModel.from('/models/hiyori/hiyori_pro_t10.model3.json');
        
        if (!isMounted) {
          currentModel.destroy();
          return;
        }

        currentModel.scale.set(scaleRef.current);
        currentModel.anchor.set(0.5, 0.5);
        currentModel.position.set(window.innerWidth / 2, window.innerHeight / 2 + 100);
        app.stage.addChild(currentModel);
        
        modelRef.current = currentModel;

        currentModel.interactive = true;
        currentModel.buttonMode = true;

        currentModel.on('pointerdown', (e) => {
          dragRef.current.isDragging = true;
          const pos = e.data.global;
          dragRef.current.offsetX = pos.x - currentModel.position.x;
          dragRef.current.offsetY = pos.y - currentModel.position.y;
        });

        currentModel.on('pointermove', (e) => {
          if (dragRef.current.isDragging) {
            const pos = e.data.global;
            currentModel.position.x = pos.x - dragRef.current.offsetX;
            currentModel.position.y = pos.y - dragRef.current.offsetY;
          }
        });

        currentModel.on('pointerup', () => {
          dragRef.current.isDragging = false;
        });

        currentModel.on('pointerupoutside', () => {
          dragRef.current.isDragging = false;
        });

        app.view.addEventListener('wheel', (e) => {
          e.preventDefault();
          const scaleDelta = e.deltaY > 0 ? -0.02 : 0.02;
          scaleRef.current = Math.max(0.1, Math.min(2.0, scaleRef.current + scaleDelta));
          currentModel.scale.set(scaleRef.current);
        }, { passive: false });

        currentModel.internalModel.motionManager.update = (...args) => {
          const rig = rigRef.current;
          if (!rig || !rig.face || !currentModel.internalModel.coreModel) return;

          const core = currentModel.internalModel.coreModel;
          const face = rig.face;

          const lerpAmount = 0.12;
          const lerp = (a, b, t) => a + (b - a) * t;
          
          const setParam = (id, value) => {
            if (value === undefined || value === null || isNaN(value)) return;
            const current = core.getParameterValueById(id);
            core.setParameterValueById(id, lerp(current, value, lerpAmount));
          };

          setParam('ParamAngleX', face.head?.degrees?.y * 1.1);
          setParam('ParamAngleY', face.head?.degrees?.x * 1.1);
          setParam('ParamAngleZ', face.head?.degrees?.z * 1.1);

          setParam('ParamEyeBallX', face.pupil?.x);
          setParam('ParamEyeBallY', face.pupil?.y);

          const eyeL = Math.max(0, Math.min(1, face.eye?.l * 1.2));
          const eyeR = Math.max(0, Math.min(1, face.eye?.r * 1.2));
          setParam('ParamEyeLOpen', eyeL);
          setParam('ParamEyeROpen', eyeR);
          
          setParam('ParamBrowLY', face.brow);
          setParam('ParamBrowRY', face.brow);
          
          const mouthOpen = Math.max(0, Math.min(1, face.mouth?.y * 1.3));
          setParam('ParamMouthOpenY', mouthOpen);
          setParam('ParamMouthForm', face.mouth?.x);

          setParam('ParamBodyAngleX', face.head?.degrees?.y * 0.5);

          if (rig.arm !== undefined) {
            setParam('ParamArmLA', rig.arm);
            setParam('ParamArmRA', rig.arm);
          }
        };

        if (statusRef.current) {
          statusRef.current.innerText = "[义体同步] Live2D 虚拟化身已就绪";
        }
      } catch (error) {
        console.error('Live2D model load error:', error);
        if (statusRef.current) {
          statusRef.current.innerText = `[模型加载失败] ${error.message}`;
        }
      }
    };

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

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
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
              
              if (canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
              }
            }
          };
        }

        if (statusRef.current) {
          statusRef.current.innerText = "[双引擎就绪] 面部 + 手势识别已启动";
        }
      } catch (error) {
        if (isMounted && statusRef.current) {
          statusRef.current.innerText = `[信号中断] 摄像头初始化失败: ${error.message}`;
        }
      }
    };

    const drawFaceMesh = (ctx, landmarks, width, height) => {
      const pointSize = Math.max(1, Math.min(width, height) / 300);
      
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 3;
      ctx.shadowColor = '#00ffff';
      
      landmarks.forEach((point, i) => {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, pointSize, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    const drawHandSkeleton = (ctx, landmarks, width, height) => {
      const lineWidth = Math.max(1, Math.min(width, height) / 200);
      const pointSize = Math.max(2, Math.min(width, height) / 150);
      
      ctx.strokeStyle = '#ff69b4';
      ctx.lineWidth = lineWidth;
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#ff69b4';
      
      HAND_CONNECTIONS.forEach(([i, j]) => {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      });

      ctx.fillStyle = '#ff1493';
      ctx.shadowBlur = 0;
      landmarks.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, pointSize, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    let lastVideoTime = -1;

    const renderLoop = () => {
      if (!isMounted) return;

      if (faceLandmarker && handLandmarker && videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        const startTimeMs = performance.now();
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime;

          const faceResults = faceLandmarker.detectForVideo(videoRef.current, startTimeMs);
          const handResults = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

          const hudCanvas = canvasRef.current;
          const hudCtx = hudCanvas ? hudCanvas.getContext('2d') : null;
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;

          if (hudCtx) {
            hudCtx.clearRect(0, 0, videoWidth, videoHeight);
          }

          const hasFace = faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0;
          const hasHand = handResults.landmarks && handResults.landmarks.length > 0;

          if (!hasFace && !hasHand) {
            if (statusRef.current) {
              statusRef.current.innerText = "[信号中断] 请保持面部正对终端并举起双手";
              statusRef.current.style.color = '#888888';
            }
          } else {
            if (hasFace) {
              const faceLandmarks = faceResults.faceLandmarks[0];
              
              if (hudCtx) {
                drawFaceMesh(hudCtx, faceLandmarks, videoWidth, videoHeight);
              }

              const faceRig = Face.solve(faceLandmarks, {
                runtime: "mediapipe",
                video: videoRef.current
              });
              rigRef.current.face = faceRig;
            }

            if (hasHand) {
              const handLandmarks = handResults.landmarks;
              
              handLandmarks.forEach((landmarks, index) => {
                if (hudCtx) {
                  drawHandSkeleton(hudCtx, landmarks, videoWidth, videoHeight);
                }
              });

              const primaryHand = handLandmarks[0];
              const handY = primaryHand[0].y;
              rigRef.current.arm = (0.7 - handY) * 2;
              rigRef.current.arm = Math.max(-1, Math.min(1, rigRef.current.arm));
            } else {
              rigRef.current.arm = undefined;
            }

            if (statusRef.current && rigRef.current.face) {
              const face = rigRef.current.face;
              let statusText = "[义体同步] Live2D 同步率：100%";
              let statusColor = '#00ffff';

              if (face.mouth?.y > 0.5) {
                statusText = "[神经递质异动] 检测到张嘴";
                statusColor = '#00ff88';
              }
              
              if (hasHand) {
                statusText += " | 手势联动中";
                statusColor = '#ff69b4';
              }

              statusRef.current.innerText = statusText;
              statusRef.current.style.color = statusColor;
            }
          }
        }
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
          statusRef.current.innerText = "[神经握手] 正在建立双引擎连接...";
        }

        await initMediaPipe();
        await initLive2D();
        
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
      if (handLandmarker) {
        try { handLandmarker.close(); } catch (e) {}
      }
      
      if (appRef.current) {
        try { 
          appRef.current.destroy(true, { children: true }); 
        } catch (e) {}
        appRef.current = null;
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
      <audio 
        ref={audioRef}
        src="/music/I%20Really%20Want%20to%20Stay%20at%20Your%20House.mp3" 
        autoPlay 
        loop 
      />
      
      <div 
        ref={live2dContainerRef}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10
        }}
      />
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '320px',
        height: '240px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid rgba(0, 255, 255, 0.5)',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.4), 0 0 60px rgba(255, 105, 180, 0.2)',
        zIndex: 30,
        backgroundColor: '#111'
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            pointerEvents: 'none'
          }}
        />
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          color: '#00ffff',
          fontSize: '10px',
          fontFamily: 'monospace',
          textShadow: '0 0 5px #00ffff'
        }}>
          面部识别
        </div>
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '8px',
          color: '#ff69b4',
          fontSize: '10px',
          fontFamily: 'monospace',
          textShadow: '0 0 5px #ff69b4'
        }}>
          手势识别
        </div>
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
        [ESC] 退出 | 拖拽移动 | 滚轮缩放
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
        [神经握手] 正在建立双引擎连接...
      </div>
    </div>
  );
}
