# Att göra lista

## Prio 1 — Stabilitet & Säkerhet

- [ ] Add authentication middleware to admin routes
- [ ] Add Zod validation to API routes
- [ ] Write unit tests for booking logic (create/cancel/confirm)

## Prio 2 — Integrationer

- [ ] Implement webhooks for Matchi booking system
- [ ] Add Court22 API rate-limit retry logic
- [ ] Handle player deactivation when ELO data source is unreachable

## Prio 3 — Spelarupplevelse

- [ ] Add SMS delivery status tracking (sent/delivered/failed)
- [ ] Implement waitlist notification when a booking slot opens up
- [ ] Create weekly recurring time slot conflict detection

## Prio 4 — DevOps & Underhåll

- [ ] Create GitHub Actions CI pipeline with lint + type-check + test
- [ ] Add database migration scripts for schema changes
- [ ] Document booking state machine (pending → confirmed → completed/cancelled)
