// LEILÃO POKÉMON — Desktop (Electron)
// TOTALMENTE autônomo com prioridade inteligente:
//   1. Servidor já rodando? Conecta.
//   2. Projeto LOCAL no PC (D:\LeilaoPokemon)? Usa ELE (tem IA, sessão, tudo).
//   3. Nada encontrado? Usa o embutido no .exe (build na primeira vez).
const { app, BrowserWindow, Menu, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const PORT = 3000;
let mainWindow = null;
let stackProcess = null;
let buildProcess = null;

const BUNDLED_ROOT = app.isPackaged ? path.join(process.resourcesPath, "app") : path.join(__dirname, "..");
const isElectron = Boolean(process.versions.electron);
const nodeBin = isElectron ? process.execPath : "node";
const nodeEnv = { ...process.env };
if (isElectron) nodeEnv.ELECTRON_RUN_AS_NODE = "1";

// --- Procura o projeto LOCAL no PC (prioridade sobre o bundled) ---------------
function findProjectDir() {
  const candidates = [
    "D:\\LeilaoPokemon",
    "C:\\LeilaoPokemon",
    path.join(app.getPath("home"), "LeilaoPokemon"),
    path.join(app.getPath("documents"), "LeilaoPokemon"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "package.json")) &&
        fs.existsSync(path.join(dir, "scripts", "start-all.mjs"))) {
      console.log("[init] projeto local encontrado:", dir);
      return dir;
    }
  }
  return null;
}

// --- Helpers -----------------------------------------------------------------------
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

function needsBuild(root) {
  return !fs.existsSync(path.join(root, ".next", "BUILD_ID"));
}

// --- Build Next.js (bundled, primeira vez) ---------------------------------------------
function runBuild(root) {
  return new Promise((resolve, reject) => {
    const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
    if (!fs.existsSync(nextCli)) { reject(new Error("next CLI não encontrado")); return; }
    console.log("[build] next build em", root);
    buildProcess = spawn(nodeBin, [nextCli, "build"], {
      cwd: root, env: nodeEnv,
      stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    buildProcess.stdout.on("data", chunk => console.log("[build]", chunk.toString().trim()));
    buildProcess.stderr.on("data", chunk => console.log("[build-err]", chunk.toString().trim()));
    buildProcess.on("exit", code => {
      buildProcess = null;
      code === 0 ? resolve() : reject(new Error(`next build falhou (code ${code})`));
    });
  });
}

// --- Sobe o stack (start-all.mjs) a partir do diretório dado -------------------------
function startStack(root) {
  const script = path.join(root, "scripts", "start-all.mjs");
  if (!fs.existsSync(script)) {
    console.log("[stack] start-all.mjs não encontrado em", root);
    return;
  }
  console.log("[stack] iniciando via start-all.mjs em", root);
  stackProcess = spawn(nodeBin, [script], {
    cwd: root,
    env: { ...nodeEnv, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
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

// --- Telas ----------------------------------------------------------------------------
const htmlProgress = (title, sub) => `data:text/html;charset=utf-8,
  <body style="font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
    <div style="text-align:center;max-width:500px;padding:40px">
      <div style="font-size:48px;margin-bottom:16px">🦭</div>
      <h2 style="color:#e74c3c;margin:0 0 8px">${title}</h2>
      <p style="color:#aaa;font-size:14px">${sub}</p>
      <div style="width:300px;height:6px;background:#16213e;border-radius:3px;margin:20px auto;overflow:hidden">
        <div style="width:100%;height:100%;background:#e74c3c;border-radius:3px;animation:slide 2s infinite"></div>
      </div>
      <style>@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}</style>
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

// --- Janela e fluxo principal -----------------------------------------------------------
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1024, minHeight: 700,
    title: "Leilão Pokémon",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false,
    },
    show: false,
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: "reload", label: "Recarregar" },
    { role: "quit", label: "Sair" },
  ]));

  mainWindow.once("ready-to-show", () => { mainWindow.show(); mainWindow.maximize(); });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  mainWindow.on("closed", () => { mainWindow = null; });

  try {
    // 1. Já rodando? Conecta.
    if (await isServerRunning()) {
      mainWindow.loadURL(`http://localhost:${PORT}`);
      return;
    }

    // 2. Projeto LOCAL no PC? Usa ele (tem IA de 7GB, sessão WhatsApp, .env completo)
    const localDir = findProjectDir();
    if (localDir) {
      mainWindow.loadURL(htmlProgress("Iniciando...", "Usando o projeto local (reconhecimento com IA local)"));
      startStack(localDir);
      const ok = await waitForServer();
      if (ok && mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(`http://localhost:${PORT}`);
      return;
    }

    // 3. Sem projeto local: usa o embutido (build na primeira vez)
    if (needsBuild(BUNDLED_ROOT)) {
      mainWindow.loadURL(htmlProgress("Configurando o Leilão Pokémon...", "Compilando o painel (só na primeira vez)"));
      await runBuild(BUNDLED_ROOT);
    }

    mainWindow.loadURL(htmlProgress("Iniciando servidor...", "Bot WhatsApp + reconhecimento"));
    startStack(BUNDLED_ROOT);

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

// --- Reconecta sozinho se a página cair ----------------------------------------------------
setInterval(async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.webContents.getURL().startsWith("data:")) {
    if (await isServerRunning()) mainWindow.loadURL(`http://localhost:${PORT}`);
  }
}, 5_000);

// --- Uma instância SÓ ------------------------------------------------------------------------
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
