import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt", // Changed from "autoUpdate" - user must confirm updates
      includeAssets: ["favicon.ico", "robots.txt"],
      injectRegister: "auto",
      strategies: "generateSW",

      // Manifest handled externally by dynamic-manifest edge function
      manifest: false,

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        cleanupOutdatedCaches: true,
        skipWaiting: false, // Changed from true - don't auto-skip, let user confirm
        clientsClaim: false, // Changed from true - don't auto-claim, prevents unexpected reloads
        sourcemap: false,
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/rufeqqwcnyzvmelzezgl\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 5,
            },
          },
        ],
        navigationPreload: true,
      },

      devOptions: {
        enabled: false, // Disabled in dev to prevent interference during development
      },
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
