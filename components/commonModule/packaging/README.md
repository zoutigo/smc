# Packaging module (common extraction)

This folder hosts the configuration we would plug into a future common module
builder. It re-uses the existing packaging implementation without changing
current routes. Nothing is wired yet; it’s a snapshot of what would be needed:

- `config.ts`: high-level descriptor (registry path, forms, pages, actions).
- `types.ts`: minimal shared types for the config.

When we later build the shared builder, we can consume this config to render
pages/forms/actions for other domains (storage/transport) without duplicating
the packaging code.

