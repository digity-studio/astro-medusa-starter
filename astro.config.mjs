import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({
    imageService: "compile",
  }),
  integrations: [react()],
  server: {
    port: 8000,
    host: true,
  },
  vite: {
    ssr: {
      noExternal: ["@medusajs/js-sdk"],
    },
    plugins: [tailwindcss()],
  },
  image: {
    domains: ["medusa-public-images.s3.eu-west-1.amazonaws.com"],
  },
});
