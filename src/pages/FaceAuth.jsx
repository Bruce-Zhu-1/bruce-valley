import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';

const MEMBER_LABELS = ['Bruce', 'Liu', 'Jiang'];

const MEMBER_MESSAGES = {
  Bruce: '检测到朱小龙生物信息，欢迎家长回家',
  Liu: '检测到刘乙砖生物特征信息，欢迎Kazuha的主人回家',
  Jiang: '检测到江校长生物特征，优势在我，欢迎回家'
};

const MATCH_THRESHOLD = 0.6;
const REQUIRED_CONSECUTIVE_FRAMES = 5;
const MAX_UNKNOWN_FRAMES = 20;
const MAX_SCAN_TIME = 15000;
const MIN_SCAN_TIME = 6000;
const REDIRECT_DELAY = 3500;

export default function FaceAuth() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const scanTimerRef = useRef(null);
  const lockTimerRef = useRef(null);
  const scanStartTimeRef = useRef(0);

  const labeledDescriptorsRef = useRef(null);
  const faceMatcherRef = useRef(null);

  const [status, setStatus] = useState('init');
  const [statusText, setStatusText] = useState('初始化生物识别系统...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [detectedMember, setDetectedMember] = useState(null);
  const [consecutiveCount, setConsecutiveCount] = useState(0);
  const [lastMatchedLabel, setLastMatchedLabel] = useState(null);
  const [unknownFrameCount, setUnknownFrameCount] = useState(0);
  const [authResult, setAuthResult] = useState({ status: 'scanning', message: '' });

  const loadLabeledImages = useCallback(async () => {
    setStatusText('提取本地生物特征集...');
    const descriptors = [];

    for (let i = 0; i < MEMBER_LABELS.length; i++) {
      const label = MEMBER_LABELS[i];
      setLoadingProgress(Math.round(((i + 1) / MEMBER_LABELS.length) * 100));
      setStatusText(`正在提取 ${label} 的生物特征... (${i + 1}/${MEMBER_LABELS.length})`);

      const descriptorsForLabel = [];

      for (let j = 1; j <= 3; j++) {
        const imgPath = `/faceid/${label}/${j}.webp`;
        try {
          const img = await faceapi.fetchImage(imgPath);
          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(true)
            .withFaceDescriptor();

          if (detection && detection.descriptor) {
            descriptorsForLabel.push(detection.descriptor);
            console.log(`[FaceAuth] 成功提取 ${label} 第 ${j} 张照片特征`);
          } else {
            console.warn(`[FaceAuth] 未能从 ${label} 第 ${j} 张照片检测到人脸`);
          }
        } catch (error) {
          console.error(`[FaceAuth] 加载 ${imgPath} 失败:`, error);
        }
      }

      if (descriptorsForLabel.length > 0) {
        descriptors.push(new faceapi.LabeledFaceDescriptors(label, descriptorsForLabel));
      }
    }

    return descriptors;
  }, []);

  const initFaceApi = useCallback(async () => {
    try {
      setStatus('loading_models');
      setStatusText('加载轻量神经模型...');
      setLoadingProgress(0);

      await faceapi.nets.tinyFaceDetector.loadFromUri('/models/face-api');
      setLoadingProgress(33);
      setStatusText('加载面部关键点模型...');

      await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models/face-api');
      setLoadingProgress(66);
      setStatusText('加载特征提取模型...');

      await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face-api');
      setLoadingProgress(100);
      console.log('[FaceAuth] 所有模型加载完成');

      setStatus('loading_descriptors');
      const labeledDescriptors = await loadLabeledImages();

      if (labeledDescriptors.length === 0) {
        throw new Error('未能加载任何成员特征数据');
      }

      labeledDescriptorsRef.current = labeledDescriptors;
      faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, MATCH_THRESHOLD);
      console.log('[FaceAuth] 特征库构建完成，共', labeledDescriptors.length, '名成员');

      setStatus('starting_camera');
      setStatusText('开启视觉传感器...');
      await startCamera();

      setStatus('ready');
      setStatusText('生物识别系统就绪，请正视摄像头');

      scanTimerRef.current = setTimeout(() => {
        if (authResult.status === 'scanning') {
          handleAuthFail('扫描超时，识别失败');
        }
      }, MAX_SCAN_TIME);
    } catch (error) {
      console.error('[FaceAuth] 初始化失败:', error);
      setStatus('error');
      setStatusText(`系统初始化失败: ${error.message}`);
    }
  }, [loadLabeledImages, authResult.status]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('[FaceAuth] 摄像头启动成功');
        scanStartTimeRef.current = Date.now();
      }
    } catch (error) {
      console.error('[FaceAuth] 摄像头启动失败:', error);
      throw new Error('无法访问摄像头，请检查权限设置');
    }
  };

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log('[FaceAuth] 摄像头已关闭');
    }
  }, []);

  const handleAuthSuccess = useCallback((label) => {
    console.log('[FaceAuth] 鉴权成功:', label);

    stopDetection();

    setAuthResult({
      status: 'success',
      message: MEMBER_MESSAGES[label] || `欢迎 ${label}`
    });

    setTimeout(() => {
      navigate('/ar-space');
    }, REDIRECT_DELAY);
  }, [stopDetection, navigate]);

  const handleAuthFail = useCallback((reason) => {
    if (authResult.status !== 'scanning') return;

    console.log('[FaceAuth] 鉴权失败:', reason);
    stopDetection();

    setAuthResult({
      status: 'fail',
      message: '敌人入侵！！'
    });

    setTimeout(() => {
      navigate('/');
    }, REDIRECT_DELAY);
  }, [authResult.status, stopDetection, navigate]);

  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !faceMatcherRef.current) return;
    if (authResult.status !== 'scanning') return;

    const video = videoRef.current;

    if (video.readyState !== 4) return;

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptors();

      if (canvasRef.current && detections.length > 0) {
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        resizedDetections.forEach((detection, idx) => {
          const box = detection.detection.box;
          const landmarks = detection.landmarks;
          const isLocked = lockTimerRef.current;
          
          const boxColor = isLocked ? '#00ff88' : '#00ffff';
          const boxGlow = isLocked ? 'rgba(0, 255, 136, 0.8)' : 'rgba(0, 255, 255, 0.6)';
          
          ctx.save();
          ctx.shadowColor = boxGlow;
          ctx.shadowBlur = 15;
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          const cornerLength = Math.min(box.width, box.height) * 0.15;
          ctx.lineWidth = 3;
          ctx.strokeStyle = isLocked ? '#00ff88' : '#00ffff';
          
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + cornerLength);
          ctx.lineTo(box.x, box.y);
          ctx.lineTo(box.x + cornerLength, box.y);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(box.x + box.width - cornerLength, box.y);
          ctx.lineTo(box.x + box.width, box.y);
          ctx.lineTo(box.x + box.width, box.y + cornerLength);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(box.x + box.width, box.y + box.height - cornerLength);
          ctx.lineTo(box.x + box.width, box.y + box.height);
          ctx.lineTo(box.x + box.width - cornerLength, box.y + box.height);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(box.x + cornerLength, box.y + box.height);
          ctx.lineTo(box.x, box.y + box.height);
          ctx.lineTo(box.x, box.y + box.height - cornerLength);
          ctx.stroke();
          
          ctx.restore();
          
          const positions = landmarks.positions;
          const time = Date.now() * 0.003;
          
          const landmarkColors = [
            '#00ffff', '#00ff88', '#ff00ff', '#ffff00', '#ff6600',
            '#00ff00', '#ff0066', '#6600ff', '#00ffff', '#ff00ff'
          ];
          
          positions.forEach((point, pointIdx) => {
            const colorIdx = Math.floor((pointIdx + time) % landmarkColors.length);
            const color = landmarkColors[colorIdx];
            const baseSize = 4;
            const pulseSize = Math.sin(time * 2 + pointIdx * 0.3) * 1.5;
            const size = baseSize + pulseSize;
            
            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, size * 1.8, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
            ctx.stroke();
            
            ctx.restore();
          });
          
          const jawLine = positions.slice(0, 17);
          const leftEyebrow = positions.slice(17, 22);
          const rightEyebrow = positions.slice(22, 27);
          const noseBridge = positions.slice(27, 31);
          const noseBottom = positions.slice(31, 36);
          const leftEye = positions.slice(36, 42);
          const rightEye = positions.slice(42, 48);
          const outerMouth = positions.slice(48, 60);
          const innerMouth = positions.slice(60, 68);
          
          const drawConnectors = (points, color, lineWidth = 1.5) => {
            if (points.length < 2) return;
            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
            ctx.restore();
          };
          
          drawConnectors(jawLine, '#00ffff', 1);
          drawConnectors(leftEyebrow, '#ff00ff', 2);
          drawConnectors(rightEyebrow, '#ff00ff', 2);
          drawConnectors(noseBridge, '#ffff00', 1.5);
          drawConnectors(noseBottom, '#ffff00', 1.5);
          drawConnectors(leftEye.concat([leftEye[0]]), '#00ff88', 2);
          drawConnectors(rightEye.concat([rightEye[0]]), '#00ff88', 2);
          drawConnectors(outerMouth.concat([outerMouth[0]]), '#ff6600', 1.5);
          drawConnectors(innerMouth.concat([innerMouth[0]]), '#ff0066', 1);
        });
      }

      if (lockTimerRef.current) {
        setStatusText(`[目标已锁定] 正在进行深度生物特征解析...`);
        return;
      }

      if (detections.length > 0) {
        const bestMatch = faceMatcherRef.current.findBestMatch(detections[0].descriptor);

        if (bestMatch.label !== 'unknown') {
          setDetectedMember(bestMatch.label);
          setUnknownFrameCount(0);

          if (bestMatch.label === lastMatchedLabel) {
            const newCount = consecutiveCount + 1;
            setConsecutiveCount(newCount);

            if (newCount >= REQUIRED_CONSECUTIVE_FRAMES) {
              const elapsed = Date.now() - scanStartTimeRef.current;
              const delay = Math.max(0, MIN_SCAN_TIME - elapsed);

              console.log(`[FaceAuth] 目标锁定: ${bestMatch.label}，延迟 ${delay}ms 后放行`);

              lockTimerRef.current = setTimeout(() => {
                handleAuthSuccess(bestMatch.label);
              }, delay);
              return;
            }
          } else {
            setLastMatchedLabel(bestMatch.label);
            setConsecutiveCount(1);
          }

          setStatusText(`识别中: ${bestMatch.label} (置信度: ${(1 - bestMatch.distance).toFixed(2)})`);
        } else {
          setDetectedMember(null);
          setConsecutiveCount(0);
          setLastMatchedLabel(null);

          const newUnknownCount = unknownFrameCount + 1;
          setUnknownFrameCount(newUnknownCount);

          if (newUnknownCount >= MAX_UNKNOWN_FRAMES) {
            handleAuthFail('连续检测到未知人员');
            return;
          }

          setStatusText(`检测到未知生物 (${newUnknownCount}/${MAX_UNKNOWN_FRAMES})`);
        }
      } else {
        setDetectedMember(null);
        setConsecutiveCount(0);
        setLastMatchedLabel(null);
        setStatusText('未检测到人脸，请进入画面');
      }
    } catch (error) {
      console.error('[FaceAuth] 检测错误:', error);
    }
  }, [consecutiveCount, lastMatchedLabel, unknownFrameCount, authResult.status, handleAuthSuccess, handleAuthFail]);

  useEffect(() => {
    initFaceApi();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        console.log('[FaceAuth] 摄像头已关闭');
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }

      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }
    };
  }, [initFaceApi]);

  useEffect(() => {
    if (status === 'ready' && authResult.status === 'scanning') {
      intervalRef.current = setInterval(detectFaces, 200);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, detectFaces, authResult.status]);

  const getStatusColor = () => {
    switch (status) {
      case 'error': return '#ff4444';
      case 'ready': return detectedMember ? '#00ff88' : '#00ffff';
      default: return '#ffff00';
    }
  };

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
      <style>{`
        @keyframes cyberGlitch {
          0% { text-shadow: 0 0 10px #0ff, 2px 2px #f0f; transform: translate(0); }
          20% { text-shadow: 0 0 20px #0ff, -2px -2px #f0f; transform: translate(-2px, 2px); }
          40% { text-shadow: 0 0 10px #0ff, 2px -2px #f0f; transform: translate(2px, -2px); }
          60% { text-shadow: 0 0 30px #0ff, -2px 2px #f0f; transform: translate(-2px, 0); }
          100% { text-shadow: 0 0 10px #0ff, 2px 2px #f0f; transform: translate(0); }
        }
        @keyframes flashAlert {
          0%, 100% { opacity: 1; color: #ff003c; text-shadow: 0 0 30px #ff003c, 0 0 60px #ff003c; transform: scale(1); }
          50% { opacity: 0.3; color: #880015; text-shadow: 0 0 10px #ff003c; transform: scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes successGlow {
          0%, 100% { box-shadow: 0 0 60px rgba(0, 255, 136, 0.5), inset 0 0 100px rgba(0, 255, 136, 0.1); }
          50% { box-shadow: 0 0 100px rgba(0, 255, 136, 0.8), inset 0 0 150px rgba(0, 255, 136, 0.2); }
        }
        @keyframes scanLine {
          0% { top: 0; opacity: 1; }
          100% { top: 100%; opacity: 0.3; }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(0, 255, 136, 0.8); box-shadow: 0 0 30px rgba(0, 255, 136, 0.5); }
          50% { border-color: rgba(0, 255, 136, 1); box-shadow: 0 0 50px rgba(0, 255, 136, 0.8); }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px),
          linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none'
      }} />

      {authResult.status === 'scanning' && (
        <>
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '16px 24px',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
            zIndex: 10
          }}>
            <div style={{ color: '#00ffff', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 0 10px #00ffff' }}>
              [FACE AUTH SYSTEM v2.0]
            </div>
            <div style={{ color: getStatusColor(), fontSize: '12px', transition: 'color 0.3s ease' }}>
              {statusText}
            </div>
            {(status === 'loading_models' || status === 'loading_descriptors') && (
              <div style={{ marginTop: '12px' }}>
                <div style={{
                  width: '200px',
                  height: '4px',
                  background: 'rgba(0, 255, 255, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${loadingProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00ffff, #00ff88)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ color: '#888', fontSize: '10px', marginTop: '4px', textAlign: 'right' }}>
                  {loadingProgress}%
                </div>
              </div>
            )}
          </div>

          <div style={{
            position: 'relative',
            width: '640px',
            maxWidth: '90vw',
            aspectRatio: '4/3',
            border: `2px solid ${detectedMember ? '#00ff88' : 'rgba(0, 255, 255, 0.5)'}`,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: detectedMember
              ? '0 0 40px rgba(0, 255, 136, 0.4), inset 0 0 60px rgba(0, 255, 136, 0.1)'
              : '0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 40px rgba(0, 255, 255, 0.05)',
            transition: 'all 0.3s ease',
            animation: detectedMember ? 'borderPulse 1s ease-in-out infinite' : 'none'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                transform: 'scaleX(-1)'
              }}
            />

            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              padding: '4px 8px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(0, 255, 255, 0.5)',
              borderRadius: '4px',
              color: '#00ffff',
              fontSize: '10px'
            }}>
              LIVE
            </div>

            {detectedMember && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '12px 24px',
                background: 'rgba(0, 255, 136, 0.2)',
                border: '2px solid #00ff88',
                borderRadius: '8px',
                color: '#00ff88',
                fontSize: '16px',
                fontWeight: 'bold',
                textShadow: '0 0 10px #00ff88',
                animation: 'pulse 1s ease-in-out infinite'
              }}>
                {detectedMember} ({consecutiveCount}/{REQUIRED_CONSECUTIVE_FRAMES})
              </div>
            )}

            {lockTimerRef.current && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                padding: '8px 16px',
                background: 'rgba(0, 255, 136, 0.3)',
                border: '2px solid #00ff88',
                borderRadius: '4px',
                color: '#00ff88',
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '0 0 10px #00ff88',
                animation: 'pulse 0.5s ease-in-out infinite'
              }}>
                BIOMETRIC LOCKED
              </div>
            )}

            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
              animation: 'scanLine 2s linear infinite',
              pointerEvents: 'none'
            }} />
          </div>

          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            padding: '12px 16px',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            zIndex: 10
          }}>
            <div style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>已注册成员</div>
            {MEMBER_LABELS.map(label => (
              <div key={label} style={{
                color: detectedMember === label ? '#00ff88' : '#666',
                fontSize: '11px',
                marginBottom: '4px',
                transition: 'color 0.3s ease'
              }}>
                {detectedMember === label ? '●' : '○'} {label}
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '10px 20px',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 68, 68, 0.5)',
              borderRadius: '6px',
              color: '#ff4444',
              fontSize: '12px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 68, 68, 0.2)';
              e.target.style.borderColor = '#ff4444';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.8)';
              e.target.style.borderColor = 'rgba(255, 68, 68, 0.5)';
            }}
          >
            [ESC] 退出识别
          </button>
        </>
      )}

      {authResult.status === 'success' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(0, 20, 30, 0.95) 0%, rgba(0, 40, 50, 0.95) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'successGlow 2s ease-in-out infinite'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.2) 0%, transparent 50%)
            `,
            pointerEvents: 'none'
          }} />
          
          <div style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: 'bold',
            color: '#00ff88',
            textShadow: '0 0 30px #00ff88, 0 0 60px #00ff88, 0 0 90px #00ff88',
            animation: 'cyberGlitch 0.5s ease-in-out infinite',
            textAlign: 'center',
            padding: '0 20px',
            letterSpacing: '4px'
          }}>
            ACCESS GRANTED
          </div>
          
          <div style={{
            marginTop: '40px',
            fontSize: 'clamp(1.2rem, 3vw, 2rem)',
            color: '#00ffff',
            textShadow: '0 0 20px #00ffff',
            textAlign: 'center',
            padding: '0 40px',
            maxWidth: '80%',
            lineHeight: '1.6'
          }}>
            {authResult.message}
          </div>

          <div style={{
            marginTop: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#00ff88',
              borderRadius: '50%',
              boxShadow: '0 0 20px #00ff88',
              animation: 'pulse 1s ease-in-out infinite'
            }} />
            <div style={{
              color: '#00ff88',
              fontSize: '14px',
              fontFamily: 'monospace',
              letterSpacing: '2px'
            }}>
              正在进入 AR 空间...
            </div>
          </div>
        </div>
      )}

      {authResult.status === 'fail' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(30, 0, 0, 0.98) 0%, rgba(50, 0, 0, 0.98) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255, 0, 0, 0.1)',
            animation: 'flashAlert 0.3s ease-in-out infinite',
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'absolute',
            top: '20%',
            left: '0',
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ff003c, transparent)',
            opacity: 0.5
          }} />
          
          <div style={{
            fontSize: 'clamp(4rem, 10vw, 8rem)',
            fontWeight: 'bold',
            color: '#ff003c',
            textShadow: '0 0 30px #ff003c, 0 0 60px #ff003c, 0 0 90px #ff003c',
            animation: 'flashAlert 0.5s ease-in-out infinite',
            textAlign: 'center',
            padding: '0 20px',
            letterSpacing: '8px'
          }}>
            ⚠️ 敌人入侵！！
          </div>
          
          <div style={{
            marginTop: '40px',
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            color: '#ff6666',
            textShadow: '0 0 10px #ff003c',
            textAlign: 'center',
            padding: '0 40px',
            fontFamily: 'monospace',
            letterSpacing: '2px'
          }}>
            ACCESS DENIED - UNAUTHORIZED BIOMETRIC SIGNATURE
          </div>

          <div style={{
            marginTop: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#ff003c',
              borderRadius: '50%',
              boxShadow: '0 0 20px #ff003c',
              animation: 'flashAlert 0.5s ease-in-out infinite'
            }} />
            <div style={{
              color: '#ff6666',
              fontSize: '14px',
              fontFamily: 'monospace',
              letterSpacing: '2px'
            }}>
              正在返回主页...
            </div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '0',
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ff003c, transparent)',
            opacity: 0.5
          }} />
        </div>
      )}
    </div>
  );
}
