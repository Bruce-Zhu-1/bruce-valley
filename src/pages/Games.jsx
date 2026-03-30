import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import useSound from 'use-sound'

const gameLibrary = [
  { id: 'snake', name: 'SNAKE', path: '/games/snake/index.html', isReady: true },
  { id: 'tetris', name: 'TETRIS', path: '/games/tetris/index.html', isReady: true },
  { id: 'flappy', name: 'FLAPPY', path: '/games/floppybird/index.html', isReady: true },
  { id: 'dino', name: 'DINO RUN', path: '/games/dinorun/index.html', isReady: true },
]

function PixelSnake() {
  return (
    <div style={{ width: '48px', height: '48px', position: 'relative', margin: '0 auto' }}>
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#22c55e', top: '8px', left: '8px', boxShadow: '0 0 0 1px #166534' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#22c55e', top: '8px', left: '16px', boxShadow: '0 0 0 1px #166534' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#22c55e', top: '16px', left: '16px', boxShadow: '0 0 0 1px #166534' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#22c55e', top: '24px', left: '16px', boxShadow: '0 0 0 1px #166534' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#22c55e', top: '24px', left: '24px', boxShadow: '0 0 0 1px #166534' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#22c55e', top: '32px', left: '24px', boxShadow: '0 0 0 1px #166534' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#22c55e', top: '32px', left: '32px', boxShadow: '0 0 0 1px #166534' }} />
      <div style={{ position: 'absolute', width: '4px', height: '4px', background: '#fef08a', top: '10px', left: '10px' }} />
    </div>
  )
}

function PixelTetris() {
  return (
    <div style={{ width: '48px', height: '48px', position: 'relative', margin: '0 auto' }}>
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#a855f7', top: '8px', left: '16px', boxShadow: '0 0 0 1px #7c3aed' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#a855f7', top: '16px', left: '8px', boxShadow: '0 0 0 1px #7c3aed' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#a855f7', top: '16px', left: '16px', boxShadow: '0 0 0 1px #7c3aed' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#a855f7', top: '16px', left: '24px', boxShadow: '0 0 0 1px #7c3aed' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#f97316', top: '28px', left: '8px', boxShadow: '0 0 0 1px #ea580c' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#f97316', top: '28px', left: '16px', boxShadow: '0 0 0 1px #ea580c' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#f97316', top: '28px', left: '24px', boxShadow: '0 0 0 1px #ea580c' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#f97316', top: '36px', left: '24px', boxShadow: '0 0 0 1px #ea580c' }} />
    </div>
  )
}

function PixelBird() {
  return (
    <div style={{ width: '48px', height: '48px', position: 'relative', margin: '0 auto' }}>
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#fbbf24', top: '16px', left: '12px', boxShadow: '0 0 0 1px #d97706' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#fbbf24', top: '16px', left: '20px', boxShadow: '0 0 0 1px #d97706' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#fbbf24', top: '16px', left: '28px', boxShadow: '0 0 0 1px #d97706' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#fbbf24', top: '24px', left: '12px', boxShadow: '0 0 0 1px #d97706' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#fbbf24', top: '24px', left: '20px', boxShadow: '0 0 0 1px #d97706' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#fbbf24', top: '24px', left: '28px', boxShadow: '0 0 0 1px #d97706' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#fef08a', top: '24px', left: '36px', boxShadow: '0 0 0 1px #ca8a04' }} />
      <div style={{ position: 'absolute', width: '4px', height: '4px', background: '#1f2937', top: '18px', left: '30px' }} />
      <div style={{ position: 'absolute', width: '8px', height: '4px', background: '#f97316', top: '28px', left: '36px' }} />
    </div>
  )
}

