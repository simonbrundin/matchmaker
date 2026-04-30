---
title: AI-integration
description: Hur GPT-4o-mini används för meddelandeanalys och generering
---

# AI-integration

Systemet använder **GPT-4o-mini** via OpenAI API för att analysera inkommande meddelanden och generera utgående inbjudningar.

## Konfiguration

### Miljövariabler

```bash
OPENAI_API_KEY=sk-...
```

### System-prompts

AI:t konfigureras med system-prompts som definierar:
- Roll som sportbokningsassistent
- Regler för att analysera svar
- Format för JSON-svar

## Inkommande meddelande-analys

### Funktion

```typescript
analyzeIncomingMessage(message: string, playerName: string): Promise<{
  response: string
  confidence: number
  shouldCreateUnavailability: boolean
  unavailability?: {
    startDate: string
    endDate: string
    reason: string
  }
}>
```

### System-prompt för analys

AI:n får instruktioner att:

1. **Analysera meddelandet** för att avgöra om spelaren:
   - Vill boka
   - Kan inte spela
   - Har frågor
   - Vill avboka

2. **Extrahera datum** om spelaren anger ledighet

3. **Generera svar** som är informella och korta (1-2 meningar)

4. **Beräkna konfidens** (0.0-1.0) baserat på tydligheten i meddelandet

### Exempel

| Input | AI-analys |
|-------|-----------|
| "Kan inte imorgon" | ✅ Koordinat, konfidens 95% |
| "Har något på gång nästa vecka" | ⚠️ Otydligt, konfidens 65% |
| "När spelar vi nästa gång?" | ❌ Fråga, konfidens 40% |

### Unavailability-creering

Om `shouldCreateUnavailability: true`:
- AI:n genererar start- och slutdatum baserat på texten
- En post skapas i `unavailabilities`-tabellen
- Admin får Telegram-notis om ändringen

## Generering av inbjudningar

### Funktion

```typescript
generateInviteMessage(playerName: string, date: Date, time: string, location?: string): Promise<string>
```

### Krav

- Max 2 meningar
- Informellt ton
- Inkluderar datum, tid och valfri plats

### Exempel

```
Hej Simon! Vi spelar padel imorgon kl 18:00. Kan du?
```

```
Simon, vettu - padel imorgon 19:00 på Södermalm. Blir det?
```

## Felhantering

### Rate limiting

Om OpenAI API:et returnerar rate limit:
1. Meddelandet sparas i `ai_response_suggestions` med `status: pending`
2. AI-analysen körs vid nästa försök

### Timeout

Timeout är satt till 10 sekunder. Vid timeout:
- Loggas ett fel
- Admin.notify() skickar varning

### Fallback

Om AI-analys misslyckas helt:
- Svar från spelare sparas utan AI-förslag
- Admin får meddelande om att granska manuellt

## Modeller

| Uppgift | Modell | Kostnad |
|---------|--------|---------|
| Analys av inkommande | GPT-4o-mini | ~$0.0015/meddelande |
| Generering av inbjudningar | GPT-4o-mini | ~$0.001/meddelande |

## Nästa steg

- [Meddelandeflöde →](/admin/dokumentation/meddelandeflode) - Övergripande flöde
- [Bokningsprocessen →](/admin/dokumentation/bokningsprocessen) - Hur kandidater väljs ut