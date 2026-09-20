# Backward compatibility

## Protected surfaces

- **Routes and parameters:** country-prefixed storefront URLs under `src/pages/[countryCode]`, product identifiers, and order-confirmation navigation.
- **Medusa contracts:** SDK configuration, Store API request parameters, response assumptions in `src/lib/data`, region selection, cart state, checkout steps, delivery options, payment sessions, and order creation.
- **Persisted browser state:** Nanostores/localStorage cart keys and serialized shapes.
- **Deployment configuration:** Cloudflare adapter behavior, `wrangler.jsonc`, public asset headers, and environment-variable names consumed by Astro configuration.
- **Component-facing types:** exported types and props used across Astro pages and React islands.

## Breaking changes

A change is breaking when existing links stop resolving, saved carts become unreadable, established Medusa requests or response handling stop working, checkout semantics change without migration, deployment configuration becomes incompatible, or a shared component/type consumer must change immediately.

## Required path

Prefer additive changes and tolerant reads. For an unavoidable breaking change, document affected consumers and rollout order in the PR, provide a compatibility or migration path, exercise both sides of the contract, and state rollback limits. Persisted-state migrations must tolerate older data. Route changes should retain redirects or aliases for an explicit deprecation period. Configuration renames must accept the previous name during migration or include a coordinated deployment plan.
