export interface SMSMessage {
  id: string
  phoneNumber: string
  text: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  createdAt: string
}

export interface SMSGatewayConfig {
  url: string
  apiKey: string
}

export class SMSGatewayClient {
  private baseUrl: string
  private apiKey: string

  constructor(config: SMSGatewayConfig) {
    this.baseUrl = config.url.replace(/\/$/, '')
    this.apiKey = config.apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const auth = Buffer.from(this.apiKey).toString('base64')
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SMS Gateway error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async sendMessage(phoneNumber: string, text: string): Promise<SMSMessage> {
    const result = await this.request<{
      id: string
      phoneNumber: string
      text: string
      status: string
      createdAt: string
    }>('/3rdparty/v1/messages', {
      method: 'POST',
      body: JSON.stringify({
        textMessage: { text },
        phoneNumbers: [phoneNumber],
      }),
    })

    return {
      id: result.id,
      phoneNumber: result.phoneNumber,
      text: result.text,
      status: result.status as SMSMessage['status'],
      createdAt: result.createdAt,
    }
  }

  async getMessageStatus(messageId: string): Promise<SMSMessage> {
    return this.request<SMSMessage>(`/3rdparty/v1/message/${messageId}`)
  }

  async listMessages(limit = 50): Promise<SMSMessage[]> {
    const result = await this.request<{ messages: SMSMessage[] }>(
      `/3rdparty/v1/messages?limit=${limit}`
    )
    return result.messages
  }
}

let smsClient: SMSGatewayClient | null = null

export function getSMSClient(): SMSGatewayClient {
  if (!smsClient) {
    let config: any
    try {
      config = useRuntimeConfig()
    } catch {
      throw new Error('SMS Gateway: useRuntimeConfig only available in Nuxt context')
    }
    if (!config.smsGatewayUrl || !config.smsGatewayApiKey) {
      throw new Error('SMS Gateway configuration missing')
    }
    smsClient = new SMSGatewayClient({
      url: config.smsGatewayUrl as string,
      apiKey: config.smsGatewayApiKey as string,
    })
  }
  return smsClient
}