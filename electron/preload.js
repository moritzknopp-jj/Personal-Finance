// Minimal preload — contextIsolation is on, nodeIntegration is off.
// Exposes only what the renderer actually needs.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("chaosKiller", {
  version: process.env.npm_package_version ?? "1.0.0",
  platform: process.platform,
});
