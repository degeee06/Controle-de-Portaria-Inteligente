/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0D0D0D',
        'brand-secondary': '#1A1A1A',
        'brand-accent': '#4F46E5',
        'brand-accent-hover': '#4338CA',
        'brand-text-primary': '#F5F5F5',
        'brand-text-secondary': '#A3A3A3',
      }
    },
  },
  plugins: [],
}
