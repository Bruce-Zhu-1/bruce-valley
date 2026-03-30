import { useState, useEffect, useRef, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations, Bounds, OrbitControls } from '@react-three/drei'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import { generateAIResponseStream, isAIConfigured } from '../services/ai'
import useSound from 'use-sound'

function RobotModel() {
  const group = useRef()
  const { scene, animations } = useGLTF('/robot1.glb')
  const { actions, names } = useAnimations(animations, group)
  
  useEffect(() => {
    if (actions && names.length > 0) {
      const firstAction = actions[names[0]]
      if (firstAction) {
        firstAction.reset().fadeIn(0.5).play()
      }
    }
    
    return () => {
      if (actions && names.length > 0) {
        actions[names[0]]?.fadeOut(0.5)
      }
    }
  }, [actions, names])
  
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

function TypewriterText({ text, speed = 50 }) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])
  
  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
  }, [text])
  
  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <span 
          className="inline-block w-2 h-4 ml-1 bg-amber-900"
          style={{ animation: 'blink 1s infinite' }}
        />
      )}
    </span>
  )
}

function Agent() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const messagesEndRef = useRef(null)
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    setIsConfigured(isAIConfigured())
    
    if (isAIConfigured()) {
      setMessages([
        {
          role: 'assistant',
          content: '你好啊，我叫Bruci，是Bruce的赛博生命。你想问我些什么呢？',
          timestamp: new Date().toISOString()
        }
      ])
    } else {
      setMessages([
        {
          role: 'system',
          content: '⚠️ API Key 未配置。请在项目根目录的 .env 文件中设置 VITE_GEMINI_API_KEY。',
          timestamp: new Date().toISOString()
        }
      ])
    }
  }, [])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputValue.trim() || isLoading || !isConfigured) return
    
    const userMessage = inputValue.trim()
    setInputValue('')
    
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    
    const emptyAIMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, newUserMessage, emptyAIMessage])
    setIsLoading(true)
    
    try {
      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content
        }))
      
      const stream = generateAIResponseStream(userMessage, conversationHistory)
      let fullResponse = ''
      
      for await (const chunk of stream) {
        if (chunk.success && chunk.text) {
          fullResponse += chunk.text
          setMessages(prev => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage.role === 'assistant') {
              lastMessage.content = fullResponse
            }
            return newMessages
          })
          scrollToBottom()
        }
        
        if (chunk.done && !chunk.success) {
          setMessages(prev => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage.role === 'assistant') {
              lastMessage.content = chunk.error || '抱歉，发生了错误。请稍后再试。'
              lastMessage.role = 'error'
            }
            return newMessages
          })
        }
      }
    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage.role === 'assistant') {
          lastMessage.content = '网络错误，请检查连接后重试。'
          lastMessage.role = 'error'
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <main className="relative min-h-screen">
      <div className="fixed inset-0 z-[1]" style={{
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.5) 100%)',
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
      
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-6xl h-[75vh] min-h-[500px] mx-auto flex flex-row items-stretch justify-center bg-black/30 backdrop-blur-sm rounded-lg relative z-20 overflow-hidden border-4 border-[#8b5a2b]/50 shadow-2xl">
          
          <div className="w-2/5 flex flex-col bg-[#fcf3d9]/95 border-r-4 border-[#8b5a2b]">
            <div className="flex-1 min-h-[280px]">
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                dpr={[1, 2]}
              >
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
                <Suspense fallback={null}>
                  <Bounds fit clip observe margin={1.2}>
                    <RobotModel />
                  </Bounds>
                </Suspense>
                <OrbitControls 
                  enableZoom={false} 
                  enablePan={false}
                  minPolarAngle={Math.PI / 4}
                  maxPolarAngle={Math.PI / 1.8}
                  makeDefault 
                />
              </Canvas>
            </div>
            
            <div className="p-6 text-center border-t-4 border-[#8b5a2b]/30 bg-[#f4e4bc]/50">
              <h2 
                className="text-[#4a3018] mb-3"
                style={{
                  fontSize: '0.85rem',
                  fontFamily: '"Press Start 2P", Courier New, monospace',
                  letterSpacing: '0.12em',
                }}
              >
                <TypewriterText text="BRUCE'S AI ASSISTANT" speed={80} />
              </h2>
              <p 
                className="text-amber-800/70"
                style={{
                  fontSize: '0.45rem',
                  fontFamily: '"Press Start 2P", Courier New, monospace',
                  letterSpacing: '0.2em',
                }}
              >
                POWERED BY GEMINI
              </p>
            </div>
          </div>
          
          <div className="w-3/5 flex flex-col bg-[#fcf3d9]/90">
            
            <div className="p-5 border-b-4 border-[#8b5a2b]/30 bg-[#f4e4bc]/60">
              <h3 
                className="text-amber-950 flex items-center gap-3"
                style={{
                  fontSize: '0.75rem',
                  fontFamily: '"Press Start 2P", Courier New, monospace',
                  letterSpacing: '0.12em',
                }}
              >
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                Q&A TERMINAL
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px]">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 ${
                      message.role === 'user'
                        ? 'bg-amber-800 text-amber-100 border-2 border-amber-950 rounded-sm'
                        : message.role === 'error'
                        ? 'bg-red-100 text-red-700 border-2 border-red-400 rounded-sm'
                        : message.role === 'system'
                        ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500 rounded-sm'
                        : 'bg-amber-100/60 border-2 border-amber-900 rounded-sm'
                    }`}
                  >
                    <p 
                      className="leading-relaxed whitespace-pre-wrap"
                      style={{ 
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        color: message.role === 'user' 
                          ? '#fef3c7' 
                          : message.role === 'error' 
                          ? '#b91c1c' 
                          : message.role === 'system' 
                          ? '#92400e' 
                          : '#4a3018'
                      }}
                    >
                      {message.role === 'system' && (
                        <AlertCircle className="inline w-4 h-4 mr-2" />
                      )}
                      {message.content}
                      {message.role === 'assistant' && isLoading && index === messages.length - 1 && (
                        <span 
                          className="inline-block w-2 h-4 ml-1 bg-amber-900"
                          style={{ animation: 'blink 1s infinite' }}
                        />
                      )}
                    </p>
                  </div>
                </div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 bg-amber-950/90 border-t-4 border-amber-900">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isConfigured ? "输入你的问题..." : "请先配置 API Key"}
                  disabled={!isConfigured || isLoading}
                  className="flex-1 px-4 py-3 bg-amber-100 border-2 border-amber-900 rounded-none text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.95rem'
                  }}
                />
                <button
                  type="submit"
                  disabled={!isConfigured || isLoading || !inputValue.trim()}
                  className="px-5 py-3 bg-amber-800 text-amber-100 border-2 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
          
        </div>
      </div>
      
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </main>
  )
}

export default Agent
