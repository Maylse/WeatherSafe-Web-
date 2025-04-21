import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/WeatherSafe-Web-/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://weathersafeapi.onrender.com",
        // target: "http://192.168.254.154:8000",
        changeOrigin: true,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    },
  },
});
