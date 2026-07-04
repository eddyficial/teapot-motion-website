import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.BASE_PATH || "./",
  server: {
    host: "127.0.0.1",
    port: 5174,
  },
  preview: {
    host: "127.0.0.1",
    port: 4174,
  },
});
