# Matchmaker - Development Notes

## Package Manager

**This project uses `bun` as the package manager.** Do NOT use npm or pnpm.

### Commands

- `bun install` - Install dependencies
- `bun add <package>` - Add a package
- `bun remove <package>` - Remove a package
- `bun run <script>` - Run a script

### Why Bun?

- Faster installation than npm/pnpm
- Native TypeScript support
- SQLite support via better-sqlite3

## Database

This project uses **PostgreSQL** for data storage, not Supabase.

- Local development: Docker Compose with postgres:16-alpine
- Connection via `DATABASE_URL` environment variable

## Development

- Run local dev: `cd environments/dev && docker compose up -d`
- Or use Tilt: `cd environments/dev && tilt up`
