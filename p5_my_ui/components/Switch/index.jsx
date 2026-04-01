import { useState } from 'react'
import './style.css'

import iconOn from '../../assets/images/icon-on.png'
import iconOff from '../../assets/images/icon-off.png'

const Switch = ({
  value = false,
  onChange,
  size = 'medium',
  className = '',
  style = {},
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleChange = () => {
    onChange?.(!value)
  }

  const sizeClass = `p5-switch-size-${size}`
  const stateClass = value ? 'p5-switch-on' : 'p5-switch-off'

  return (
    <div 
      className={`p5-switch-ctn ${stateClass} ${sizeClass} ${className}`}
      style={style}
      {...props}
    >
      <div className="p5-switch-bg-ctn">
        <span className={`p5-switch-bg ${isHovered ? 'p5-switch-bg-move' : ''}`} />
      </div>
      <span className="p5-switch-icon" />
      <span className={isHovered ? 'p5-switch-sub-icon' : ''} />
      <input 
        type="checkbox" 
        onClick={handleChange}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </div>
  )
}

export default Switch
