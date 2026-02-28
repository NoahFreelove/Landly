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
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
          light: "#60A5FA",
        },
        surface: {
          page: "#FAFBFC",
          card: "#FFFFFF",
          elevated: "#F3F4F6",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
        },
        accent: {
          red: "#EF4444",
          green: "#10B981",
          yellow: "#F59E0B",
          klarna: "#FFB3C7",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { opacity: "0.5" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
