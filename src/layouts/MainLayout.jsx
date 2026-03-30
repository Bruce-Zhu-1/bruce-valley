import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Loading from '../components/common/Loading'
import useAppStore from '../stores/useAppStore'

function MainLayout() {
  const { isLoading } = useAppStore()
  
  return (
    <div className="relative min-h-screen bg-pixel-black">
      <div className="noise-overlay" />
      
      {isLoading && <Loading fullScreen />}
      
      <Navbar />
      
      <main className="relative z-10 pt-16">
        <Outlet />
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-pixel-black border-t border-pixel-green-deep py-2">
        <div className="container mx-auto px-4">
          <p className="text-center text-pixel-green text-[8px] font-pixel">
            © 2024 BRUCE'S WORLD | POWERED BY PIXELS & PASSION
          </p>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
