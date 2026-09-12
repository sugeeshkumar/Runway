/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        canvas: {
          light: '#F6F4EF',
          dark: '#1B1A17',
        },
        card: {
          light: '#FFFFFF',
          dark: '#22201C',
        },
        hairline: {
          light: '#E5E2D9',
          dark: '#2E2C27',
        },
        ink: {
          primary: '#1B1A17',
          secondary: '#6E6C65',
          muted: '#A09E96',
          darkPrimary: '#F6F4EF',
          darkSecondary: '#A5A39A',
          darkMuted: '#6E6C65',
        },
        clay: {
          50: '#FDF8F6',
          100: '#F9ECE6',
          200: '#F3D4C7',
          400: '#E48965',
          500: '#D96B43',
          600: '#C85A32',
          700: '#A64421',
          800: '#843419',
          900: '#5C220E',
        },
        budget: {
          safe: {
            bg: '#F0F5F2',
            text: '#2A664A',
            border: '#D3E4DB',
            darkBg: '#15251E',
            darkText: '#5BB88F',
            darkBorder: '#1F3C2F',
          },
          approaching: {
            bg: '#FAF4E8',
            text: '#9C6218',
            border: '#F2E2C4',
            darkBg: '#2A2012',
            darkText: '#E6A853',
            darkBorder: '#3F301B',
          },
          over: {
            bg: '#FAEDED',
            text: '#A63232',
            border: '#F2C6C6',
            darkBg: '#2C1616',
            darkText: '#E87070',
            darkBorder: '#452020',
          },
        },
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
