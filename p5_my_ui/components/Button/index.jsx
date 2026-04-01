import { useMemo } from 'react'
import './style.css'

const Button = ({ 
  children, 
  className = '', 
  style = {},
  onClick,
  ...props 
}) => {
  const btnStyle = useMemo(() => {
    const degreeX = Math.random() < 0.5 
      ? 1 + Math.random() * 1.5 
      : -1 - Math.random() * 1.5
    return {
      transform: `skewX(${degreeX}deg)`,
      ...style
    }
  }, [])

  return (
    <div 
      className={`p5-btn-ctn ${className}`}
      style={btnStyle}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export default Button
