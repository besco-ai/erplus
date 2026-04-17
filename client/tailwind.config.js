/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        erplus: {
          bg: '#F5F5F5',
          sidebar: '#1A1A1A',
          'sidebar-hover': '#2A2A2A',
          'sidebar-active': '#333333',
          accent: '#C41E2A',
          'accent-light': '#FDE8EA',
          text: '#1A1A1A',
          'text-muted': '#6B7280',
          'text-light': '#9CA3AF',
          border: '#E0E0E0',
          'border-light': '#F0F0F0',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
