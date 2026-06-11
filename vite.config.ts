import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "admin-write",
      configureServer(server) {
        server.middlewares.use("/api/save-deck", (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end();
            return;
          }
          let body = "";
          req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
          req.on("end", () => {
            try {
              const { deckId, content } = JSON.parse(body);
              if (!/^[a-z0-9_-]+$/i.test(deckId)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: "invalid deckId" }));
                return;
              }
              const dataDir = path.join(process.cwd(), "data");
              const filePath = path.join(dataDir, `${deckId}.json`);
              if (!filePath.startsWith(dataDir + path.sep)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: "invalid path" }));
                return;
              }
              // Validate the payload so a buggy client can't write a deck file
              // that breaks the next dev-server boot.
              const parsed = JSON.parse(content);
              if (
                parsed.id !== deckId ||
                !Array.isArray(parsed.events) ||
                parsed.events.length === 0
              ) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: "invalid deck content" }));
                return;
              }
              fs.writeFileSync(filePath, content, "utf-8");
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
        });
      },
    },
  ],
});
