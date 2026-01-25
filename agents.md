# AGENTS.md — Core Rules

## Invariants (must always be respected)

- Next.js 16.0.1 App Router
- Server components by default
- Auth / Prisma / CI must not break
- All Prisma models must use UUID primary keys (no auto-increment IDs)
- No secrets or env changes
- Build, lint, type-check, tests must pass
- Prefer UUID primary keys on models
- Do not modify Prisma migration files
- Do not modify Prisma models unless explicitly requested
- Favor UI interaction tests (React Testing Library + fireEvent) for links/buttons when validating navigation flows.
- All links and buttons must use `cursor-pointer`.

## Preferences (follow unless justified)

- Reuse existing components or shadcn  before creating new ones
- Prefer composition and variants over duplication 
- Tailwind + Radix over custom CSS
- When creating pages or components, build on shadcn components first, align tokens/styles with `app/globals.css`, then extend via `tailwind.config.ts` if needed.
- Follow existing API route patterns; add server actions only when they fit the current flow
- Generated page content should be written in English.

## Freedom

- You may propose UX or architecture improvements
- You may create new components if reuse is not reasonable
- You may suggest refactors (do not apply without approval)

## Workflow

- Plan → Code → Verify → Summarize

## Stack notes

- Next.js 16.0.1 App Router (TypeScript) with `@/*` alias; `app/layout.tsx` wraps pages with `AuthProvider` and `ThemeProvider` (no React Query layer).
- Prisma targets MySQL; keep generator binary targets as-is in `prisma/schema.prisma`.
- Seed data lives in `prisma/seed.ts`
- Tests run with Jest using `tests/setup-jest.js` (default environment: node; switch to jsdom per test when rendering UI).

## Dev commands

- `npm run dev` to develop; `npm run lint`, `npm run typecheck`, `npm test` before shipping.
- DB utilities: `npm run prisma:generate` and `npm run db:seed` (demo drivers/customers/bookings/services).
- Build/start: `npm run build` then `npm run start`.

## UI / UX patterns

- Use Tailwind theme tokens and shadcn-style components in `components/ui/*` (`Button`, `Card`, `Dialog`, `Form`, etc.) with `cn` helper; prefer variants over new CSS.
- Reuse layout helpers (e.g., `SiteHeader`, `SiteFooter`, landing blocks) before creating new shells.
- New `page.tsx` files must define metadata, stay responsive, align with site themes/colors, and maintain an elegant look.
- Designs are for laptops and bug screens
- Keep brand styling consistent with `app/globals.css` (Tailwind v4, Public Sans/Space Grotesk, gold/navy palette).
- Use NextAuth session data for gating/protection; favor server components and server actions for mutations.

## Routing & data flow

- `middleware.ts` uses `auth` 
- Prefer SSR when creating or updating pages; use client fallbacks only for dynamic portions. Centralize static fallback/seed data in `prisma/seed.ts`
