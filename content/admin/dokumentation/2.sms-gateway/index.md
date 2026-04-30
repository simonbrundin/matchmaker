---
title: SMS Gateway
description: Konfiguration av SMS Gateway for Android
---

# SMS Gateway

SMS Gateway for Android är en Android-app som tar emot SMS och vidarebefordrar dem till systemet via webhooks.

## Installation

1. Installera **SMS Gateway for Android** från Google Play
2. Följ appens installationsguide

## Konfiguration

### Webhook-URL

Konfigurera webhooks via appens inställningar:

```bash
curl -X POST -u "username:password" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://din-domän.se/api/webhook/sms",
    "event": "sms:received"
  }' \
  https://api.sms-gate.app/3rdparty/v1/webhooks
```

### Miljövariabler

Lägg till följande i din `.env`-fil:

```bash
SMS_GATEWAY_URL=https://api.sms-gate.app
SMS_GATEWAY_API_KEY=username:password
```

### Sse Only-läge

Om du använder en Huawei-telefon (pga US-sanktioner) måste du aktivera **Sse Only**-läge i appens inställningar.

## Webhook-payload

Systemet förväntar sig följande payload:

```typescript
interface IncomingSmsPayload {
  messages: Array<{
    phone: string      // Avsändarens telefonnummer
    text: string       // SMS-texten
    timestamp: string  // ISO 8601 format
  }>
}
```

### Exempel

```json
{
  "messages": [
    {
      "phone": "+46701234567",
      "text": "Kan inte imorgon",
      "timestamp": "2024-01-15T10:30:00+01:00"
    }
  ]
}
```

## Säkerhet

### Autentisering

Alla förfrågningar till SMS Gateway API:t autentiseras med Basic Auth:
- **Username**: Din API-användare
- **Password**: Din API-lösenord

### Validering

Webhook-mottagaren validerar:
1. Att payload innehåller `messages`-array
2. Att varje meddelande har `phone`, `text` och `timestamp`

## Felsökning

| Problem | Lösning |
|---------|---------|
| Ingånga SMS visas inte | Verifiera webhook-URL och autentisering |
| Dubbla meddelanden | Kontrollera att endast en webhook är registrerad |
| appen fungerar inte på Huawei | Aktivera Sse Only-läge |

## Nästa steg

- [Meddelandeflöde →](/admin/dokumentation/meddelandeflode) - Övergripande flöde
- [AI-integration →](/admin/dokumentation/ai-integration) - Hur inkommande meddelanden analyseras