import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../services/supabase'
import useSound from 'use-sound'

const authorInfo = {
  bruce: { name: 'Bruce Zhu', title: 'THE CREATOR', image: '/roles/bruce0.webp', color: '#8b0000' },
  jiang: { name: 'Jonathan YC', title: 'THE SAGE', image: '/roles/jiang0.webp', color: '#1a5f2a' },
  liu: { name: 'Liu YS', title: 'THE WARRIOR', image: '/roles/liu0.webp', color: '#2c4a80' },
  zou: { name: 'Zou Master', title: 'THE SCHOLAR', image: '/roles/zou0.webp', color: '#6b4c8a' },
  wei: { name: 'VS Wei', title: 'THE PHANTOM', image: '/roles/wei0.webp', color: '#4a4a4a' },
}

function NotesAuthor() {
  const { author } = useParams()
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })
  const [playSelect] = useSound('/music/sfx/select.mp3', { volume: 0.5 })

  const authorData = authorInfo[author] || authorInfo.bruce

  useEffect(() => {
    fetchArticles()
  }, [author])

  const fetchArticles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('author', author)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setArticles(data)
    }
    setLoading(false)
  }

  const handleArticleClick = (articleId) => {
    playSelect()
    setTimeout(() => {
      navigate(`/notes/${author}/${articleId}`)
    }, 150)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <main className="relative min-h-screen bg-[#0a0a0a]">
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, ${authorData.color}22 0%, transparent 50%),
            linear-gradient(to bottom, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)
          `,
        }}
      />

      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0px, rgba(0, 0, 0, 0.1) 1px, transparent 1px, transparent 2px)',
        }}
      />

      <header 
        className="relative z-10 border-b-4 border-amber-900/30"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <Link 
              to="/notes" 
              onClick={playClick}
              className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-amber-100 border-2 border-amber-900 hover:bg-amber-700 transition-all"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}
            >
              <span>◄</span> BACK TO HALL
            </Link>

            <div className="flex items-center gap-4">
              <img 
                src={authorData.image} 
                alt={authorData.name}
                className="w-16 h-16 object-cover object-top border-2"
                style={{ borderColor: authorData.color }}
              />
              <div className="text-right">
                <p 
                  className="text-xs tracking-widest mb-1"
                  style={{ color: authorData.color, fontFamily: '"Rye", serif' }}
                >
                  {authorData.title}
                </p>
                <h1 
                  className="text-xl text-amber-100"
                  style={{ fontFamily: '"Rye", serif', letterSpacing: '0.1em' }}
                >
                  {authorData.name}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 
            className="text-2xl text-amber-100 mb-2"
            style={{ fontFamily: '"Rye", serif', letterSpacing: '0.15em' }}
          >
            WRITTEN WORKS
          </h2>
          <div 
            className="h-1 w-24"
            style={{ background: authorData.color }}
          />
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : articles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p 
              className="text-amber-200/60"
              style={{ fontFamily: '"Rye", serif' }}
            >
              No notes found for this author.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {articles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleArticleClick(article.id)}
                className="group cursor-pointer"
              >
                <div 
                  className="relative p-6 border-2 border-amber-900/30 bg-[#1a0a0a]/80 hover:border-amber-700/50 transition-all duration-300"
                  style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 
                        className="text-lg text-amber-100 group-hover:text-amber-50 transition-colors mb-2"
                        style={{ fontFamily: '"Rye", serif' }}
                      >
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-amber-200/60 text-sm mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-amber-200/40">
                        <span>{formatDate(article.created_at)}</span>
                        {article.read_time && (
                          <span>{article.read_time} min read</span>
                        )}
                      </div>
                    </div>
                    <div 
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-amber-700/30 group-hover:border-amber-500/50 transition-colors"
                      style={{ color: authorData.color }}
                    >
                      <span className="text-xl">→</span>
                    </div>
                  </div>

                  <div 
                    className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500"
                    style={{ background: authorData.color }}
                  />
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <div 
        className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
        }}
      />
    </main>
  )
}

export default NotesAuthor
