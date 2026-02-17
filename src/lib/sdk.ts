import Medusa from "@medusajs/js-sdk";

const MEDUSA_BACKEND_URL = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL;

const MEDUSA_PUBLISHABLE_KEY = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY;

const isDevEnvironment = import.meta.env.DEV;

if (!MEDUSA_BACKEND_URL) {
  console.warn("PUBLIC_MEDUSA_BACKEND_URL environment variable is not set.");
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
  debug: isDevEnvironment,
});
