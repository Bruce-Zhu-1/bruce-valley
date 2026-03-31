import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { SYSTEM_PROMPT } from '../constants/prompt'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const SILICON_FLOW_API_KEY = import.meta.env.VITE_SILICON_FLOW_API_KEY

let genAI = null
let model = null

function initializeGemini() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_KEY_PLACEHOLDER' || GEMINI_API_KEY === '') {
    console.warn('Gemini API Key not configured. Please set VITE_GEMINI_API_KEY in .env file.')
    return false
  }
  
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      generationConfig: {
        maxOutputTokens: 8192,
      },
    })
    return true
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error)
    return false
  }
}

async function* streamGeminiChat(userMessage, conversationHistory = []) {
  if (!model) {
    const initialized = initializeGemini()
    if (!initialized) {
      yield {
        success: false,
        error: 'Gemini API Key 未配置。请在 .env 文件中设置 VITE_GEMINI_API_KEY。',
        text: null,
        done: true
      }
      return
    }
  }
  
  try {
    let history = conversationHistory
      .filter(msg => msg.role === 'user' || msg.role === 'model')
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }))
    
    if (history.length > 0 && history[0].role !== 'user') {
      history = history.slice(1)
    }
    
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    })
    
    const result = await chat.sendMessageStream(userMessage)
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      yield {
        success: true,
        text: chunkText,
        error: null,
        done: false
      }
    }
    
    yield {
      success: true,
      text: '',
      error: null,
      done: true
    }
  } catch (error) {
    console.error('Gemini API Stream 错误:', error)
    
    let errorMessage = '🔮 星露谷的神秘力量暂时无法回应...'
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key') || error.message?.includes('invalid')) {
      errorMessage = '🔑 API Key 无效，请检查配置文件。'
    } else if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota') || error.message?.includes('429')) {
      errorMessage = '⏳ 今日魔法能量已耗尽，请稍后再试或切换至 Silicon Flow 引擎。'
    } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      errorMessage = '🌐 网络连接异常，请检查 VPN 设置。'
    } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      errorMessage = '⏰ 连接超时，星露谷的信号不太好...'
    } else if (error.message?.includes('CORS') || error.message?.includes('cors')) {
      errorMessage = '🚫 跨域请求被阻止，请检查浏览器设置。'
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      errorMessage = '📡 DNS 解析失败，请检查网络连接。'
    } else if (error.status === 401 || error.status === 403) {
      errorMessage = '🔐 认证失败，请确认 API Key 是否有效。'
    } else if (error.status === 503 || error.status === 500) {
      errorMessage = '🛠️ Gemini 服务正在维护中，请稍后再试。'
    }
    
    yield {
      success: false,
      text: null,
      error: errorMessage,
      done: true
    }
  }
}

async function* streamSiliconFlowChat(userMessage, conversationHistory = []) {
  if (!SILICON_FLOW_API_KEY || SILICON_FLOW_API_KEY === '') {
    yield {
      success: false,
      error: 'Silicon Flow API Key 未配置。请在 .env 文件中设置 VITE_SILICON_FLOW_API_KEY。',
      text: null,
      done: true
    }
    return
  }
  
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      { role: 'user', content: userMessage }
    ]
    
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SILICON_FLOW_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages: messages,
        stream: true,
        max_tokens: 8192,
        temperature: 0.7,
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        yield { success: true, text: '', error: null, done: true }
        break
      }
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || !trimmedLine.startsWith('data:')) continue
        
        const data = trimmedLine.slice(5).trim()
        if (data === '[DONE]') {
          yield { success: true, text: '', error: null, done: true }
          return
        }
        
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            yield { success: true, text: content, error: null, done: false }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  } catch (error) {
    console.error('Silicon Flow API Stream 错误:', error)
    
    let errorMessage = '🔮 星露谷的神秘力量暂时无法回应...'
    
    if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('Unauthorized')) {
      errorMessage = '🔑 Silicon Flow API Key 无效或已过期。'
    } else if (error.message?.includes('429') || error.message?.includes('quota')) {
      errorMessage = '⏳ 今日魔法能量已耗尽，请稍后再试或切换至 Gemini 引擎。'
    } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      errorMessage = '🌐 网络连接异常，请检查网络设置。'
    } else if (error.message?.includes('timeout')) {
      errorMessage = '⏰ 连接超时，星露谷的信号不太好...'
    }
    
    yield {
      success: false,
      text: null,
      error: errorMessage,
      done: true
    }
  }
}

async function* generateAIResponseStream(userMessage, conversationHistory = [], engine = 'gemini') {
  if (engine === 'siliconflow') {
    yield* streamSiliconFlowChat(userMessage, conversationHistory)
  } else {
    yield* streamGeminiChat(userMessage, conversationHistory)
  }
}

function isGeminiConfigured() {
  return GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_KEY_PLACEHOLDER' && GEMINI_API_KEY !== ''
}

function isSiliconFlowConfigured() {
  return SILICON_FLOW_API_KEY && SILICON_FLOW_API_KEY !== ''
}

function isAIConfigured() {
  return isGeminiConfigured() || isSiliconFlowConfigured()
}

function getAvailableEngines() {
  const engines = []
  if (isGeminiConfigured()) engines.push({ id: 'gemini', name: 'Gemini-G爹', available: true })
  if (isSiliconFlowConfigured()) engines.push({ id: 'siliconflow', name: 'Silicon Flow-全球模型', available: true })
  return engines
}

export { 
  generateAIResponseStream, 
  initializeGemini, 
  isAIConfigured,
  isGeminiConfigured,
  isSiliconFlowConfigured,
  getAvailableEngines,
  streamGeminiChat,
  streamSiliconFlowChat
}
