import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/Inventory/",
  plugins: [react()],
  optimizeDeps: {
    include: ["ag-grid-community", "ag-grid-react"],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 kB for ag-grid
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate ag-grid into its own chunk
          "ag-grid": ["ag-grid-react", "ag-grid-community"],
          // React and ReactDOM in vendor chunk
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
});
