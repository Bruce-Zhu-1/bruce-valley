import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import useSound from 'use-sound'
import HomeCanvas from '../components/HomeCanvas'
import '../index.css'

const menuItems = [
  { id: 'notes', src: '/UI/notes_btn.png', path: '/notes', alt: 'Notes' },
  { id: 'works', src: '/UI/works_btn.png', path: '/works', alt: 'Works' },
  { id: 'guest', src: '/UI/guest_btn.png', path: '/guest', alt: 'Guest' },
  { id: 'agent', src: '/UI/bot_btn.png', path: '/agent', alt: 'Agent' },
]

const extraItems = [
  { id: 'team', label: 'THE CREW', path: '/team' },
]

function MenuButton({ item, playSelect }) {
  return (
    <Link to={item.path} style={{ textDecoration: 'none', display: 'block' }}>
      <motion.div
        whileHover={{ scale: 1.1, y: -8 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        onClick={playSelect}
        style={{
          position: 'relative',
          cursor: 'pointer',
          imageRendering: 'pixelated',
        }}
      >
        <img
          src={item.src}
          alt={item.alt}
          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '180px',
            minWidth: '120px',
            display: 'block',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6))',
            transition: 'filter 0.25s ease',
          }}
          className="stardew-btn"
        />
      </motion.div>
    </Link>
  )
}

function Home() {
  const [playSelect] = useSound('/music/sfx/select.mp3', { volume: 0.5 })
  
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}
    >
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.15) 40%, transparent 100%)',
        zIndex: -1,
      }} />
      
      <HomeCanvas />
      
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 'clamp(80px, 12vh, 120px)',
        paddingBottom: '40px',
        overflowY: 'auto',
      }}>
        
        <motion.div
          initial={{ y: '-100vh', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100vh', opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginBottom: 'clamp(80px, 15vh, 140px)',
          }}
        >
          <Link to="/games" style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={playSelect}
              style={{
                cursor: 'pointer',
              }}
              className="title-link"
            >
              <img
                src="/UI/title.png"
                alt="BRUCE'S VALLEY"
                className="floating-title"
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: 'min(90vw, 720px)',
                  minWidth: '320px',
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 40px rgba(255, 200, 100, 0.35))',
                }}
              />
            </motion.div>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ y: '100vh', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100vh', opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'clamp(16px, 4vw, 40px)',
            flexWrap: 'wrap',
            maxWidth: '1200px',
            padding: '0 20px',
          }}
        >
          {menuItems.map((item) => (
            <MenuButton key={item.id} item={item} playSelect={playSelect} />
          ))}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          style={{
            marginTop: 'clamp(30px, 5vh, 60px)',
          }}
        >
          {extraItems.map((item) => (
            <Link 
              key={item.id} 
              to={item.path} 
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={playSelect}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #8b0000 0%, #5c0000 100%)',
                  border: '3px solid #f4e4bc',
                  boxShadow: '4px 4px 0 rgba(0, 0, 0, 0.8), 0 0 20px rgba(139, 0, 0, 0.5)',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  fontFamily: '"Rye", serif',
                  fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
                  color: '#f4e4bc',
                  letterSpacing: '0.2em',
                  textShadow: '2px 2px 0 rgba(0, 0, 0, 0.8)',
                }}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </motion.div>
        
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        .floating-title {
          animation: float 5s ease-in-out infinite;
        }
        
        .stardew-btn:hover {
          filter: 
            drop-shadow(0 0 10px rgba(255, 215, 0, 0.95)) 
            drop-shadow(0 0 20px rgba(255, 200, 50, 0.75))
            drop-shadow(0 0 30px rgba(255, 180, 0, 0.55))
            drop-shadow(0 0 40px rgba(255, 160, 0, 0.35))
            drop-shadow(0 10px 20px rgba(0, 0, 0, 0.7)) !important;
        }
        
        .title-link:hover img {
          filter: 
            drop-shadow(0 0 15px rgba(255, 215, 0, 0.9)) 
            drop-shadow(0 0 30px rgba(255, 200, 100, 0.7))
            drop-shadow(0 10px 25px rgba(0, 0, 0, 0.8)) !important;
        }
      `}</style>
    </motion.main>
  )
}

export default Home
