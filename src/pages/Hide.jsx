// src/pages/Hide.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';

export default function Hide() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [statusText, setStatusText] = useState("正在唤醒摄像头与粒子引擎...");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true; 
    let canExit = false;  
    
    // 3秒保护期，防止刚进页面手乱动触发退出
    const exitTimer = setTimeout(() => { canExit = true; }, 3000);

    let handLandmarker;
    let camera, scene, renderer, particleSystem;
    let animationId;
    let stream;
    let removeResizeListener;

    // --- 1. 生成实心爱心粒子 (利用数学公式) ---
    const PARTICLE_COUNT = 8000; 
    const generateParticles = () => {
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const randomPositions = new Float32Array(PARTICLE_COUNT * 3);
      const heartPositions = new Float32Array(PARTICLE_COUNT * 3);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // 初始散乱位置：布满整个空间
        randomPositions[i * 3] = (Math.random() - 0.5) * 300;
        randomPositions[i * 3 + 1] = (Math.random() - 0.5) * 300;
        randomPositions[i * 3 + 2] = (Math.random() - 0.5) * 300;

        // 实心爱心参数方程生成
        const t = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()); // 保证圆内均匀分布
        
        // 经典爱心曲线
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        
        // 缩放并翻转 Y 轴，增加一点 Z 轴厚度
        heartPositions[i * 3] = hx * r * 1.5; 
        heartPositions[i * 3 + 1] = hy * r * 1.5;
        heartPositions[i * 3 + 2] = (Math.random() - 0.5) * 5; 

        // 赋予初始坐标
        positions[i * 3] = randomPositions[i * 3];
        positions[i * 3 + 1] = randomPositions[i * 3 + 1];
        positions[i * 3 + 2] = randomPositions[i * 3 + 2];
      }
      return { positions, randomPositions, heartPositions };
    };

    // --- 2. 初始化 Three.js 引擎 ---
    const initThreeJS = () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 60; // 稍微拉远一点，看全景

      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (containerRef.current) containerRef.current.appendChild(renderer.domElement);

      const { positions, randomPositions, heartPositions } = generateParticles();

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aRandomPos', new THREE.BufferAttribute(randomPositions, 3));
      geometry.setAttribute('aHeartPos', new THREE.BufferAttribute(heartPositions, 3));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0.0 }, // 0: 散开, 1: 聚成爱心
          uColor: { value: new THREE.Color(0xff1493) } // DeepPink
        },
        vertexShader: `
          uniform float uTime;
          uniform float uProgress;
          attribute vec3 aRandomPos;
          attribute vec3 aHeartPos;
          varying vec3 vPos;
          void main() {
            vec3 targetPos = mix(aRandomPos, aHeartPos, uProgress);
            // 微微的浮动感
            targetPos.y += sin(uTime * 2.0 + targetPos.x * 0.1) * 2.0;
            vec4 mvPosition = modelViewMatrix * vec4(targetPos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // 【核心修正】大幅增加粒子尺寸
            gl_PointSize = (300.0 / -mvPosition.z) * (1.0 + uProgress * 0.5);
            vPos = targetPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          void main() {
            // 让方形的点变成圆形发光体
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            if (distanceToCenter > 0.5) discard;
            float alpha = 1.0 - (distanceToCenter * 2.0); // 边缘变淡
            gl_FragColor = vec4(uColor, alpha);
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

    // --- 3. 初始化 AI 手势模型 ---
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        if (!isMounted) return;

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numHands: 1 // 为了性能，只检测一只手就足够了
        });

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!isMounted) { stream.getTracks().forEach(track => track.stop()); return; }

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                if (isMounted && videoRef.current) {
                    videoRef.current.play();
                    setStatusText("捏合拇指食指：退出 | 握拳：爱心 | 张开：消散");
                }
            };
        }
      } catch (error) {
        if (isMounted) setStatusText("摄像头开启失败");
      }
    };

    // --- 4. 极致简化的全新手势逻辑 ---
    const getD = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const checkGesture = (landmarks) => {
      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];

      // 【动作 C：退出】捏合大拇指和食指 (Pinch)
      const pinchDist = getD(thumbTip, indexTip);
      if (pinchDist < 0.05) return 'EXIT';

      let curledFingers = 0;
      const tips = [8, 12, 16, 20]; // 食指、中指、无名指、小指 指尖
      const mcps = [5, 9, 13, 17];  // 对应的手指根部

      // 如果指尖比指根离手腕还近，说明手指弯曲了
      for (let i = 0; i < 4; i++) {
        if (getD(wrist, landmarks[tips[i]]) < getD(wrist, landmarks[mcps[i]])) {
          curledFingers++;
        }
      }

      // 【动作 B：聚成爱心】3 根或 4 根手指弯曲，即为握拳
      if (curledFingers >= 3) return 'GATHER';
      
      // 【动作 A：消散粒子】几乎没有手指弯曲，即为张开手掌
      if (curledFingers <= 1) return 'DISPERSE';

      return 'HOLD'; // 中间状态，保持当前进度不动
    };

    // --- 5. 键盘兜底退出机制 ---
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // --- 6. 渲染循环 ---
    let lastVideoTime = -1;
    let targetProgress = 0;

    const renderLoop = () => {
      if (!isMounted) return;

      if (particleSystem) {
          particleSystem.material.uniforms.uTime.value += 0.02;
          // 平滑过渡进度 (缓动算法)
          particleSystem.material.uniforms.uProgress.value += (targetProgress - particleSystem.material.uniforms.uProgress.value) * 0.1;
          particleSystem.rotation.y = Math.sin(particleSystem.material.uniforms.uTime.value * 0.3) * 0.2; // 整体轻微旋转
      }

      if (handLandmarker && videoRef.current && videoRef.current.readyState >= 2) {
        let startTimeMs = performance.now();
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const action = checkGesture(results.multiHandLandmarks[0]);
            
            if (action === 'EXIT' && canExit) {
              handleExit();
              return; 
            } else if (action === 'GATHER') {
              targetProgress = 1.0; // 目标状态：聚集成心
            } else if (action === 'DISPERSE') {
              targetProgress = 0.0; // 目标状态：散开
            }
          }
        }
      }

      if (renderer && scene && camera) {
          renderer.render(scene, camera);
      }
      animationId = requestAnimationFrame(renderLoop);
    };

    // --- 7. 彻底清理环境与退出 ---
    const handleExit = () => {
      isMounted = false;
      navigate('/');
    };

    removeResizeListener = initThreeJS();
    renderLoop(); 
    initMediaPipe(); 

    return () => {
      isMounted = false;
      clearTimeout(exitTimer);
      window.removeEventListener('keydown', handleKeyDown); // 卸载按键监听
      
      if (animationId) cancelAnimationFrame(animationId);
      if (removeResizeListener) window.removeEventListener('resize', removeResizeListener);

      if (stream) stream.getTracks().forEach(track => track.stop());
      if (handLandmarker) {
          try { handLandmarker.close(); } catch(e){}
      }

      if (particleSystem) {
        particleSystem.geometry.dispose();
        particleSystem.material.dispose();
      }

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss(); // 防显存泄漏
        if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, [navigate]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, backgroundColor: 'black' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {/* 视频标签只需在后台静默运行 */}
      <video ref={videoRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }} autoPlay playsInline muted></video>
      <div style={{ position: 'absolute', bottom: '40px', width: '100%', textAlign: 'center', color: '#ff1493', fontFamily: 'monospace', fontSize: '1.2rem', textShadow: '0 0 10px #ff1493', pointerEvents: 'none' }}>
        {statusText}
      </div>
    </div>
  );
}