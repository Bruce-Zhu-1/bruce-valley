import { useState, useEffect } from 'react'

const images = [
  '/background/1.jpg',
  '/background/2.jpg',
  '/background/3.jpg',
  '/background/4.jpg',
  '/background/5.jpg',
  '/background/6.jpg',
  '/background/7.jpg',
  '/background/8.jpg'
]

function GlobalBackground() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="fixed inset-0 z-[-1] bg-black">
      {images.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[5000ms] ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${image})`,
          }}
        />
      ))}
    </div>
  )
}

export default GlobalBackground
