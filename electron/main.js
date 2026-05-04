const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const isDev = process.env.NODE_ENV === "development";
const PORT = 3842; // fixed port to avoid collisions

let mainWindow = null;
let nextProcess = null;

// ── Wait for the Next.js HTTP server to be ready ─────────────────────────────
function waitForServer(url, retries = 40, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function check() {
      http
        .get(url, (res) => {
          if (res.statusCode < 500) resolve();
          else retry();
        })
        .on("error", retry);
    }
    function retry() {
      if (++attempts >= retries) return reject(new Error(`Server not ready after ${retries} attempts`));
      setTimeout(check, interval);
    }
    check();
  });
}

// ── Start the embedded Next.js server ────────────────────────────────────────
function startNextServer() {
  // In packaged app, the app resources are at process.resourcesPath/app
  // In dev mode, use the project root
  const appRoot = isDev
    ? path.join(__dirname, "..")
    : path.join(process.resourcesPath, "app");

  const nextBin = path.join(appRoot, "node_modules", ".bin", "next");
  const args = ["start", "--port", String(PORT)];

  console.log("[Electron] Starting Next.js server at:", appRoot);

  nextProcess = spawn(process.execPath, [nextBin, ...args], {
    cwd: appRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  nextProcess.stdout.on("data", (d) => console.log("[Next]", d.toString().trim()));
  nextProcess.stderr.on("data", (d) => console.error("[Next]", d.toString().trim()));

  nextProcess.on("exit", (code) => {
    console.log("[Electron] Next.js process exited with code:", code);
  });
}

// ── Create the main application window ───────────────────────────────────────
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

  // Open external links in the system browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Allow running as root (Linux CI / container environments)
  if (process.platform === "linux") {
    app.commandLine.appendSwitch("no-sandbox");
  }

  try {
    startNextServer();

    // Show a loading window while the server starts
    mainWindow = new BrowserWindow({
      width: 480,
      height: 300,
      frame: false,
      resizable: false,
      center: true,
      backgroundColor: "#f8fafc",
      webPreferences: { contextIsolation: true },
    });
    mainWindow.loadURL(`data:text/html,
      <html><body style="margin:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;height:100vh;font-family:sans-serif;background:#f8fafc;color:#334155">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <h2 style="margin:16px 0 8px">File Chaos Killer</h2>
        <p style="margin:0;color:#94a3b8;font-size:14px">Starting server…</p>
      </body></html>
    `);

    await waitForServer(`http://localhost:${PORT}`);

    mainWindow.close();
    mainWindow = null;
    createWindow();
  } catch (err) {
    console.error("[Electron] Failed to start server:", err.message);
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
