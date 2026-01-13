import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        smc: {
          primary: "rgb(var(--smc-primary) / <alpha-value>)",
          secondary: "rgb(var(--smc-secondary) / <alpha-value>)",
          info: "rgb(var(--smc-info) / <alpha-value>)",
          warning: "rgb(var(--smc-warning) / <alpha-value>)",
          success: "rgb(var(--smc-success) / <alpha-value>)",
          text: "rgb(var(--smc-text) / <alpha-value>)",
          textMuted: "rgb(var(--smc-text-muted) / <alpha-value>)",
          bg: "rgb(var(--smc-bg) / <alpha-value>)",
          card: "rgb(var(--smc-card) / <alpha-value>)",
          border: "rgb(var(--smc-border) / <alpha-value>)",
        },
      },
      borderRadius: {
        sm: "calc(var(--smc-radius) - 4px)",
        md: "var(--smc-radius)",
        lg: "var(--smc-radius-lg)",
        xl: "calc(var(--smc-radius-lg) + 4px)",
      },
      boxShadow: {
        card: "var(--smc-shadow)",
        soft: "0 10px 20px rgba(10, 20, 40, 0.08)",
      },
      spacing: {
        "smc-1": "var(--smc-space-1)",
        "smc-2": "var(--smc-space-2)",
        "smc-3": "var(--smc-space-3)",
        "smc-4": "var(--smc-space-4)",
        "layout-header": "var(--smc-layout-header)",
        "layout-sidebar": "var(--smc-layout-sidebar)",
        "layout-footer": "var(--smc-layout-footer)",
      },
    },
  },
  plugins: [],
};

export default config;
