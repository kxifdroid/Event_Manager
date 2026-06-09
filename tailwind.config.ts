import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#13131A',
        accent: '#6C63FF',
        coral: '#FF6584',
        border: 'hsl(240 6% 20%)',
        foreground: 'hsl(0 0% 98%)',
        muted: {
          DEFAULT: 'hsl(240 5% 26%)',
          foreground: 'hsl(240 5% 65%)',
        },
        card: {
          DEFAULT: '#13131A',
          foreground: 'hsl(0 0% 98%)',
        },
        primary: {
          DEFAULT: '#6C63FF',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#FF6584',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(108, 99, 255, 0.15)',
        'glow-hover': '0 0 30px rgba(108, 99, 255, 0.25)',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(19,19,26,0.9) 0%, rgba(19,19,26,0.7) 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
