/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          background: "#F4F6F8",
          sidebar: "#0B0F14",
          card: "#FFFFFF",
          primary: "#10B981",
          text: "#111827",
          muted: "#6B7280",
          danger: "#EF4444",
          warning: "#F59E0B",
          border: "#E5E7EB",
        },
      },
      borderRadius: {
        app: "1rem",
        "app-sm": "0.625rem",
      },
      boxShadow: {
        app: "0 18px 45px rgba(15, 23, 42, 0.07)",
        "app-soft": "0 12px 28px rgba(15, 23, 42, 0.06)",
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
