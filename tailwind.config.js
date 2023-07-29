const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      "display": {
        "inherit" : 'inherit',
      },
      "animation": {
        "background-shine": 'background-shine 2s linear infinite',
        "strobe": 'strobe 2s ease-in-out infinite',
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
        'primary': {
          light: '#394F7F',
          dark: '#394F7F',
          text: {
            light: '#ffffff',
            dark: '#ffffff'
          }
        },
        'secondary': {
          light: '#dae1f1',
          dark: '#2B3141',
          text: {
            light: '#000000',
            dark: '#ffffff'
          }
        },
        'accent': {
          light: '#4369bc',
          dark: '#8ea5d7',
          text: {
            light: '#ffffff',
            dark: '#000000'
          }
        },
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

