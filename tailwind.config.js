module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '2000px', // pour les résos > 1536px
      },
    },
  },
  plugins: [],
}
