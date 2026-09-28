import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:     "#07090f",
        surf:   "#0d1017",
        card:   "#111520",
        card2:  "#141927",
        gold:   "#f0b429",
        gold2:  "#fcd34d",
        green:  "#22c55e",
        ink:    "#f1f5f9",
        muted:  "#64748b",
        border: "rgba(255,255,255,0.07)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
