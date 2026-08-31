/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Slate mapping to dark graphite tones
        slate: {
          950: '#0B0F12', // Background
          900: '#11171B', // Primary Surface
          850: '#161D21', // Secondary Surface
          800: '#1B2428', // Elevated Surface
          700: '#283338', // Border
          750: '#283338', // Border
          600: '#6F7C82', // Muted Text
          550: '#6F7C82',
          500: '#6F7C82',
          450: '#A4B0B5', // Secondary Text
          400: '#A4B0B5',
          350: '#F3F6F7', // Main Text
          300: '#F3F6F7',
          200: '#F3F6F7',
          100: '#F3F6F7',
          50: '#F3F6F7',
        },
        // Indigo mapping to restrained brand teal
        indigo: {
          50: '#E6F9F7',
          100: '#C2F2EE',
          200: '#9CEADE',
          300: '#6ADCCF',
          400: '#22D6C3', // Accent Hover
          500: '#19C3B1', // Accent Primary
          600: '#19C3B1',
          650: '#19C3B1',
          700: '#19C3B1',
          750: '#19C3B1',
          800: '#139284',
          900: '#0D6257',
          950: '#06312B',
        },
        // Semantic overrides
        emerald: {
          400: '#35C98A', // Success
          500: '#35C98A',
          600: '#35C98A',
        },
        rose: {
          400: '#E05A5A', // Critical
          450: '#E05A5A',
          500: '#E05A5A',
          600: '#E05A5A',
        },
        yellow: {
          400: '#E7B84B', // Warning
          500: '#E7B84B',
          600: '#E7B84B',
        },
        orange: {
          400: '#E7B84B',
          500: '#E7B84B',
          600: '#E7B84B',
        },
        blue: {
          400: '#5BA7E8', // Info
          500: '#5BA7E8',
          600: '#5BA7E8',
        }
      },
      // Strict border-radii limitations
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '6px',
        'xl': '8px',
        '2xl': '10px',
      }
    },
  },
  plugins: [],
}
