/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          background: "rgb(var(--color-background) / <alpha-value>)",
          text: "rgb(var(--color-text) / <alpha-value>)",
          muted: "rgb(var(--color-muted) / <alpha-value>)",
          primary: "rgb(var(--color-primary) / <alpha-value>)",
          coral: "rgb(var(--color-coral) / <alpha-value>)",
          peach: "rgb(var(--color-peach) / <alpha-value>)",
          danger: "rgb(var(--color-danger) / <alpha-value>)",
          warning: "rgb(var(--color-warning) / <alpha-value>)",
          success: "rgb(var(--color-success) / <alpha-value>)",
          info: "rgb(var(--color-info) / <alpha-value>)",
          income: "rgb(var(--color-income) / <alpha-value>)",
          expense: "rgb(var(--color-expense) / <alpha-value>)",
          surface: "rgb(var(--color-surface) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
          "border-dark": "rgb(var(--color-border-dark) / <alpha-value>)",
        },
      },
      borderRadius: {
        app: "1.25rem",
        "app-lg": "1.5rem",
        "app-sm": "0.75rem",
        "app-xs": "0.625rem",
      },
      boxShadow: {
        app: "var(--shadow-card)",
        "app-soft": "var(--shadow-soft)",
        "app-float": "var(--shadow-float)",
      },
      fontFamily: {
        sans: [
          '"Funnel Display"',
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      fontSize: {
        hero: ["3rem", { lineHeight: "3.5rem", fontWeight: "700" }],
        page: ["2rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        total: ["1.75rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        section: ["1.375rem", { lineHeight: "1.875rem", fontWeight: "700" }],
        card: ["1.125rem", { lineHeight: "1.625rem", fontWeight: "600" }],
        compact: ["0.875rem", { lineHeight: "1.25rem" }],
        caption: ["0.75rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};
