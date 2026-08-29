import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Archivo", "system-ui", "sans-serif"],
        body: ["Archivo", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        paper: "#f3f2f2",
        surface: "#eae9e9",
        ink: "#201e1d",
        signal: {
          DEFAULT: "#ec3013",
          50: "#fff2ef",
          100: "#ffe0d9",
          200: "#ffc4b8",
          300: "#ff9783",
          500: "#ff563c",
          600: "#dd2b0f",
          700: "#ae1800",
          800: "#7c1405",
        },
      },
      borderRadius: { none: "0" },
      letterSpacing: { tightest: "-0.03em", tighter: "-0.02em" },
    },
  },
  plugins: [],
};
export default config;