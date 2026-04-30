---
title: Cron-jobb
description: Schema och konfiguration av automatiska jobb
---

# Cron-jobb

Systemet har två cron-jobb som körs automatiskt för att hantera bokningar och uppföljningar.

## Översikt

| Jobb | Schema | Fil |
|------|--------|-----|
| create-bookings | Dagligen 05:00 | `server/api/cron/create-bookings.post.ts` |
| process-followups | Var 15:e minut | `server/api/cron/process-followups.post.ts` |

## Create Bookings

### Schema
**Dagligen kl 05:00**

### Syfte
Skapa bokningar för morgondagen baserat på veckoschema och skicka inbjudningar till kandidater.

### Flöde

```
05:00 varje dag
     │
     ▼
Beräkna morgondagens datum
     │
     ▼
Hämta weekly_times för morgondagens veckodag
     │
     ▼
För varje veckotid:
     │
     ├─► Kontrollera om bokning redan finns
     │        │
     │        ▼
     │    Finns? → Skip, fortsätt med nästa
     │
     ├─► Skapa bokning (status: pending)
     │
     ├─► Hämta kandidater via getEligibleCandidates()
     │
     ├─► Sortera och filtrera (probability >= tröskel)
     │
     ├─► Skicka inbjudningar (max 3)
     │
     └─► Uppdatera booked_players status till 'invited'
```

### Kriterier för veckotider

| Villkor | Beskrivning |
|---------|-------------|
| `is_active = true` | Schemat är aktivt |
| `day_of_week` matchar | Morgondagens veckodag (0-6) |
| `start_date <= imorgon` | Startdatum har passerat |
| `end_date IS NULL OR end_date >= imorgon` | Slutdatum ej passerat (eller inget slutdatum) |

### Exekveringstid

- Normalt: ~5-30 sekunder (baserat på antal veckotider)
- Max: Beror på antal kandidater som ska kontaktas

### Felhantering

Vid fel:
1. Loggför felet
2. Skippa aktuell veckotid
3. Fortsätt med nästa
4. Skicka Telegram-notis till admin vid allvarliga fel

## Process Followups

### Schema
**Var 15:e minut: 00, 15, 30, 45**

```
┌─────────────┐
│ 00:00 cron  │────► Kolla 00:00-00:15
├─────────────┤
│ 00:15 cron  │────► Kolla 00:15-00:30
├─────────────┤
│ 00:30 cron  │────► Kolla 00:30-00:45
├─────────────┤
│ 00:45 cron  │────► Kolla 00:45-01:00
└─────────────┘
```

### Syfte
Skicka uppföljningsmeddelanden till spelare som inte har svarat på inbjudningar.

### Flöde

```
Var 15:e minut
      │
      ▼
Hämta pending bookings
där scheduled_date <= idag
och scheduled_time <= nu
      │
      ▼
För varje booking:
      │
      ├─► Hämta invited-svar med response = null
      │
      ├─► Kontrollera daysSinceInvite <= 4
      │
      ├─► Beräkna maxMessages baserat på dagar
      │
      ├─► Kontrollera tidsfönster (8-21)
      │
      ├─► Kontrollera messageCount < maxMessages
      │
      └─► Skicka uppföljningsmeddelande
```

### Tidsfönster

Meddelanden skickas endast mellan **08:00 och 21:00**:

| Klockslag | Tillåtet | Antal möjliga |
|-----------|----------|---------------|
| 05:00 | ❌ | 0 |
| 07:30 | ❌ | 0 |
| 08:00 | ✅ | 1 |
| 10:00 | ✅ | 1 |
| 12:00 | ✅ | 2 |
| 15:00 | ✅ | 2 |
| 17:00 | ✅ | 3 |
| 19:00 | ✅ | 3 |
| 21:30 | ❌ | 0 |

### Max-meddelanden-formel

```typescript
const maxMessages = (daysSinceInvite + 1) * 3

// Dag 0: max 3
// Dag 1: max 6
// Dag 2: max 9
// Dag 3: max 12
// Dag 4: max 15
// Dag 5+: skip (inbjudan för gammal)
```

### Uppföljningsmeddelanden

```typescript
const followupMessages = [
  'Hej! Påminnelse om padel imorgon. Kan du?',           // dag 0-1
  'Vad gäller med padeln imorgon?',                       // dag 1-2
  'Sista chansen att svara - kan du spela imorgon?',      // dag 2+
]
```

## Kör manual

### Via HTTP

```bash
# Create bookings
curl -X POST https://din-domän.se/api/cron/create-bookings

# Process followups
curl -X POST https://din-domän.se/api/cron/process-followups
```

### Via Kubernetes

```bash
kubectl create job --from=cronjob/matchmaker-create-bookings create-bookings-manual
```

## Övervakning

### Logs att bevaka

| Logg | Indikerar |
|------|-----------|
| `create-bookings: processed X weekly times` | Normal körning |
| `create-bookings: no eligible candidates for...` | Inga kandidater hittades |
| `process-followups: sending followup to...` | Uppföljning skickad |
| `process-followups: skipped (too old)` | Inbjudan för gammal |

### Telegram-notiser

Vid allvarliga fel skickas notificationer till admin via Telegram.

## Nästa steg

- [Bokningsprocessen →](/admin/dokumentation/bokningsprocessen) - Hur bokningar skapas
- [Meddelandeflöde →](/admin/dokumentation/meddelandeflode) - Övergripande flöde