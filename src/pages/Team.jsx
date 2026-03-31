import { Link } from 'react-router-dom'
import TeamDisplay from '../components/TeamDisplay'
import useSound from 'use-sound'

function Team() {
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })

  return (
    <main className="relative min-h-screen">
      <TeamDisplay />
      
      <div className="absolute top-6 left-6 z-[100]">
        <Link 
          to="/" 
          onClick={playClick}
          className="inline-flex items-center px-4 py-2 mt-8 mb-6 font-pixel text-amber-100 bg-amber-800 border-4 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
        >
          <span className="mr-2">◄</span> BACK TO VALLEY
        </Link>
      </div>
    </main>
  )
}

export default Team
