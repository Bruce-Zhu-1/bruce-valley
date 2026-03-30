import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Loader2, ThumbsUp, Star } from 'lucide-react'
import { fetchDiaryContent, fallbackArticles } from '../services/github'
import { supabase } from '../services/supabase'
import DiaryCommentBoard from '../components/DiaryCommentBoard'
import useSound from 'use-sound'

function DiaryDetail() {
  const { id } = useParams()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  const [likes, setLikes] = useState(0)
  const [stars, setStars] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [userStarred, setUserStarred] = useState(false)
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })
  
  const article = fallbackArticles.find(a => a.slug === id) || {
    title: id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    date: '',
  }
  
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true)
      setError(false)
      
      const markdown = await fetchDiaryContent(id)
      
      if (markdown) {
        setContent(markdown)
      } else {
        setError(true)
        setContent(`# ${article.title}\n\n抱歉，无法加载文章内容。\n\n请稍后再试或返回列表页。`)
      }
      
      setLoading(false)
    }
    
    loadContent()
    loadStats()
  }, [id, article.title])
  
  const loadStats = async () => {
    const likedStored = localStorage.getItem(`liked_diary_${id}`)
    const starredStored = localStorage.getItem(`starred_diary_${id}`)
    setUserLiked(likedStored === 'true')
    setUserStarred(starredStored === 'true')
    
    const { data, error } = await supabase
      .from('diary_stats')
      .select('*')
      .eq('diary_id', id)
      .single()
    
    if (!error && data) {
      setLikes(data.likes_count || 0)
      setStars(data.stars_count || 0)
    }
  }
  
  const handleLike = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    
    const likedStored = localStorage.getItem(`liked_diary_${id}`)
    const isLiked = likedStored === 'true'
    
    const newLikes = isLiked ? Math.max(0, likes - 1) : likes + 1
    const newUserLiked = !isLiked
    
    setLikes(newLikes)
    setUserLiked(newUserLiked)
    localStorage.setItem(`liked_diary_${id}`, String(newUserLiked))
    
    await supabase
      .from('diary_stats')
      .upsert({
        diary_id: id,
        likes_count: newLikes,
        stars_count: stars
      }, { onConflict: 'diary_id' })
  }
  
  const handleFavorite = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    
    const starredStored = localStorage.getItem(`starred_diary_${id}`)
    const isStarred = starredStored === 'true'
    
    const newStars = isStarred ? Math.max(0, stars - 1) : stars + 1
    const newUserStarred = !isStarred
    
    setStars(newStars)
    setUserStarred(newUserStarred)
    localStorage.setItem(`starred_diary_${id}`, String(newUserStarred))
    
    await supabase
      .from('diary_stats')
      .upsert({
        diary_id: id,
        likes_count: likes,
        stars_count: newStars
      }, { onConflict: 'diary_id' })
  }
  
  return (
    <main className="relative min-h-screen">
      <div className="fixed inset-0 z-[1]" style={{
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.5) 100%)',
      }} />
      
      <div className="fixed inset-0 z-[2] pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0px, rgba(0, 0, 0, 0.03) 1px, transparent 1px, transparent 2px)',
      }} />
      
      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/diaries" 
          onClick={playClick}
          className="relative z-50 inline-flex items-center px-4 py-2 mt-8 mb-6 font-pixel text-amber-100 bg-amber-800 border-4 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
        >
          <span className="mr-2">◄</span> BACK TO VALLEY
        </Link>
      </div>
      
      <div className="relative z-10 pt-24 pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto mt-8 p-8 md:p-10 bg-[#fcf3d9]/95 backdrop-blur-md border-4 border-[#8b5a2b] shadow-2xl rounded-sm relative">
          <header className="mb-10 text-center">
            <h1 
              className="mb-6 text-amber-950"
              style={{
                fontSize: 'clamp(0.85rem, 3.5vw, 1.5rem)',
                fontWeight: 'bold',
                letterSpacing: '0.08em',
                fontFamily: '"Press Start 2P", Courier New, monospace',
                lineHeight: 1.7,
              }}
            >
              {article.title}
            </h1>
            
            {article.date && (
              <p 
                className="text-amber-800/60 mb-8"
                style={{
                  fontSize: '0.45rem',
                  fontFamily: '"Press Start 2P", Courier New, monospace',
                  letterSpacing: '0.2em',
                }}
              >
                {article.date}
              </p>
            )}
            
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 border-2 transition-all duration-300 cursor-pointer ${
                  userLiked 
                    ? 'bg-amber-300 border-amber-600 text-amber-800' 
                    : 'border-[#8b5a2b]/50 text-amber-800 hover:bg-amber-200/50'
                }`}
              >
                <ThumbsUp size={16} className={userLiked ? 'fill-current' : ''} />
                <span 
                  style={{ 
                    fontFamily: '"Press Start 2P", Courier New, monospace', 
                    fontSize: '0.5rem' 
                  }}
                >
                  {likes}
                </span>
              </button>
              
              <button
                onClick={handleFavorite}
                className={`flex items-center gap-2 px-4 py-2 border-2 transition-all duration-300 cursor-pointer ${
                  userStarred 
                    ? 'bg-amber-300 border-amber-600 text-amber-800' 
                    : 'border-[#8b5a2b]/50 text-amber-800 hover:bg-amber-200/50'
                }`}
              >
                <Star size={16} className={userStarred ? 'fill-current' : ''} />
                <span 
                  style={{ 
                    fontFamily: '"Press Start 2P", Courier New, monospace', 
                    fontSize: '0.5rem' 
                  }}
                >
                  {stars}
                </span>
              </button>
            </div>
          </header>
          
          <div className="h-px bg-gradient-to-r from-transparent via-[#8b5a2b]/50 to-transparent mb-10" />
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 size={48} className="text-amber-600 animate-spin mb-6" />
              <p 
                className="text-amber-800"
                style={{
                  fontSize: '0.55rem',
                  fontFamily: '"Press Start 2P", Courier New, monospace',
                  letterSpacing: '0.1em',
                }}
              >
                LOADING CONTENT...
              </p>
            </div>
          ) : (
            <article className="prose prose-amber max-w-none prose-headings:font-pixel prose-headings:text-amber-950 prose-p:text-[#4a3018] prose-p:leading-relaxed prose-a:text-amber-700 prose-a:no-underline hover:prose-a:text-amber-600 prose-strong:text-amber-900 prose-code:text-amber-700 prose-code:bg-amber-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-amber-900 prose-pre:text-amber-100 prose-blockquote:border-l-[#8b5a2b] prose-blockquote:text-amber-800 prose-blockquote:bg-amber-50/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-img:rounded-lg prose-img:border prose-img:border-[#8b5a2b]/30">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
              >
                {content}
              </ReactMarkdown>
            </article>
          )}
          
          {error && (
            <div className="text-center mt-10 p-6 bg-red-50 border-4 border-red-300">
              <p 
                className="text-red-600"
                style={{
                  fontSize: '0.55rem',
                  fontFamily: '"Press Start 2P", Courier New, monospace',
                }}
              >
                ⚠ UNABLE TO LOAD CONTENT FROM GITHUB
              </p>
            </div>
          )}
          
          <hr className="my-10 border-[#8b5a2b]/30" />
          
          <div className="mt-8">
            <DiaryCommentBoard diaryId={id} />
          </div>
          
          <div className="text-center mt-10">
            <Link 
              to="/diaries"
              onClick={playClick}
              className="inline-flex items-center gap-2 px-6 py-3 text-amber-100 bg-amber-800 border-4 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.55rem' }}
            >
              <ArrowLeft size={14} />
              RETURN TO LIST
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default DiaryDetail
