import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/Inventory/",
  plugins: [react()],
  optimizeDeps: {
    include: ["ag-grid-community", "ag-grid-react"],
  },
});
