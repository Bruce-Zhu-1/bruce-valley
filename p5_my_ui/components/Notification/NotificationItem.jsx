import { useState, useEffect } from 'react'
import Title from '../Title'
import Characters from './character.js'
import './style.css'

import notificationImg from '../../assets/images/notification.png'

const portraitImages = import.meta.glob('../../assets/images/portraits/*.png', { eager: true })

const getPortraitImage = (character) => {
  const path = `../../assets/images/portraits/${character}.png`
  return portraitImages[path]?.default || portraitImages['../../assets/images/portraits/mona.png']?.default
}

const NotificationItem = ({
  id,
  top = 100,
  left = 100,
  character = 'mona',
  content = '',
  onDestroy
}) => {
  const [moveLeft, setMoveLeft] = useState(0)
  const characterName = Characters[character] || Characters.mona

  useEffect(() => {
    const timer = setTimeout(() => {
      setMoveLeft(left)
    }, 0)

    return () => clearTimeout(timer)
  }, [left])

  const handleClick = () => {
    onDestroy?.(id)
  }

  return (
    <div 
      className="p5-noti-ctn" 
      style={{ top: `${top}px`, left: `${moveLeft}px` }}
      onClick={handleClick}
    >
      <div className="p5-noti-sub-ctn">
        <img 
          className="p5-portrait-img" 
          src={getPortraitImage(character)} 
          alt={character} 
        />

        <div className="p5-dialog-ctn">
          <img className="p5-dialog-img" src={notificationImg} alt="dialog" />

          <div className="p5-noti-title">
            <Title 
              content={characterName} 
              size="small"
              selectedBgColor="#ff0022"
              selectedFontColor="#fff"
              fontColor="#fff"
            />
          </div>

          <div className="p5-noti-text">
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationItem
