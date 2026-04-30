---
title: Meddelandeflöde
description: Översikt över hur meddelanden flödar genom systemet
---

# Meddelandeflöde

Systemet hanterar två huvudtyper av meddelanden: **inkommande** (från spelare) och **utgående** (till spelare).

## Översikt

```
                    INKOMMANDE                           UTGÅENDE
                    SMS                                  SMS

Spelare  ──────►  SMS Gateway  ──────►  Webhook  ──────►  AI-analys
                                    │
                                    ▼
                               Telegram-notis
                                  till admin

                              │
                              ▼
                         AI-svar
                         sparas
```

## Inkommande SMS

### Flöde

1. **SMS Gateway for Android** tar emot SMS från spelare
2. **Webhook** skickar till `/api/webhook/sms`
3. **Validering** - payload måste innehålla `messages`-array
4. **Telefonnummer-lookup** - slå upp spelare i databasen
5. **Spara meddelande** i `messages`-tabellen
6. **AI-analys** via GPT-4o-mini
7. **Telegram-notis** till admin med sammanfattning

### AI-analys av inkommande

GPT-4o-mini analyserar meddelandet och returnerar:

```typescript
{
  response: string,           // Föreslaget svar
  confidence: number,         // 0.0-1.0
  shouldCreateUnavailability: boolean,
  unavailability?: {
    startDate: string,
    endDate: string,
    reason: string
  }
}
```

### Exempel på AI-svar

| Spelarens meddelande | AI-förslag | Konfidens |
|---------------------|------------|-----------|
| "Kan inte imorgon" | "Ok, ingen fara!" | 95% |
| "Kan du spela på torsdag?" | "Ja, det passar bra! Jag bjuder in dig till torsdag!" | 88% |
| "Vad gäller med nästa vecka?" | "Låt mig kolla lediga tider och återkommer!" | 72% |

---

## Utgående SMS - Inbjudan

### Schema
Körs **dagligen kl 05:00** via cron-jobbet `create-bookings`

### Flöde

```
05:00 Cron  ──►  Hämta morgondagens veckotider
                │
                ▼
            För varje veckotid:
                │
                ▼
            Skapa bokning (status: pending)
                │
                ▼
            Hämta kandidater (getEligibleCandidates)
                │
                ▼
            Sortera & filtrera
                │
                ▼
            Skicka inbjudningar (max 3)
```

### Villkor för att få inbjudan

| Villkor | Värde |
|---------|-------|
| Spelare är aktiv | `is_active = true` |
| ELO-matchning | Inom ±200 av värdens ELO |
| Tillgänglighet | Ingen `unavailability` för datumet |
| Sannolikhet | >= `(neededPlayers - position) / 36` |

### Sortera kandidater

Kandidater sorteras efter:

1. **Vänner först** - `is_friend = true` får +0.2 bonus
2. **Historik** - `0.3 + (winRate * 0.4)`
3. **LFU (Least Frequently Used)** - spelare som inte kontaktats på länge优先级更高

### Exempel

För en bokning med 3 lediga platser:
- Position 0: Sannolikhet >= 3/36 = 0.083 (8.3%)
- Position 1: Sannolikhet >= 2/36 = 0.056 (5.6%)
- Position 2: Sannolikhet >= 1/36 = 0.028 (2.8%)
- Position 3+: Sannolikhet >= 0

---

## Utgående SMS - Uppföljning

### Schema
Körs **var 15:e minut** via cron-jobbet `process-followups`

### Flöde

```
15-min Cron  ──►  Hämta pending bookings
                    där datum/tid passerat
                │
                ▼
            Hämta invited-svar som är null
                │
                ▼
            Kontrollera tidsfönster
                │
                ▼
            Skicka uppföljningsmeddelande
```

### Tidsfönster för uppföljning

Antal tillåtna meddelanden baserat på klockslag:

| Tid | Max meddelanden |
|-----|-----------------|
| 08:00 - 12:00 | 1 |
| 12:00 - 17:00 | 2 |
| 17:00 - 21:00 | 3 |

### Max-meddelanden baserat på dagar

```typescript
const maxMessages = (daysSinceInvite + 1) * 3

// Dag 0: max 3 meddelanden
// Dag 1: max 6 meddelanden
// Dag 2: max 9 meddelanden
// Dag 3: max 12 meddelanden
// Dag 4: max 15 meddelanden
```

### Uppföljningsmeddelanden

| Dagar sedan inbjudan | Meddelande |
|----------------------|------------|
| 0-1 | "Hej! Påminnelse om padel imorgon. Kan du?" |
| 1-2 | "Vad gäller med padeln imorgon?" |
| 2+ | "Sista chansen att svara - kan du spela imorgon?" |

### Avbrottsvillkor

- Inbjudan är äldre än 4 dagar
- spelaren har redan svarat (response != null)
- Max meddelanden har nåtts för perioden

---

## Sammanfattning av filterregler

### Inbjudan (create-bookings)
- ✅ Bokning existerar inte för datum+tid
- ✅ Spelare är aktiv
- ✅ ELO inom ±200 av värd
- ✅ Spelare är ledig
- ✅ probability >= tröskel
- ✅ Max 9 kandidater kontaktas
- ✅ Max 3 inbjudningar per bokning

### Uppföljning (process-followups)
- ✅ Booking status = 'pending'
- ✅ Datum/tid har passerat
- ✅ Inbjudan status = 'invited' och response = null
- ✅ daysSinceInvite <= 4
- ✅ Inom tillåtet tidsfönster
- ✅ messageCount < maxMessages

---

## Nästa steg

- [SMS Gateway →](/admin/dokumentation/sms-gateway) - Konfiguration av Android-app och webhooks
- [AI-integration →](/admin/dokumentation/ai-integration) - Hur GPT-4o-mini används
- [Bokningsprocessen →](/admin/dokumentation/bokningsprocessen) - Detaljer om kandidatsortering