function PixelDino() {
  return (
    <div style={{ width: '48px', height: '48px', position: 'relative', margin: '0 auto' }}>
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#6b7280', top: '8px', left: '20px', boxShadow: '0 0 0 1px #374151' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#6b7280', top: '8px', left: '28px', boxShadow: '0 0 0 1px #374151' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#6b7280', top: '16px', left: '12px', boxShadow: '0 0 0 1px #374151' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#6b7280', top: '16px', left: '20px', boxShadow: '0 0 0 1px #374151' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#6b7280', top: '16px', left: '28px', boxShadow: '0 0 0 1px #374151' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#6b7280', top: '24px', left: '12px', boxShadow: '0 0 0 1px #374151' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#6b7280', top: '24px', left: '20px', boxShadow: '0 0 0 1px #374151' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#6b7280', top: '32px', left: '12px', boxShadow: '0 0 0 1px #374151' }} />
      <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#6b7280', top: '32px', left: '28px', boxShadow: '0 0 0 1px #374151' }} />
      <div style={{ position: 'absolute', width: '4px', height: '4px', background: '#fef08a', top: '10px', left: '22px' }} />
    </div>
  )
}

function getPixelIcon(id) {
  switch (id) {
    case 'snake': return <PixelSnake />
    case 'tetris': return <PixelTetris />
    case 'flappy': return <PixelBird />
    case 'dino': return <PixelDino />
    default: return null
  }
}

function CartridgeCard({ game, onSelect, playSelect }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const handleClick = () => {
    if (game.isReady) {
      playSelect()
      onSelect(game)
    }
  }
  
  return (
    <motion.div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={game.isReady ? { 
        scale: 1.05,
        rotate: [0, -1, 1, -1, 1, 0],
        transition: { rotate: { repeat: Infinity, duration: 0.3 } }
      } : {}}
      whileTap={game.isReady ? { scale: 0.95 } : {}}
      style={{
        position: 'relative',
        cursor: game.isReady ? 'pointer' : 'not-allowed',
        opacity: game.isReady ? 1 : 0.5,
      }}
    >
      <div style={{
        background: 'rgba(254, 243, 199, 0.08)',
        border: '4px solid rgba(120, 53, 15, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '6px',
        padding: '24px 16px',
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isHovered && game.isReady 
          ? '0 0 20px rgba(254, 243, 199, 0.2), inset 0 0 15px rgba(254, 243, 199, 0.05)'
          : 'inset 0 0 10px rgba(0, 0, 0, 0.3)',
        transition: 'box-shadow 0.3s ease',
      }}>
        <div style={{
          filter: isHovered && game.isReady 
            ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))' 
            : 'none',
          transition: 'filter 0.2s ease',
        }}>
          {getPixelIcon(game.id)}
        </div>
        
        <h3 style={{
          fontFamily: '"Press Start 2P", Courier New, monospace',
          fontSize: '0.65rem',
          color: game.isReady ? '#fef3c7' : '#78350f',
          letterSpacing: '0.15em',
          textAlign: 'center',
          marginTop: '16px',
          textShadow: '1px 1px 0 #451a03',
        }}>
          {game.name}
        </h3>
        
        <p style={{
          fontFamily: '"Press Start 2P", Courier New, monospace',
          fontSize: '0.35rem',
          color: isHovered 
            ? (game.isReady ? '#fbbf24' : '#78350f')
            : 'rgba(120, 53, 15, 0.6)',
          letterSpacing: '0.1em',
          textAlign: 'center',
          marginTop: '12px',
          transition: 'color 0.2s ease',
        }}>
          {game.isReady 
            ? (isHovered ? '► READY TO PLAY' : 'INSERT CARTRIDGE')
            : 'COMING SOON'}
        </p>
        
        {game.isReady && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            background: isHovered ? '#22c55e' : '#166534',
            borderRadius: '50%',
            boxShadow: isHovered ? '0 0 8px #22c55e' : 'none',
            transition: 'all 0.2s ease',
          }} />
        )}
      </div>
    </motion.div>
  )
}

function CartridgeGrid({ onSelectGame, playSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '24px',
        maxWidth: '500px',
        width: '100%',
        padding: '0 16px',
      }}
    >
      {gameLibrary.map((game, index) => (
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <CartridgeCard game={game} onSelect={onSelectGame} playSelect={playSelect} />
        </motion.div>
      ))}
    </motion.div>
  )
}

