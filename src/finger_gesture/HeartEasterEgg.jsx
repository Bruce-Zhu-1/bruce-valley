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

    // --- 1. 初始化全屏 ---
    const enterFullScreen = async () => {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    };
    enterFullScreen();

    // --- 2. 核心：数学公式生成立体爱心粒子坐标 ---
    const PARTICLE_COUNT = 15000;
    const generateParticles = () => {
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const randomPositions = new Float32Array(PARTICLE_COUNT * 3); // 打散的坐标
      const heartPositions = new Float32Array(PARTICLE_COUNT * 3);  // 爱心的坐标

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // 随机散乱坐标 (全屏随机分布)
        randomPositions[i * 3] = (Math.random() - 0.5) * 100;
        randomPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        randomPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;

        // 立体爱心数学公式 (Math Magic!)
        const t = Math.PI * 2 * Math.random();
        const u = Math.PI * Math.random(); // 增加立体厚度
        // 标准心形参数方程缩放
        const x = 16 * Math.pow(Math.sin(t), 3) * (0.5 + 0.5 * Math.sin(u));
        const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * (0.5 + 0.5 * Math.sin(u));
        const z = (Math.random() - 0.5) * 15; // 深度，让它变得立体

        // 稍微放大一点心形
        heartPositions[i * 3] = x * 0.8;
        heartPositions[i * 3 + 1] = y * 0.8;
        heartPositions[i * 3 + 2] = z;

        // 初始状态设置为散乱
        positions[i * 3] = randomPositions[i * 3];
        positions[i * 3 + 1] = randomPositions[i * 3 + 1];
        positions[i * 3 + 2] = randomPositions[i * 3 + 2];
      }
      return { positions, randomPositions, heartPositions };
    };

    // --- 3. 初始化 Three.js ---
    const initThreeJS = () => {
      scene = new THREE.Scene();
      // 使用非常深的暗粉色背景，凸显赛博感
      scene.background = new THREE.Color(0x0a0005); 
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 40;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.appendChild(renderer.domElement);

      const { positions, randomPositions, heartPositions } = generateParticles();

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aRandomPos', new THREE.BufferAttribute(randomPositions, 3));
      geometry.setAttribute('aHeartPos', new THREE.BufferAttribute(heartPositions, 3));

      // 使用 ShaderMaterial 实现 GPU 级别的瞬间聚合/打散
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0.0 }, // 0: 散乱, 1: 聚合为爱心
          uColor: { value: new THREE.Color(0xff69b4) } // 亮粉色 Hot Pink
        },
        vertexShader: `
          uniform float uTime;
          uniform float uProgress;
          attribute vec3 aRandomPos;
          attribute vec3 aHeartPos;
          varying vec3 vPos;
          void main() {
            // 平滑插值：根据握拳状态在随机位置和爱心位置之间过渡
            vec3 targetPos = mix(aRandomPos, aHeartPos, uProgress);
            
            // 让粒子有一些自己的呼吸浮动感
            targetPos.y += sin(uTime * 2.0 + targetPos.x) * 0.5;
            
            vec4 mvPosition = modelViewMatrix * vec4(targetPos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            // 粒子近大远小
            gl_PointSize = (20.0 / -mvPosition.z) * (1.0 + uProgress * 2.0); 
            vPos = targetPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          void main() {
            // 画圆形的粒子并发光
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            if (distanceToCenter > 0.5) discard;
            float alpha = 1.0 - (distanceToCenter * 2.0);
            gl_FragColor = vec4(uColor, alpha * 0.8);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending, // 叠加发光模式
        depthWrite: false
      });

      particleSystem = new THREE.Points(geometry, material);
      scene.add(particleSystem);
    };

    // --- 4. 初始化 MediaPipe 手势识别 ---
    const initMediaPipe = async () => {
      const wasmPath = window.location.origin + "/wasm";
      const vision = await FilesetResolver.forVisionTasks(wasmPath);
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/hand_landmarker.task",
          delegate: "CPU"
        },
        runningMode: "VIDEO",
        numHands: 2 // 必须设为2才能识别双手合十
      });

      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setStatusText("双手合十：退出 | 握拳：聚合 | 张开：消散");
    };

    // --- 5. 动作判断逻辑 ---
    // 判断是否握拳 (手指指尖到手腕的距离，是否小于掌心基部到手腕的距离)
    const isFist = (landmarks) => {
      const wrist = landmarks[0];
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      
      const getDist = (p1, p2) => Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2 + (p1.z-p2.z)**2);
      const tipDist = (getDist(wrist, indexTip) + getDist(wrist, middleTip)) / 2;
      
      return tipDist < 0.25; // 阈值，越小代表握得越紧
    };

    // 判断双手合十
    const isClaspedHands = (multiHandLandmarks) => {
      if (multiHandLandmarks.length !== 2) return false;
      const hand1Wrist = multiHandLandmarks[0][0];
      const hand2Wrist = multiHandLandmarks[1][0];
      const dist = Math.sqrt((hand1Wrist.x - hand2Wrist.x)**2 + (hand1Wrist.y - hand2Wrist.y)**2);
      return dist < 0.15; // 两只手腕距离非常近
    };

    // --- 6. 渲染与物理循环 ---
    let lastVideoTime = -1;
    let targetProgress = 0; // 目标状态：0散开，1聚合

    const renderLoop = () => {
      particleSystem.material.uniforms.uTime.value += 0.02;

      // 手势识别与目标更新
      if (handLandmarker && videoRef.current.readyState >= 2) {
        let startTimeMs = performance.now();
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);
          
          if (results.multiHandLandmarks.length > 0) {
            // 检测双手合十退出
            if (isClaspedHands(results.multiHandLandmarks)) {
              handleExit();
              return; // 终止循环
            }
            
            // 检测是否握拳 (以第一只手为准)
            if (isFist(results.multiHandLandmarks[0])) {
              targetProgress = 1.0; // 握拳，聚成爱心
            } else {
              targetProgress = 0.0; // 摊开，散落
            }
          }
        }
      }

      // 平滑插值动画 (让聚合和散落显得很丝滑)
      particleSystem.material.uniforms.uProgress.value += 
        (targetProgress - particleSystem.material.uniforms.uProgress.value) * 0.1;

      // 稍微让爱心旋转一下
      particleSystem.rotation.y = Math.sin(particleSystem.material.uniforms.uTime.value * 0.5) * 0.3;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(renderLoop);
    };

    // --- 启动流程 ---
    initThreeJS();
    initMediaPipe().then(() => {
      renderLoop();
    });

    // --- 退出与清理 ---
    const handleExit = () => {
      if (document.exitFullscreen) document.exitFullscreen();
      cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (renderer) renderer.dispose();
      onClose(); // 通知父组件卸载
    };

    return () => handleExit();
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: 'black' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {/* 隐藏的 video 标签供 MediaPipe 读取摄像头 */}
      <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline muted></video>
      <div style={{ position: 'absolute', bottom: '40px', width: '100%', textAlign: 'center', color: '#ff69b4', fontFamily: 'monospace', fontSize: '1.2rem', textShadow: '0 0 10px #ff69b4' }}>
        {statusText}
      </div>
    </div>
  );
}