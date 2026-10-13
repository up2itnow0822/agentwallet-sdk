import { defineConfig } from "vite";
export default defineConfig({
  resolve: { dedupe: ["viem", "react", "react-dom"] },
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
});
