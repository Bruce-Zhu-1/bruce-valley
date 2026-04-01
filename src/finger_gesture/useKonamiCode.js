// src/finger_gesture/useKonamiCode.js
import { useState, useEffect } from 'react';

export function useEasterEggTrigger() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let inputSequence = '';
    const targetSequence = 'yknEnter';

    const handleKeyDown = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; 
      
      inputSequence += key;

      if (inputSequence.length > 20) {
        inputSequence = inputSequence.slice(-20);
      }

      if (inputSequence.endsWith(targetSequence)) {
        setIsActive(true);
        inputSequence = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isActive, setIsActive };
}

export function useHide2Trigger() {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    let inputSequence = '';
    const targetSequence = 'tsy';

    const handleKeyDown = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : '';
      
      if (key) {
        inputSequence += key;

        if (inputSequence.length > 10) {
          inputSequence = inputSequence.slice(-10);
        }

        if (inputSequence.endsWith(targetSequence)) {
          setTriggered(true);
          inputSequence = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { triggered, setTriggered };
}
