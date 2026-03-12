# Astro Medusa Storefront

A blazing-fast, open-source ecommerce storefront built with **Astro**, **React**, and **Medusa v2** — deployed to the edge on **Cloudflare Workers**.

Static-first architecture. Interactive where it matters. Zero compromise on performance.

## Tech Stack

| Layer      | Technology                                                                               |
| ---------- | ---------------------------------------------------------------------------------------- |
| Framework  | [Astro 6](https://astro.build) — static HTML, islands of interactivity                   |
| UI         | [React 19](https://react.dev) — only where you need it                                   |
| Styling    | [Tailwind CSS v4](https://tailwindcss.com) — zero-config Vite plugin                     |
| Backend    | [Medusa v2](https://medusajs.com) — headless commerce engine                             |
| Payments   | [Stripe](https://stripe.com) — secure checkout                                           |
| State      | [Nanostores](https://github.com/nanostores/nanostores) — tiny, framework-agnostic stores |
| Forms      | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) validation       |
| Deployment | [Cloudflare Workers](https://workers.cloudflare.com) — edge-first                          |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                Cloudflare Workers                │
│                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │  Static  │  │  Astro   │  │    React     │  │
│   │   HTML   │──│Middleware│──│   Islands    │  │
│   │  (SSG)   │  │ (Region) │  │ (Cart, Nav)  │  │
│   └──────────┘  └──────────┘  └──────┬───────┘  │
│                                       │         │
└───────────────────────────────────────┼─────────┘
                                        │
                              ┌─────────▼─────────┐
                              │   Medusa v2 API   │
                              │  (Your backend)   │
                              └─────────┬─────────┘
                                        │
                              ┌─────────▼─────────┐
                              │      Stripe       │
                              └───────────────────┘
```

**Static where possible, dynamic where necessary:**

- Product pages, store listing, and landing page are statically generated at build time
- Medusa webhooks trigger a re-deploy when products are created, updated, or deleted — keeping static pages in sync
- Product variant availability is refreshed client-side to prevent stale inventory data
- Cart, checkout, and navigation hydrate as interactive React islands
- Middleware handles region detection and country-based routing
- Cart state persists client-side via Nanostores + `localStorage`

## Pages

| Route                        | Description                                      |
| ---------------------------- | ------------------------------------------------ |
| `/:country/`                 | Landing page                                     |
| `/:country/store`            | Product catalog                                  |
| `/:country/store/:productId` | Product detail with image carousel               |
| `/:country/cart`             | Shopping cart                                    |
| `/:country/checkout`         | Multi-step checkout (address, shipping, payment) |
| `/:country/order/confirmed`  | Order confirmation                               |

All routes are prefixed with an ISO-2 country code for region-based pricing and shipping.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Yarn](https://yarnpkg.com) 4.x
- A running [Medusa v2](https://docs.medusajs.com) backend
- [Stripe](https://stripe.com) account (for payments)

### Setup

```bash
# Clone the repo
git clone https://github.com/bystrol/astro-medusa-starter.git
cd astro-medusa-starter/

# Install dependencies
yarn

# Configure environment
cp .env.example .env
```

Fill in your `.env`:

```env
PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
DEFAULT_REGION=us
PUBLIC_STRIPE_KEY=pk_test_...
S3_DOMAIN=your-bucket.s3.us-east-1.amazonaws.com
```

> Make sure your Medusa backend has [CORS configured](https://docs.medusajs.com/learn/configurations/medusa-config#httpstorecors) to allow requests from your storefront origin.

### Development

```bash
yarn dev        # Start dev server on localhost:8000
```

### Production

```bash
yarn build      # Build for Cloudflare Workers
yarn preview    # Preview the production build locally
```

## Project Structure

```
src/
├── assets/              # Static assets (images, fonts)
├── components/          # Shared UI components
├── layouts/             # Page layouts
├── lib/
│   ├── sdk.ts           # Medusa SDK singleton
│   ├── stores/          # Nanostores (cart state)
│   ├── params/          # Static path generation
│   └── utils/           # Helpers (pricing, stock, etc.)
├── loaders/             # Astro content loaders
├── middleware.ts         # Region detection & routing
├── modules/
│   ├── cart/            # Cart page & sidebar
│   ├── checkout/        # Multi-step checkout flow
│   ├── layout/          # Nav, footer
│   ├── order/           # Order confirmation
│   └── products/        # Product cards, detail, carousel
├── pages/
│   └── [countryCode]/   # All routes, region-prefixed
├── styles/              # Global styles & Tailwind theme
└── types/               # TypeScript type definitions
```

## Key Design Decisions

- **Islands architecture** — React only loads for interactive components (cart, nav, checkout). Everything else ships as zero-JS static HTML.
- **Real-time inventory checks** — Product variant stock data is fetched client-side on page load, ensuring accurate availability even though pages are statically generated.
- **Edge deployment** — Cloudflare Workers adapter means your storefront runs close to your customers, everywhere.
- **Tailwind v4** — No config file. Theme customization lives in CSS with `@theme`. Powered by the Vite plugin.
- **Region-aware routing** — Country code in the URL drives pricing, currency, and available shipping options — all resolved via Medusa regions.

## License

[MIT](LICENSE)

## Author

**Michal Bystryk** — [LinkedIn](https://www.linkedin.com/in/michal-bystryk/)
