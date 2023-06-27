const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      "animation": {
        "background-shine": 'background-shine 2s linear infinite',
        "strobe": 'strobe 2s ease-in-out infinite delay-1000',
      },
      "keyframes": {
        'background-shine': {
					from: { backgroundPosition: '0 0' },
					to: { backgroundPosition: '-200% 0' }
				},
        'strobe': {
          '0%, 100%': { opacity: 0 }, 
          '50%': { opacity: 1 },
        }
      },
      colors: {
        'backgroud': {
          light: colors.white,
          dark: colors.zinc[800]
        },
        'border': {
          light: colors.zinc[300],
          dark: colors.zinc[700]
        },
        'text': {
          light: colors.black,
          dark: colors.white,
        },
        'shadow': {
          light: '#0000000e',
          dark: '#00000031'
        }
      },
    },
  },
  plugins: [],
}

