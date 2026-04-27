import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f3eadf",
        paper: "#fffaf2",
        oat: "#e8dac9",
        cocoa: "#2d211c",
        bark: "#6f5f57",
        peach: "#f6bd85",
        peachDeep: "#cf8a4e",
        lavender: "#b8a2dd",
        sage: "#d9e1c9",
        forest: "#244832",
        ink: "#2d211c",
        leaf: "#2f855a",
        mango: "#f59e0b",
        clay: "#b45309",
        skywash: "#e0f2fe"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(45, 33, 28, 0.08)",
        editorial: "0 18px 40px rgba(45, 33, 28, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        editorial: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
