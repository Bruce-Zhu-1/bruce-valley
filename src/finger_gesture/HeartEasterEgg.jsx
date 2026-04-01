// src/finger_gesture/HeartEasterEgg.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export default function HeartEasterEgg({ onClose }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [statusText, setStatusText] = useState("正在唤醒摄像头与粒子引擎...");

  useEffect(() => {
    let handLandmarker;
    let camera, scene, renderer, particleSystem;
    let animationId;
    let stream;
    let isComponentMounted = true; // 防止组件卸载后继续执行异步逻辑

    // --- 1. 核心：数学公式生成立体爱心粒子坐标 ---
    const PARTICLE_COUNT = 15000;
    const generateParticles = () => {
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const randomPositions = new Float32Array(PARTICLE_COUNT * 3); 
      const heartPositions = new Float32Array(PARTICLE_COUNT * 3);  

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // 让初始散乱坐标范围更大一点，视觉冲击力更强
        randomPositions[i * 3] = (Math.random() - 0.5) * 150;
        randomPositions[i * 3 + 1] = (Math.random() - 0.5) * 150;
        randomPositions[i * 3 + 2] = (Math.random() - 0.5) * 150;

        const t = Math.PI * 2 * Math.random();
        const u = Math.PI * Math.random(); 
        
        const x = 16 * Math.pow(Math.sin(t), 3) * (0.5 + 0.5 * Math.sin(u));
        const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * (0.5 + 0.5 * Math.sin(u));
        const z = (Math.random() - 0.5) * 15; 

        heartPositions[i * 3] = x * 0.8;
        heartPositions[i * 3 + 1] = y * 0.8;
        heartPositions[i * 3 + 2] = z;

        positions[i * 3] = randomPositions[i * 3];
        positions[i * 3 + 1] = randomPositions[i * 3 + 1];
        positions[i * 3 + 2] = randomPositions[i * 3 + 2];
      }
      return { positions, randomPositions, heartPositions };
    };

    // --- 2. 初始化 Three.js ---
    const initThreeJS = () => {
      scene = new THREE.Scene();
      // 纯黑背景
      scene.background = new THREE.Color(0x000000);
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 40;

      // 不使用 alpha: true，让背景完全不透明
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 性能优化：限制最大像素比
      containerRef.current.appendChild(renderer.domElement);

      const { positions, randomPositions, heartPositions } = generateParticles();

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aRandomPos', new THREE.BufferAttribute(randomPositions, 3));
      geometry.setAttribute('aHeartPos', new THREE.BufferAttribute(heartPositions, 3));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0.0 },
          uColor: { value: new THREE.Color(0xff69b4) } 
        },
        vertexShader: `
          uniform float uTime;
          uniform float uProgress;
          attribute vec3 aRandomPos;
          attribute vec3 aHeartPos;
          varying vec3 vPos;
          void main() {
            vec3 targetPos = mix(aRandomPos, aHeartPos, uProgress);
            targetPos.y += sin(uTime * 2.0 + targetPos.x) * 0.5;
            
            vec4 mvPosition = modelViewMatrix * vec4(targetPos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = (20.0 / -mvPosition.z) * (1.0 + uProgress * 2.0); 
            vPos = targetPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          void main() {
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            if (distanceToCenter > 0.5) discard;
            float alpha = 1.0 - (distanceToCenter * 2.0);
            gl_FragColor = vec4(uColor, alpha * 0.8);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      particleSystem = new THREE.Points(geometry, material);
      scene.add(particleSystem);

      // --- 响应窗口调整 (重要优化) ---
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      return handleResize;
    };

    let removeResizeListener;

    // --- 3. 初始化 MediaPipe (使用官方CDN) ---
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        if (!isComponentMounted) return;

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2 
        });

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!isComponentMounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        videoRef.current.srcObject = stream;
        
        // 等待视频元数据加载完毕再播放
        videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setStatusText("双手合十：退出 | 握拳：聚合 | 张开：消散");
        };

      } catch (error) {
        console.error("初始化摄像头或AI模型失败:", error);
        setStatusText("初始化失败：请确保允许使用摄像头且网络正常");
      }
    };

    // --- 4. 动作判断逻辑优化 (距离比例缩放不变性) ---
    const getDist = (p1, p2) => Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2 + (p1.z-p2.z)**2);

    const isFist = (landmarks) => {
      const wrist = landmarks[0];
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const middleKnuckle = landmarks[9]; // 中指根部（掌指关节）

      // 以 手腕到中指根部 的距离作为手掌尺寸的基础比例尺
      const palmSize = getDist(wrist, middleKnuckle);
      
      // 当前指尖到手腕的平均距离
      const tipDist = (getDist(wrist, indexTip) + getDist(wrist, middleTip)) / 2;
      
      // 如果指尖到手腕的距离，只有手掌大小的 1.2 倍以内，说明手指已经卷曲回掌心附近，即为握拳
      return tipDist < palmSize * 1.2; 
    };

    const isClaspedHands = (multiHandLandmarks) => {
      if (multiHandLandmarks.length !== 2) return false;
      const hand1Wrist = multiHandLandmarks[0][0];
      const hand2Wrist = multiHandLandmarks[1][0];
      const dist = Math.sqrt((hand1Wrist.x - hand2Wrist.x)**2 + (hand1Wrist.y - hand2Wrist.y)**2);
      return dist < 0.15; // 这个阈值通常比较稳定，因为双手合十时必然靠得很近
    };

    // --- 5. 渲染与物理循环 ---
    let lastVideoTime = -1;
    let targetProgress = 0; 

    const renderLoop = () => {
      if (!isComponentMounted) return;

      particleSystem.material.uniforms.uTime.value += 0.02;

      // 手势识别
      if (handLandmarker && videoRef.current && videoRef.current.readyState >= 2) {
        let startTimeMs = performance.now();
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);
          
          if (results.multiHandLandmarks.length > 0) {
            if (isClaspedHands(results.multiHandLandmarks)) {
              handleExit();
              return; 
            }
            if (isFist(results.multiHandLandmarks[0])) {
              targetProgress = 1.0; 
            } else {
              targetProgress = 0.0; 
            }
          }
        }
      }

      // 平滑插值动画
      particleSystem.material.uniforms.uProgress.value += 
        (targetProgress - particleSystem.material.uniforms.uProgress.value) * 0.1;

      particleSystem.rotation.y = Math.sin(particleSystem.material.uniforms.uTime.value * 0.5) * 0.3;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(renderLoop);
    };

    // --- 启动 ---
    removeResizeListener = initThreeJS();
    initMediaPipe().then(() => {
      if (isComponentMounted) renderLoop();
    });

    // --- 退出与清理 (避免 GPU / Web Worker 内存泄漏) ---
    const handleExit = () => {
      isComponentMounted = false;
      
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn(err));
      }
      
      cancelAnimationFrame(animationId);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (handLandmarker) {
        handLandmarker.close(); // 彻底关闭 AI 模型 Worker
      }

      if (particleSystem) {
        particleSystem.geometry.dispose(); // 释放几何体显存
        particleSystem.material.dispose(); // 释放材质显存
      }

      if (renderer) {
        window.removeEventListener('resize', removeResizeListener);
        renderer.dispose();
        renderer.forceContextLoss(); // 强制释放 WebGL 上下文，彻底解决 Context Lost 问题
        if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
      
      onClose();
    };

    // 监听 React 组件卸载时的清理
    return () => {
      if (isComponentMounted) {
        handleExit();
      }
    };
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: 'black' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline muted></video>
      <div style={{ 
        position: 'absolute', 
        bottom: '40px', 
        width: '100%', 
        textAlign: 'center', 
        color: '#ff69b4', 
        fontFamily: 'monospace', 
        fontSize: '1.2rem', 
        textShadow: '0 0 10px #ff69b4',
        pointerEvents: 'none' // 防止文字阻挡鼠标或触摸事件
      }}>
        {statusText}
      </div>
    </div>
  );
}
