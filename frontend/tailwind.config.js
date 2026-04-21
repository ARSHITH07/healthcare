/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#2563eb",
        brandDark: "#1d4ed8",
        valid: "#16a34a",
        danger: "#dc2626",
        slateBg: "#f3f4f6",
        ink: "#0f172a"
      },
      boxShadow: {
        soft: "0 12px 35px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        dashboardGlow:
          "radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 30%), radial-gradient(circle at right 20%, rgba(22, 163, 74, 0.12), transparent 28%)"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        floatIn: "floatIn 280ms ease-out"
      }
    }
  },
  plugins: []
};
