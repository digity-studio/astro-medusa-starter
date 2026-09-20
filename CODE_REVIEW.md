# Code review guide

## Priorities

Review correctness and user-visible failure modes first, then security, compatibility, accessibility, performance, and maintainability. Verify the PR does what its description claims and does not silently widen its scope.

## Storefront checks

- Preserve country-prefixed routing and region lookup behavior under `src/pages/[countryCode]`, `src/middleware.ts`, and `src/lib/params`.
- Use Astro for static rendering and React only for interactive islands. Shared island state belongs in Nanostores rather than prop-drilling.
- Keep browser code compatible with the Cloudflare edge adapter and avoid Node-only runtime APIs.
- Treat checkout, cart persistence, prices, inventory, region selection, delivery, and payment paths as contract-sensitive. Check empty, loading, error, narrow viewport, and retry behavior where applicable.
- Use the Medusa SDK patterns already established in `src/lib/sdk.ts` and the data helpers. Do not expose server credentials to client bundles.
- Preserve Tailwind CSS v4's CSS-based configuration; this project intentionally has no `tailwind.config.js`.

## Evidence and severity

Run `yarn build`. A blocker is a security, data-isolation, money, migration, merge-gate, or fundamental correctness failure. Major findings cause material user-facing breakage or violate a protected contract. Minor findings are contained quality issues that can safely follow up. Findings should name the behavior, consequence, evidence, and smallest credible fix.
