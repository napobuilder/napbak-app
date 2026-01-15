/** @type {import('tailwindcss').Config} */
export default {
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { 
            transform: 'translateY(0) rotate(0deg)',
            opacity: '0.3',
          },
          '50%': { 
            transform: 'translateY(-20px) rotate(10deg)',
            opacity: '0.6',
          },
        },
        'pulse-subtle': {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': { 
            transform: 'scale(1.05)',
            opacity: '0.9',
          },
        },
        'fade-in': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}

