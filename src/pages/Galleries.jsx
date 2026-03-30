import { Link } from 'react-router-dom'

function Galleries() {
  return (
    <main className="relative min-h-screen">
      <div className="fixed inset-0 z-[-1]" style={{
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.5) 100%)',
      }} />
      
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0px, rgba(0, 0, 0, 0.03) 1px, transparent 1px, transparent 2px)',
      }} />
      
      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/" 
          className="relative z-50 inline-flex items-center px-4 py-2 mt-8 mb-6 font-pixel text-amber-100 bg-amber-800 border-4 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
        >
          <span className="mr-2">◄</span> BACK TO VALLEY
        </Link>
      </div>
      
      <section className="relative z-10 flex flex-col justify-center items-center min-h-screen px-6 py-10">
        <h1 style={{
          fontSize: 'clamp(1.5rem, 5vw, 3rem)',
          fontWeight: 'bold',
          color: '#FFFFFF',
          letterSpacing: '0.15em',
          marginBottom: '16px',
          fontFamily: '"Press Start 2P", Courier New, monospace',
          textShadow: '0 0 20px rgba(78, 205, 196, 0.8)',
          textAlign: 'center',
        }}>
          GALLERIES
        </h1>
        <p style={{
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.6)',
          letterSpacing: '0.2em',
          fontFamily: '"Press Start 2P", Courier New, monospace',
          textAlign: 'center',
        }}>
          建设中...
        </p>
      </section>
    </main>
  )
}

export default Galleries
