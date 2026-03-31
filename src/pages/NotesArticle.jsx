import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { supabase } from '../services/supabase'
import useSound from 'use-sound'

const authorInfo = {
  bruce: { name: 'Bruce Zhu', title: 'THE CREATOR', image: '/roles/bruce0.webp', color: '#8b0000' },
  jiang: { name: 'Jonathan YC', title: 'THE SAGE', image: '/roles/jiang0.webp', color: '#1a5f2a' },
  liu: { name: 'Liu YS', title: 'THE WARRIOR', image: '/roles/liu0.webp', color: '#2c4a80' },
  zou: { name: 'Zou Master', title: 'THE SCHOLAR', image: '/roles/zou0.webp', color: '#6b4c8a' },
  wei: { name: 'VS Wei', title: 'THE PHANTOM', image: '/roles/wei0.webp', color: '#4a4a4a' },
}

function NotesArticle() {
  const { author, articleId } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })

  const authorData = authorInfo[author] || authorInfo.bruce

  useEffect(() => {
    fetchArticle()
  }, [author, articleId])

  const fetchArticle = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', articleId)
      .eq('author', author)
      .single()
    
    if (!error && data) {
      setArticle(data)
    }
    setLoading(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <main className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full" />
      </main>
    )
  }

  if (!article) {
    return (
      <main className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-amber-100 mb-4" style={{ fontFamily: '"Rye", serif' }}>
            Article Not Found
          </h1>
          <Link 
            to={`/notes/${author}`}
            className="text-amber-500 hover:text-amber-400 underline"
          >
            Return to author page
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen bg-[#0a0a0a]">
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, ${authorData.color}15 0%, transparent 50%),
            linear-gradient(to bottom, #0a0a0a 0%, #0f0a0a 50%, #0a0a0a 100%)
          `,
        }}
      />

      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.05) 0px, rgba(0, 0, 0, 0.05) 1px, transparent 1px, transparent 2px)',
        }}
      />

      <header 
        className="relative z-10 border-b-4 border-amber-900/30"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link 
              to={`/notes/${author}`} 
              onClick={playClick}
              className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-amber-100 border-2 border-amber-900 hover:bg-amber-700 transition-all"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}
            >
              <span>◄</span> BACK
            </Link>

            <div className="flex items-center gap-3">
              <img 
                src={authorData.image} 
                alt={authorData.name}
                className="w-10 h-10 object-cover object-top border-2"
                style={{ borderColor: authorData.color }}
              />
              <div className="text-right">
                <p 
                  className="text-xs"
                  style={{ color: authorData.color, fontFamily: '"Rye", serif' }}
                >
                  {authorData.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <article className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 
            className="text-3xl md:text-4xl text-amber-100 mb-4 leading-tight"
            style={{ fontFamily: '"Rye", serif', letterSpacing: '0.05em' }}
          >
            {article.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-amber-200/50">
            <span>{formatDate(article.created_at)}</span>
            {article.read_time && (
              <>
                <span>•</span>
                <span>{article.read_time} min read</span>
              </>
            )}
          </div>
          <div 
            className="mt-6 mx-auto h-1 w-32"
            style={{ background: authorData.color }}
          />
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="prose prose-invert prose-amber max-w-none
            prose-headings:text-amber-100 prose-headings:font-serif
            prose-h1:text-2xl prose-h1:border-b prose-h1:border-amber-900/30 prose-h1:pb-4
            prose-h2:text-xl prose-h2:text-amber-200
            prose-h3:text-lg prose-h3:text-amber-300
            prose-p:text-amber-100/90 prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300
            prose-strong:text-amber-100 prose-strong:font-bold
            prose-blockquote:border-l-amber-600 prose-blockquote:bg-amber-900/10 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:not-italic
            prose-code:text-amber-300 prose-code:bg-amber-900/20 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-[#1a0a0a] prose-pre:border prose-pre:border-amber-900/30
            prose-img:rounded-lg prose-img:border-2 prose-img:border-amber-900/30
            prose-hr:border-amber-900/30
            prose-ul:text-amber-100/90 prose-ol:text-amber-100/90
            prose-li:marker:text-amber-600"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {article.content}
          </ReactMarkdown>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-8 border-t border-amber-900/30 text-center"
        >
          <p 
            className="text-amber-200/40 text-sm italic"
            style={{ fontFamily: 'serif' }}
          >
            Written by {authorData.name}
          </p>
        </motion.footer>
      </article>

      <div 
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
        }}
      />
    </main>
  )
}

export default NotesArticle
