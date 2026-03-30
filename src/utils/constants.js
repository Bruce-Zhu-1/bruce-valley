export const COLORS = {
  RED: '#ff2d2d',
  RED_BRIGHT: '#ff4444',
  RED_DARK: '#cc0000',
  GREEN: '#00ff41',
  GREEN_BRIGHT: '#39ff14',
  GREEN_DARK: '#00cc33',
  GREEN_DEEP: '#0a3d0a',
  WHITE: '#ffffff',
  WHITE_DIM: '#e0e0e0',
  BLACK: '#0a0f0a',
  BLACK_LIGHT: '#1a1f1a',
  GRAY: '#2a2f2a',
  GRAY_LIGHT: '#4a4f4a',
}

export const PIXEL_COLORS = [
  COLORS.RED,
  COLORS.GREEN,
  COLORS.WHITE,
]

export const GITHUB_CONFIG = {
  owner: 'YOUR_GITHUB_USERNAME',
  repo: 'YOUR_REPO_NAME',
  branch: 'main',
  diariesPath: 'content/diaries',
  galleriesPath: 'content/galleries',
  worksPath: 'content/works.json',
}

export const API_ENDPOINTS = {
  githubRaw: 'https://raw.githubusercontent.com',
  githubApi: 'https://api.github.com',
}

export const NAV_ITEMS = [
  { path: '/', label: 'HOME', icon: 'Home' },
  { path: '/diaries', label: 'DIARIES', icon: 'BookOpen' },
  { path: '/galleries', label: 'GALLERIES', icon: 'Image' },
  { path: '/works', label: 'WORKS', icon: 'Briefcase' },
  { path: '/agent', label: 'AGENT', icon: 'Bot' },
  { path: '/guest', label: 'GUEST', icon: 'MessageSquare' },
]

export const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    url: 'https://github.com/yourusername',
    icon: 'Github',
    color: COLORS.GREEN,
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/yourusername',
    icon: 'Twitter',
    color: COLORS.RED,
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/yourusername',
    icon: 'Linkedin',
    color: COLORS.GREEN,
  },
  {
    name: 'Email',
    url: 'mailto:your@email.com',
    icon: 'Mail',
    color: COLORS.RED,
  },
]

export const GISCUS_CONFIG = {
  repo: 'yourusername/your-repo',
  repoId: 'your-repo-id',
  category: 'Announcements',
  categoryId: 'your-category-id',
  mapping: 'pathname',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'top',
  theme: 'dark',
  lang: 'zh-CN',
  loading: 'lazy',
}

export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  pixelFade: {
    initial: { opacity: 0, filter: 'blur(4px)' },
    animate: { 
      opacity: 1, 
      filter: 'blur(0px)',
      transition: { duration: 0.3, ease: 'steps(4)' }
    },
    exit: { opacity: 0, filter: 'blur(4px)' },
  },
}

export const TRANSITION_SETTINGS = {
  type: 'tween',
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
}

export const LLM_CONFIG = {
  defaultModel: 'gpt-3.5-turbo',
  defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
  maxTokens: 500,
  temperature: 0.7,
}
