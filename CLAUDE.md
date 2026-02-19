# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev           # Start dev server on port 8000
yarn build         # Production build (Cloudflare Pages)
yarn preview       # Preview production build
yarn astro <cmd>   # Direct Astro CLI access
```

No test runner is configured in this project.

Linting is via ESLint v9 flat config (`eslint.config.js`) with TypeScript and Astro plugins. Formatting via Prettier with `prettier-plugin-astro`.

## Environment Variables

Copy `.env.example` to `.env` and set:

| Variable | Purpose |
|----------|---------|
| `PUBLIC_MEDUSA_BACKEND_URL` | Medusa API endpoint (e.g., `http://localhost:9000`) |
| `PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Storefront sales channel publishable key |
| `DEFAULT_REGION` | Fallback country ISO-2 code (e.g., `us`) |

The `PUBLIC_` prefix exposes variables to client code via `import.meta.env`.

## Architecture

This is an Astro-based storefront for a Medusa v2 backend, deployed to Cloudflare Pages.

**Rendering model:**
- Astro generates static HTML for all `/:countryCode/` route combinations at build time
- React is used only for interactive islands: `Nav`, `CartSidebar`, `ProductActions`, `ImageCarousel`, `CartPage`
- Cart state lives entirely client-side via Nanostores + `localStorage`

**Region-based routing:**
- All routes are prefixed with a country code: `/:countryCode/store`, `/:countryCode/store/:productId`
- `src/middleware.ts` intercepts requests, maps country codes to Medusa regions, and attaches region data
- Regions are fetched from Medusa and cached for 1 hour
- `src/lib/params/region-params.ts` and `product-params.ts` generate static paths at build time

**Medusa integration (`src/lib/sdk.ts`):**
- Singleton `Medusa` client from `@medusajs/js-sdk`, configured with backend URL and publishable key
- Used both server-side (Astro pages, loaders, middleware) and client-side (React cart components)
- The SDK is force-bundled for SSR via `vite.ssr.noExternal`

**State management (`src/lib/stores/cart.ts`):**
- Nanostores atoms: `$cart`, `$isCartSidebarOpen`, `$regionId`
- Computed store: `$cartItemCount` derived from `$cart`
- React components subscribe via `useStore()` from `@nanostores/react`
- `initCart()` loads cart ID from `localStorage` on mount or creates a new cart

**Module structure (`src/modules/`):**
- Feature-based: `products/`, `layout/`, `cart/`
- Each module has a `components/` subdirectory with `.astro` (static) and `.tsx` (interactive) files
- `src/lib/utils/` contains pure helpers: `money.ts`, `get-product-price.ts`, `is-product-in-stock.ts`, etc.

**Content loading:**
- `src/loaders/store-loader.ts` is an Astro content loader that fetches the product collection

## Path Aliases (tsconfig.json)

```
@assets/*    → src/assets/*
@components/* → src/components/*
@layouts/*   → src/layouts/*
@lib/*       → src/lib/*
@loaders/*   → src/loaders/*
@modules/*   → src/modules/*
@pages/*     → src/pages/*
@styles/*    → src/styles/*
@types/*     → src/types/*
```

## Astro Coding Standards

- Use `.astro` components for static content and layout; use React only when interactivity is needed
- Use `client:visible` for components that hydrate when visible in the viewport
- Use `client:load` for components that should hydrate immediately
- Use `client:idle` for non-critical UI that can wait until the browser is idle
- Use `client:only` for components that should never render on the server
- Use `client:media` for components that should only hydrate at specific breakpoints
- Implement shared state with nanostores instead of prop drilling between islands
- Use `Astro.cookies` for server-side cookie management
- Use `import.meta.env` for environment variables
- Leverage Server Endpoints for API routes
- Use Astro middleware for request/response modification

## Key Constraints

- Tailwind CSS v4 is used via `@tailwindcss/vite` Vite plugin — there is no `tailwind.config.js`; configuration is done in CSS using `@theme`
- The Cloudflare adapter requires Astro output mode compatible with edge runtime; avoid Node.js-only APIs
- Image optimization is configured to allow `medusa-public-images.s3.eu-west-1.amazonaws.com` as an external domain
