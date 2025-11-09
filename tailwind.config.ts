import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        border: 'var(--border)',
        'card-bg': 'var(--card-bg)',
        active: 'var(--active)',
        'text-muted': 'var(--text-muted)',
      },
      borderRadius: {
        'card': '1rem',
        'button': '1rem',
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
      },
    },
  },
  plugins: [],
}
export default config

