import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import MessageItem from './MessageItem'
import './style.css'

const MessageContext = createContext(null)

export const useMessage = () => {
  const context = useContext(MessageContext)
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider')
  }
  return context
}

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([])
  const messageRefs = useRef({})

  const addMessage = useCallback((type = 'default', duration = 3000) => {
    const id = `msg_${Date.now()}`
    const top = 160 + messages.length * 20
    
    setMessages(prev => [...prev, { id, type, duration, top }])
    
    return id
  }, [messages.length])

  const removeMessage = useCallback((id) => {
    setMessages(prev => {
      const idx = prev.findIndex(msg => msg.id === id)
      if (idx === -1) return prev
      
      const newMessages = [...prev]
      newMessages.splice(idx, 1)
      
      newMessages.forEach((msg, i) => {
        if (messageRefs.current[msg.id]) {
          messageRefs.current[msg.id].updateTop(160 + i * 20)
        }
      })
      
      return newMessages
    })
  }, [])

  const show = useCallback((type = 'default', duration = 3000) => {
    return addMessage(type, duration)
  }, [addMessage])

  const success = useCallback((duration = 3000) => {
    return addMessage('clear', duration)
  }, [addMessage])

  const error = useCallback((duration = 3000) => {
    return addMessage('fail', duration)
  }, [addMessage])

  const registerRef = useCallback((id, ref) => {
    messageRefs.current[id] = ref
  }, [])

  return (
    <MessageContext.Provider value={{ show, success, error, removeMessage }}>
      {children}
      {messages.map(msg => (
        <MessageItem
          key={msg.id}
          id={msg.id}
          type={msg.type}
          duration={msg.duration}
          top={msg.top}
          onDestroy={removeMessage}
          registerRef={registerRef}
        />
      ))}
    </MessageContext.Provider>
  )
}

export default MessageProvider
