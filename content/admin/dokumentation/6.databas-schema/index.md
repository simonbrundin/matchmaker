---
title: Databas-schema
description: Tabeller och relationer i databasen
---

# Databas-schema

Systemet använder PostgreSQL via Supabase. Här är en översikt över databastabellerna och deras relationer.

## ER-diagram (förenklat)

```
players ──────┬────── booked_players ──────┬────── bookings
              │                            │
              │                            │
              └── messages                 └── weekly_times
              │
              └── unavailabilities
              │
              └── ai_response_suggestions
```

## Tabeller

### players

Kärntabellen för alla spelare.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | UUID | Primärnyckel |
| `name` | TEXT | Spelarens namn |
| `phone` | TEXT | Telefonnummer (unik) |
| `elo` | INTEGER | ELO-rating (default 1500) |
| `is_active` | BOOLEAN | Aktiv-status |
| `is_friend` | BOOLEAN | Vän-status |
| `win_rate` | DECIMAL | Vinstandel (0.0-1.0) |
| `last_contacted_at` | TIMESTAMP | Senaste kontakt |
| `created_at` | TIMESTAMP | Skapad |
| `updated_at` | TIMESTAMP | Uppdaterad |

### bookings

Bokningar för padelpass.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | UUID | Primärnyckel |
| `scheduled_date` | DATE | Datum för bokningen |
| `scheduled_time` | TIME | Tid för bokningen |
| `status` | TEXT | pending/invited/confirmed/cancelled/completed |
| `created_at` | TIMESTAMP | Skapad |
| `updated_at` | TIMESTAMP | Uppdaterad |

### booked_players

Kopplingstabell mellan bokningar och spelare.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | UUID | Primärnyckel |
| `booking_id` | UUID | FK till bookings |
| `player_id` | UUID | FK till players |
| `status` | TEXT | invited/confirmed/declined |
| `response` | TEXT | Spelarens svar (ja/nej/kanske) |
| `invite_number` | INTEGER | Vilken inbjudan i ordningen |
| `created_at` | TIMESTAMP | Skapad |
| `updated_at` | TIMESTAMP | Uppdaterad |

### weekly_times

Återkommande veckotider.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | UUID | Primärnyckel |
| `day_of_week` | INTEGER | Dag (0=Söndag, 6=Lördag) |
| `start_time` | TIME | Starttid |
| `end_time` | TIME | Sluttid |
| `location` | TEXT | Plats (valfri) |
| `is_active` | BOOLEAN | Aktiv-status |
| `start_date` | DATE | Första datum |
| `end_date` | DATE | Sista datum (valfri) |
| `created_at` | TIMESTAMP | Skapad |
| `updated_at` | TIMESTAMP | Uppdaterad |

### messages

Alla meddelanden (inkommande och utgående).

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | UUID | Primärnyckel |
| `player_id` | UUID | FK till players |
| `booking_id` | UUID | FK till bookings (valfri) |
| `direction` | TEXT | incoming/outgoing |
| `content` | TEXT | Meddelandeinnehåll |
| `created_at` | TIMESTAMP | Skapad |

### unavailabilities

Spelares planerade ledighet.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | UUID | Primärnyckel |
| `player_id` | UUID | FK till players |
| `start_date` | DATE | Startdatum |
| `end_date` | DATE | Slutdatum |
| `reason` | TEXT | Orsak |
| `created_at` | TIMESTAMP | Skapad |
| `updated_at` | TIMESTAMP | Uppdaterad |

### ai_response_suggestions

AI-genererade svarsförslag för inkommande meddelanden.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | UUID | Primärnyckel |
| `message_id` | UUID | FK till messages |
| `response` | TEXT | Föreslaget svar |
| `confidence` | DECIMAL | Konfidens (0.0-1.0) |
| `should_create_unavailability` | BOOLEAN | Om ledighet ska skapas |
| `status` | TEXT | pending/applied/rejected |
| `created_at` | TIMESTAMP | Skapad |
| `updated_at` | TIMESTAMP | Uppdaterad |

## Index

| Tabell | Index | Syfte |
|--------|-------|-------|
| `players` | `phone` | Snabb lookup vid inkommande SMS |
| `bookings` | `(scheduled_date, scheduled_time)` | Snabb sökning av bokningar |
| `booked_players` | `(booking_id, player_id)` | Snabb koppling |
| `unavailabilities` | `(player_id, start_date, end_date)` | Snabb ledighetskontroll |
| `messages` | `(player_id, created_at)` | Snabb meddelandehistorik |

## Relationer

### players → booked_players
```
players.id 1 ──────∞ booked_players.player_id
```

### bookings → booked_players
```
bookings.id 1 ──────∞ booked_players.booking_id
```

### players → unavailabilities
```
players.id 1 ──────∞ unavailabilities.player_id
```

## Exempel SQL-frågor

### Hämta alla lediga spelare för ett datum

```sql
SELECT p.*
FROM players p
WHERE p.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM unavailabilities u
  WHERE u.player_id = p.id
  AND u.start_date <= '2024-01-15'
  AND u.end_date >= '2024-01-15'
)
```

### Hämta kandidater för en bokning

```sql
SELECT p.*,
  0.3 + (p.win_rate * 0.4) +
    CASE WHEN p.is_friend THEN 0.2 ELSE 0 END as probability
FROM players p
WHERE p.is_active = true
AND p.elo BETWEEN 1300 AND 1700  -- värdens ELO ±200
AND p.id NOT IN (
  SELECT player_id FROM booked_players
  WHERE booking_id = 'some-booking-id'
)
ORDER BY
  p.is_friend DESC,
  p.last_contacted_at ASC NULLS FIRST
LIMIT 9
```

## Nästa steg

- [Bokningsprocessen →](/admin/dokumentation/bokningsprocessen) - Hur data används
- [AI-integration →](/admin/dokumentation/ai-integration) - AI-genererade förslag