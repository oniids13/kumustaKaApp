import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "s5pgmhuomr.loclx.io", // Allow LocalXpose URL
      "localhost", // Keep localhost access
    ],
  },
});
