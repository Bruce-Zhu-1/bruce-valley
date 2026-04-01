import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Volume2, VolumeX } from 'lucide-react'

const tracks = [
  '/music/overture.mp3'
]

function GlobalAudioPlayer() {
  const [userWantsPlaying, setUserWantsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const audioRef = useRef(null)
  const location = useLocation()
  
  const shouldPlay = userWantsPlaying && location.pathname !== '/games'
  
  useEffect(() => {
    if (audioRef.current) {
      if (shouldPlay) {
        audioRef.current.play().catch(() => {
          console.log('Auto-play prevented by browser')
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [shouldPlay])
  
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => {
        setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % tracks.length)
      }
      
      audio.addEventListener('ended', handleEnded)
      return () => audio.removeEventListener('ended', handleEnded)
    }
  }, [])
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = tracks[currentTrackIndex]
      if (shouldPlay) {
        audioRef.current.play().catch(() => {
          console.log('Auto-play prevented by browser')
        })
      }
    }
  }, [currentTrackIndex])
  
  const togglePlay = () => {
    setUserWantsPlaying((prev) => !prev)
  }
  
  return (
    <>
      <audio ref={audioRef} src={tracks[currentTrackIndex]} loop={true} />
      
      <button
        onClick={togglePlay}
        className="fixed bottom-6 right-6 z-[9999] bg-amber-800 border-4 border-amber-950 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] p-3 cursor-pointer hover:-translate-y-1 hover:bg-amber-700 transition-all"
        style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
        title={userWantsPlaying ? '暂停音乐' : '播放音乐'}
      >
        {userWantsPlaying ? (
          <Volume2 className="w-6 h-6 text-amber-100" />
        ) : (
          <VolumeX className="w-6 h-6 text-amber-100" />
        )}
      </button>
    </>
  )
}

export default GlobalAudioPlayer
