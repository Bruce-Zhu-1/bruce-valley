import { useState, useEffect } from 'react'
import Text from '../Text'
import './style.css'

const Slider = ({
  value = 0,
  onChange,
  leftText = '',
  rightText = '',
  min = 0,
  max = 100,
  width = 100,
  placement = 'top',
  tip = true,
  className = '',
  style = {},
  ...props
}) => {
  const [tempValue, setTempValue] = useState(value)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setTempValue(value)
  }, [value])

  const handleChange = (e) => {
    const newValue = Number(e.target.value)
    setTempValue(newValue)
    onChange?.(newValue)
  }

  const iconPosition = ((tempValue - min) / (max - min)) * width - 18

  return (
    <div 
      className={`p5-slider-ctn ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <Text className="p5-slider-text-left">{leftText}</Text>

      <div className="p5-slider-bg" style={{ width: `${width}px` }}>
        {tip && isHovered && (
          <span 
            className="p5-slider-icon p5-text p5-font"
            style={{ 
              left: `${iconPosition}px`, 
              top: placement === 'top' ? '-30px' : '24px' 
            }}
          >
            {tempValue}
          </span>
        )}

        <input 
          className={`p5-slider-progress ${isHovered ? 'p5-slider-progress-hover' : 'p5-slider-progress-static'}`}
          type="range" 
          min={min} 
          max={max} 
          value={tempValue}
          onChange={handleChange}
        />
      </div>

      <Text className="p5-slider-text-right">{rightText}</Text>
    </div>
  )
}

export default Slider
