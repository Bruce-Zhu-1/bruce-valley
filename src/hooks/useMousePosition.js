import { useEffect, useState } from 'react'

function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [normalizedPosition, setNormalizedPosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event
      const { innerWidth, innerHeight } = window
      
      setMousePosition({ x: clientX, y: clientY })
      setNormalizedPosition({
        x: (clientX / innerWidth) * 2 - 1,
        y: -(clientY / innerHeight) * 2 + 1,
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])
  
  return {
    mousePosition,
    normalizedPosition,
  }
}

export default useMousePosition
