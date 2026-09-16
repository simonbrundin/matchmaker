---
title: Bokningsprocessen
description: Hur bokningar skapas och kandidater väljs ut
---

# Bokningsprocessen

Bokningsprocessen är kärnan i systemet - här skapas bokningar och kandidater väljs ut baserat på ELO, tillgänglighet och sannolikhet att acceptera.

## Översikt

```
create-bookings cron (05:00)
       │
       ▼
  ┌─────────────┐
  │ Skapa bokning │  status: 'pending'
  └─────────────┘
       │
       ▼
  ┌──────────────────────┐
  │ Hämta kandidater     │  getEligibleCandidates()
  │ (aktiva, ELO±200,    │
  │  tillgängliga)       │
  └──────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │ Sortera kandidater   │  vänner först, LFU
  └──────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │ Filtrera & skicka    │  probability >= tröskel
  │ (max 3 inbjudningar) │
  └──────────────────────┘
```

## Huvudfunktioner

### `getEligibleCandidates(bookingId, hostElo, date, time)`

Hämtar och sorterar kandidater för en bokning.

### `calculateAcceptProbability(player, isFriend)`

Beräknar sannolikheten att en spelare accepterar en inbjudan.

## Villkor för kandidater

### Grundläggande krav

| Villkor | Beskrivning |
|---------|-------------|
| `is_active = true` | Spelaren är aktiv |
| ELO inom ±200 | Jämfört med värdens ELO |
| Ingen unavailability | Ingen bokad ledighet för datumet |
| Inte redan inbjuden | Har inte fått inbjudan till denna bokning |

### ELO-matchning

```
Värdens ELO: 1500

Godkända kandidater:
├── ELO 1300-1700 (inom ±200)
├── ELO 1250-1750 (inom ±250) ❌
└── ELO 1200-1800 (inom ±300) ❌
```

## Sorteringsalgoritm

### Steg 1: Vänner först

```typescript
if (a.is_friend !== b.is_friend) {
  return b.is_friend ? 1 : -1  // Vänner sorteras först
}
```

### Steg 2: LFU (Least Frequently Used)

```typescript
// Aldrig kontaktad = lägst prioritet (kontaktas sist)
if (!a.last_contacted_at) return -1
if (!b.last_contacted_at) return 1

// Äldst kontaktad först
return new Date(a.last_contacted_at).getTime() -
       new Date(b.last_contacted_at).getTime()
```

### Steg 3: Sannolikhet

```typescript
const baseProbability = 0.3
const historyBonus = player.winRate * 0.4
const friendBonus = isFriend ? 0.2 : 0

const probability = Math.min(
  baseProbability + historyBonus + friendBonus,
  0.8  // Max 80%
)
```

## Sannolikhetströskel

För att en kandidat ska få en inbjudan måste:

```
probability >= (neededPlayers - position) / 36
```

### Exempel (neededPlayers = 3)

| Position | Tröskel | Exempel |
|----------|---------|---------|
| 0 | 3/36 = 0.083 | probability >= 8.3% |
| 1 | 2/36 = 0.056 | probability >= 5.6% |
| 2 | 1/36 = 0.028 | probability >= 2.8% |
| 3+ | 0/36 = 0 | Alltid uppfyllt |

### Praktiskt exempel

```
Spelare med 60% winRate + vän:
├── baseProbability: 0.3
├── historyBonus: 0.6 * 0.4 = 0.24
├── friendBonus: 0.2
├── Total: 0.74 (74%)
└── ✅ Kvalificerar för alla positioner
```

## Maximala gränser

| Gräns | Värde |
|-------|-------|
| Max kandidater kontaktade | 9 |
| Max inbjudningar per bokning | 3 |

## Status-förändringar

```
new → pending → invited → confirmed/cancelled/completed
```

| Status | Betydelse |
|--------|-----------|
| `pending` | Bokning skapad, väntar på svar |
| `invited` | Inbjudan skickad till spelare |
| `confirmed` | Spelare har accepterat |
| `cancelled` | Bokning avbruten |
| `completed` | Bokning genomförd |

## Relaterade funktioner

| Funktion | Fil |
|----------|-----|
| `createBooking()` | `server/lib/booking.ts` |
| `getEligibleCandidates()` | `server/lib/booking.ts` |
| `invitePlayer()` | `server/lib/booking.ts` |
| `updatePlayerResponse()` | `server/lib/booking.ts` |

## Nästa steg

- [Meddelandeflöde →](/admin/dokumentation/meddelandeflode) - Övergripande flöde
- [Cron-jobb →](/admin/dokumentation/cron-jobb) - Schema för bokningsskapande