import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  Home, 
  BookOpen, 
  Image, 
  Briefcase, 
  Bot, 
  MessageSquare,
  Menu,
  X
} from 'lucide-react'
import { NAV_ITEMS } from '../../utils/constants'
import styles from './Navbar.module.css'

const iconMap = {
  Home,
  BookOpen,
  Image,
  Briefcase,
  Bot,
  MessageSquare,
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])
  
  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'tween',
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }
    },
  }
  
  const linkVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        type: 'tween',
        duration: 0.2,
      },
    }),
  }
  
  const mobileMenuVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      transition: {
        duration: 0.3,
      }
    },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }
    },
  }
  
  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-pixel-black/95 backdrop-blur-sm border-b border-pixel-green' 
          : 'bg-pixel-black'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink 
            to="/" 
            className="flex items-center gap-3 group"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-pixel-green flex items-center justify-center"
              style={{ imageRendering: 'pixelated' }}
            >
              <span className="text-pixel-black font-pixel text-sm font-bold">B</span>
            </motion.div>
            <span className={`font-pixel text-xs hidden sm:block ${styles.logoText}`}>
              BRUCE'S WORLD
            </span>
          </NavLink>
          
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item, index) => {
              const Icon = iconMap[item.icon]
              const isActive = location.pathname === item.path
              
              return (
                <motion.div
                  key={item.path}
                  custom={index}
                  variants={linkVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <NavLink
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 font-pixel text-[10px] uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'text-pixel-green bg-pixel-green-deep border border-pixel-green'
                        : 'text-pixel-white-dim hover:text-pixel-green hover:bg-pixel-green-deep/50'
                    }`}
                  >
                    {Icon && <Icon size={14} />}
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-pixel-green"
                      />
                    )}
                  </NavLink>
                </motion.div>
              )
            })}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center border-2 border-pixel-green text-pixel-green hover:bg-pixel-green hover:text-pixel-black transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="md:hidden bg-pixel-black border-t border-pixel-green overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4">
              {NAV_ITEMS.map((item, index) => {
                const Icon = iconMap[item.icon]
                const isActive = location.pathname === item.path
                
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NavLink
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 font-pixel text-xs uppercase tracking-wider transition-all duration-200 ${
                        isActive
                          ? 'text-pixel-green bg-pixel-green-deep border-l-4 border-pixel-green'
                          : 'text-pixel-white-dim hover:text-pixel-green hover:bg-pixel-green-deep/30'
                      }`}
                    >
                      {Icon && <Icon size={16} />}
                      <span>{item.label}</span>
                    </NavLink>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
