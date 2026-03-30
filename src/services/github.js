const GITHUB_API_BASE = 'https://api.github.com'
const REPO_OWNER = 'Bruce-Zhu-1'
const REPO_NAME = 'BruceWorldWebsite'
const DIARIES_PATH = 'diaries'
const STORAGE_KEY = 'bruce_diaries_stats'
const CONTENT_CACHE_PREFIX = 'bruce_article_content_'

function generateRandomStats() {
  return {
    upvotes: Math.floor(Math.random() * 300) + 50,
    comments: Math.floor(Math.random() * 80) + 10,
    favorites: Math.floor(Math.random() * 150) + 30,
  }
}

function generateRandomDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 60)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date.toISOString().split('T')[0]
}

function formatTitleFromFilename(filename) {
  return filename
    .replace(/\.md$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getStoredStats() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to read stored stats:', error)
  }
  return null
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch (error) {
    console.error('Failed to save stats:', error)
  }
}

function getCachedContent(slug) {
  try {
    const cacheKey = `${CONTENT_CACHE_PREFIX}${slug}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      return cached
    }
  } catch (error) {
    console.error('Failed to read cached content:', error)
  }
  return null
}

function cacheContent(slug, content) {
  try {
    const cacheKey = `${CONTENT_CACHE_PREFIX}${slug}`
    localStorage.setItem(cacheKey, content)
  } catch (error) {
    console.error('Failed to cache content:', error)
  }
}

async function fetchDiariesFromGitHub() {
  const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DIARIES_PATH}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    const files = await response.json()
    
    const mdFiles = files.filter(
      (file) => file.type === 'file' && file.name.endsWith('.md')
    )
    
    const storedStats = getStoredStats()
    const newStats = {}
    
    const articles = mdFiles.map((file, index) => {
      const slug = file.name.replace(/\.md$/i, '')
      let stats
      
      if (storedStats && storedStats[slug]) {
        stats = storedStats[slug]
      } else {
        stats = {
          ...generateRandomStats(),
          date: generateRandomDate(),
        }
        newStats[slug] = stats
      }
      
      return {
        id: index + 1,
        slug: slug,
        title: formatTitleFromFilename(file.name),
        excerpt: '点击查看文章详情...',
        upvotes: stats.upvotes,
        comments: stats.comments,
        favorites: stats.favorites,
        date: stats.date,
        githubUrl: file.download_url,
      }
    })
    
    if (Object.keys(newStats).length > 0) {
      const allStats = { ...storedStats, ...newStats }
      saveStats(allStats)
    }
    
    return articles
  } catch (error) {
    console.error('Failed to fetch diaries from GitHub:', error)
    return null
  }
}

async function fetchDiaryContent(slug) {
  const cachedContent = getCachedContent(slug)
  if (cachedContent) {
    return cachedContent
  }
  
  const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@main/${DIARIES_PATH}/${encodeURIComponent(slug)}.md`
  
  try {
    const response = await fetch(jsdelivrUrl)
    
    if (!response.ok) {
      const fallbackUrl = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@master/${DIARIES_PATH}/${encodeURIComponent(slug)}.md`
      const fallbackResponse = await fetch(fallbackUrl)
      
      if (!fallbackResponse.ok) {
        throw new Error('Failed to fetch from jsDelivr CDN')
      }
      
      const content = await fallbackResponse.text()
      cacheContent(slug, content)
      return content
    }
    
    const content = await response.text()
    cacheContent(slug, content)
    return content
  } catch (error) {
    console.error('Failed to fetch diary content:', error)
    return null
  }
}

const fallbackArticles = [
  { id: 1, slug: 'how-to-build-pixel-3d-scene', title: '如何用 React Three Fiber 构建像素风 3D 场景', excerpt: '探索 R3F 的魅力，从零开始搭建一个 Awwwards 级别的体素世界。本文将深入讲解 instancedMesh、后处理特效以及性能优化技巧...', upvotes: 256, comments: 48, favorites: 128, date: '2024-01-15' },
  { id: 2, slug: 'vibe-coding-ai-era', title: 'Vibe Coding：AI 时代的编程新范式', excerpt: '当 AI 成为你的结对编程伙伴，代码不再只是工具，而是一种表达。分享我在 Trae IDE 中的创作体验...', upvotes: 189, comments: 32, favorites: 95, date: '2024-01-12' },
  { id: 3, slug: 'pixel-art-renaissance', title: '像素艺术复兴：从 8-bit 到现代 Web 设计', excerpt: '像素风不再只是怀旧，它正在成为现代 Web 设计的一股清流。探讨如何在 2024 年打造治愈系像素界面...', upvotes: 342, comments: 67, favorites: 201, date: '2024-01-10' },
  { id: 4, slug: 'webgl-performance-optimization', title: 'WebGL 性能优化实战：让 3D 场景飞起来', excerpt: '从 draw call 到 shader 优化，全方位解析 WebGL 性能瓶颈。让你的 3D 作品在移动端也能流畅运行...', upvotes: 178, comments: 29, favorites: 87, date: '2024-01-08' },
  { id: 5, slug: 'framer-motion-guide', title: 'Framer Motion 动画设计指南', excerpt: '流畅的动画是优秀用户体验的关键。本文将介绍如何用 Framer Motion 打造丝滑的页面过渡和微交互...', upvotes: 145, comments: 23, favorites: 76, date: '2024-01-05' },
  { id: 6, slug: 'tailwind-advanced-tips', title: 'Tailwind CSS 高级技巧：打造独特视觉风格', excerpt: '超越基础类名，探索 Tailwind 的进阶用法。从自定义主题到响应式设计，构建独一无二的 UI...', upvotes: 234, comments: 41, favorites: 112, date: '2024-01-03' },
  { id: 7, slug: 'typescript-best-practices', title: 'TypeScript 最佳实践：类型安全的艺术', excerpt: 'TypeScript 不仅是类型检查，更是一种编程思维。分享我在大型项目中的类型设计经验...', upvotes: 198, comments: 35, favorites: 89, date: '2024-01-01' },
  { id: 8, slug: 'zustand-vs-redux', title: 'Zustand vs Redux：状态管理新选择', excerpt: '轻量级状态管理方案 Zustand 正在崛起。对比 Redux，分析各自适用场景和最佳实践...', upvotes: 167, comments: 28, favorites: 73, date: '2023-12-28' },
  { id: 9, slug: 'vite-deep-dive', title: 'Vite 构建工具深度解析', excerpt: 'Vite 为什么这么快？从 ESM 到 HMR，深入理解 Vite 的核心原理和优化策略...', upvotes: 223, comments: 39, favorites: 98, date: '2023-12-25' },
  { id: 10, slug: 'react-18-features', title: 'React 18 新特性完全指南', excerpt: 'Concurrent Mode、Suspense、Automatic Batching... React 18 带来了哪些改变？如何在新项目中充分利用...', upvotes: 312, comments: 56, favorites: 145, date: '2023-12-22' },
  { id: 11, slug: 'css-grid-practice', title: 'CSS Grid 布局实战：复杂界面轻松搞定', excerpt: 'Grid 布局是现代 CSS 的利器。通过实际案例，掌握 Grid 的高级用法和响应式技巧...', upvotes: 156, comments: 24, favorites: 68, date: '2023-12-18' },
  { id: 12, slug: 'build-portfolio-website', title: '从零搭建个人作品集网站', excerpt: '记录我打造 Bruce\'s World 的全过程。从设计构思到技术选型，再到最终上线，分享每一步的心得...', upvotes: 445, comments: 89, favorites: 234, date: '2023-12-15' },
]

async function getDiaries() {
  const articles = await fetchDiariesFromGitHub()
  return articles || fallbackArticles
}

export { fetchDiariesFromGitHub, fetchDiaryContent, getDiaries, fallbackArticles }
