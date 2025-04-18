/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Add this line to enable class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Add dark mode specific variables
        dark: {
          background: "var(--dark-background)",
          foreground: "var(--dark-foreground)",
        },
      },
    },
  },
  plugins: [],
};