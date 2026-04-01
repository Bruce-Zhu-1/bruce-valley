import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import './style.css'

import clearImg from '../../assets/images/msg/clear.png'
import defaultImg from '../../assets/images/msg/default.png'
import failImg from '../../assets/images/msg/fail.png'
import swordImg from '../../assets/images/sword.png'

const msgImages = {
  clear: clearImg,
  default: defaultImg,
  fail: failImg
}

const MessageItem = forwardRef(({ 
  id, 
  type = 'default', 
  duration = 3000, 
  top: initialTop = 160,
  onDestroy,
  registerRef
}, ref) => {
  const [swordMove, setSwordMove] = useState(false)
  const [msgOpacity, setMsgOpacity] = useState(1)
  const [top, setTop] = useState(0)

  const opacityTime = duration - 1000 > 0 ? duration - 1000 : duration

  useImperativeHandle(ref, () => ({
    updateTop: (newTop) => {
      setTop(newTop)
    }
  }))

  useEffect(() => {
    registerRef?.(id, { updateTop: (newTop) => setTop(newTop) })
  }, [id, registerRef])

  useEffect(() => {
    const msgTimer = setTimeout(() => {
      setSwordMove(true)
      setTop(initialTop)
    }, 0)

    const opacityTimer = setTimeout(() => {
      setMsgOpacity(0)
    }, opacityTime)

    return () => {
      clearTimeout(msgTimer)
      clearTimeout(opacityTimer)
    }
  }, [initialTop, opacityTime])

  const handleTransitionEnd = () => {
    if (msgOpacity === 0) {
      onDestroy?.(id)
    }
  }

  return (
    <div className="p5-msg-ctn" style={{ top: `${top}px` }}>
      <div 
        className="p5-msg-sub-ctn" 
        style={{ opacity: msgOpacity }}
        onTransitionEnd={handleTransitionEnd}
      >
        <img className="p5-msg-img" src={msgImages[type] || msgImages.default} alt="message" />
        <img 
          className={`p5-sword-img ${swordMove ? 'p5-sword-animation' : ''}`} 
          src={swordImg} 
          alt="sword" 
        />
      </div>
    </div>
  )
})

MessageItem.displayName = 'MessageItem'

export default MessageItem
