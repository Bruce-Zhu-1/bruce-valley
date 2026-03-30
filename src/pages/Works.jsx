import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useSound from 'use-sound'

const domainData = [
  {
    id: 'learning',
    title: 'Tech & Learning',
    avatar: '/roles/learning.png',
    role: 'Senior Digital Farmer',
    skills: [
      { name: 'Frontend (Farming)', level: 5 },
      { name: 'Backend (Mining)', level: 4 },
      { name: 'Design (Foraging)', level: 4 },
      { name: 'DevOps (Fishing)', level: 3 },
      { name: 'Database (Combat)', level: 3 },
    ],
    projects: [
      { 
        id: 1, 
        title: 'Bruce Hub', 
        type: 'Epic Quest', 
        tech: 'React / Tailwind / Three.js', 
        desc: 'My personal digital lifeform & farm terminal. A Stardew-inspired portfolio with 3D interactions.', 
        link: 'https://github.com' 
      },
      { 
        id: 2, 
        title: 'AI Assistant Bot', 
        type: 'Main Quest', 
        tech: 'React / Gemini API', 
        desc: 'A digital lifeform powered by Gemini. Chat interface with warm, helpful personality.', 
        link: '#' 
      },
      { 
        id: 3, 
        title: 'WebGL Experiments', 
        type: 'Side Quest', 
        tech: 'Three.js / GLSL', 
        desc: 'Creative coding experiments with shaders and 3D graphics for interactive experiences.', 
        link: '#' 
      },
    ],
  },
  {
    id: 'gaming',
    title: 'Gaming Adventures',
    avatar: '/roles/player.png',
    role: 'Arcade Challenger',
    skills: [
      { name: 'Reaction Speed', level: 5 },
      { name: 'Strategy (Tactics)', level: 4 },
      { name: 'FPS (Combat)', level: 4 },
      { name: 'Puzzle Solving', level: 5 },
      { name: 'RPG Grinding', level: 3 },
    ],
    projects: [
      { 
        id: 1, 
        title: 'Tetris Arcade', 
        type: 'Epic Quest', 
        tech: 'Vanilla JS / Canvas', 
        desc: 'A retro block puzzle integration in the farm arcade. Classic gameplay with pixel aesthetics.', 
        link: '#' 
      },
      { 
        id: 2, 
        title: 'Snake Adventure', 
        type: 'Side Quest', 
        tech: 'Vanilla JS', 
        desc: 'The classic snake game reimagined with farm-themed graphics and smooth controls.', 
        link: '#' 
      },
      { 
        id: 3, 
        title: 'Flappy Bird Clone', 
        type: 'Side Quest', 
        tech: 'Vanilla JS', 
        desc: 'A pixel-art recreation of the infamous bird game. Simple yet addictive mechanics.', 
        link: '#' 
      },
      { 
        id: 4, 
        title: 'Dino Run', 
        type: 'Side Quest', 
        tech: 'Vanilla JS', 
        desc: 'Endless runner featuring a pixel dinosaur. Jump over obstacles and survive!', 
        link: '#' 
      },
    ],
  },
  {
    id: 'life',
    title: 'Life & Memories',
    avatar: '/roles/life.png',
    role: 'Valley Wanderer',
    skills: [
      { name: 'Photography', level: 4 },
      { name: 'Cooking (Recipes)', level: 3 },
      { name: 'Travel (Exploring)', level: 4 },
      { name: 'Music (Festivals)', level: 3 },
      { name: 'Writing (Journals)', level: 4 },
    ],
    projects: [
      { 
        id: 1, 
        title: 'Travel Journal', 
        type: 'Epic Quest', 
        tech: 'Photos & Stories', 
        desc: 'Documenting adventures across different valleys and cities. Memories preserved in pixels.', 
        link: '#' 
      },
      { 
        id: 2, 
        title: 'Photo Gallery', 
        type: 'Main Quest', 
        tech: 'Digital Photography', 
        desc: 'A collection of moments captured through the lens. From sunsets to city lights.', 
        link: '#' 
      },
      { 
        id: 3, 
        title: 'Recipe Collection', 
        type: 'Side Quest', 
        tech: 'Home Cooking', 
        desc: 'Favorite recipes discovered during farm life. From simple dishes to gourmet experiments.', 
        link: '#' 
      },
    ],
  },
]

function SkillBar({ skill }) {
  const stars = []
  for (let i = 0; i < 5; i++) {
    stars.push(
      <span 
        key={i} 
        className={`text-lg ${i < skill.level ? 'text-yellow-500' : 'text-slate-300'}`}
        style={{ 
          fontFamily: '"Press Start 2P", Courier New, monospace',
          textShadow: i < skill.level ? '0 0 4px rgba(234, 179, 8, 0.6)' : 'none'
        }}
      >
        ★
      </span>
    )
  }
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-amber-900/20 last:border-0">
      <span 
        className="text-[#4a3018] text-[0.5rem]"
        style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
      >
        {skill.name}
      </span>
      <div className="flex gap-1">{stars}</div>
    </div>
  )
}

