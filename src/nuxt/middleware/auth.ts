/**
 * Authentication middleware for admin routes.
 *
 * Protects all routes under /admin/*.
 *
 * HOW TO CONFIGURE:
 * -----------------
 * This middleware checks for an authenticated admin session. The current
 * implementation is a placeholder — replace the session-check with your
 * actual auth provider (e.g., Supabase, Auth.js, custom session, etc.).
 *
 * Options:
 * 1. Cookie-based session: check for a signed session cookie
 * 2. JWT token: verify from Authorization header
 * 3. External auth provider: call your auth endpoint
 *
 * To enable, add this file to nuxt.config.ts:
 *   routeRules: {
 *     '/admin/**': { middleware: ['auth'] }
 *   }
 */

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check in development if SKIP_AUTH=true (never use in production)
  if (process.dev && process.env.SKIP_AUTH === 'true') return

  const session = useCookie('admin_session')

  if (!session.value) {
    return navigateTo('/login')
  }

  // TODO: Replace with your actual session validation
  // e.g., verify JWT, check with auth provider, decode session token, etc.
  // const isValid = await validateSession(session.value)
  // if (!isValid) {
  //   session.value = null
  //   return navigateTo('/login')
  // }
})
