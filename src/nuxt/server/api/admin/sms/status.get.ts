import { getSMSClient } from "~~/server/lib/sms-gateway";
import { getSetting } from "~~/server/lib/app-settings";

interface StatusResponse {
  hasUrl: boolean;
  hasCredentials: boolean;
  url: string;
  usernamePreview: string;
  hasConnection?: boolean;
  connectionError?: string;
  lastMessage?: any;
}

export default defineEventHandler(async (): Promise<StatusResponse> => {
  let hasUrl = false;
  let hasCredentials = false;
  let url = "";
  let usernamePreview = "";
  let connectionError = "";

  // Read config from database first, fall back to environment variables
  try {
    const dbUrl = await getSetting("sms_gateway_url");
    const dbUsername = await getSetting("sms_gateway_username");
    const dbPassword = await getSetting("sms_gateway_password");

    if (dbUrl || dbUsername || dbPassword) {
      hasUrl = !!dbUrl;
      hasCredentials = !!(dbUsername && dbPassword);
      url = dbUrl || "";
      if (dbUsername) {
        usernamePreview =
          dbUsername.length > 8
            ? dbUsername.slice(0, 4) + "..." + dbUsername.slice(-4)
            : dbUsername;
      }
    }
  } catch {
    // Database not available, continue to env vars
  }

  // Fall back to environment variables if database is empty
  if (!hasUrl && !hasCredentials) {
    try {
      const config = useRuntimeConfig();
      hasUrl = !!config.smsGatewayUrl;
      hasCredentials =
        !!config.smsGatewayUsername && !!config.smsGatewayPassword;
      url = (config.smsGatewayUrl as string) || "";
      if (config.smsGatewayUsername) {
        const user = config.smsGatewayUsername as string;
        usernamePreview =
          user.length > 8 ? user.slice(0, 4) + "..." + user.slice(-4) : user;
      }
    } catch {
      return { hasUrl, hasCredentials, url, usernamePreview };
    }
  }

  if (!hasUrl || !hasCredentials) {
    return { hasUrl, hasCredentials, url, usernamePreview };
  }

  try {
    const client = await getSMSClient();
    const messages = await client.listMessages(1);
    const lastMessage = messages.length > 0 ? messages[0] : null;
    return {
      hasUrl,
      hasCredentials,
      url,
      usernamePreview,
      hasConnection: true,
      lastMessage,
    };
  } catch (err: any) {
    connectionError = err.message || "Unknown error";
    return {
      hasUrl,
      hasCredentials,
      url,
      usernamePreview,
      hasConnection: false,
      connectionError,
    };
  }
});
