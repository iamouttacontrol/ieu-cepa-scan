/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1a5276",
        secondary: "#2e86c1",
        accent: "#f39c12",
        success: "#27ae60",
        danger: "#e74c3c",
        warning: "#f39c12",
      },
    },
  },
  plugins: [],
};
