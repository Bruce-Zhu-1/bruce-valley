import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import useSound from 'use-sound'

const characters = [
  { 
    id: 'bruce', 
    name: 'Bruce Zhu', 
    title: 'THE CREATOR',
    image: '/roles/bruce0.webp',
    color: '#8b0000',
    quote: 'Code is poetry.'
  },
  { 
    id: 'jiang', 
    name: 'Jonathan YC', 
    title: 'THE SAGE',
    image: '/roles/jiang0.webp',
    color: '#1a5f2a',
    quote: 'Wisdom seeks truth.'
  },
  { 
    id: 'liu', 
    name: 'Liu YS', 
    title: 'THE WARRIOR',
    image: '/roles/liu0.webp',
    color: '#2c4a80',
    quote: 'Strength in silence.'
  },
  { 
    id: 'zou', 
    name: 'Zou Master', 
    title: 'THE SCHOLAR',
    image: '/roles/zou0.webp',
    color: '#6b4c8a',
    quote: 'Knowledge is power.'
  },
  { 
    id: 'wei', 
    name: 'VS Wei', 
    title: 'THE PHANTOM',
    image: '/roles/wei0.webp',
    color: '#4a4a4a',
    quote: 'Shadows speak louder.'
  },
]

function TiltCard({ character, onSelect }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 300, damping: 30 })
  
  const glareX = useTransform(x, [-0.5, 0.5], ['200%', '-200%'])
  const glareOpacity = useTransform(x, [-0.5, 0, 0.5], [0.1, 0.3, 0.1])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5
    x.set(normalizedX)
    y.set(normalizedY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{
        perspective: '1000px',
        width: '180px',
        flexShrink: 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(character)}
    >
      <motion.div
        className="relative"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        <div 
          className="relative overflow-visible rounded-lg"
          style={{
            width: '180px',
            height: '420px',
            background: `linear-gradient(180deg, ${character.color}dd 0%, #1a1a1a 100%)`,
            border: `3px solid ${character.color}`,
            boxShadow: isHovered 
              ? `0 25px 50px -12px ${character.color}88, 0 0 30px ${character.color}44`
              : '0 10px 30px rgba(0,0,0,0.5)',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <div 
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
            }}
          />
          
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 45%, transparent 50%)',
              x: glareX,
              opacity: glareOpacity,
            }}
          />

          <div 
            className="absolute left-0 right-0 flex justify-center"
            style={{
              top: '-60px',
              height: '280px',
              zIndex: 10,
            }}
          >
            <motion.img
              src={character.image}
              alt={character.name}
              className="object-cover object-top"
              style={{
                width: '160px',
                height: '100%',
                filter: isHovered ? 'drop-shadow(0 20px 30px rgba(0,0,0,0.8))' : 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))',
                transition: 'filter 0.3s ease',
              }}
              animate={isHovered ? { 
                y: -10,
                scale: 1.05,
              } : { 
                y: 0,
                scale: 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </div>

          <div 
            className="absolute bottom-0 left-0 right-0 p-4 text-center"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
              height: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <p 
              className="text-xs tracking-widest mb-1"
              style={{ color: character.color, fontFamily: '"Rye", serif' }}
            >
              {character.title}
            </p>
            <h3 
              className="text-lg font-bold text-amber-100 mb-2"
              style={{ fontFamily: '"Rye", serif', letterSpacing: '0.1em' }}
            >
              {character.name}
            </h3>
            <p 
              className="text-xs text-amber-200/60 italic"
              style={{ fontFamily: 'serif' }}
            >
              "{character.quote}"
            </p>
          </div>

          <motion.div
            className="absolute top-3 left-3 right-3 h-8 flex items-center justify-center"
            style={{
              background: character.color,
              border: '2px solid rgba(255,255,255,0.2)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span 
              className="text-xs text-amber-100 tracking-widest"
              style={{ fontFamily: '"Rye", serif' }}
            >
              VIEW NOTES
            </span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Notes() {
  const navigate = useNavigate()
  const [playSelect] = useSound('/music/sfx/select.mp3', { volume: 0.5 })
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })

  const handleSelect = (character) => {
    playSelect()
    setTimeout(() => {
      navigate(`/notes/${character.id}`)
    }, 200)
  }

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(139, 0, 0, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(139, 0, 0, 0.1) 0%, transparent 50%),
            linear-gradient(to bottom, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)
          `,
        }}
      />

      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0px, rgba(0, 0, 0, 0.1) 1px, transparent 1px, transparent 2px)',
        }}
      />

      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/" 
          onClick={playClick}
          className="inline-flex items-center px-4 py-2 mt-8 mb-6 font-pixel text-amber-100 bg-amber-800 border-4 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
        >
          <span className="mr-2">◄</span> BACK TO VALLEY
        </Link>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 
            className="text-4xl md:text-5xl text-amber-100 mb-4"
            style={{ 
              fontFamily: '"Rye", serif',
              letterSpacing: '0.2em',
              textShadow: '0 0 30px rgba(139, 0, 0, 0.5)',
            }}
          >
            CHRONICLES
          </h1>
          <p 
            className="text-amber-200/60 tracking-widest"
            style={{ fontFamily: '"Rye", serif', fontSize: '0.9rem' }}
          >
            SELECT YOUR AUTHOR
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-row flex-wrap justify-center gap-6 md:gap-8 lg:gap-10 pt-16"
        >
          {characters.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <TiltCard character={character} onSelect={handleSelect} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 text-center"
        >
          <p 
            className="text-amber-200/40 text-xs tracking-widest"
            style={{ fontFamily: 'serif' }}
          >
            Click on a character to view their notes
          </p>
        </motion.div>
      </div>

      <div 
        className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
        }}
      />
    </main>
  )
}

export default Notes
