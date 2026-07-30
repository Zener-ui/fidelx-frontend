/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#DF500C",
          dark: "#B8420A",
          light: "#DF500C18",
        },
        blue: {
          accent: "#1F744F",
        },
        navy: {
          DEFAULT: "#FBFAF6",
          mid: "#F3F0E9",
          light: "#EDE8DC",
          border: "#E2DED5",
        },
        slate: {
          muted: "#71675D",
          soft: "#A69B8E",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#FFFFFF",
          border: "#E2DED5",
        },
        ink: {
          DEFAULT: "#221811",
        },
      },
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        display: ["Newsreader", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 16px rgba(34,24,17,0.06)",
        glow: "0 0 24px rgba(223,80,12,0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};
