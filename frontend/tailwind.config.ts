import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        "card-border": "var(--card-border)",
      },
      ringColor: {
        primary: "var(--ring)",
      },
      keyframes: {
        typing: {
          from: {
            width: "0",
          },
          to: {
            width: "8ch",
          },
        },
        blink: {
          "0%, 80%": {
            borderColor: "var(--primary)",
          },
          "40%": {
            borderColor: "transparent",
          },
          "100%": {
            borderColor: "transparent",
            borderWidth: "0",
          },
        },
      },
      animation: {
        typing:
          "typing 3.5s steps(8, end) forwards, blink .75s step-end 8 forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
