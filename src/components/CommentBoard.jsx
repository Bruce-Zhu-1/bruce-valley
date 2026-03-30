import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

const badWords = ['TMD', '垃圾', '广告', '操', '傻']

function CommentBoard({ postId }) {
  const [comments, setComments] = useState([])
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyNickname, setReplyNickname] = useState('')
  const [likedComments, setLikedComments] = useState([])

  useEffect(() => {
    if (postId) {
      fetchComments()
      loadLikedComments()
    }
  }, [postId])

  const loadLikedComments = () => {
    const stored = localStorage.getItem(`liked_comments_${postId}`)
    if (stored) {
      setLikedComments(JSON.parse(stored))
    }
  }

  const saveLikedComments = (newList) => {
    setLikedComments(newList)
    localStorage.setItem(`liked_comments_${postId}`, JSON.stringify(newList))
  }

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (!error && data) {
      setComments(data)
    }
  }

  const checkBadWords = (text) => {
    const upperText = text.toUpperCase()
    for (const word of badWords) {
      if (upperText.includes(word.toUpperCase())) {
        return true
      }
    }
    return false
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    
    if (!content.trim()) {
      alert('评论内容不能为空')
      return
    }
    
    if (checkBadWords(content)) {
      alert('评论包含敏感词，请修改后提交')
      return
    }
    
    const isAdmin = nickname.trim() === 'Bruce_The_Emperor'
    const finalNickname = isAdmin ? 'Bruce' : (nickname.trim() || '匿名农夫')
    
    const { error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          nickname: finalNickname,
          content: content.trim(),
          is_admin: isAdmin,
          parent_id: null,
          reply_to_user: null,
          likes_count: 0
        }
      ])
    
    if (error) {
      alert('评论失败，请稍后重试')
      console.error(error)
    } else {
      setContent('')
      setNickname('')
      fetchComments()
    }
  }

  const handleSubmitReply = async (parentComment, replyToUser = null) => {
    if (!replyContent.trim()) {
      alert('回复内容不能为空')
      return
    }
    
    if (checkBadWords(replyContent)) {
      alert('回复包含敏感词，请修改后提交')
      return
    }
    
    const isAdmin = replyNickname.trim() === 'Bruce_The_Emperor'
    const finalNickname = isAdmin ? 'Bruce' : (replyNickname.trim() || '匿名农夫')
    
    const { error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          nickname: finalNickname,
          content: replyContent.trim(),
          is_admin: isAdmin,
          parent_id: parentComment.id,
          reply_to_user: replyToUser || parentComment.nickname,
          likes_count: 0
        }
      ])
    
    if (error) {
      alert('回复失败，请稍后重试')
      console.error(error)
    } else {
      setReplyContent('')
      setReplyNickname('')
      setReplyingTo(null)
      fetchComments()
    }
  }

  const handleLike = async (commentId) => {
    if (likedComments.includes(commentId)) {
      return
    }
    
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return
    
    const { error } = await supabase
      .from('comments')
      .update({ likes_count: (comment.likes_count || 0) + 1 })
      .eq('id', commentId)
    
    if (!error) {
      saveLikedComments([...likedComments, commentId])
      fetchComments()
    }
  }

  const renderComments = () => {
    const parentComments = comments.filter(c => c.parent_id === null)
    
    return parentComments.map(parent => {
      const childComments = comments.filter(c => c.parent_id === parent.id)
      
      return (
        <div key={parent.id} className="mb-4">
          <div className="bg-[#fcf3d9]/90 border-2 border-amber-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-amber-950 font-bold"
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.5rem' }}
              >
                {parent.nickname}
              </span>
              {parent.is_admin && (
                <span 
                  className="bg-yellow-500 text-amber-950 px-1 rounded-sm shadow-sm border border-yellow-700"
                  style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.35rem' }}
                >
                  [人皇]
                </span>
              )}
              <span 
                className="text-amber-600/60 ml-auto"
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.35rem' }}
              >
                {new Date(parent.created_at).toLocaleString('zh-CN')}
              </span>
            </div>
            
            <p 
              className="text-[#4a3018] mb-3"
              style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.45rem' }}
            >
              {parent.content}
            </p>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLike(parent.id)}
                disabled={likedComments.includes(parent.id)}
                className={`px-2 py-1 border-2 transition-all ${
                  likedComments.includes(parent.id)
                    ? 'bg-red-500 text-white border-red-700'
                    : 'bg-amber-100 text-amber-800 border-amber-900 hover:bg-amber-200'
                }`}
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.35rem' }}
              >
                ❤ {parent.likes_count || 0}
              </button>
              
              <button
                onClick={() => setReplyingTo(replyingTo === parent.id ? null : parent.id)}
                className="px-2 py-1 bg-amber-100 text-amber-800 border-2 border-amber-900 hover:bg-amber-200 transition-all"
                style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.35rem' }}
              >
                回复
              </button>
            </div>
            
            {replyingTo === parent.id && (
              <div className="mt-4 pt-4 border-t-2 border-amber-900/30">
                <input
                  type="text"
                  value={replyNickname}
                  onChange={(e) => setReplyNickname(e.target.value)}
                  placeholder="昵称..."
                  className="w-full px-3 py-2 mb-2 bg-amber-100 border-2 border-amber-900 text-amber-950 placeholder-amber-600/50"
                  style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.4rem' }}
                />
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`回复 ${parent.nickname}...`}
                  rows={2}
                  className="w-full px-3 py-2 mb-2 bg-amber-100 border-2 border-amber-900 text-amber-950 placeholder-amber-600/50 resize-none"
                  style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.4rem' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitReply(parent)}
                    className="px-3 py-1 bg-amber-800 text-amber-100 border-2 border-amber-950 hover:bg-amber-700 transition-all"
                    style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.35rem' }}
                  >
                    发送
                  </button>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 bg-slate-500 text-white border-2 border-slate-700 hover:bg-slate-600 transition-all"
                    style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.35rem' }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {childComments.length > 0 && (
            <div className="ml-8 pl-4 border-l-4 border-amber-900/30 mt-2 space-y-2">
              {childComments.map(child => (
                <div key={child.id} className="bg-amber-100/50 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-amber-950 font-bold"
                      style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.45rem' }}
                    >
                      {child.nickname}
                    </span>
                    {child.is_admin && (
                      <span 
                        className="bg-yellow-500 text-amber-950 px-1 rounded-sm shadow-sm border border-yellow-700"
                        style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.3rem' }}
                      >
                        [人皇]
                      </span>
                    )}
                  </div>
                  
                  <p 
                    className="text-[#4a3018]"
                    style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.4rem' }}
                  >
                    {child.reply_to_user && (
                      <span className="text-blue-600">@{child.reply_to_user} : </span>
                    )}
                    {child.content}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleLike(child.id)}
                      disabled={likedComments.includes(child.id)}
                      className={`px-2 py-0.5 border-2 transition-all ${
                        likedComments.includes(child.id)
                          ? 'bg-red-500 text-white border-red-700'
                          : 'bg-amber-100 text-amber-800 border-amber-900 hover:bg-amber-200'
                      }`}
                      style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.3rem' }}
                    >
                      ❤ {child.likes_count || 0}
                    </button>
                    
                    <button
                      onClick={() => {
                        setReplyingTo(parent.id)
                        setReplyContent('')
                        setReplyNickname('')
                      }}
                      className="px-2 py-0.5 bg-amber-100 text-amber-800 border-2 border-amber-900 hover:bg-amber-200 transition-all"
                      style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.3rem' }}
                    >
                      回复
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    })
  }

  if (!postId) {
    return null
  }

  return (
    <div className="w-full">
      <h4 
        className="text-amber-950 mb-4"
        style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.6rem' }}
      >
        评论区
      </h4>
      
      <form onSubmit={handleSubmitComment} className="mb-6">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="昵称..."
          className="w-full px-3 py-2 mb-2 bg-amber-100 border-2 border-amber-900 text-amber-950 placeholder-amber-600/50"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.4rem' }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          rows={3}
          className="w-full px-3 py-2 mb-2 bg-amber-100 border-2 border-amber-900 text-amber-950 placeholder-amber-600/50 resize-none"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.4rem' }}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-amber-800 text-amber-100 border-2 border-amber-950 hover:bg-amber-700 transition-all"
          style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.4rem' }}
        >
          发表评论
        </button>
      </form>
      
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p 
            className="text-amber-700 text-center py-4"
            style={{ fontFamily: '"Press Start 2P", Courier New, monospace', fontSize: '0.4rem' }}
          >
            暂无评论，来抢沙发吧！
          </p>
        ) : (
          renderComments()
        )}
      </div>
    </div>
  )
}

export default CommentBoard
