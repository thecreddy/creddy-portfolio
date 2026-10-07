/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      colors: {
        sand: {
          50: '#FAF9F5',
          100: '#F5F4EE',
          200: '#EBE9DE',
          300: '#DEDAC8',
          400: '#C5BEA4',
          500: '#A49C7E',
          600: '#7E765C',
          700: '#5F5843',
          800: '#433E2F',
          900: '#2A261D',
        }
      }
    },
  },
  plugins: [],
}

