import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        coal: "#1f2937",
        field: "#0f7a4f",
        canary: "#f4c430",
        mist: "#f4f7fb",
        line: "#d7dde8"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(20, 33, 61, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
