/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-body)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      colors: {
        green: {
          50:  "#f0faf1",
          100: "#dcf2de",
          200: "#b8e5bc",
          300: "#86cf8d",
          400: "#4db85a",
          500: "#28a035",
          600: "#1a8226",
          700: "#166820",
          800: "#14511c",
          900: "#114319",
          950: "#082510",
        },
      },
      borderRadius: {
        sm: "6px", md: "10px", lg: "14px", xl: "20px",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        fadeUp:  "fadeUp 0.22s cubic-bezier(0.4,0,0.2,1)",
        slideIn: "slideIn 0.22s cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },
  plugins: [],
};
