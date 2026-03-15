# Architecture & Constraints

## Rendering Model
- Astro generates static HTML for all `/:countryCode/` routes at build time
- React is used only for interactive islands: Nav, CartSidebar, ProductActions, ImageCarousel, CartPage
- Cart state lives entirely client-side via Nanostores + localStorage

## Region-Based Routing
- All routes prefixed with country code: `/:countryCode/store`, `/:countryCode/store/:productId`
- `src/middleware.ts` maps country codes to Medusa regions (cached 1 hour)
- `src/lib/params/region-params.ts` and `product-params.ts` generate static paths at build time

## Key Constraints
- **Tailwind CSS v4**: No `tailwind.config.js` — configuration via `@theme` in CSS
- **Cloudflare edge runtime**: Avoid Node.js-only APIs
- The Medusa SDK is force-bundled for SSR via `vite.ssr.noExternal`
