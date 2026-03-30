import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import DOMPurify from 'dompurify'
import CommentBoard from '../components/CommentBoard'
import useSound from 'use-sound'

function Guest() {
  const [nickname, setNickname] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [posts, setPosts] = useState([])
  const [showPosts, setShowPosts] = useState(false)
  const [playClick] = useSound('/music/sfx/click.mp3', { volume: 0.5 })

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setPosts(data)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (content.length < 10 || content.length > 5000) {
      alert('正文长度必须在 10 ~ 5000 字之间！')
      return
    }
    
    const lastPostTime = localStorage.getItem('last_post_time')
    if (lastPostTime) {
      const timeDiff = Date.now() - parseInt(lastPostTime)
      if (timeDiff < 3600000) {
        alert('您已投稿过，请休息一会')
        return
      }
    }
    
    const cleanContent = DOMPurify.sanitize(content, { ALLOWED_TAGS: [] })
    const cleanNickname = DOMPurify.sanitize(nickname, { ALLOWED_TAGS: [] }) || '匿名农夫'
    const cleanTitle = DOMPurify.sanitize(title, { ALLOWED_TAGS: [] }) || '无题'
    
    setIsSubmitting(true)
    
    const { error } = await supabase
      .from('posts')
      .insert([
        {
          nickname: cleanNickname,
          title: cleanTitle,
          content: cleanContent,
          status: 'pending'
        }
      ])
    
    setIsSubmitting(false)
    
    if (error) {
      alert('投稿失败，请稍后重试')
      console.error(error)
    } else {
      alert('投稿成功！您的文章已进入审核队列，审核通过后将展示在页面上。')
      setNickname('')
      setTitle('')
      setContent('')
      localStorage.setItem('last_post_time', Date.now().toString())
    }
  }

  const togglePosts = async () => {
    if (!showPosts) {
      await fetchPosts()
    }
    setShowPosts(!showPosts)
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
      
      <section className="relative z-10 flex flex-col items-center min-h-screen px-6 py-24">
        <h1 
          className="text-amber-100 mb-8"
          style={{ 
            fontSize: 'clamp(1.2rem, 4vw, 2rem)',
            fontFamily: '"Press Start 2P", Courier New, monospace',
            textShadow: '0 0 20px rgba(251, 191, 36, 0.6)'
          }}
        >
          ROYAL LEDGER
        </h1>
        
        <div className="bg-[#f4e4bc] border-4 border-[#8b5a2b] shadow-[10px_10px_0px_rgba(0,0,0,0.5)] p-8 max-w-3xl w-full mx-auto mb-8">
          <h2 
            className="text-amber-950 text-center mb-6"
            style={{ 
              fontSize: '0.9rem',
              fontFamily: '"Press Start 2P", Courier New, monospace'
            }}
          >
            投稿布告栏
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                className="block text-amber-900 mb-2"
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.5rem' }}
              >
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入你的农夫名号..."
                className="w-full px-4 py-3 bg-amber-100 border-4 border-amber-900 text-amber-950 placeholder-amber-600/50 focus:outline-none focus:border-amber-700"
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
              />
            </div>
            
            <div>
              <label 
                className="block text-amber-900 mb-2"
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.5rem' }}
              >
                标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给你的故事起个名字..."
                className="w-full px-4 py-3 bg-amber-100 border-4 border-amber-900 text-amber-950 placeholder-amber-600/50 focus:outline-none focus:border-amber-700"
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
              />
            </div>
            
            <div>
              <label 
                className="block text-amber-900 mb-2"
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.5rem' }}
              >
                正文
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在这里写下你的农场故事..."
                rows={8}
                className="w-full px-4 py-3 bg-amber-100 border-4 border-amber-900 text-amber-950 placeholder-amber-600/50 focus:outline-none focus:border-amber-700 resize-none"
                style={{ 
                  fontFamily: '"Press Start 2P", Courier New, monospace', 
                  fontSize: '0.55rem',
                  minHeight: '200px'
                }}
              />
              <p 
                className="text-amber-700 mt-1"
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.4rem' }}
              >
                {content.length} / 5000 字
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-amber-800 text-amber-100 border-4 border-amber-950 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
            >
              {isSubmitting ? '提交中...' : '提交投稿'}
            </button>
          </form>
        </div>
        
        <button
          onClick={togglePosts}
          className="px-6 py-3 bg-amber-800 text-amber-100 border-4 border-amber-950 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] hover:bg-amber-700 hover:-translate-y-1 transition-all mb-8"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.5rem' }}
        >
          {showPosts ? '隐藏布告栏' : '查看已审核投稿'}
        </button>
        
        {showPosts && (
          <div className="max-w-3xl w-full space-y-6">
            {posts.length === 0 ? (
              <div className="bg-[#f4e4bc] border-4 border-[#8b5a2b] p-8 text-center">
                <p 
                  className="text-amber-800"
                  style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.5rem' }}
                >
                  暂无已审核的投稿
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div 
                  key={post.id}
                  className="bg-[#fcf3d9]/95 border-4 border-[#8b5a2b] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 
                      className="text-amber-950"
                      style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.7rem' }}
                    >
                      {post.title}
                    </h3>
                    <span 
                      className="text-amber-700"
                      style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.4rem' }}
                    >
                      by {post.nickname}
                    </span>
                  </div>
                  <p 
                    className="text-[#4a3018] leading-relaxed whitespace-pre-wrap mb-4"
                    style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.5rem' }}
                  >
                    {post.content}
                  </p>
                  <p 
                    className="text-amber-600/60"
                    style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.35rem' }}
                  >
                    {new Date(post.created_at).toLocaleString('zh-CN')}
                  </p>
                  
                  <div className="mt-6 pt-4 border-t-4 border-[#8b5a2b]/30">
                    <CommentBoard postId={post.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
      </section>
    </main>
  )
}

export default Guest