function GameOverlay({ game, onEject, iframeRef, playClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4"
    >
      <motion.button
        onClick={() => { playClick(); onEject(); }}
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
        className="mb-6 px-7 py-3.5 bg-amber-900/90 border-[3px] border-amber-700 cursor-pointer"
        style={{
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(254, 243, 199, 0.2), 0 4px 12px rgba(0, 0, 0, 0.4)',
        }}
      >
        <span 
          className="font-pixel text-[0.6rem] text-amber-50 tracking-[0.15em]"
          style={{
            fontFamily: '"Press Start 2P", Courier New, monospace',
            textShadow: '0 0 10px rgba(254, 243, 199, 0.5)',
          }}
        >
          ◄ EJECT CARTRIDGE
        </span>
      </motion.button>
      
      <div className="w-full max-w-5xl h-[75vh] min-h-[500px] border-4 border-amber-800/80 bg-black rounded-lg overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <iframe 
          ref={iframeRef}
          src={game.path}
          className="w-full h-full border-none"
          style={{ display: 'block' }}
          title={game.name}
          allow="fullscreen"
          onLoad={() => iframeRef.current?.focus()}
        />
      </div>
      
      <p 
        className="font-pixel text-[0.45rem] text-amber-50/60 tracking-[0.15em] text-center mt-5"
        style={{
          fontFamily: '"Press Start 2P", Courier New, monospace',
        }}
      >
        NOW PLAYING: {game.name}
      </p>
    </motion.div>
  )
}

function Games() {
  const [activeGame, setActiveGame] = useState(null)
  const iframeRef = useRef(null)
  const [playSelect] = useSound('/music/sfx/select.mp3', { volume: 0.5 })
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })
  
  useEffect(() => {
    if (activeGame !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [activeGame])
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2 }}
        style={{
          minHeight: '100vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '40px 20px',
        }}
      >
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: -1,
        }} />
        
        <div className="absolute top-6 left-6 z-50">
          <Link 
            to="/" 
            onClick={playClick}
            className="relative z-50 inline-flex items-center px-4 py-2 mt-8 mb-6 font-pixel text-amber-100 bg-amber-800 border-4 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
          >
            <span className="mr-2">◄</span> BACK TO VALLEY
          </Link>
        </div>
        
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            textAlign: 'center',
            marginBottom: '40px',
            marginTop: '60px',
          }}
        >
          <h1 style={{
            fontFamily: '"Press Start 2P", Courier New, monospace',
            fontSize: 'clamp(1.2rem, 4vw, 2rem)',
            color: '#fef3c7',
            letterSpacing: '0.15em',
            textShadow: '2px 2px 0 #78350f, 4px 4px 0 #451a03, 0 0 30px rgba(254, 243, 199, 0.3)',
          }}>
            FARM ARCADE
          </h1>
          
          <p style={{
            fontFamily: '"Press Start 2P", Courier New, monospace',
            fontSize: '0.5rem',
            color: '#d97706',
            letterSpacing: '0.2em',
            marginTop: '12px',
          }}>
            SELECT YOUR CARTRIDGE
          </p>
        </motion.div>
        
        <CartridgeGrid onSelectGame={setActiveGame} playSelect={playSelect} />
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            fontFamily: '"Press Start 2P", Courier New, monospace',
            fontSize: '0.35rem',
            color: 'rgba(254, 243, 199, 0.4)',
            letterSpacing: '0.15em',
            textAlign: 'center',
            marginTop: '32px',
          }}
        >
          CLICK A CARTRIDGE TO START PLAYING
        </motion.p>
      </motion.div>
      
      <AnimatePresence>
        {activeGame !== null && (
          <GameOverlay 
            key="overlay"
            game={activeGame} 
            onEject={() => setActiveGame(null)}
            iframeRef={iframeRef}
            playClick={playClick}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Games
