import Medusa from "@medusajs/js-sdk";

const MEDUSA_BACKEND_URL = import.meta.env.MEDUSA_BACKEND_URL;
const MEDUSA_PUBLISHABLE_KEY = import.meta.env.MEDUSA_PUBLISHABLE_KEY;
const isDevEnvironment = import.meta.env.DEV;

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
  debug: isDevEnvironment,
});
