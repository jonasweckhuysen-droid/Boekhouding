import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Boekhouding/",  // Let op hier: juiste naam van je repo
});