function ProjectCard({ project, index, playClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
      className="bg-amber-100/60 border-2 border-amber-900/50 p-4 mb-4 group hover:-translate-y-1 hover:bg-amber-200/80 transition-all cursor-pointer relative"
      style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-amber-950 text-[0.65rem] font-bold leading-relaxed flex-1 pr-2">
          {project.title}
        </h3>
        <span className={`px-2 py-1 text-[0.4rem] ${
          project.type === 'Epic Quest' 
            ? 'bg-red-600 text-white' 
            : project.type === 'Main Quest'
            ? 'bg-amber-600 text-white'
            : 'bg-slate-500 text-white'
        }`}>
          {project.type.toUpperCase()}
        </span>
      </div>
      
      <p className="text-amber-800 text-[0.45rem] mb-2">
        {project.tech}
      </p>
      
      <p className="text-[#4a3018] text-[0.5rem] leading-relaxed mb-3">
        {project.desc}
      </p>
      
      <div className="flex justify-end">
        <a 
          href={project.link} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={playClick}
          className="px-3 py-1.5 bg-amber-800 text-amber-100 text-[0.45rem] border-2 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-0.5 transition-all inline-block"
        >
          VIEW QUEST ➡
        </a>
      </div>
    </motion.div>
  )
}

function Works() {
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0)
  const currentDomain = domainData[currentDomainIndex]
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })
  
  const goToPrevDomain = () => {
    if (currentDomainIndex > 0) {
      playClick()
      setCurrentDomainIndex(prev => prev - 1)
    }
  }
  
  const goToNextDomain = () => {
    if (currentDomainIndex < domainData.length - 1) {
      playClick()
      setCurrentDomainIndex(prev => prev + 1)
    }
  }
  
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
          onClick={playClick}
          className="relative z-50 inline-flex items-center px-4 py-2 mt-8 mb-6 font-pixel text-amber-100 bg-amber-800 border-4 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
        >
          <span className="mr-2">◄</span> BACK TO VALLEY
        </Link>
      </div>
      
      <div className="fixed inset-0 z-10 flex items-center justify-center p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-6xl h-[80vh] min-h-[600px] mx-auto flex flex-col md:flex-row relative z-20 bg-[#f4e4bc] border-4 border-[#8b5a2b] shadow-[20px_20px_0px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden"
        >
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDomain.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col md:flex-row w-full h-full"
            >
              
              <div className="w-full md:w-[40%] px-8 pt-12 pb-24 flex flex-col gap-6 overflow-y-auto h-full overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#fcf3d9]/50">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="flex items-center gap-4"
                >
                  <div className="bg-white p-2 border-2 border-slate-200 shadow-md rotate-[-2deg]">
                    <img 
                      src={currentDomain.avatar} 
                      className="w-24 h-24 object-cover"
                      style={{ imageRendering: 'pixelated' }}
                      alt="Avatar" 
                    />
                  </div>
                  <div>
                    <h2 
                      className="text-amber-950 text-lg font-bold mb-1"
                      style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
                    >
                      Bruce
                    </h2>
                    <p 
                      className="text-amber-800 text-[0.45rem]"
                      style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
                    >
                      {currentDomain.role}
                    </p>
                  </div>
                </motion.div>
                
                <div className="border-t-4 border-[#8b5a2b]/30 pt-6">
                  <h3 
                    className="text-amber-950 text-[0.6rem] mb-4"
                    style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
                  >
                    SKILLS
                  </h3>
                  <div className="space-y-1">
                    {currentDomain.skills.map((skill, index) => (
                      <motion.div
                        key={skill.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + index * 0.08, duration: 0.3 }}
                      >
                        <SkillBar skill={skill} />
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t-4 border-[#8b5a2b]/30">
                  <p 
                    className="text-amber-800/60 text-[0.35rem] text-center"
                    style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
                  >
                    FARMING SINCE 2020
                  </p>
                </div>
              </div>
              
              <div className="hidden md:block w-[4px] bg-gradient-to-b from-transparent via-amber-900/20 to-transparent shadow-[inset_10px_0_10px_rgba(0,0,0,0.05)]" />
              
              <div className="w-full md:w-[60%] px-8 pt-12 pb-24 overflow-y-auto h-full overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#f4e4bc]/80">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <h2 
                    className="text-amber-950 text-[0.85rem] mb-2"
                    style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
                  >
                    {currentDomain.title}
                  </h2>
                  <div className="h-1 bg-gradient-to-r from-[#8b5a2b] via-[#8b5a2b]/50 to-transparent mb-6" />
                </motion.div>
                
                <div className="space-y-4">
                  {currentDomain.projects.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} playClick={playClick} />
                  ))}
                </div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="mt-8 pt-4 border-t-4 border-[#8b5a2b]/30 text-center"
                >
                  <p 
                    className="text-amber-800/60 text-[0.35rem]"
                    style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
                  >
                    MORE QUESTS COMING SOON...
                  </p>
                </motion.div>
              </div>
              
            </motion.div>
          </AnimatePresence>
          
          {currentDomainIndex > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={goToPrevDomain}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-4 px-4 py-3 bg-amber-800 text-amber-100 border-4 border-amber-950 shadow-lg hover:-translate-y-1 hover:bg-amber-700 transition-all z-30"
              style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.5rem' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
          
          {currentDomainIndex < domainData.length - 1 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={goToNextDomain}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-4 px-4 py-3 bg-amber-800 text-amber-100 border-4 border-amber-950 shadow-lg hover:-translate-y-1 hover:bg-amber-700 transition-all z-30"
              style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.5rem' }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
          
        </motion.div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {domainData.map((domain, index) => (
            <button
              key={domain.id}
              onClick={() => { playClick(); setCurrentDomainIndex(index); }}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentDomainIndex 
                  ? 'bg-amber-600 scale-125' 
                  : 'bg-amber-900/30 hover:bg-amber-700/50'
              }`}
              style={{
                boxShadow: index === currentDomainIndex ? '0 0 8px rgba(217, 119, 6, 0.6)' : 'none'
              }}
            />
          ))}
        </div>
        
      </div>
    </main>
  )
}

export default Works
