import { motion } from 'framer-motion'

function Loading({ fullScreen = false }) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-[100] flex items-center justify-center bg-pixel-black'
    : 'flex items-center justify-center py-20'
  
  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-16 h-16 border-4 border-pixel-green border-t-transparent"
          style={{ imageRendering: 'pixelated' }}
        />
        
        <div className="flex flex-col items-center gap-2">
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="font-pixel text-pixel-green text-xs uppercase tracking-widest"
          >
            LOADING
          </motion.p>
          
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{
                  backgroundColor: ['#00ff41', '#ff2d2d', '#00ff41'],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                className="w-2 h-2"
              />
            ))}
          </div>
        </div>
        
        <div className="w-48 h-1 bg-pixel-gray overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="h-full w-1/2 bg-pixel-green"
          />
        </div>
      </div>
    </div>
  )
}

export default Loading
