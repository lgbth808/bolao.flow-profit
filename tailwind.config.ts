import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#111111",
      ink: "#111111",
      coal: "#111111",
      field: "#0F3D2E",
      canary: "#F2C230",
      mist: "#FFF0D6",
      line: "#F2C230",
      rose: "#EB3D8C",
      red: {
        50: "#FFF6E5",
        100: "#FFF6E5",
        200: "#EB3D8C",
        300: "#EB3D8C",
        700: "#EB3D8C"
      }
    },
    extend: {
      boxShadow: {
        panel: "0 18px 45px rgba(17, 17, 17, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
