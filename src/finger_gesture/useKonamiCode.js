// src/finger_gesture/useKonamiCode.js
import { useState, useEffect } from 'react';

export function useEasterEggTrigger() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let inputSequence = '';
    const targetSequence = 'yknEnter'; // 目标序列：y, k, n, 然后回车

    const handleKeyDown = (e) => {
      // 获取按键，如果是字母转小写，如果是 Enter 首字母大写
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; 
      
      inputSequence += key;

      // 保持序列长度不要太长，防止内存堆积
      if (inputSequence.length > 20) {
        inputSequence = inputSequence.slice(-20);
      }

      // 检查是否匹配
      if (inputSequence.endsWith(targetSequence)) {
        setIsActive(true);
        inputSequence = ''; // 清空序列
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isActive, setIsActive };
}
