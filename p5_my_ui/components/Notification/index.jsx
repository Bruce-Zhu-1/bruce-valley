import { createContext, useContext, useState, useCallback } from 'react'
import NotificationItem from './NotificationItem'
import './style.css'

const NotificationContext = createContext(null)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((options = {}) => {
    const {
      content = '',
      top = 100,
      left = 100,
      character = 'mona'
    } = options

    const id = `noti_${Date.now()}`
    
    setNotifications(prev => [...prev, { id, content, top, left, character }])
    
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const show = useCallback((options = {}) => {
    return addNotification(options)
  }, [addNotification])

  const info = useCallback((content, character = 'mona') => {
    return addNotification({ content, character })
  }, [addNotification])

  return (
    <NotificationContext.Provider value={{ show, info, removeNotification }}>
      {children}
      {notifications.map(noti => (
        <NotificationItem
          key={noti.id}
          id={noti.id}
          content={noti.content}
          top={noti.top}
          left={noti.left}
          character={noti.character}
          onDestroy={removeNotification}
        />
      ))}
    </NotificationContext.Provider>
  )
}

export default NotificationProvider
