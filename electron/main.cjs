// LEILÃO POKÉMON — Desktop (Electron)
// Abre o painel (Next.js localhost:3000) numa janela nativa e sobe os
// processos filhos (bot WhatsApp + serviço de reconhecimento) junto.
const { app, BrowserWindow, Menu, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const isDev = !app.isPackaged;
const ROOT = isDev ? path.join(__dirname, "..") : path.join(process.resourcesPath, "app");
const NEXT_PORT = 3000;
const RECOGNITION_PORT = 8765;

let mainWindow = null;
const childProcesses = [];

// --- Processos filhos -------------------------------------------------------
function spawnChild(label, bin, args, cwd, env = {}) {
  const child = spawn(bin, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const log = chunk => {
    const line = chunk.toString().trim();
    if (line) console.log(`[${label}] ${line}`);
  };
  child.stdout.on("data", log);
  child.stderr.on("data", log);
  child.on("exit", code => console.log(`[${label}] saiu (code ${code})`));
  childProcesses.push(child);
  return child;
}

function startNextServer() {
  if (isDev) return; // em dev o Next já está rodando via npm run dev
  const nextBin = path.join(ROOT, "node_modules", ".bin", "next");
  spawnChild("next", process.execPath, [nextBin, "start", "-p", String(NEXT_PORT)], ROOT);
}

function startBot() {
  const botDir = path.join(ROOT, "bot");
  if (!fs.existsSync(path.join(botDir, "index.mjs"))) return;
  spawnChild("bot", process.execPath, ["index.mjs"], botDir, {
    BOT_DATA_DIR: path.join(botDir, "data"),
  });
}

function startRecognition() {
  const recDir = path.join(ROOT, "recognition");
  const venvPython = path.join(recDir, ".venv", "Scripts", "python.exe");
  if (!fs.existsSync(venvPython)) {
    console.log("[recognition] .venv não encontrado — IA desligada (wizard usa pipeline do navegador)");
    return;
  }
  spawnChild("recognition", venvPython, ["recognition_server.py"], recDir);
}

// --- Espera o Next.js responder ----------------------------------------------
function waitForServer(port, timeoutMs = 60_000) {
  return new Promise(resolve => {
    const started = Date.now();
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, res => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) resolve(false);
        else setTimeout(check, 1_000);
      });
    };
    check();
  });
}

// --- Janela -----------------------------------------------------------------
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Leilão Pokémon",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Menu minimalista (sem devtools em produção)
  if (!isDev) {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { role: "reload", label: "Recarregar" },
      { role: "quit", label: "Sair" },
    ]));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Links externos abrem no navegador padrão (não dentro do app)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const ok = await waitForServer(NEXT_PORT);
  if (ok) {
    mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);
  } else {
    mainWindow.loadURL(`data:text/html,<h1 style="font-family:sans-serif;padding:40px">Falha ao iniciar o servidor. Verifique o terminal.</h1>`);
  }

  mainWindow.on("closed", () => { mainWindow = null; });
}

// --- Ciclo de vida -----------------------------------------------------------
app.whenReady().then(async () => {
  startNextServer();
  await new Promise(r => setTimeout(r, isDev ? 500 : 3_000));
  startBot();
  startRecognition();
  await createWindow();
});

app.on("window-all-closed", () => {
  for (const child of childProcesses) { try { child.kill(); } catch {} }
  app.quit();
});

app.on("before-quit", () => {
  for (const child of childProcesses) { try { child.kill("SIGTERM"); } catch {} }
});
