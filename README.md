# Matchmaker

System för att schemalägga och organisera padelmatcher — hanterar spelare, banor, återkommande tider, bokningar och automatiserade aviseringar via SMS och Telegram.

## Tech Stack

- **Frontend:** Nuxt 4 + Vue 3 + TypeScript
- **UI:** @nuxt/ui (glassmorphism dark theme)
- **Database:** PostgreSQL (via `postgres` driver)
- **Notifications:** Telegram (grammy), SMS (eget gateway)
- **Booking systems:** Court22, Matchi
- **Testing:** Cucumber (BDD)
- **Package manager:** bun

## Projektstruktur

```
src/nuxt/
├── app/
│   ├── components/     # Vue-komponenter (grupperade per domän)
│   │   ├── home/      # Startsida-widgets (chart, stats, sales)
│   │   ├── players/    # Spelarhantering (list, select, delete, messages)
│   │   ├── halls/     # Hallhantering (add, edit, delete, availability)
│   │   ├── weekly-times/  # Återkommande tider
│   │   ├── customers/ # Kundhantering
│   │   ├── inbox/     # Inkorg
│   │   └── ...
│   ├── composables/   # Dela Vue-logik (useDashboard, etc.)
│   ├── layouts/       # admin.vue (dark), default.vue (light)
│   ├── pages/        # Sidor (admin/*, index, poster, etc.)
│   ├── types/         # TypeScript-typer (database.ts)
│   └── utils/         # Hjälpfunktioner
├── server/
│   └── lib/           # Server-side bibliotek
│       ├── booking-systems.ts  # Court22 + Matchi integration
│       └── postgres.ts        # DB-anslutning
└── public/            # Statiska assets
environments/
├── dev/               # Docker Compose + Tilt för lokal utveckling
└── common/            # Delade Kubernetes-config (Dockerfile, entrypoint)
```

## Kom igång

### Förutsättningar

- [bun](https://bun.sh) (package manager)
- Docker / Docker Compose (för lokal databas)

### Installation

```bash
cd src/nuxt
bun install
```

### Utveckling

Starta lokal databas:
```bash
cd environments/dev
docker compose up -d
```

Starta Nuxt dev-server:
```bash
cd src/nuxt
bun run dev
```

Appen körs på `http://localhost:3000`.

### Tester

```bash
bun test                    # Kör alla cucumber-tester
bun test:local             # Kör mot lokal databas
bun test:report            # Generera HTML-rapport
```

### Miljövariabler

Kopiera och fyll i:
```bash
cp src/nuxt/.env.example src/nuxt/.env
```

Variabler som behövs:
- `DATABASE_URL` — PostgreSQL-anslutningssträng
- `SMS_GATEWAY_URL`, `SMS_GATEWAY_USERNAME`, `SMS_GATEWAY_PASSWORD` — SMS-gateway
- `TELEGRAM_BOT_TOKEN` — Telegram-bot
- `OPENAI_API_KEY` — OpenAI (för AI-genererade svar)
- `ADMIN_TELEGRAM_CHAT_ID` — Admin-Telegram-chat för notiser

## Designbeslut

### Två layouter

Appen har två distinkta layouter:
- **`admin.vue`** — Mörk glassmorphism sidebar för admin-arbete
- **`default.vue`** — Ljus, enkel navbar för publikt gränssnitt

### Bokningssystem

Matchmaker stödjer två externa bokningssystem (Court22 och Matchi). Båda kontrolleras via `server/lib/booking-systems.ts` som förenar dem bakom ett gemensamt API. Om en hall inte har något system kopplat skickas SMS ändå (ingen verifiering).

### Spelargenerering

Spelare genereras med ELO-rating och hanteras genom admin-interfacet. ELO används för att para ihop jämnbördiga spelare.

## Scripts

| Kommando | Beskrivning |
|----------|-------------|
| `bun run dev` | Starta dev-server |
| `bun run build` | Bygg för produktion |
| `bun run generate` | Generera statisk site |
| `bun run preview` | Förhandsvisa produktion |
| `bun test` | Kör BDD-tester |

## Licens

Privat projekt.
