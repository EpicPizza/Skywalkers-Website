const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'backgroud': {
          light: colors.white,
          dark: colors.zinc[800]
        },
        'border': {
          light: colors.zinc[200],
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

