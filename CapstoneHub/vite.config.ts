import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { existsSync, createReadStream } from "fs";

const labsDist = path.resolve(__dirname, "dist", "labs");

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

/** Serve built labs from dist/ when proxy target is unavailable (dev without running lab servers) */
function serveLabsFallback() {
  return {
    name: "serve-labs-fallback",
    enforce: "pre" as const,
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        const match = pathname.match(/^\/labs\/([^/]+)(\/.*)?$/);
        if (!match) return next();
        const slug = match[1];
        const subPath = match[2] === undefined || match[2] === "" ? "/" : match[2];
        const labDir = path.join(labsDist, slug);
        if (!existsSync(labDir)) return next();
        const filePath = subPath === "/" ? "index.html" : subPath.replace(/^\//, "");
        const file = path.join(labDir, filePath);
        if (!existsSync(file)) return next();
        const ext = path.extname(file);
        res.setHeader("Content-Type", MIME[ext] ?? "application/octet-stream");
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  server: {
    host: "::",
    port: 3000,
    proxy: {
      "/labs/exposure": { target: "http://localhost:3001", changeOrigin: true, ws: true },
      "/labs/bit-depth": { target: "http://localhost:3002", changeOrigin: true, ws: true },
      "/labs/demosaic": { target: "http://localhost:3003", changeOrigin: true, ws: true },
      "/labs/image": { target: "http://localhost:3004", changeOrigin: true, ws: true },
      "/labs/photon-sim": { target: "http://localhost:3005", changeOrigin: true, ws: true },
    },
  },
  plugins: [serveLabsFallback(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@content": path.resolve(__dirname, "./content"),
    },
  },
});
