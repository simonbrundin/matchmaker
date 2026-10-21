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

<!-- wiki:start -->
## Kunskaps-wiki

Det här repot delar en gemensam kunskaps-wiki med alla andra repor.
Wikin ligger i `~/wiki`.

**Två regler:**

1. **Läs wikin innan du frågar användaren.** Svaret finns ofta redan
   dokumenterat - leta först.
2. **Skriv en not i wikin inbox när något stort händer.** Incident, beslut,
   ny feature eller en icke-obvious bugg.

```bash
wikictl search "bigram"                  # sök i hela wikin
wikictl search "fel" --project <repo>    # sök inom ett projekt
wikictl note --title "Rubrik" --tags "bug" --body "Vad som hände och varför."
wikictl ingest                          # flytta inboxen in i grafen
```

Anteckningar taggas automatiskt med `projekt:<repo>`.
Schemat för wikin står i `~/wiki/AGENTS.md`.
<!-- wiki:end -->
