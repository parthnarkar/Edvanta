import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Increase warning threshold to reduce noisy warnings (kb)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split large node_modules packages into smaller manual chunks
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor_react';
            if (id.includes('lucide-react')) return 'vendor_icons';
            if (id.includes('three') || id.includes('spline')) return 'vendor_3d';
            if (id.includes('@mui') || id.includes('tailwindcss')) return 'vendor_ui';
            return 'vendor';
          }
        },
      },
    },
  },
});
