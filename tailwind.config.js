/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pixel: {
          red: '#ff2d2d',
          'red-bright': '#ff4444',
          'red-dark': '#cc0000',
          green: '#00ff41',
          'green-bright': '#39ff14',
          'green-dark': '#00cc33',
          'green-deep': '#0a3d0a',
          white: '#ffffff',
          'white-dim': '#e0e0e0',
          black: '#0a0f0a',
          'black-light': '#1a1f1a',
          'black-pure': '#000000',
          gray: '#2a2f2a',
          'gray-light': '#4a4f4a',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'Courier New', 'monospace'],
        mono: ['Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'rgba(255, 255, 255, 0.85)',
            a: {
              color: '#60a5fa',
              '&:hover': {
                color: '#93c5fd',
              },
            },
            'h1, h2, h3, h4': {
              color: 'rgba(255, 255, 255, 1)',
              fontFamily: '"Press Start 2P", Courier New, monospace',
              letterSpacing: '0.05em',
            },
            'h1': {
              fontSize: '1.5rem',
              marginBottom: '2rem',
              marginTop: '2.5rem',
            },
            'h2': {
              fontSize: '1.2rem',
              marginBottom: '1.5rem',
              marginTop: '2rem',
            },
            'h3': {
              fontSize: '1rem',
              marginBottom: '1rem',
              marginTop: '1.5rem',
            },
            p: {
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: '1.8',
              marginBottom: '1.5rem',
            },
            'ul, ol': {
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: '1.8',
            },
            code: {
              color: '#f472b6',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0',
            },
            'pre code': {
              color: '#6ee7b7',
              backgroundColor: 'transparent',
            },
            blockquote: {
              color: 'rgba(255, 255, 255, 0.7)',
              borderLeftColor: 'rgba(244, 114, 182, 0.5)',
              fontStyle: 'italic',
            },
            hr: {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            img: {
              borderRadius: '0',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            },
            strong: {
              color: 'rgba(255, 255, 255, 1)',
            },
            table: {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            'th, td': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            th: {
              color: 'rgba(255, 255, 255, 1)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
        },
      },
      animation: {
        'pixel-blink': 'pixelBlink 0.5s steps(2) infinite',
        'pixel-fade-in': 'pixelFadeIn 0.3s steps(4) forwards',
        'pixel-slide-up': 'pixelSlideUp 0.4s steps(8) forwards',
        'glitch': 'glitch 0.3s steps(2) infinite',
        'scanline': 'scanline 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
        'border-flash': 'borderFlash 1s steps(4) infinite',
      },
      keyframes: {
        pixelBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        pixelFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pixelSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGreen: {
          '0%, 100%': { 
            boxShadow: '0 0 5px #00ff41, 0 0 10px #00ff41',
            borderColor: '#00ff41',
          },
          '50%': { 
            boxShadow: '0 0 20px #00ff41, 0 0 40px #00ff41',
            borderColor: '#39ff14',
          },
        },
        pulseRed: {
          '0%, 100%': { 
            boxShadow: '0 0 5px #ff2d2d, 0 0 10px #ff2d2d',
            borderColor: '#ff2d2d',
          },
          '50%': { 
            boxShadow: '0 0 20px #ff2d2d, 0 0 40px #ff2d2d',
            borderColor: '#ff4444',
          },
        },
        borderFlash: {
          '0%, 100%': { borderColor: '#00ff41' },
          '25%': { borderColor: '#ff2d2d' },
          '50%': { borderColor: '#00ff41' },
          '75%': { borderColor: '#ff2d2d' },
        },
      },
      boxShadow: {
        'pixel-green': '0 0 10px #00ff41, 0 0 20px rgba(0, 255, 65, 0.3)',
        'pixel-red': '0 0 10px #ff2d2d, 0 0 20px rgba(255, 45, 45, 0.3)',
        'pixel-inset': 'inset 0 0 20px rgba(0, 255, 65, 0.1)',
      },
      backgroundImage: {
        'pixel-grid': 'linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)',
        'scanline': 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)',
      },
      backgroundSize: {
        'pixel-grid': '20px 20px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
