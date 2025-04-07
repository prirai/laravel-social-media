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
      colors: {
        scrollbar: {
          track: 'var(--scrollbar-track)',
          thumb: 'var(--scrollbar-thumb)',
          hover: 'var(--scrollbar-thumb-hover)',
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
        },
        '.scrollbar-elegant': {
          'scrollbar-width': 'thin',
          'scrollbar-color': 'var(--scrollbar-thumb) var(--scrollbar-track)',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            'background': 'var(--scrollbar-track)',
            'border-radius': '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            'background': 'var(--scrollbar-thumb)',
            'border-radius': '10px',
            'border': '2px solid var(--scrollbar-track)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            'background': 'var(--scrollbar-thumb-hover)',
          }
        },
      };
      addUtilities(newUtilities, ['responsive']);
    },
  ],
}
