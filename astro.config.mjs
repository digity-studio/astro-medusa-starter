// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
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
