import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';
import { Face } from 'kalidokit';

export default function Hide4() {
  const live2dContainerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const statusRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  const rigRef = useRef(null);
  const appRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let faceLandmarker;
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
        const currentModel = await window.PIXI.live2d.Live2DModel.from('/models/hiyori/hiyori_free_t08.model3.json');
        
        if (!isMounted) {
          currentModel.destroy();
          return;
        }

        currentModel.scale.set(0.35);
        currentModel.anchor.set(0.5, 0.5);
        currentModel.position.set(window.innerWidth / 2, window.innerHeight / 2 + 100);
        app.stage.addChild(currentModel);
        
        modelRef.current = currentModel;

        const lerp = (a, b, t) => a + (b - a) * t;

        currentModel.internalModel.motionManager.update = (...args) => {
          const rig = rigRef.current;
          if (rig && currentModel.internalModel.coreModel) {
            const core = currentModel.internalModel.coreModel;

            core.setParameterValueById('ParamAngleX', lerp(core.getParameterValueById('ParamAngleX'), rig.head.degrees.y, 0.2));
            core.setParameterValueById('ParamAngleY', lerp(core.getParameterValueById('ParamAngleY'), rig.head.degrees.x, 0.2));
            core.setParameterValueById('ParamAngleZ', lerp(core.getParameterValueById('ParamAngleZ'), rig.head.degrees.z, 0.2));

            core.setParameterValueById('ParamBodyAngleX', lerp(core.getParameterValueById('ParamBodyAngleX'), rig.head.degrees.y * 0.5, 0.2));
            core.setParameterValueById('ParamEyeBallX', rig.pupil.x);
            core.setParameterValueById('ParamEyeBallY', rig.pupil.y);

            core.setParameterValueById('ParamEyeLOpen', lerp(core.getParameterValueById('ParamEyeLOpen'), rig.eye.l, 0.5));
            core.setParameterValueById('ParamEyeROpen', lerp(core.getParameterValueById('ParamEyeROpen'), rig.eye.r, 0.5));
            core.setParameterValueById('ParamMouthOpenY', lerp(core.getParameterValueById('ParamMouthOpenY'), rig.mouth.y, 0.5));
            core.setParameterValueById('ParamMouthForm', rig.mouth.x);
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
            }
          };
        }
      } catch (error) {
        if (isMounted && statusRef.current) {
          statusRef.current.innerText = "[信号中断] 摄像头初始化失败";
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
                hudCtx.clearRect(0, 0, 300, 400);
              }
            } else {
              const landmarks = results.faceLandmarks[0];

              if (hudCtx) {
                drawFaceMesh(hudCtx, landmarks, 300, 400);
              }

              const faceRig = Face.solve(landmarks, {
                runtime: "mediapipe",
                video: videoRef.current
              });
              rigRef.current = faceRig;

              if (statusRef.current) {
                if (faceRig.mouth.y > 0.5) {
                  statusRef.current.innerText = "[神经递质异动] 检测到微笑";
                  statusRef.current.style.color = '#00ff88';
                } else {
                  statusRef.current.innerText = "[义体同步] Live2D 同步率：100%";
                  statusRef.current.style.color = '#00ffff';
                }
              }
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
          statusRef.current.innerText = "[神经握手] 正在建立连接...";
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
        width: '300px',
        height: '400px',
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
          width={300}
          height={400}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '300px',
            height: '400px',
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
