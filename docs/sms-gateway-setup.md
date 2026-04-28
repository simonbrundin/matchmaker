# SMS Gateway for Android - Installationsguide

Den här guiden beskriver hur du konfigurerar en Android-telefon som SMS-gateway för matchmaker-systemet.

## Översikt

Systemet använder [SMS Gateway for Android](https://github.com/capcom6/android-sms-gateway) för att skicka och ta emot SMS via en Android-telefon istället för en extern SMS-gateway.

### Fördelar

- Minimal kostnad (~49 kr/mån för SIM med gratis SMS)
- Ingen extern tjänst behövs
- Full kontroll över SMS:en

---

## Förutsättningar

- Android-telefon ( Huawei P Smart eller annan)
- SIM-kort med gratis SMS (t.ex. Lyca Mobile, Hallon)
- SMS Gateway for Android-app

---

## Steg 1: Installera appen

### Från F-Droid (rekommenderas)

1. Installera [F-Droid](https://f-droid.org/)
2. Sök efter "SMS Gateway for Android"
3. Installera appen

### Från GitHub

Ladda ner senaste release från:
https://github.com/capcom6/android-sms-gateway/releases

---

## Steg 2: Konfigurera Cloud Server

### OBS för Huawei-telefoner

På grund av US-sanktioner har Huawei-telefoner **inget Google Play Services**. Därför måste du använda **SSE Only**-läge istället för FCM.

### Konfigurationssteg

1. Starta appen
2. Gå till **Settings → Cloud Server**
3. Aktivera "Cloud Server" (toggle)
4. Välj **Notification Channel → SSE Only**
5. Stäng av skärmen - låt appen vara minimrad
6. Tryck "Offline" → blir "Online" när ansluten

### Credentials

Efter anslutning visas i appen:

- **Server URL**: `https://api.sms-gate.app`
- **Username**: `xxxxxxxx`
- **Password**: `xxxxxxxx`

Notera dessa - du behöver dom i Steg 4.

---

## Steg 3: Konfigurera miljövariabler

```bash
# I din .env-fil

# URL till SMS-gate.app molnserver
SMS_GATEWAY_URL=https://api.sms-gate.app

# Credentials i formatet username:password
SMS_GATEWAY_API_KEY=username:password
```

### Exempel

```bash
SMS_GATEWAY_URL=https://api.sms-gate.app
SMS_GATEWAY_API_KEY=abc123xy:def456zw
```

---

## Steg 4: Konfigurera inkommande SMS (webhook)

För att ta emot svar från spelare behöver du konfigurera en webhook.

### Konfigurera via API

```bash
curl -X POST -u "username:password" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://[din-domän]/api/webhook/sms", "event": "sms:received"}' \
  https://api.sms-gate.app/3rdparty/v1/webhooks
```

Ersätt:
- `username:password` - dina credentials från appen
- `[din-domän]` - din server-domän (t.ex. matchmaker.example.com)

### Webhook-payload

Webhoo-payload som din server tar emot:
```json
{
  "event": "sms:received",
  "payload": {
    "message": "Hej!",
    "sender": "+46701234567",
    "receivedAt": "2024-06-22T15:46:11.000+07:00"
  }
}
```

### Verifiera webhook

```bash
curl -X GET -u "username:password" \
  https://api.sms-gate.app/3rdparty/v1/webhooks
```

### Kontrollera att din server tar emot webhook

Din server har redan en endpoint konfigurerad på `/api/webhook/sms.post.ts` som tar emot inkommande SMS.

---

## Steg 5: Testa

### Testa utgående SMS

1. Skicka ett test-SMS via din server (använd admin-interfacet eller API)
2. Verifiera att SMS:et kommer fram till mobilnumret

### Testa inkommande SMS

1. Svara på SMS:et från en annan telefon
2. Kolla server-loggar för att se att webhooken triggas
3. Verifiera att meddelandet sparas i databasen

---

## Felsökning

### App:en kopplar inte upp

- Verifiera att telefonen har internetuppkoppling
- Prova starta om appen
- För Huawei: kontrollera att SSE Only är valt

### SMS:en skickas inte

- Kontrollera credentials i .env-filen
- Verifiera att username:password-formatet är korrekt
- Kolla server-loggar för felmeddelanden

### Inkommande SMS fungerar inte

- Verifiera att webhook-URL är korrekt
- Kontrollera att din server är nåbar från internet
- Kolla att brandväggen tillåter inkommande anrop

---

## Kostnad

| Del | Pris |
|-----|------|
| Lyca Mobile SIM (1 GB) | ~49 kr/mån |
| App | Gratis |
| Molnserver (sms-gate.app) | Gratis |
| **Total/år** | **~588 kr** |

---

## API-referens

### Skicka SMS

```bash
curl -X POST -u "username:password" \
  --json '{"textMessage":{"text":"Hej!"},"phoneNumbers":["+46701234567"]}' \
  https://api.sms-gate.app/3rdparty/v1/messages
```

### Svarsstruktur

```json
{
  "id": "msg-123",
  "phoneNumber": "+46701234567",
  "text": "Hej!",
  "status": "queued",
  "createdAt": "2024-01-01T12:00:00Z"
}
```

---

## Resurser

- [SMS Gateway for Android - GitHub](https://github.com/capcom6/android-sms-gateway)
- [Dokumentation](https://docs.sms-gate.app/)
- [API-referens](https://api.sms-gate.app/)