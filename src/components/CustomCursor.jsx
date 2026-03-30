import { useEffect } from 'react'
import { motion, useMotionValue } from 'framer-motion'

function CustomCursor() {
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)
  
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
    
    if (isMobile) return
    
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [mouseX, mouseY])
  
  return (
    <>
      <style>{`* { cursor: none !important; }`}</style>
      <motion.img
        src="/cursor/2.png"
        className="fixed top-0 left-0 w-8 h-8 z-[100000] pointer-events-none object-contain drop-shadow-md"
        style={{
          x: mouseX,
          y: mouseY,
        }}
      />
    </>
  )
}

export default CustomCursor
