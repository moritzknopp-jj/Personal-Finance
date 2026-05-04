export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initCronManager } = await import("./lib/cron-manager");
    await initCronManager();
  }
}
