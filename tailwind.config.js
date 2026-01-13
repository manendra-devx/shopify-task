/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./layout/**/*.liquid",
    "./templates/**/*.liquid",
    "./sections/**/*.liquid",
    "./snippets/**/*.liquid",
    "./blocks/**/*.liquid",
    "./assets/**/*.css"
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '475px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        'primary': 'var(--font-primary--family)',
        'cabin': ['Cabin', 'sans-serif'],
      },
    },
  },
  plugins: [],
}