import { getSMSClient } from '~~/server/lib/sms-gateway'

export default defineEventHandler(async () => {
  let hasUrl = false
  let hasCredentials = false
  let url = ''
  let usernamePreview = ''
  let connectionError = ''

  try {
    const config = useRuntimeConfig()
    hasUrl = !!config.smsGatewayUrl
    hasCredentials = !!config.smsGatewayUsername && !!config.smsGatewayPassword
    url = config.smsGatewayUrl as string || ''
    if (config.smsGatewayUsername) {
      const user = config.smsGatewayUsername as string
      usernamePreview = user.length > 8 ? user.slice(0, 4) + '...' + user.slice(-4) : user
    }
  } catch {
    return { hasUrl, hasCredentials, url, usernamePreview }
  }

  if (!hasUrl || !hasCredentials) {
    return { hasUrl, hasCredentials, url, usernamePreview }
  }

  try {
    const client = getSMSClient()
    const messages = await client.listMessages(1)
    const lastMessage = messages.length > 0 ? messages[0] : null
    return { hasUrl, hasCredentials, url, usernamePreview, hasConnection: true, lastMessage }
  } catch (err: any) {
    connectionError = err.message || 'Unknown error'
    return { hasUrl, hasCredentials, url, usernamePreview, hasConnection: false, connectionError }
  }
})