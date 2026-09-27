// LEILÃO POKÉMON — Desktop (Electron)
// Abre em janela nativa e sobe TUDO via start-all.mjs (o script que já
// gerencia Next.js + bot supervisor + reconhecimento com heap caps e
// restart). Um processo só, com check de porta e kill limpo.
const { app, BrowserWindow, Menu, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const PORT = 3000;
let mainWindow = null;
let stackProcess = null;

// --- Uma instância SÓ: segunda tentativa de abrir foca a janela existente ---
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
}

// --- Detecta a raiz do projeto (dev vs instalado) ----------------------------
const ROOT = app.isPackaged ? path.join(process.resourcesPath, "app") : path.join(__dirname, "..");

// --- Verifica se o painel já está rodando -----------------------------------
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

// --- Espera o painel ficar disponível ---------------------------------------
function waitForServer(timeoutMs = 120_000) {
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

// --- Sobe o stack inteiro (start-all.mjs já gerencia tudo) ------------------
function startStack() {
  const script = path.join(ROOT, "scripts", "start-all.mjs");
  if (!fs.existsSync(script)) {
    console.log("[stack] start-all.mjs não encontrado — só abrindo janela");
    return;
  }
  console.log("[stack] iniciando via start-all.mjs...");
  // CRÍTICO: no Electron empacotado, process.execPath aponta para o PRÓPRIO
  // .exe. Spawnar com ele abre OUTRA instância do app (loop infinito de
  // janelas). A flag ELECTRON_RUN_AS_NODE=1 faz o binário do Electron agir
  // como Node.js puro — exatamente o que os scripts precisam.
  const isElectron = Boolean(process.versions.electron);
  const nodeBin = isElectron ? process.execPath : "node";
  const childEnv = { ...process.env, NODE_ENV: "production" };
  if (isElectron) childEnv.ELECTRON_RUN_AS_NODE = "1";

  stackProcess = spawn(nodeBin, [script], {
    cwd: ROOT,
    env: childEnv,
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

// --- Kill limpo de TUDO ------------------------------------------------------
function killStack() {
  if (!stackProcess) return;
  try { stackProcess.kill("SIGTERM"); } catch {}
  // No Windows o SIGTERM pode não matar os netos — força depois de 3s
  setTimeout(() => { try { stackProcess.kill("SIGKILL"); } catch {} }, 3_000);
  stackProcess = null;
}

// --- Janela -------------------------------------------------------------------
async function createWindow() {
  const alreadyRunning = await isServerRunning();
  if (!alreadyRunning) startStack();

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

  if (alreadyRunning) {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  } else {
    // Tela de loading enquanto o stack sobe (pode levar 10-30s)
    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <body style="font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center">
          <h2 style="color:#e74c3c;margin-bottom:10px">Iniciando o Leilão Pokémon...</h2>
          <p style="color:#aaa">Next.js + Bot WhatsApp + Reconhecimento</p>
          <div style="margin-top:20px;font-size:28px;animation:pulse 1.5s infinite">🦭</div>
          <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}</style>
        </div>
      </body>`);

    // Assim que o servidor responder, troca a tela de loading pelo painel
    const ok = await waitForServer();
    if (ok && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(`http://localhost:${PORT}`);
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <body style="font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center;max-width:500px;padding:40px">
            <h2 style="color:#e74c3c">Falha ao iniciar</h2>
            <p style="color:#aaa;font-size:14px">
              Verifique se a porta 3000 está livre e se o arquivo .env.local
              está presente na pasta do aplicativo.<br><br>
              Clique em "Recarregar" para tentar de novo.
            </p>
          </div>
        </body>`);
    }
  }

  mainWindow.on("closed", () => { mainWindow = null; });
}

// --- Reconecta se a página cair e o servidor voltar ---------------------------
setInterval(async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const url = mainWindow.webContents.getURL();
  if (url.startsWith("data:")) {
    if (await isServerRunning()) mainWindow.loadURL(`http://localhost:${PORT}`);
  }
}, 5_000);

// --- Ciclo de vida --------------------------------------------------------------
app.whenReady().then(createWindow);
app.on("window-all-closed", () => { killStack(); app.quit(); });
app.on("before-quit", () => killStack());
