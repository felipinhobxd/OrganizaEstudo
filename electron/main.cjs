// LEILÃO POKÉMON — Desktop (Electron)
// TOTALMENTE autônomo: na primeira vez abre mostra "Configurando..." e roda
// `next build` no PC do usuário (30-60s). Depois disso, sobe tudo sozinho
// (next start + bot + reconhecimento) e abre o painel na janela nativa.
const { app, BrowserWindow, Menu, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const PORT = 3000;
let mainWindow = null;
let stackProcess = null;
let buildProcess = null;

const ROOT = app.isPackaged ? path.join(process.resourcesPath, "app") : path.join(__dirname, "..");
const isElectron = Boolean(process.versions.electron);
const nodeBin = isElectron ? process.execPath : "node";
const nodeEnv = { ...process.env };
if (isElectron) nodeEnv.ELECTRON_RUN_AS_NODE = "1";

// --- Helpers -------------------------------------------------------------------
function isServerRunning() {
  return new Promise(resolve => {
    const req = http.get(`http://127.0.0.1:${PORT}/api/health`, res => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(3_000, () => { req.destroy(); resolve(false); });
  });
}

function waitForServer(timeoutMs = 180_000) {
  const started = Date.now();
  return new Promise(resolve => {
    const check = async () => {
      if (await isServerRunning()) return resolve(true);
      if (Date.now() - started > timeoutMs) return resolve(false);
      setTimeout(check, 2_000);
    };
    check();
  });
}

function needsBuild() {
  const buildId = path.join(ROOT, ".next", "BUILD_ID");
  return !fs.existsSync(buildId);
}

// --- Build Next.js na primeira execução -------------------------------------------
function runBuild() {
  return new Promise((resolve, reject) => {
    const nextCli = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
    if (!fs.existsSync(nextCli)) { reject(new Error("next CLI não encontrado")); return; }
    console.log("[build] next build em", ROOT);
    buildProcess = spawn(nodeBin, [nextCli, "build"], {
      cwd: ROOT,
      env: nodeEnv,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let lastLine = "";
    buildProcess.stdout.on("data", chunk => {
      const lines = chunk.toString().trim().split("\n");
      if (lines.length) lastLine = lines[lines.length - 1];
      console.log("[build]", chunk.toString().trim());
    });
    buildProcess.stderr.on("data", chunk => console.log("[build-err]", chunk.toString().trim()));
    buildProcess.on("exit", code => {
      buildProcess = null;
      if (code === 0) resolve(true);
      else reject(new Error(`next build falhou (code ${code})`));
    });
  });
}

// --- Sobe TUDO via start-all.mjs (bot supervisor + reconhecimento) --------------
function startStack() {
  const script = path.join(ROOT, "scripts", "start-all.mjs");
  if (!fs.existsSync(script)) {
    console.log("[stack] start-all.mjs não encontrado");
    return;
  }
  console.log("[stack] npm start via start-all.mjs");
  stackProcess = spawn(nodeBin, [script], {
    cwd: ROOT,
    env: { ...nodeEnv, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const log = chunk => {
    const line = chunk.toString().trim();
    if (line) console.log(`[stack] ${line}`);
  };
  stackProcess.stdout.on("data", log);
  stackProcess.stderr.on("data", log);
  stackProcess.on("exit", code => console.log(`[stack] saiu (code ${code})`));
}

function killStack() {
  if (buildProcess) { try { buildProcess.kill("SIGKILL"); } catch {} buildProcess = null; }
  if (stackProcess) {
    try { stackProcess.kill("SIGTERM"); } catch {}
    setTimeout(() => { try { stackProcess.kill("SIGKILL"); } catch {} }, 3_000);
    stackProcess = null;
  }
}

// --- Telas HTML -----------------------------------------------------------------
const htmlBuild = (pct) => `data:text/html;charset=utf-8,
  <body style="font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
    <div style="text-align:center;max-width:500px;padding:40px">
      <div style="font-size:48px;margin-bottom:16px">🦭</div>
      <h2 style="color:#e74c3c;margin:0 0 8px">Configurando o Leilão Pokémon...</h2>
      <p style="color:#aaa;font-size:14px">${pct}</p>
      <div style="width:300px;height:6px;background:#16213e;border-radius:3px;margin:20px auto;overflow:hidden">
        <div style="width:100%;height:100%;background:#e74c3c;border-radius:3px;animation:slide 2s infinite"></div>
      </div>
      <style>@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}</style>
      <p style="color:#555;font-size:12px;margin-top:16px">Só na primeira vez — depois abre direto.</p>
    </div>
  </body>`;

const htmlError = (msg) => `data:text/html;charset=utf-8,
  <body style="font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
    <div style="text-align:center;max-width:500px;padding:40px">
      <div style="font-size:48px;margin-bottom:16px">⚠️</div>
      <h2 style="color:#e74c3c;margin:0 0 10px">Falha ao iniciar</h2>
      <p style="color:#aaa;font-size:14px">${msg}</p>
      <p style="color:#777;font-size:13px;margin-top:20px">Clique em "Recarregar" para tentar de novo.</p>
    </div>
  </body>`;

// --- Janela ------------------------------------------------------------------------
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Leilão Pokémon",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: "reload", label: "Recarregar" },
    { role: "quit", label: "Sair" },
  ]));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });

  // --- Fluxo principal ---
  try {
    if (await isServerRunning()) {
      mainWindow.loadURL(`http://localhost:${PORT}`);
      return;
    }

    if (needsBuild()) {
      console.log("[init] primeira execução: next build");
      mainWindow.loadURL(htmlBuild("Preparando o painel (compilando)..."));
      await runBuild();
    }

    mainWindow.loadURL(htmlBuild("Iniciando servidor, bot e reconhecimento..."));
    startStack();

    const ok = await waitForServer();
    if (ok && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(`http://localhost:${PORT}`);
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(htmlError("O servidor não respondeu em 3 minutos."));
    }
  } catch (error) {
    console.error("[init] erro:", error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(htmlError(String(error.message || error)));
    }
  }
}

// --- Reconecta se a página cair ---------------------------------------------------
setInterval(async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const url = mainWindow.webContents.getURL();
  if (url.startsWith("data:")) {
    if (await isServerRunning()) mainWindow.loadURL(`http://localhost:${PORT}`);
  }
}, 5_000);

// --- Uma instância SÓ ----------------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(createWindow);
}

app.on("window-all-closed", () => { killStack(); app.quit(); });
app.on("before-quit", () => killStack());
