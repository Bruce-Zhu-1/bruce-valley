import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ThumbsUp, MessageSquare, Star, Loader2 } from 'lucide-react'
import { getDiaries } from '../services/github'
import { supabase } from '../services/supabase'
import useSound from 'use-sound'

const itemsPerPage = 5

function ArticleCard({ article, index, likedItems, favoritedItems, onLike, onFavorite, playClick }) {
  const isLiked = likedItems.includes(article.id)
  const isFavorited = favoritedItems.includes(article.id)
  
  const handleLike = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onLike(article.id)
  }
  
  const handleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite(article.id)
  }
  
  return (
    <Link 
      to={`/diaries/${article.slug}`}
      className="block cursor-pointer"
      onClick={playClick}
    >
      <div 
        className="relative bg-[#f4e4bc] border-4 border-[#8b5a2b] p-5 mb-4 transition-all duration-300 hover:scale-[1.01] shadow-[inset_0_0_10px_rgba(139,69,19,0.3)] shadow-xl"
        style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-amber-950 text-sm font-bold leading-relaxed flex-1 pr-4">
            {article.title}
          </h2>
          <span className="text-amber-800/60 text-[0.5rem] whitespace-nowrap">{article.date}</span>
        </div>
        
        <p className="text-amber-900/80 text-[0.6rem] leading-relaxed mb-4 line-clamp-2">
          {article.excerpt}
        </p>
        
        <div className="flex items-center gap-3 pt-3 border-t-2 border-[#8b5a2b]/30">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[0.55rem] transition-all duration-200 ${
              isLiked 
                ? 'bg-amber-300 border-amber-600 text-amber-800' 
                : 'border-[#8b5a2b]/50 text-amber-800 hover:bg-amber-200/50'
            }`}
          >
            <ThumbsUp size={12} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{article.likes_count || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#8b5a2b]/50 text-amber-800 text-[0.55rem] transition-all duration-200 hover:bg-amber-200/50">
            <MessageSquare size={12} />
            <span>{article.comments_count || 0}</span>
          </button>
          <button 
            onClick={handleFavorite}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[0.55rem] transition-all duration-200 ${
              isFavorited 
                ? 'bg-amber-300 border-amber-600 text-amber-800' 
                : 'border-[#8b5a2b]/50 text-amber-800 hover:bg-amber-200/50'
            }`}
          >
            <Star size={12} fill={isFavorited ? 'currentColor' : 'none'} />
            <span>{article.stars_count || 0}</span>
          </button>
        </div>
      </div>
    </Link>
  )
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }
  
  return (
    <div className="flex items-center justify-center gap-2 mt-8" style={{ fontFamily: '"Press Start 2P", Courier New, monospace' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 text-[0.6rem] border-4 transition-all duration-200 ${
          currentPage === 1
            ? 'border-[#8b5a2b]/30 text-amber-800/30 cursor-not-allowed bg-amber-100/50'
            : 'border-[#8b5a2b] text-amber-100 bg-amber-700 hover:bg-amber-600'
        }`}
      >
        ◄ PREV
      </button>
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 text-[0.6rem] border-4 transition-all duration-200 ${
            currentPage === page
              ? 'bg-amber-500 border-amber-700 text-amber-950'
              : 'border-[#8b5a2b] text-amber-100 bg-amber-700 hover:bg-amber-600'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 text-[0.6rem] border-4 transition-all duration-200 ${
          currentPage === totalPages
            ? 'border-[#8b5a2b]/30 text-amber-800/30 cursor-not-allowed bg-amber-100/50'
            : 'border-[#8b5a2b] text-amber-100 bg-amber-700 hover:bg-amber-600'
        }`}
      >
        NEXT ►
      </button>
    </div>
  )
}

function Diaries() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [likedItems, setLikedItems] = useState([])
  const [favoritedItems, setFavoritedItems] = useState([])
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })
  
  useEffect(() => {
    const loadDiaries = async () => {
      setLoading(true)
      const data = await getDiaries()
      
      const { data: statsData, error } = await supabase
        .from('diary_stats')
        .select('*')
      
      if (!error && statsData) {
        const statsMap = {}
        statsData.forEach(stat => {
          statsMap[stat.diary_id] = stat
        })
        
        const articlesWithStats = data.map(article => ({
          ...article,
          likes_count: statsMap[article.slug]?.likes_count || 0,
          stars_count: statsMap[article.slug]?.stars_count || 0,
          comments_count: statsMap[article.slug]?.comments_count || 0
        }))
        
        setArticles(articlesWithStats)
      } else {
        setArticles(data)
      }
      
      setLoading(false)
    }
    loadDiaries()
  }, [])
  
  const totalPages = Math.ceil(articles.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = articles.slice(indexOfFirstItem, indexOfLastItem)
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  const handleLike = (id) => {
    setLikedItems((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }
  
  const handleFavorite = (id) => {
    setFavoritedItems((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
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
          to="/" 
          onClick={playClick}
          className="relative z-50 inline-flex items-center px-4 py-2 mt-8 mb-6 font-pixel text-amber-100 bg-amber-800 border-4 border-amber-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
        >
          <span className="mr-2">◄</span> BACK TO VALLEY
        </Link>
      </div>
      
      <div className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 
            className="text-center mb-8"
            style={{
              fontSize: 'clamp(1.2rem, 4vw, 2rem)',
              fontWeight: 'bold',
              color: '#fef3c7',
              letterSpacing: '0.15em',
              fontFamily: '"Press Start 2P", Courier New, monospace',
              textShadow: '2px 2px 0 #78350f, 4px 4px 0 #451a03, 0 0 30px rgba(254, 243, 199, 0.3)',
            }}
          >
            FARM DIARIES
          </h1>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-amber-600 animate-spin mb-6" />
              <p 
                className="text-amber-200"
                style={{
                  fontSize: '0.55rem',
                  fontFamily: '"Press Start 2P", Courier New, monospace',
                  letterSpacing: '0.1em',
                }}
              >
                LOADING ARTICLES...
              </p>
            </div>
          ) : (
            <>
              {currentItems.map((article, index) => (
                <ArticleCard 
                  key={article.id}
                  article={article}
                  index={index}
                  likedItems={likedItems}
                  favoritedItems={favoritedItems}
                  onLike={handleLike}
                  onFavorite={handleFavorite}
                  playClick={playClick}
                />
              ))}
              
              {totalPages > 1 && (
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default Diaries
