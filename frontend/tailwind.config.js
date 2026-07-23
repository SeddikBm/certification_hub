/** @type {import('tailwindcss').Config} */
import styleGuide from './resources/style-guide.json';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: styleGuide.colors,
      borderRadius: styleGuide.borderRadius,
      spacing: styleGuide.spacing,
      fontFamily: styleGuide.fontFamily,
      fontSize: styleGuide.fontSize
    },
  },
  plugins: [],
}
