import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
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
import GlobalBackground from './components/GlobalBackground'
import GlobalAudioPlayer from './components/GlobalAudioPlayer'
import Preloader from './components/Preloader'
import CustomCursor from './components/CustomCursor'

function App() {
  const location = useLocation()
  
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
