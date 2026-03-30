import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  conversationId: null,
  
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          ...message,
        },
      ],
    })),
  
  setUserMessage: (content) => {
    const { addMessage } = get()
    addMessage({
      role: 'user',
      content,
      status: 'sent',
    })
  },
  
  setBotMessage: (content) => {
    const { addMessage } = get()
    addMessage({
      role: 'assistant',
      content,
      status: 'received',
    })
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  setConversationId: (id) => set({ conversationId: id }),
  
  clearMessages: () => 
    set({
      messages: [],
      conversationId: null,
      error: null,
    }),
  
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
  
  sendMessage: async (content) => {
    const { setUserMessage, setBotMessage, setLoading, setError } = get()
    
    setUserMessage(content)
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      const data = await response.json()
      setBotMessage(data.response || data.message || 'Received response')
    } catch (err) {
      setError(err.message)
      setBotMessage('Sorry, I encountered an error. Please try again.')
    } finally {
      setLoading(false)
    }
  },
  
  sendMessageToLLM: async (content, apiConfig) => {
    const { setUserMessage, setBotMessage, setLoading, setError, messages } = get()
    
    setUserMessage(content)
    setLoading(true)
    setError(null)
    
    const systemPrompt = `You are a helpful AI assistant in Bruce's World - a pixel-art styled personal portfolio. 
    You are friendly, knowledgeable, and respond in a concise manner. 
    Keep responses brief and helpful. You can help with questions about the website, Bruce's work, or general topics.`
    
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }))
    
    try {
      const response = await fetch(apiConfig.endpoint || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: apiConfig.model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'API request failed')
      }
      
      const data = await response.json()
      const botResponse = data.choices?.[0]?.message?.content || 'I received your message but could not generate a response.'
      setBotMessage(botResponse)
    } catch (err) {
      setError(err.message)
      setBotMessage(`Error: ${err.message}. Please check your API configuration.`)
    } finally {
      setLoading(false)
    }
  },
}))

export default useChatStore
