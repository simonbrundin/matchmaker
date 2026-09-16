import { startCronJobs } from "../../server/cron/scheduler";

export default () => {
  // The scheduler runs in the production process. Starting it in the Bun-based
  // dev server causes node-cron to fail during SSR and prevents pages from loading.
  if (process.env.NODE_ENV === "development") return;

  startCronJobs();
  console.log("📅 Cron jobs started");
};
