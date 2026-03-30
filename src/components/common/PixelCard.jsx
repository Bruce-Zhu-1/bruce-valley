import { motion } from 'framer-motion'
import { useState } from 'react'

function PixelCard({ 
  children, 
  title, 
  subtitle,
  variant = 'green',
  hoverable = true,
  className = '',
  onClick,
  ...props 
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  const borderColors = {
    green: 'border-pixel-green',
    red: 'border-pixel-red',
    mixed: 'animate-border-flash',
  }
  
  const glowColors = {
    green: 'hover:shadow-pixel-green',
    red: 'hover:shadow-pixel-red',
    mixed: '',
  }
  
  return (
    <motion.div
      whileHover={hoverable ? { 
        y: -4,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
      } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`
        relative bg-pixel-black-light border-2 
        ${borderColors[variant]}
        ${hoverable ? 'cursor-pointer' : ''}
        ${glowColors[variant]}
        transition-all duration-300
        ${className}
      `}
      style={{
        boxShadow: isHovered && hoverable
          ? variant === 'green'
            ? '8px 8px 0 #0a3d0a, 0 0 20px rgba(0, 255, 65, 0.2)'
            : variant === 'red'
            ? '8px 8px 0 rgba(255, 45, 45, 0.3), 0 0 20px rgba(255, 45, 45, 0.2)'
            : '8px 8px 0 #0a3d0a'
          : '6px 6px 0 #0a3d0a',
      }}
      {...props}
    >
      {(title || subtitle) && (
        <div className="border-b border-pixel-green-deep p-4">
          {title && (
            <h3 className="font-pixel text-sm text-pixel-white mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="font-pixel text-[8px] text-pixel-green uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {isHovered && hoverable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-2 right-2"
        >
          <div className="w-2 h-2 bg-pixel-green animate-pulse" />
        </motion.div>
      )}
      
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-pixel-green" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-pixel-green" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-pixel-green" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-pixel-green" />
    </motion.div>
  )
}

export default PixelCard
