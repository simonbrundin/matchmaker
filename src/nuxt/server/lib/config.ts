export const HOST_DAYS_AHEAD = 5
export const HOST_CONTACT_TIMES = ['08:00']

export const PLAYER_DAYS_AHEAD = 4
export const PLAYER_CONTACT_TIMES = ['08:00', '12:30', '17:00']

// Court22 API key (Azure API Management subscription key)
// If not set, the client falls back to the hardcoded key found in the web app.
// Set COURT22_API_KEY in .env to use your own key.
export const COURT22_API_KEY = process.env.COURT22_API_KEY