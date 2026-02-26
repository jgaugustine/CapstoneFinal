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

/** Serve built labs from dist/labs in dev and preview so /labs/exposure/ etc. load the lab app. */
function serveLabsFallback() {
  const serveLab = (req: import("connect").IncomingMessage, res: import("http").ServerResponse, next: () => void, labRoot: string) => {
    const pathname = req.url?.split("?")[0] ?? "";
    const match = pathname.match(/^\/labs\/([^/]+)(\/.*)?$/);
    if (!match) return next();
    const slug = match[1];
    const subPath = match[2] === undefined || match[2] === "" ? "/" : match[2];
    const labDir = path.join(labRoot, slug);
    if (!existsSync(labDir)) return next();
    const filePath = subPath === "/" ? "index.html" : subPath.replace(/^\//, "");
    const file = path.join(labDir, filePath);
    if (!existsSync(file)) return next();
    const ext = path.extname(file);
    res.setHeader("Content-Type", MIME[ext] ?? "application/octet-stream");
    createReadStream(file).pipe(res);
  };

  return {
    name: "serve-labs-fallback",
    enforce: "pre" as const,
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((req, res, next) => serveLab(req, res, next, labsDist));
    },
    configurePreviewServer(server: import("vite").PreviewServer) {
      server.middlewares.use((req, res, next) => serveLab(req, res, next, path.join(__dirname, "dist", "labs")));
    },
  };
}

export default defineConfig({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [serveLabsFallback(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@content": path.resolve(__dirname, "./content"),
    },
  },
});
