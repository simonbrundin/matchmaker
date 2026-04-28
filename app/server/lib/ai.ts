import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const config = useRuntimeConfig()
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key missing')
    }
    openaiClient = new OpenAI({
      apiKey: config.openaiApiKey as string,
    })
  }
  return openaiClient
}

export interface ParsedUnavailability {
  startDate: string
  endDate: string
  reason: string | null
}

export interface AIResponseSuggestion {
  response: string
  confidence: number
  shouldCreateUnavailability: boolean
  unavailability?: ParsedUnavailability
}

const SYSTEM_PROMPT = `Du är en assistent för ett padelbokningssystem. Din uppgift är att:

1. Analysera inkommande SMS från spelare
2. Avgöra om de vill spela, inte kan, eller har andra frågor
3. Om de anger att de är lediga (t.ex. "ja", "kan", "vill") - föreslå ett positivt svar
4. Om de anger att de inte kan spela (t.ex. "nej", "upptagen", "bortrest", "sjuk") - föreslå ett negativt svar och ta reda på hur länge
5. Om de anger specifika datum (t.ex. "bortrest 2 veckor", "ledig 15-20 maj") - skapa en unavailability-post

Svara alltid med JSON i följande format:
{
  "response": "Föreslaget svar att skicka till spelaren",
  "confidence": 0.0-1.0,
  "shouldCreateUnavailability": true/false,
  "unavailability": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "reason": "orsak om angiven"
  } (om shouldCreateUnavailability är true)
}

Var kort och koncis i svaren. Använd svenska.`

export async function analyzeIncomingMessage(
  message: string,
  playerName: string
): Promise<AIResponseSuggestion> {
  const client = getOpenAIClient()

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Spelarens namn: ${playerName}\nInkommande meddelande: "${message}"`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)
    return {
      response: parsed.response || 'Tack för ditt svar!',
      confidence: parsed.confidence || 0.5,
      shouldCreateUnavailability: parsed.shouldCreateUnavailability || false,
      unavailability: parsed.unavailability,
    }
  } catch {
    return {
      response: 'Tack för ditt svar!',
      confidence: 0.5,
      shouldCreateUnavailability: false,
    }
  }
}

export async function generateInviteMessage(
  playerName: string,
  date: string,
  time: string,
  location?: string,
  bookingId?: string
): Promise<string> {
  let shortRef = ''
  if (bookingId) {
    shortRef = ` [Ref: ${bookingId.slice(-6).toUpperCase()}]`
  }

  const client = getOpenAIClient()

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Du skapar inbjudningsmeddelanden för padel. Var kort och trevlig. Inkludera alltid referenskoden i slutet av meddelandet.',
      },
      {
        role: 'user',
        content: `Skapa inbjudnings-SMS till ${playerName} för padel ${date} kl ${time}.${shortRef} Max 2 meningar.`,
      },
    ],
  })

  return (
    completion.choices[0]?.message?.content ||
    `Hej ${playerName}! Vill du spela padel ${date} kl ${time}?${shortRef}`
  )
}