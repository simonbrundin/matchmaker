import { startCronJobs } from '~/server/cron/scheduler'

export default defineNuxtPlugin(() => {
  if (process.server) {
    startCronJobs()
    console.log('📅 Cron jobs started')
  }
})