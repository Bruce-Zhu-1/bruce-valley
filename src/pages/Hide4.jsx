import React, { useEffect, useRef, useState, useCallback } from 'react';
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

const EXPRESSIONS = ['Cry', 'blood', 'clothes', 'hand up', 'hat', 'light'];
const MOTIONS = [
  { name: 'Stop', group: 'TapBody', index: 0 },
  { name: 'Mr', group: 'TapBody', index: 1 },
  { name: 'Walk (Idle)', group: 'Idle', index: 0 }
];

const RELEASE_DELAY = 500;

export default function Hide4() {
  const live2dContainerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const statusRef = useRef(null);
  const navigate = useNavigate();

  const appRef = useRef(null);
  const modelRef = useRef(null);
  const dragRef = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });
  const scaleRef = useRef(0.1);

  const rigRef = useRef({ face: null });

  const stateMachineRef = useRef({
    toggles: {
      hat: false,
      clothes: false,
      blood: false,
      light: false,
      handUp: false
    },
    currentMotion: 'walk',
    lastSeen: {
      MiddleFinger: 0,
      HandUp: 0,
      Victory: 0,
      Pinch: 0,
      Angry: 0,
      Gun: 0
    }
  });

  const [hudState, setHudState] = useState({
    emotion: 'Neutral',
    gesture: 'None',
    confidence: 0,
    activeToggles: [],
    currentMotion: 'walk'
  });

  const getActiveToggles = useCallback(() => {
    const toggles = stateMachineRef.current.toggles;
    const active = [];
    if (toggles.hat) active.push('佩戴帽子');
    if (toggles.clothes) active.push('穿着外套');
    if (toggles.blood) active.push('流血状态');
    if (toggles.light) active.push('发光状态');
    if (toggles.handUp) active.push('挥手状态');
    return active;
  }, []);

  const updateToggle = useCallback((key, expName, isActive, now) => {
    const sm = stateMachineRef.current;
    if (isActive) {
      sm.lastSeen[key] = now;
      if (!sm.toggles[key]) {
        sm.toggles[key] = true;
        modelRef.current?.expression(expName);
      }
    } else {
      if (sm.toggles[key] && (now - sm.lastSeen[key] > RELEASE_DELAY)) {
        sm.toggles[key] = false;
      }
    }
  }, []);

  const handleRotate = () => {
    if (modelRef.current) {
      modelRef.current.angle = (modelRef.current.angle + 90) % 360;
    }
  };

  const handleManualExpression = (name) => {
    modelRef.current?.expression(name);
  };

  const handleManualMotion = (group, index) => {
    modelRef.current?.motion(group, index);
  };

  const detectEmotion = useCallback((blendshapes) => {
    if (!blendshapes?.categories) return { emotion: 'Neutral', confidence: 0 };

    const categories = blendshapes.categories;
    const getScore = (name) => categories.find(c => c.categoryName === name)?.score || 0;

    const smileScore = (getScore('mouthSmileLeft') + getScore('mouthSmileRight')) / 2;
    const frownScore = (getScore('mouthFrownLeft') + getScore('mouthFrownRight')) / 2;
    const browDownAvg = (getScore('browDownLeft') + getScore('browDownRight')) / 2;
    const browInnerUp = getScore('browInnerUp');
    const jawOpen = getScore('jawOpen');
    const eyeWideAvg = (getScore('eyeWideLeft') + getScore('eyeWideRight')) / 2;

    if (smileScore > 0.3) return { emotion: 'Happy', confidence: smileScore };
    if (browInnerUp > 0.3 && frownScore > 0.2) return { emotion: 'Sad', confidence: Math.max(browInnerUp, frownScore) };
    if (browDownAvg > 0.3) return { emotion: 'Angry', confidence: browDownAvg };
    if (jawOpen > 0.3 && eyeWideAvg > 0.2) return { emotion: 'Surprised', confidence: Math.max(jawOpen, eyeWideAvg) };

    return { emotion: 'Neutral', confidence: 0 };
  }, []);

  const detectMiddleFinger = useCallback((handLandmarks) => {
    if (!handLandmarks || handLandmarks.length === 0) return false;

    const hand = handLandmarks[0];
    const middleTip = hand[12];
    const middlePip = hand[10];
    const middleMcp = hand[9];

    const isMiddleExtended = middleTip.y < middlePip.y && middlePip.y < middleMcp.y;

    const indexTip = hand[8];
    const indexPip = hand[6];
    const ringTip = hand[16];
    const ringPip = hand[14];
    const pinkyTip = hand[20];
    const pinkyPip = hand[18];

    const isIndexBent = indexTip.y > indexPip.y;
    const isRingBent = ringTip.y > ringPip.y;
    const isPinkyBent = pinkyTip.y > pinkyPip.y;

    return isMiddleExtended && isIndexBent && isRingBent && isPinkyBent;
  }, []);

  const detectGunGesture = useCallback((handLandmarks) => {
    if (!handLandmarks || handLandmarks.length === 0) return false;

    const hand = handLandmarks[0];

    const indexExtended = hand[8].y < hand[6].y;

    const middleBent = hand[12].y > hand[10].y;
    const ringBent = hand[16].y > hand[14].y;
    const pinkyBent = hand[20].y > hand[18].y;

    const thumbUp = hand[4].y < hand[5].y;

    return indexExtended && middleBent && ringBent && pinkyBent && thumbUp;
  }, []);

  const detectGesture = useCallback((handLandmarks) => {
    if (!handLandmarks || handLandmarks.length === 0) return 'None';

    if (handLandmarks.length === 2) return 'HandUp';

    const hand = handLandmarks[0];
    const indexTip = hand[8];
    const middleTip = hand[12];
    const thumbTip = hand[4];

    if (detectMiddleFinger(handLandmarks)) return 'MiddleFinger';

    if (detectGunGesture(handLandmarks)) return 'Gun';

    const indexExtended = indexTip.y < hand[6].y;
    const middleExtended = middleTip.y < hand[10].y;
    const ringBent = hand[16].y > hand[14].y;
    const pinkyBent = hand[20].y > hand[18].y;

    if (indexExtended && middleExtended && ringBent && pinkyBent) return 'Victory';

    const thumbIndexDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    if (thumbIndexDist < 0.06) return 'Pinch';

    return 'Active';
  }, [detectMiddleFinger, detectGunGesture]);

  const processFaceSystem = useCallback((faceResults, rig) => {
    const sm = stateMachineRef.current;
    const now = Date.now();
    let emotion = 'Neutral';
    let confidence = 0;

    if (faceResults.faceBlendshapes?.length > 0) {
      const result = detectEmotion(faceResults.faceBlendshapes[0]);
      emotion = result.emotion;
      confidence = result.confidence;

      updateToggle('blood', 'blood', emotion === 'Angry' && confidence > 0.5, now);
    }

    return { emotion, confidence };
  }, [detectEmotion, updateToggle]);

  const processHandSystem = useCallback((handResults) => {
    const sm = stateMachineRef.current;
    const gesture = detectGesture(handResults.landmarks);
    const now = Date.now();

    if (gesture === 'MiddleFinger') {
      sm.lastSeen.MiddleFinger = now;
      if (sm.currentMotion !== 'stop') {
        sm.currentMotion = 'stop';
        modelRef.current?.motion('TapBody', 0);
      }
    } else {
      if (sm.currentMotion === 'stop' && (now - sm.lastSeen.MiddleFinger > RELEASE_DELAY)) {
        sm.currentMotion = 'walk';
        modelRef.current?.motion('Idle', 0);
      }
    }

    updateToggle('handUp', 'hand up', gesture === 'HandUp', now);
    updateToggle('light', 'light', gesture === 'Victory', now);
    updateToggle('clothes', 'clothes', gesture === 'Pinch', now);
    updateToggle('hat', 'hat', gesture === 'Gun', now);

    return gesture;
  }, [detectGesture, updateToggle]);

  useEffect(() => {
    let isMounted = true;
    let faceLandmarker;
    let handLandmarker;
    let animationId;
    let stream;

    const initLive2D = async () => {
      if (!window.PIXI || !window.PIXI.live2d) {
        console.error("Live2D 引擎未能成功加载");
        if (statusRef.current) {
          statusRef.current.innerText = ">> 致命错误：Live2D 神经元未接入";
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
        const currentModel = await window.PIXI.live2d.Live2DModel.from('/models/jinx/jinx.model3.json');

        if (!isMounted) {
          currentModel.destroy();
          return;
        }

        currentModel.scale.set(scaleRef.current);
        currentModel.anchor.set(0.5, 0.5);
        currentModel.position.set(window.innerWidth / 2, window.innerHeight / 2 + 100);
        app.stage.addChild(currentModel);

        modelRef.current = currentModel;

        console.log('=== Jinx 模型调试信息 ===');
        if (currentModel.internalModel.motionManager.expressionManager) {
          console.log('可用表情:', currentModel.internalModel.motionManager.expressionManager.expressions);
        }
        console.log('可用动作:', currentModel.internalModel.motionManager.definitions);

        currentModel.internalModel.motionManager.on('motionFinish', (group, index) => {
          const sm = stateMachineRef.current;
          if (sm.currentMotion === 'walk' && group === 'Idle') {
            currentModel.motion('Idle', 0, 3);
          }
        });

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

        currentModel.on('pointerup', () => dragRef.current.isDragging = false);
        currentModel.on('pointerupoutside', () => dragRef.current.isDragging = false);

        app.view.addEventListener('wheel', (e) => {
          e.preventDefault();
          const scaleDelta = e.deltaY > 0 ? -0.01 : 0.01;
          scaleRef.current = Math.max(0.05, Math.min(1.0, scaleRef.current + scaleDelta));
          currentModel.scale.set(scaleRef.current);
        }, { passive: false });

        const motionManager = currentModel.internalModel.motionManager;
        const originalUpdate = motionManager.update.bind(motionManager);

        motionManager.update = (model, now) => {
          originalUpdate(model, now);

          const rig = rigRef.current;
          if (!rig?.face || !currentModel.internalModel.coreModel) return;

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
        };

        if (statusRef.current) {
          statusRef.current.innerText = "[义体同步] Jinx 虚拟化身已就绪";
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
          numFaces: 1,
          outputFaceBlendshapes: true
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
      landmarks.forEach((point) => {
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

          const hasFace = faceResults.faceLandmarks?.length > 0;
          const hasHand = handResults.landmarks?.length > 0;

          if (!hasFace && !hasHand) {
            if (statusRef.current) {
              statusRef.current.innerText = "[信号中断] 请保持面部正对终端";
              statusRef.current.style.color = '#888888';
            }
            setHudState(prev => ({ ...prev, emotion: 'Neutral', gesture: 'None', confidence: 0 }));
          } else {
            let emotion = 'Neutral';
            let confidence = 0;
            let gesture = 'None';

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

              const faceResult = processFaceSystem(faceResults, rigRef);
              emotion = faceResult.emotion;
              confidence = faceResult.confidence;
            }

            if (hasHand) {
              handResults.landmarks.forEach((landmarks) => {
                if (hudCtx) {
                  drawHandSkeleton(hudCtx, landmarks, videoWidth, videoHeight);
                }
              });

              gesture = processHandSystem(handResults);
            }

            const sm = stateMachineRef.current;
            setHudState({
              emotion,
              gesture,
              confidence: Math.round(confidence * 100),
              activeToggles: getActiveToggles(),
              currentMotion: sm.currentMotion
            });

            if (statusRef.current) {
              let statusText = `[情绪: ${emotion}]`;
              if (confidence > 0) statusText += ` (${Math.round(confidence * 100)}%)`;
              if (gesture !== 'None' && gesture !== 'Active') {
                statusText += ` | 手势: ${gesture === 'MiddleFinger' ? '中指警告' : gesture === 'Gun' ? '打枪' : gesture}`;
              }
              statusRef.current.innerText = statusText;

              const colorMap = {
                'Happy': '#00ff88',
                'Sad': '#6699ff',
                'Surprised': '#ffff00',
                'Angry': '#ff4444'
              };
              statusRef.current.style.color = colorMap[emotion] || '#00ffff';
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
      if (faceLandmarker) try { faceLandmarker.close(); } catch (e) {}
      if (handLandmarker) try { handLandmarker.close(); } catch (e) {}

      if (appRef.current) {
        try { appRef.current.destroy(true, { children: true }); } catch (e) {}
        appRef.current = null;
      }
    };
  }, [navigate, processFaceSystem, processHandSystem, getActiveToggles]);

  const getEmotionColor = (emotion) => {
    const colors = { 'Happy': '#00ff88', 'Sad': '#6699ff', 'Surprised': '#ffff00', 'Angry': '#ff4444' };
    return colors[emotion] || '#00ffff';
  };

  const getGestureText = (gesture) => {
    const texts = { 'HandUp': '双手举手', 'Victory': '胜利', 'Pinch': '捏合', 'MiddleFinger': '中指警告', 'Gun': '打枪', 'Active': '活动' };
    return texts[gesture] || '无';
  };

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
        top: '50%',
        left: '20px',
        transform: 'translateY(-50%)',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '12px',
        border: '2px solid rgba(0, 255, 255, 0.4)',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)',
        zIndex: 25,
        minWidth: '180px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #00ffff',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)',
            marginBottom: '8px'
          }}>
            <img src="/models/jinx/1.png" alt="Jinx" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ color: '#00ffff', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', textShadow: '0 0 10px #00ffff' }}>
            神经义体动作面板
          </div>
          <div style={{ color: '#888', fontSize: '10px', fontFamily: 'monospace' }}>(Debug)</div>
        </div>

        <div style={{ marginBottom: '12px', paddingTop: '8px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
          <div style={{ color: '#ff69b4', fontSize: '11px', fontFamily: 'monospace', marginBottom: '8px', textShadow: '0 0 5px #ff69b4' }}>
            表情组 (Expressions)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {EXPRESSIONS.map((exp) => (
              <button
                key={exp}
                onClick={() => handleManualExpression(exp)}
                style={{
                  padding: '6px 10px',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  border: '1px solid #ff69b4',
                  borderRadius: '6px',
                  color: '#ff69b4',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.target.style.boxShadow = '0 0 10px rgba(255, 105, 180, 0.6)'; e.target.style.transform = 'scale(1.05)'; }}
                onMouseOut={(e) => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'scale(1)'; }}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
          <div style={{ color: '#00ffff', fontSize: '11px', fontFamily: 'monospace', marginBottom: '8px', textShadow: '0 0 5px #00ffff' }}>
            动作组 (Motions)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {MOTIONS.map((motion) => (
              <button
                key={motion.name}
                onClick={() => handleManualMotion(motion.group, motion.index)}
                style={{
                  padding: '6px 10px',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  border: '1px solid #00ffff',
                  borderRadius: '6px',
                  color: '#00ffff',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.target.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.6)'; e.target.style.transform = 'scale(1.05)'; }}
                onMouseOut={(e) => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'scale(1)'; }}
              >
                {motion.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '220px',
        width: '320px',
        height: '240px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid rgba(0, 255, 255, 0.5)',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.4), 0 0 60px rgba(255, 105, 180, 0.2)',
        zIndex: 30,
        backgroundColor: '#111'
      }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', backgroundColor: '#111' }} autoPlay playsInline muted />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '8px', left: '8px', color: '#00ffff', fontSize: '10px', fontFamily: 'monospace', textShadow: '0 0 5px #00ffff' }}>面部识别</div>
        <div style={{ position: 'absolute', top: '24px', left: '8px', color: '#ff69b4', fontSize: '10px', fontFamily: 'monospace', textShadow: '0 0 5px #ff69b4' }}>手势识别</div>
      </div>

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '220px',
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.85)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        zIndex: 25
      }}>
        <div style={{ color: '#00ffff', fontSize: '12px', fontFamily: 'monospace', marginBottom: '6px', textShadow: '0 0 5px #00ffff' }}>HUD 状态面板</div>
        <div style={{ color: getEmotionColor(hudState.emotion), fontSize: '16px', fontFamily: 'monospace', fontWeight: 'bold' }}>
          情绪: {hudState.emotion} {hudState.confidence > 0 ? `(${hudState.confidence}%)` : ''}
        </div>
        <div style={{ marginTop: '6px', color: '#ff69b4', fontSize: '14px', fontFamily: 'monospace' }}>
          手势: {getGestureText(hudState.gesture)}
        </div>
        <div style={{ marginTop: '6px', color: '#ffff00', fontSize: '12px', fontFamily: 'monospace' }}>
          动作: {hudState.currentMotion === 'walk' ? '行走中' : '停止'}
        </div>
        {hudState.activeToggles.length > 0 && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
            <div style={{ color: '#00ff88', fontSize: '11px', fontFamily: 'monospace', marginBottom: '4px' }}>激活形态:</div>
            {hudState.activeToggles.map((t, i) => (
              <span key={i} style={{ display: 'inline-block', marginRight: '6px', padding: '2px 6px', background: 'rgba(0, 255, 136, 0.2)', borderRadius: '4px', color: '#00ff88', fontSize: '10px', fontFamily: 'monospace' }}>
                [{t}]
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '12px',
        border: '2px solid rgba(0, 255, 255, 0.4)',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)',
        zIndex: 25,
        minWidth: '220px'
      }}>
        <div style={{ color: '#00ffff', fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '12px', textShadow: '0 0 10px #00ffff', borderBottom: '1px solid rgba(0, 255, 255, 0.3)', paddingBottom: '8px' }}>
          【神经驱动指南】
        </div>
        <div style={{ color: '#aaffaa', fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.8' }}>
          <div>😊 微笑 → 自然映射</div>
          <div>😠 皱眉 → 切换流血</div>
          <div>🙌 双手举 → 边走边挥手</div>
          <div>✌️ 耶 → 切换发光</div>
          <div>👌 捏合 → 切换外套</div>
          <div>🖕 中指 → 停止/防御</div>
          <div>🔫 打枪(7) → 切换帽子</div>
        </div>
        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(0, 255, 255, 0.3)', color: '#888', fontSize: '11px', fontFamily: 'monospace' }}>
          <div>滚轮: 缩放模型</div>
          <div>拖拽: 移动身体</div>
        </div>
      </div>

      <button
        onClick={handleRotate}
        style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '2px solid #00ffff',
          borderRadius: '8px',
          color: '#00ffff',
          fontSize: '12px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 30,
          textShadow: '0 0 10px #00ffff',
          boxShadow: '0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 20px rgba(0, 255, 255, 0.1)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => { e.target.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.6), inset 0 0 30px rgba(0, 255, 255, 0.2)'; e.target.style.transform = 'scale(1.05)'; }}
        onMouseOut={(e) => { e.target.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 20px rgba(0, 255, 255, 0.1)'; e.target.style.transform = 'scale(1)'; }}
      >
        🔄 旋转视角 (Rotate)
      </button>

      <div style={{
        position: 'absolute',
        top: '20px',
        right: '260px',
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
        [神经握手] 正在建立双引擎连接...
      </div>
    </div>
  );
}
