/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        'primary-light': '#a78bfa',
        'primary-dark': '#5b21b6',
        accent: '#f472b6',
        'accent-light': '#fbcfe8',
      },
    },
  },
  plugins: [],
}
