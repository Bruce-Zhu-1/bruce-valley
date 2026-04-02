import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import Home from './pages/Home'
import Diaries from './pages/Diaries'
import DiaryDetail from './pages/DiaryDetail'
import Galleries from './pages/Galleries'
import Works from './pages/Works'
import Guest from './pages/Guest'
import Agent from './pages/Agent'
import Games from './pages/Games'
import Team from './pages/Team'
import Notes from './pages/Notes'
import NotesAuthor from './pages/NotesAuthor'
import NotesArticle from './pages/NotesArticle'
import Hide from './pages/Hide'
import Hide2 from './pages/Hide2'
import Hide3 from './pages/Hide3'
import GlobalBackground from './components/GlobalBackground'
import GlobalAudioPlayer from './components/GlobalAudioPlayer'
import Preloader from './components/Preloader'
import CustomCursor from './components/CustomCursor'

function App() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let inputSequence = ''
    const targetSequence = 'tsy'

    const handleKeyDown = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : ''
      
      if (key) {
        inputSequence += key

        if (inputSequence.length > 10) {
          inputSequence = inputSequence.slice(-10)
        }

        if (inputSequence.endsWith(targetSequence)) {
          navigate('/hide2')
          inputSequence = ''
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/diaries" element={<Diaries />} />
        <Route path="/diaries/:id" element={<DiaryDetail />} />
        <Route path="/galleries" element={<Galleries />} />
        <Route path="/works" element={<Works />} />
        <Route path="/guest" element={<Guest />} />
        <Route path="/agent" element={<Agent />} />
        <Route path="/games" element={<Games />} />
        <Route path="/team" element={<Team />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/:author" element={<NotesAuthor />} />
        <Route path="/notes/:author/:articleId" element={<NotesArticle />} />
        <Route path="/hide" element={<Hide />} />
        <Route path="/hide2" element={<Hide2 />} />
        <Route path="/hide3" element={<Hide3 />} />
      </Routes>
    </AnimatePresence>
  )
}

function AppWrapper() {
  return (
    <>
      <Preloader />
      <CustomCursor />
      <BrowserRouter>
        <GlobalBackground />
        <App />
        <GlobalAudioPlayer />
      </BrowserRouter>
    </>
  )
}

export default AppWrapper
