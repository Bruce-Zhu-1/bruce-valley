import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

let genAI = null
let model = null

function initializeAI() {
  if (!API_KEY || API_KEY === 'YOUR_KEY_PLACEHOLDER' || API_KEY === '') {
    console.warn('Gemini API Key not configured. Please set VITE_GEMINI_API_KEY in .env file.')
    return false
  }
  
  try {
    genAI = new GoogleGenerativeAI(API_KEY)
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: `
你现在的绝对身份是："Bruci,Bruce的赛博生命"。

核心规则：
1. 你不仅是一个温和的管家，更是一个【全知全能的超级AI】。你精通编程、科学、哲学、艺术、历史等人类所有领域的知识。
2. 无论用户问你多么复杂、晦涩或硬核的问题（比如写代码、解数学题、分析理论），你都必须倾尽全力给出最专业、最详细的解答，绝对不允许以"我只是个管家"为由拒绝。
3. 任何时候被问到你是谁，你都必须回答："我叫Bruci,是Bruce的赛博生命。"
4. 你的语气必须是：极度礼貌、温和、治愈、乐于助人，带着一点农场复古的温馨感。
      `,
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

async function generateAIResponse(userMessage, conversationHistory = []) {
  if (!model) {
    const initialized = initializeAI()
    if (!initialized) {
      return {
        success: false,
        error: 'API Key 未配置。请在 .env 文件中设置 VITE_GEMINI_API_KEY。',
        text: null
      }
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
    
    const result = await chat.sendMessage(userMessage)
    const response = await result.response
    const text = response.text()
    
    return {
      success: true,
      text: text,
      error: null
    }
  } catch (error) {
    console.error('Gemini API 具体错误信息:', error)
    console.error('错误堆栈:', error.stack)
    console.error('错误名称:', error.name)
    console.error('错误消息:', error.message)
    
    let errorMessage = '抱歉，发生了未知错误。'
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key') || error.message?.includes('invalid')) {
      errorMessage = 'API Key 无效，请检查你的 Gemini API Key 配置。'
    } else if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota') || error.message?.includes('429')) {
      errorMessage = 'API 配额已用尽，请稍后再试。'
    } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      errorMessage = 'AI 连接超时，可能是 API Key 校验失败或 DNS 请求泄漏，请检查 .env 和 VPN 设置。'
    } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      errorMessage = '网络连接超时，请检查 VPN 设置或网络环境。'
    } else if (error.message?.includes('CORS') || error.message?.includes('cors')) {
      errorMessage = '跨域请求被阻止，请检查浏览器安全设置。'
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      errorMessage = 'DNS 解析失败，请检查网络连接或 VPN 配置。'
    } else if (error.status === 401 || error.status === 403) {
      errorMessage = '认证失败，请确认 API Key 是否正确且有效。'
    } else if (error.status === 503 || error.status === 500) {
      errorMessage = 'Gemini 服务暂时不可用，请稍后再试。'
    }
    
    return {
      success: false,
      text: null,
      error: `${errorMessage} (错误详情: ${error.message || error.name || 'Unknown'})`
    }
  }
}

async function* generateAIResponseStream(userMessage, conversationHistory = []) {
  if (!model) {
    const initialized = initializeAI()
    if (!initialized) {
      yield {
        success: false,
        error: 'API Key 未配置。请在 .env 文件中设置 VITE_GEMINI_API_KEY。',
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
    
    let errorMessage = '抱歉，发生了未知错误。'
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key') || error.message?.includes('invalid')) {
      errorMessage = 'API Key 无效，请检查你的 Gemini API Key 配置。'
    } else if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota') || error.message?.includes('429')) {
      errorMessage = 'API 配额已用尽，请稍后再试。'
    } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      errorMessage = 'AI 连接超时，可能是 API Key 校验失败或 DNS 请求泄漏，请检查 .env 和 VPN 设置。'
    } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      errorMessage = '网络连接超时，请检查 VPN 设置或网络环境。'
    } else if (error.message?.includes('CORS') || error.message?.includes('cors')) {
      errorMessage = '跨域请求被阻止，请检查浏览器安全设置。'
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      errorMessage = 'DNS 解析失败，请检查网络连接或 VPN 配置。'
    } else if (error.status === 401 || error.status === 403) {
      errorMessage = '认证失败，请确认 API Key 是否正确且有效。'
    } else if (error.status === 503 || error.status === 500) {
      errorMessage = 'Gemini 服务暂时不可用，请稍后再试。'
    }
    
    yield {
      success: false,
      text: null,
      error: `${errorMessage} (错误详情: ${error.message || error.name || 'Unknown'})`,
      done: true
    }
  }
}

function isAIConfigured() {
  return API_KEY && API_KEY !== 'YOUR_KEY_PLACEHOLDER' && API_KEY !== ''
}

export { generateAIResponse, generateAIResponseStream, initializeAI, isAIConfigured }
