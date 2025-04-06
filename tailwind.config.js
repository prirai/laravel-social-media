/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php", 
    "./resources/**/*.js",
    "./resources/**/*.jsx",
    "./resources/**/*.ts", 
    "./resources/**/*.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Display', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
