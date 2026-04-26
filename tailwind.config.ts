import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        leaf: "#2f855a",
        mango: "#f59e0b",
        clay: "#b45309",
        skywash: "#e0f2fe"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
