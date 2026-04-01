import { useMemo } from 'react'
import './style.css'

const Title = ({
  content = '',
  size = 'medium',
  selectedBgColor = '#000',
  selectedFontColor = '#fff',
  fontColor = '#000',
  animation = false,
  className = '',
  style = {},
  ...props
}) => {
  const checkList = [' ', ',', '，', '.', '。', '!', '！', '?', '？']
  
  const getSelectedIdx = (text) => {
    const idxMap = !checkList.includes(text[1]) ? { 1: 1 } : {}
    for (let i = 2; i < text.length; i++) {
      if (!checkList.includes(text[i]) && checkList.includes(text[i - 2])) {
        idxMap[i] = 1
      }
    }
    return idxMap
  }

  const idxList = useMemo(() => getSelectedIdx(content), [content])

  const getSpanStyle = (idx) => {
    const degree = Math.random() < 0.5 
      ? Math.random() * 10 
      : -Math.random() * 10
    
    return {
      color: idxList[idx] === 1 ? selectedFontColor : fontColor,
      backgroundColor: idxList[idx] === 1 ? selectedBgColor : '',
      transform: `rotate(${degree}deg)`
    }
  }

  const sizeClass = `p5-text-size-${size}`
  const animationClass = animation ? 'p5-hover-animation-mix' : ''

  return (
    <p 
      className={`p5-title-ctn p5-font ${sizeClass} ${animationClass} ${className}`}
      style={style}
      {...props}
    >
      {content.split('').map((str, idx) => (
        <span key={idx} style={getSpanStyle(idx)}>
          {str}
        </span>
      ))}
    </p>
  )
}

export default Title
