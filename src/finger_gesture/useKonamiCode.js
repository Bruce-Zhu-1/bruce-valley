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

export function useHide3Trigger() {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    let inputSequence = '';
    const targetSequence = 'lucyEnter';

    const handleKeyDown = (e) => {
      let key = '';
      
      if (e.key.length === 1) {
        key = e.key.toLowerCase();
      } else if (e.key === 'Enter') {
        key = 'Enter';
      }
      
      if (key) {
        inputSequence += key;

        if (inputSequence.length > 20) {
          inputSequence = inputSequence.slice(-20);
        }

        if (inputSequence.toLowerCase().endsWith(targetSequence.toLowerCase())) {
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
