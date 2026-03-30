import { motion } from 'framer-motion'

function PixelButton({ 
  children, 
  variant = 'green', 
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  ...props 
}) {
  const baseClasses = 'font-pixel uppercase tracking-wider transition-all duration-200 inline-flex items-center justify-center gap-2'
  
  const variantClasses = {
    green: `
      bg-pixel-black border-2 border-pixel-green text-pixel-green
      hover:bg-pixel-green hover:text-pixel-black
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pixel-black disabled:hover:text-pixel-green
    `,
    red: `
      bg-pixel-black border-2 border-pixel-red text-pixel-red
      hover:bg-pixel-red hover:text-pixel-black
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pixel-black disabled:hover:text-pixel-red
    `,
    outline: `
      bg-transparent border-2 border-pixel-green text-pixel-green
      hover:bg-pixel-green-deep
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[8px]',
    md: 'px-6 py-3 text-[10px]',
    lg: 'px-8 py-4 text-xs',
  }
  
  const shadowClasses = variant === 'green' 
    ? 'shadow-[4px_4px_0_#0a3d0a] active:shadow-[2px_2px_0_#0a3d0a] active:translate-x-[2px] active:translate-y-[2px]]'
    : variant === 'red'
    ? 'shadow-[4px_4px_0_rgba(255,45,45,0.3)] active:shadow-[2px_2px_0_rgba(255,45,45,0.3)] active:translate-x-[2px] active:translate-y-[2px]]'
    : ''
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${shadowClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export default PixelButton
