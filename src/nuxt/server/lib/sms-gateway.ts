export interface SMSMessage {
  id: string;
  phoneNumber: string;
  text: string;
  status: "queued" | "sent" | "delivered" | "failed";
  createdAt: string;
}

export interface SMSGatewayConfig {
  url: string;
  username: string;
  password: string;
}

export class SMSGatewayClient {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(config: SMSGatewayConfig) {
    this.baseUrl = config.url.replace(/\/$/, "");
    this.username = config.username;
    this.password = config.password;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString(
      "base64",
    );
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SMS Gateway error: ${response.status} - ${error}`);
    }

    try {
      return (await response.json()) as T;
    } catch {
      return {} as T;
    }
  }

  async sendMessage(
    phoneNumber: string,
    text: string,
    options: { skipPhoneValidation?: boolean } = {},
  ): Promise<SMSMessage> {
    const endpoint = options.skipPhoneValidation
      ? "/3rdparty/v1/messages?skipPhoneValidation=true"
      : "/3rdparty/v1/messages";
    const result = await this.request<{
      id: string;
      phoneNumber: string;
      text: string;
      status: string;
      createdAt: string;
    }>(endpoint, {
      method: "POST",
      body: JSON.stringify({
        textMessage: { text },
        phoneNumbers: [phoneNumber],
      }),
    });

    return {
      id: result.id,
      phoneNumber: result.phoneNumber,
      text: result.text,
      status: result.status as SMSMessage["status"],
      createdAt: result.createdAt,
    };
  }

  async getMessageStatus(messageId: string): Promise<SMSMessage> {
    return this.request<SMSMessage>(`/3rdparty/v1/message/${messageId}`);
  }

  async listMessages(limit = 50): Promise<SMSMessage[]> {
    try {
      const result = await this.request<any>(
        `/3rdparty/v1/messages?limit=${limit}`,
      );
      if (!result) return [];
      if (Array.isArray(result)) return result;
      if (Array.isArray(result.messages)) return result.messages;
      return [];
    } catch {
      return [];
    }
  }
}

// Cached client and initialization promise
let smsClient: SMSGatewayClient | null = null;
let initPromise: Promise<SMSGatewayClient> | null = null;

export function clearSMSClientCache(): void {
  smsClient = null;
  initPromise = null;
}

async function initSMSClient(): Promise<SMSGatewayClient> {
  // First try database settings, then fall back to environment variables
  let url: string | undefined;
  let username: string | undefined;
  let password: string | undefined;

  try {
    url = (await getSetting("sms_gateway_url")) || undefined;
    username = (await getSetting("sms_gateway_username")) || undefined;
    password = (await getSetting("sms_gateway_password")) || undefined;
  } catch {
    // Database not available, use env vars as fallback
  }

  // Fall back to environment variables if database values are empty
  if (!url || !username || !password) {
    try {
      const config = useRuntimeConfig();
      url ||= config.smsGatewayUrl as string;
      username ||= config.smsGatewayUsername as string;
      password ||= config.smsGatewayPassword as string;
    } catch {
      // useRuntimeConfig not available in this context
    }
  }

  if (!url || !username || !password) {
    throw new Error("SMS Gateway configuration missing");
  }

  return new SMSGatewayClient({
    url,
    username,
    password,
  });
}

/**
 * Get SMS client. Returns a Promise that resolves to the client.
 * Subsequent calls return the same promise until the cache is cleared.
 */
export function getSMSClient(): Promise<SMSGatewayClient> {
  if (!initPromise) {
    initPromise = initSMSClient().then((client) => {
      smsClient = client;
      return client;
    });
  }
  return initPromise;
}

/**
 * Sync version - use this only after ensuring the client is initialized.
 * Throws if not initialized yet.
 */
export function getSMSClientSync(): SMSGatewayClient {
  if (!smsClient) {
    throw new Error(
      "SMS Gateway not initialized. Call getSMSClient() and await it first.",
    );
  }
  return smsClient;
}
