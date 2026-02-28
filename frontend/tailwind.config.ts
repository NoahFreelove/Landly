import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#3211d4",
          dark: "#240c9a",
          light: "#5835f5",
        },
        surface: {
          page: "#131022",
          card: "#1d1c27",
          elevated: "#1c182f",
        },
        border: {
          DEFAULT: "#2b2839",
          light: "#2d2a42",
        },
        accent: {
          red: "#ef4444",
          green: "#00cc66",
          yellow: "#f59e0b",
          klarna: "#ffb3c7",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(50, 17, 212, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(50, 17, 212, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
