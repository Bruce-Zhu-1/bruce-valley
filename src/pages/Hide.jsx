import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';

const IMAGE_PATH = '/shapes/heart.png';
const MAX_IMAGE_SIZE = 150;
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

    const parseImageToParticles = (imagePath) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          if (!isMounted) return;
          
          let width = img.width;
          let height = img.height;
          const scale = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height, 1);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const pixels = imageData.data;

          const particles = [];
          const centerX = width / 2;
          const centerY = height / 2;
          const maxDim = Math.max(width, height);

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4;
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              const a = pixels[i + 3];

              if (a > 20) {
                const targetX = (x - centerX) / maxDim * 30;
                const targetY = -(y - centerY) / maxDim * 30;
                const targetZ = (Math.random() - 0.5) * 2;

                particles.push({
                  targetPosition: [targetX, targetY, targetZ],
                  color: [r / 255, g / 255, b / 255]
                });
              }
            }
          }

          console.log(`解析完成，共生成 ${particles.length} 个粒子`);
          resolve(particles);
        };

        img.onerror = () => {
          reject(new Error(`图片加载失败: ${imagePath}`));
        };

        img.src = imagePath;
      });
    };

    const initThreeJS = (particles) => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 50;

      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }

      const count = particles.length;
      const positions = new Float32Array(count * 3);
      const targetPositions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const p = particles[i];
        
        positions[i * 3] = p.targetPosition[0];
        positions[i * 3 + 1] = p.targetPosition[1];
        positions[i * 3 + 2] = p.targetPosition[2];

        targetPositions[i * 3] = p.targetPosition[0];
        targetPositions[i * 3 + 1] = p.targetPosition[1];
        targetPositions[i * 3 + 2] = p.targetPosition[2];

        colors[i * 3] = p.color[0];
        colors[i * 3 + 1] = p.color[1];
        colors[i * 3 + 2] = p.color[2];
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(targetPositions, 3));
      geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorProgress: { value: 0.0 }
        },
        vertexShader: `
          uniform float uTime;
          attribute vec3 aTargetPos;
          attribute vec3 aColor;
          varying vec3 vColor;
          
          void main() {
            vec3 pos = aTargetPos;
            
            pos.x += sin(uTime * 2.0 + aTargetPos.x * 0.5) * 0.3;
            pos.y += cos(uTime * 1.5 + aTargetPos.y * 0.5) * 0.3;
            pos.z += sin(uTime * 1.8 + aTargetPos.z * 0.5) * 0.2;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            gl_PointSize = (80.0 / -mvPosition.z);
            
            vColor = aColor;
          }
        `,
        fragmentShader: `
          uniform float uColorProgress;
          varying vec3 vColor;
          
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            
            float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
            
            vec3 lightColor = vec3(1.0, 0.8, 0.8);
            vec3 darkRed = vec3(0.7, 0.0, 0.0);
            vec3 finalColor = mix(lightColor, darkRed, uColorProgress);
            
            finalColor = mix(finalColor, vColor, 0.3);
            
            gl_FragColor = vec4(finalColor, alpha * 0.9);
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
                statusRef.current.innerText = "捏合手指注入能量 | 张开手掌释放光芒";
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

    let lastVideoTime = -1;
    let targetColorProgress = 0.0;

    const renderLoop = () => {
      if (!isMounted) return;

      if (particleSystem) {
        particleSystem.material.uniforms.uTime.value += 0.02;
        
        const currentProgress = particleSystem.material.uniforms.uColorProgress.value;
        particleSystem.material.uniforms.uColorProgress.value += (targetColorProgress - currentProgress) * 0.1;
        
        particleSystem.rotation.y = Math.sin(particleSystem.material.uniforms.uTime.value * 0.3) * 0.1;
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

              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];
              const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

              if (dist < PINCH_THRESHOLD) {
                targetColorProgress = 1.0;
                statusRef.current.innerText = `🔥 能量注入中 | 指间距离: ${dist.toFixed(3)} (捏合)`;
                statusRef.current.style.color = '#ff1493';
              } else {
                targetColorProgress = 0.0;
                statusRef.current.innerText = `✅ 已捕捉到手势 | 指间距离: ${dist.toFixed(3)} (张开)`;
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
          statusRef.current.innerText = "正在解析粒子图谱...";
        }
        
        const particles = await parseImageToParticles(IMAGE_PATH);
        
        if (!isMounted) return;
        if (particles.length === 0) {
          if (statusRef.current) {
            statusRef.current.innerText = "图片解析失败：未找到有效像素";
          }
          return;
        }

        if (statusRef.current) {
          statusRef.current.innerText = "正在构建粒子宇宙...";
        }
        
        removeResizeListener = initThreeJS(particles);
        
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
