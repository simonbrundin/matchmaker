export default defineNuxtPlugin(() => {
  if (import.meta.server) {
    import('~~/server/cron/scheduler').then(({ startCronJobs }) => {
      startCronJobs()
      console.log('📅 Cron jobs started')
    })
  }
})