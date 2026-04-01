import { useEffect } from 'react'
import './style.css'

import '../../assets/svgs/p5-icon-btn'
import '../../assets/svgs/p5-icon-party'

const Icon = ({
  name,
  type = 'btn',
  className = '',
  style = {},
  ...props
}) => {
  const svgClass = `p5-svg-${type}`

  return (
    <div className={`p5-svg-ctn ${className}`} style={style} {...props}>
      <svg className={svgClass}>
        <use xlinkHref={`#${name}`} />
      </svg>
    </div>
  )
}

export default Icon
