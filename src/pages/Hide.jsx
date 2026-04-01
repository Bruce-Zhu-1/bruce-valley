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
    let isMounted = true; // 极其重要的防异步竞态锁
    let canExit = false;  // 退出冷却锁
    
    // 延迟解锁退出机制 (从组件挂载算起 3 秒后，防止 AI 初始的垃圾坐标误触退出)
    const exitTimer = setTimeout(() => {
        canExit = true;
    }, 3000);

    let handLandmarker;
    let camera, scene, renderer, particleSystem;
    let animationId;
    let stream;
    let removeResizeListener;

    // --- 1. 生成粒子坐标 ---
    const PARTICLE_COUNT = 6000; // 降低数量保性能，防止显卡压力过大
    const generateParticles = () => {
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const randomPositions = new Float32Array(PARTICLE_COUNT * 3);
      const heartPositions = new Float32Array(PARTICLE_COUNT * 3);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
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
      scene.background = new THREE.Color(0x000000); // 绝对纯黑，防止透色
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 40;

      // 关闭抗锯齿并开启高性能模式
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }

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

      const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      return handleResize;
    };

    // --- 3. 初始化 MediaPipe ---
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        if (!isMounted) return; // 防竞态中断

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU" // 必须是 CPU，绝不能和 Three.js 抢显存
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        if (!isMounted) return; // 防竞态中断

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!isMounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                if (isMounted && videoRef.current) {
                    videoRef.current.play();
                    setStatusText("双手合十：退出 | 握拳：聚合 | 张开：消散");
                }
            };
        }
      } catch (error) {
        console.error("MediaPipe 初始化失败:", error);
        if (isMounted) setStatusText("初始化失败，请检查摄像头权限与网络");
      }
    };

    // --- 4. 手势判断逻辑 ---
    const getDist = (p1, p2) => Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2 + (p1.z-p2.z)**2);
    
    const isFist = (landmarks) => {
      const wrist = landmarks[0];
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const middleKnuckle = landmarks[9];
      const palmSize = getDist(wrist, middleKnuckle);
      const tipDist = (getDist(wrist, indexTip) + getDist(wrist, middleTip)) / 2;
      return tipDist < palmSize * 1.2;
    };

    const isClaspedHands = (multiHandLandmarks) => {
      if (multiHandLandmarks.length !== 2) return false;
      const hand1Wrist = multiHandLandmarks[0][0];
      const hand2Wrist = multiHandLandmarks[1][0];
      const dist = Math.sqrt((hand1Wrist.x - hand2Wrist.x)**2 + (hand1Wrist.y - hand2Wrist.y)**2);
      return dist < 0.15;
    };

    // --- 5. 渲染循环 ---
    let lastVideoTime = -1;
    let targetProgress = 0;

    const renderLoop = () => {
      if (!isMounted) return; // 核心：如果组件卸载，立刻停止动画递归

      if (particleSystem) {
          particleSystem.material.uniforms.uTime.value += 0.02;
          particleSystem.material.uniforms.uProgress.value += (targetProgress - particleSystem.material.uniforms.uProgress.value) * 0.1;
          particleSystem.rotation.y = Math.sin(particleSystem.material.uniforms.uTime.value * 0.5) * 0.3;
      }

      if (handLandmarker && videoRef.current && videoRef.current.readyState >= 2) {
        let startTimeMs = performance.now();
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // 必须在 canExit (3秒冷冻期) 结束后，才能触发退出
            if (canExit && isClaspedHands(results.multiHandLandmarks)) {
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

      if (renderer && scene && camera) {
          renderer.render(scene, camera);
      }
      animationId = requestAnimationFrame(renderLoop);
    };

    // --- 6. 退出执行 ---
    const handleExit = () => {
      isMounted = false; // 阻断所有后续执行
      navigate('/');
    };

    // --- 启动流程 ---
    removeResizeListener = initThreeJS();
    renderLoop(); // 1. 无视 AI 状态，立刻启动 Three.js 渲染粒子宇宙
    initMediaPipe(); // 2. 让 AI 在后台默默异步加载，加载好后手势会自动介入

    // --- 7. 最严厉的清理函数 (防 Context Lost 杀手锏) ---
    return () => {
      isMounted = false;
      clearTimeout(exitTimer);
      
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
        renderer.forceContextLoss(); // 解决 Context Lost 的杀手锏
        if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, [navigate]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, backgroundColor: 'black' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline muted></video>
      <div style={{ position: 'absolute', bottom: '40px', width: '100%', textAlign: 'center', color: '#ff69b4', fontFamily: 'monospace', fontSize: '1.2rem', textShadow: '0 0 10px #ff69b4', pointerEvents: 'none' }}>
        {statusText}
      </div>
    </div>
  );
}