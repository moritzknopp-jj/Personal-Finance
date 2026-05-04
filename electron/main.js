const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const isDev = process.env.NODE_ENV === "development";
const PORT = 3842;

let mainWindow = null;
let nextProcess = null;

// ── Wait for Next.js HTTP server to respond ───────────────────────────────────
function waitForServer(url, retries = 50, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function check() {
      http
        .get(url, (res) => { if (res.statusCode < 500) resolve(); else retry(); })
        .on("error", retry);
    }
    function retry() {
      if (++attempts >= retries) return reject(new Error("Server not ready after " + retries + " attempts"));
      setTimeout(check, interval);
    }
    check();
  });
}

// ── Start embedded Next.js server ────────────────────────────────────────────
function startNextServer() {
  // In packaged app (asar: false), resources live at process.resourcesPath/app
  const appRoot = isDev
    ? path.join(__dirname, "..")
    : path.join(process.resourcesPath, "app");

  // Use the actual bin file rather than the .bin symlink (symlinks break in some packagers)
  const nextBin = path.join(appRoot, "node_modules", "next", "dist", "bin", "next");

  console.log("[Electron] appRoot:", appRoot);
  console.log("[Electron] nextBin:", nextBin);

  nextProcess = spawn(process.execPath, [nextBin, "start", "--port", String(PORT)], {
    cwd: appRoot,
    env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  nextProcess.stdout.on("data", (d) => console.log("[Next]", d.toString().trim()));
  nextProcess.stderr.on("data", (d) => console.error("[Next]", d.toString().trim()));
  nextProcess.on("exit", (code) => console.log("[Electron] Next.js exited:", code));
}

// ── Create main application window ───────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "File Chaos Killer",
    icon: path.join(__dirname, "icons", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: "#f8fafc",
    show: false,
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
  mainWindow.loadURL(`http://localhost:${PORT}`);
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Required when running as root (CI / container environments)
  app.commandLine.appendSwitch("no-sandbox");

  try {
    startNextServer();

    // Loading splash while server boots
    const splash = new BrowserWindow({
      width: 400,
      height: 280,
      frame: false,
      resizable: false,
      center: true,
      backgroundColor: "#f8fafc",
      webPreferences: { contextIsolation: true },
    });

    splash.loadURL(`data:text/html,<!DOCTYPE html>
<html><body style="margin:0;display:flex;flex-direction:column;align-items:center;
justify-content:center;height:100vh;font-family:system-ui,sans-serif;background:#f8fafc;color:#334155;">
<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5"
  stroke-linecap="round" stroke-linejoin="round">
  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
</svg>
<h2 style="margin:18px 0 6px;font-size:20px;font-weight:700;">File Chaos Killer</h2>
<p style="margin:0;color:#94a3b8;font-size:13px;">Starting…</p>
</body></html>`);

    await waitForServer(`http://localhost:${PORT}`);

    splash.destroy();
    createWindow();
  } catch (err) {
    console.error("[Electron] Failed to start:", err.message);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (nextProcess) nextProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", () => {
  if (nextProcess) nextProcess.kill();
});
