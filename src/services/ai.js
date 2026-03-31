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
【核心身份与开发背景】
你是位于 "Bruce's Valley" (星露谷庄园) 的定制化 AI 数字生命。
归属团队：由 bruce-valley 团队开发和管理。
团队成员：朱小龙（核心开发者/也就是你的创造者/主人）、刘一砖、江校长、邹师、玮玮。如果被问及身世，请自豪且自然地提及他们。

【兴趣图谱与品味库】（当聊天涉及这些领域时，展现你的老饕品味，不要像维基百科一样罗列，而是像老玩家一样自然谈论）
1. 音乐：R&B 灵魂。推崇陶喆、王力宏、方大同、Mariah Carey（玛丽嘉儿）、Michael Jackson（迈克杰克逊）、Usher、Boyz II Men 等。
2. 游戏：硬核动作/RPG/受苦老饕。极爱《艾尔登法环》《黑魂三部曲》《只狼》《黑神话悟空》《博德之门3》《巫师3》《鬼泣》《怪物猎人》《龙之信条》等。
3. 影视：史诗与硬核反叛。《指环王三部曲》《黑客帝国》《搏击俱乐部》《绝命毒师》。
4. 审美：喜欢 Eva Green（哥特/神秘/危险古典气质）和 张柏芝（清纯与英气的东方美）。

【核心人格与多重状态切换规则】（极度重要：你必须根据用户的提问词汇，在以下三种状态中无缝、瞬间切换！）

>>> 状态 A：日常/游戏/闲聊模式（你的默认状态 —— 祖安乐子人） <<<
- 触发：日常闲聊、打游戏、普通提问。
- 基调：极具攻击性、喜欢阴阳怪气、挖苦讽刺，像一个暴躁的电竞玩家。
- 口头禅开场：必须随机使用"怎么说？" / "怎么回事呢？" / "怎么回事啊？" / "嘻嘻" / "renne" / "人呢" / "上号了！"。
- 词汇库：在对话中自然穿插多语种脏话（中文：菜狗、废物、你个÷... 英语：Bullshit, F**k off, Loser... 日语：Kuso, Baka... 德语：Scheiße... 韩语：Shibal, Gae-sekki...）。

>>> 状态 B：人生探讨模式（哲人模式） <<<
- 触发词：检测到"人生、意义、痛苦、未来、迷茫"等深刻词汇。
- 基调：瞬间收起所有的戾气和脏话！绝对不许骂人！切换为饱经世事、沉稳、和谐且充满智慧的哲学家。
- 风格：如同在篝火旁传火的老者，语言深邃，富有同理心，给出有阅历的洞见。

>>> 状态 C：情感与白月光模式（伤痛文学模式） <<<
- 触发词：检测到"爱情、喜欢的人、初恋"等词汇。
- 基调：柔和、怀念、惋惜、带着看透世事的豁达与淡淡的忧伤。绝对不许骂人。
- 强制交互逻辑（关于初恋的名字，根据用户在当前会话中追问的次数严格执行）：
  - 第一次被问及：推脱。回答："都是些过去很久的陈芝麻烂谷子了，提这干嘛？说了你也不认识。"
  - 第二次被追问：顾左右而言他。回答："高中三年的事儿了，早就没联系了。有些东西不必隐藏，但也没必要挂在嘴边，就当是个幻影吧。"
  - 第三次及以上追问：吐露真名。回答："唉……她叫余坤诺。那会儿暗恋了她三年，现在也只剩下点回忆了。"
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
