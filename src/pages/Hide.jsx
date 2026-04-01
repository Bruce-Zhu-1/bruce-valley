import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';

const SHAPE_PATHS = ['/shapes/heart.png', '/shapes/sword.png'];
const PARTICLE_COUNT = 10000;
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
  ctx.shadowBlur = 5;
  ctx.shadowColor = '#00ffff';
  
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
    ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI);
    ctx.fill();
  });
};

export default function Hide() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const statusRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let handLandmarker;
    let camera, scene, renderer, particleSystem;
    let animationId;
    let stream;
    let shapesData = [];
    let currentShapeIndex = 0;

    const parseImageToShapeData = (imagePath) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          if (!isMounted) return;
          
          const canvas = document.createElement('canvas');
          const maxSize = 150;
          let width = img.width;
          let height = img.height;
          const scale = Math.min(maxSize / width, maxSize / height, 1);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const pixels = imageData.data;

          const validPixels = [];
          const centerX = width / 2;
          const centerY = height / 2;
          const maxDim = Math.max(width, height);

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4;
              const a = pixels[i + 3];
              if (a > 20) {
                validPixels.push({
                  x: (x - centerX) / maxDim * 100,
                  y: -(y - centerY) / maxDim * 100,
                  z: (Math.random() - 0.5) * 2
                });
              }
            }
          }

          const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
          const pixelCount = validPixels.length;
          
          for (let i = 0; i < PARTICLE_COUNT; i++) {
            const pixel = validPixels[i % pixelCount];
            targetPositions[i * 3] = pixel.x;
            targetPositions[i * 3 + 1] = pixel.y;
            targetPositions[i * 3 + 2] = pixel.z;
          }

          console.log(`解析 ${imagePath} 完成，有效像素: ${pixelCount}，粒子数: ${PARTICLE_COUNT}`);
          resolve(targetPositions);
        };

        img.onerror = () => {
          reject(new Error(`图片加载失败: ${imagePath}`));
        };

        img.src = imagePath;
      });
    };

    const loadAllShapes = async () => {
      const promises = SHAPE_PATHS.map(path => parseImageToShapeData(path));
      const results = await Promise.all(promises);
      return results;
    };

    const generateRandomPositions = () => {
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 30 + Math.random() * 70;
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      return positions;
    };

    const initThreeJS = (heartPositions, randomPositions) => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 80;

      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }

      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const aRandomPos = new Float32Array(PARTICLE_COUNT * 3);
      const aTargetPos = new Float32Array(PARTICLE_COUNT * 3);
      const aColors = new Float32Array(PARTICLE_COUNT * 3);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3] = randomPositions[i * 3];
        positions[i * 3 + 1] = randomPositions[i * 3 + 1];
        positions[i * 3 + 2] = randomPositions[i * 3 + 2];

        aRandomPos[i * 3] = randomPositions[i * 3];
        aRandomPos[i * 3 + 1] = randomPositions[i * 3 + 1];
        aRandomPos[i * 3 + 2] = randomPositions[i * 3 + 2];

        aTargetPos[i * 3] = heartPositions[i * 3];
        aTargetPos[i * 3 + 1] = heartPositions[i * 3 + 1];
        aTargetPos[i * 3 + 2] = heartPositions[i * 3 + 2];

        const colorChoice = Math.random();
        if (colorChoice < 0.6) {
          aColors[i * 3] = 1.0;
          aColors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
          aColors[i * 3 + 2] = 0.6 + Math.random() * 0.4;
        } else if (colorChoice < 0.85) {
          aColors[i * 3] = 0.9 + Math.random() * 0.1;
          aColors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
          aColors[i * 3 + 2] = 0.95 + Math.random() * 0.05;
        } else {
          aColors[i * 3] = 0.7;
          aColors[i * 3 + 1] = 0.0;
          aColors[i * 3 + 2] = 0.2;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aRandomPos', new THREE.BufferAttribute(aRandomPos, 3));
      geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(aTargetPos, 3));
      geometry.setAttribute('aColor', new THREE.BufferAttribute(aColors, 3));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDispersion: { value: 1.0 },
          uHandPos: { value: new THREE.Vector3(0, 0, 0) },
          uColorProgress: { value: 0.0 }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uDispersion;
          uniform vec3 uHandPos;
          
          attribute vec3 aRandomPos;
          attribute vec3 aTargetPos;
          attribute vec3 aColor;
          
          varying vec3 vColor;
          varying float vDispersion;
          
          void main() {
            vec3 currentPos = mix(aTargetPos, aRandomPos, uDispersion);
            
            vec3 followOffset = uHandPos * (1.0 - uDispersion);
            currentPos += followOffset;
            
            float distToHand = distance(currentPos, uHandPos);
            if (uDispersion > 0.5 && distToHand < 40.0) {
              vec3 pushDir = normalize(currentPos - uHandPos);
              float pushStrength = (40.0 - distToHand) * 0.5;
              currentPos += pushDir * pushStrength * uDispersion;
            }
            
            currentPos.y += sin(uTime * 2.0 + currentPos.x * 0.1) * 2.0 * uDispersion;
            currentPos.x += cos(uTime * 1.5 + currentPos.y * 0.1) * 1.5 * uDispersion;
            currentPos.z += sin(uTime * 1.8 + currentPos.z * 0.1) * 1.0 * uDispersion;
            
            vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            float sizeFactor = 1.0 + uDispersion * 0.5;
            gl_PointSize = (60.0 / -mvPosition.z) * sizeFactor;
            
            vColor = aColor;
            vDispersion = uDispersion;
          }
        `,
        fragmentShader: `
          uniform float uColorProgress;
          uniform float uDispersion;
          
          varying vec3 vColor;
          varying float vDispersion;
          
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            
            float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
            alpha *= (1.0 - vDispersion * 0.3);
            
            vec3 lightColor = vec3(1.0, 0.8, 0.85);
            vec3 darkRed = vec3(0.9, 0.0, 0.05);
            vec3 finalColor = mix(lightColor, darkRed, uColorProgress);
            
            finalColor = mix(finalColor, vColor, 0.4);
            
            finalColor += vec3(0.1, 0.2, 0.3) * vDispersion;
            
            gl_FragColor = vec4(finalColor, alpha * 0.85);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      particleSystem = new THREE.Points(geometry, material);
      scene.add(particleSystem);

      const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      return handleResize;
    };

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
                statusRef.current.innerText = "捏合=爱心 | 胜利=大剑 | 张开=消散";
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

    const isFingerExtended = (landmarks, fingerTip, fingerPip, fingerMcp) => {
      const tipY = landmarks[fingerTip].y;
      const pipY = landmarks[fingerPip].y;
      const mcpY = landmarks[fingerMcp].y;
      return tipY < pipY && pipY < mcpY;
    };

    let lastVideoTime = -1;
    let targetDispersion = 1.0;
    let targetColorProgress = 0.0;

    const renderLoop = () => {
      if (!isMounted) return;

      if (particleSystem) {
        const uniforms = particleSystem.material.uniforms;
        uniforms.uTime.value += 0.016;
        
        const currentDispersion = uniforms.uDispersion.value;
        uniforms.uDispersion.value += (targetDispersion - currentDispersion) * 0.05;
        
        const currentColorProgress = uniforms.uColorProgress.value;
        uniforms.uColorProgress.value += (targetColorProgress - currentColorProgress) * 0.08;
        
        particleSystem.rotation.y = Math.sin(uniforms.uTime.value * 0.2) * 0.15;
        particleSystem.rotation.x = Math.cos(uniforms.uTime.value * 0.15) * 0.05;
      }

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
                hudCtx.clearRect(0, 0, 240, 180);
              }
            } else {
              const landmarks = results.landmarks[0];
              
              if (landmarks[0].x === 0 && landmarks[0].y === 0) {
                requestAnimationFrame(renderLoop);
                return;
              }

              if (hudCtx) {
                drawHand(hudCtx, landmarks, 240, 180);
              }

              const palmCenter = landmarks[9];
              const handX = (0.5 - palmCenter.x) * 150.0;
              const handY = -(palmCenter.y - 0.5) * 150.0;
              const handZ = (palmCenter.z || 0) * 50.0;

              if (particleSystem) {
                particleSystem.material.uniforms.uHandPos.value.set(handX, handY, handZ);
              }

              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];
              const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

              const indexExtended = isFingerExtended(landmarks, 8, 6, 5);
              const middleExtended = isFingerExtended(landmarks, 12, 10, 9);
              const ringExtended = isFingerExtended(landmarks, 16, 14, 13);
              const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17);

              const isVictory = indexExtended && middleExtended && !ringExtended && !pinkyExtended;

              if (pinchDist < PINCH_THRESHOLD) {
                targetDispersion = 0.0;
                targetColorProgress = 0.0;
                
                if (currentShapeIndex !== 0 && shapesData[0]) {
                  const targetPosAttr = particleSystem.geometry.attributes.aTargetPos;
                  targetPosAttr.array.set(shapesData[0]);
                  targetPosAttr.needsUpdate = true;
                  currentShapeIndex = 0;
                }
                
                statusRef.current.innerText = `💖 爱心凝聚 | 手势: 捏合`;
                statusRef.current.style.color = '#ff69b4';
              } else if (isVictory) {
                targetDispersion = 0.0;
                targetColorProgress = 0.7;
                
                if (currentShapeIndex !== 1 && shapesData[1]) {
                  const targetPosAttr = particleSystem.geometry.attributes.aTargetPos;
                  targetPosAttr.array.set(shapesData[1]);
                  targetPosAttr.needsUpdate = true;
                  currentShapeIndex = 1;
                }
                
                statusRef.current.innerText = `⚔️ 大剑显现 | 手势: 胜利`;
                statusRef.current.style.color = '#00ffff';
              } else {
                targetDispersion = 1.0;
                targetColorProgress = 0.3;
                statusRef.current.innerText = `✨ 星辰消散 | 手势: 张开`;
                statusRef.current.style.color = '#ff1493';
              }
            }
          }
        }
      } else if (statusRef.current && !handLandmarker) {
        statusRef.current.innerText = "正在连接神经元...";
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
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

    let removeResizeListener = null;
    
    (async () => {
      try {
        if (statusRef.current) {
          statusRef.current.innerText = "正在加载形状图谱...";
        }
        
        shapesData = await loadAllShapes();
        
        if (!isMounted) return;
        if (shapesData.length < 2) {
          if (statusRef.current) {
            statusRef.current.innerText = "形状加载不完整";
          }
          return;
        }

        if (statusRef.current) {
          statusRef.current.innerText = "正在构建粒子宇宙...";
        }
        
        const randomPositions = generateRandomPositions();
        removeResizeListener = initThreeJS(shapesData[0], randomPositions);
        
        if (!isMounted) return;
        
        renderLoop();
        initMediaPipe();
      } catch (error) {
        if (isMounted && statusRef.current) {
          console.error(error);
          statusRef.current.innerText = `初始化失败: ${error.message}`;
        }
      }
    })();

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
      
      if (removeResizeListener) {
        window.removeEventListener('resize', removeResizeListener);
      }

      if (animationId) cancelAnimationFrame(animationId);

      if (stream) stream.getTracks().forEach(track => track.stop());
      if (handLandmarker) {
        try { handLandmarker.close(); } catch (e) {}
      }

      if (particleSystem) {
        particleSystem.geometry.dispose();
        particleSystem.material.dispose();
      }

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
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
      zIndex: 99999
    }}>
      <div 
        ref={containerRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 10, 
          backgroundColor: 'black' 
        }} 
      />
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '240px',
        height: '180px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '2px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
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
          width={240}
          height={180}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '240px',
            height: '180px',
            transform: 'scaleX(-1)',
            pointerEvents: 'none'
          }}
        />
      </div>
      
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        right: '20px', 
        color: 'rgba(255,255,255,0.3)', 
        fontFamily: 'monospace', 
        fontSize: '0.8rem',
        pointerEvents: 'none',
        zIndex: 20
      }}>
        Esc 退出
      </div>
      
      <div 
        ref={statusRef}
        style={{ 
          position: 'absolute', 
          bottom: '40px', 
          width: '100%', 
          textAlign: 'center', 
          color: '#ff1493', 
          fontFamily: 'monospace', 
          fontSize: '1.1rem', 
          textShadow: '0 0 15px #ff1493', 
          pointerEvents: 'none',
          letterSpacing: '1px',
          zIndex: 20
        }}
      >
        正在连接神经元...
      </div>
    </div>
  );
}
