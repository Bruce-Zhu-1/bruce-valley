import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './TeamDisplay.module.css'

const teamMembers = [
  { id: 'left2', name: 'ZouMaster', image: '/roles/zou0.webp', position: 'L2' },
  { id: 'left1', name: 'JonathanYC', image: '/roles/jiang0.webp', position: 'L1' },
  { id: 'center', name: 'BruceZhu', image: '/roles/bruce0.webp', position: 'C' },
  { id: 'right1', name: 'LiuYS', image: '/roles/liu0.webp', position: 'R1' },
  { id: 'right2', name: 'VS', image: '/roles/wei0.webp', position: 'R2' },
]

const bgImage = '/roles/background0.webp'

function TeamDisplay() {
  const [hoveredId, setHoveredId] = useState(null)
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate('/face-auth')
  }

  const getPositionStyle = (position) => {
    switch (position) {
      case 'L2':
        return {
          left: '5%',
          transform: 'translate3d(-50%, -50%, -300px) scale(0.75)',
        }
      case 'L1':
        return {
          left: '22%',
          transform: 'translate3d(-50%, -50%, -150px) scale(0.85)',
        }
      case 'C':
        return {
          left: '50%',
          transform: 'translate3d(-50%, -50%, 0px) scale(1)',
        }
      case 'R1':
        return {
          left: '78%',
          transform: 'translate3d(-50%, -50%, -150px) scale(0.85)',
        }
      case 'R2':
        return {
          left: '95%',
          transform: 'translate3d(-50%, -50%, -300px) scale(0.75)',
        }
      default:
        return {}
    }
  }

  const getHoverStyle = (member) => {
    const isHovered = hoveredId === member.id
    const isDefocused = hoveredId !== null && hoveredId !== member.id
    const baseStyle = getPositionStyle(member.position)

    if (isHovered) {
      return {
        ...baseStyle,
        transform: baseStyle.transform
          .replace('scale(0.75)', 'scale(0.95) translateZ(50px)')
          .replace('scale(0.85)', 'scale(1.05) translateZ(50px)')
          .replace('scale(1)', 'scale(1.15) translateZ(50px)'),
        zIndex: 100,
        filter: 'brightness(1.1) saturate(1.2)',
      }
    }

    if (isDefocused) {
      return {
        ...baseStyle,
        transform: baseStyle.transform
          .replace('-300px', '-350px')
          .replace('-150px', '-200px')
          .replace('0px', '-50px'),
        filter: 'brightness(0.4) saturate(0.2) blur(3px)',
        zIndex: 10,
      }
    }

    return {
      ...baseStyle,
      zIndex: 20,
    }
  }

  return (
    <div className={styles.container}>
      <div 
        className={styles.background}
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      <div className={styles.scene3d}>
        <div className={styles.teamWrapper}>
          {teamMembers.map((member) => {
            const style = getHoverStyle(member)
            const isHovered = hoveredId === member.id

            return (
              <div
                key={member.id}
                className={`${styles.memberCard} ${isHovered ? styles.hovered : ''} ${hoveredId && !isHovered ? styles.defocused : ''}`}
                style={style}
                onMouseEnter={() => setHoveredId(member.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={handleCardClick}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className={styles.memberImage}
                />
                
                {isHovered && (
                  <div className={styles.namePlate}>
                    <span className={styles.nameText}>{member.name}</span>
                    <span className={styles.positionText}>{member.position}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className={styles.letterboxTop} />
        <div className={styles.letterboxBottom} />

        <div className={styles.vignette} />
      </div>

      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>BRUCE VALLEY</h1>
        <p className={styles.subtitle}>THE WILD ONES</p>
      </div>
    </div>
  )
}

export default TeamDisplay
