import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        skin: {
          50: "#fdf8f6",
          100: "#f9ede7",
          200: "#f2d5c7",
          300: "#e8b49d",
          400: "#da8b6a",
          500: "#cc6b47",
          600: "#b85234",
          700: "#99402a",
          800: "#7d3527",
          900: "#682e24",
        },
        sage: {
          50: "#f6f7f5",
          100: "#eaede6",
          200: "#d4dace",
          300: "#b3bea8",
          400: "#8fa07f",
          500: "#6f8362",
          600: "#576a4d",
          700: "#46563e",
          800: "#3a4534",
          900: "#313a2d",
        },
        cream: {
          50: "#fefdf9",
          100: "#fdf8ee",
          200: "#f9eed5",
          300: "#f4dfab",
          400: "#edc977",
          500: "#e5b04e",
        },
        charcoal: {
          900: "#1a1714",
          800: "#2d2925",
          700: "#403b36",
          600: "#544d47",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        shimmer: "shimmer 2s infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
