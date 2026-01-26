// @ts-check
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      MEDUSA_BACKEND_URL: envField.string({
        context: "client",
        access: "public",
      }),
      MEDUSA_PUBLISHABLE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      DEFAULT_REGION: envField.string({ context: "client", access: "public" }),
    },
  },
});
