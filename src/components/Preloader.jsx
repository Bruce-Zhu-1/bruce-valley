import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Preloader() {
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const loadImage = new Promise((resolve) => {
      const img = new Image()
      img.src = '/background/1.jpg'
      img.onload = () => resolve()
      img.onerror = () => resolve()
    })
    
    const minimumDuration = new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })
    
    Promise.all([loadImage, minimumDuration]).then(() => {
      setIsLoading(false)
    })
  }, [])
  
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[100000] bg-[#1a110a] flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: '-100vh' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          <div className="relative flex flex-col items-center">
            <div className="flex gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 bg-amber-500"
                  style={{
                    boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
                  }}
                  animate={{
                    y: [0, -12, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            
            <motion.p
              className="text-amber-500 animate-pulse"
              style={{
                fontFamily: '"Press Start 2P", Courier New, monospace',
                fontSize: '0.5rem',
                letterSpacing: '0.2em',
              }}
              animate={{
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              LOADING VALLEY...
            </motion.p>
            
            <div className="mt-8 w-48 h-2 bg-amber-900/30 border border-amber-800/50 overflow-hidden">
              <motion.div
                className="h-full bg-amber-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Preloader
