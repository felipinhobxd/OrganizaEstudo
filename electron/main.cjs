// LEILÃO POKÉMON — Desktop (Electron)
// Janela nativa + detecta o servidor (localhost:3000). Se não estiver
// rodando, procura o projeto no PC (D:\LeilaoPokemon ou caminho salvo)
// e roda npm run start a partir dele.
const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const { spawn, execSync } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const PORT = 3000;
let mainWindow = null;
let stackProcess = null;

// --- Procura o projeto no PC --------------------------------------------------
function findProjectDir() {
  const candidates = [
    path.join(app.getPath("home"), ".leilao-pokemon-path"), // arquivo de config
    "D:\\LeilaoPokemon",
    "C:\\LeilaoPokemon",
    path.join(app.getPath("home"), "LeilaoPokemon"),
    path.join(app.getPath("documents"), "LeilaoPokemon"),
  ];
  for (const c of candidates) {
    if (c.endsWith(".leilao-pokemon-path")) {
      // Se é um arquivo de texto com o caminho
      if (fs.existsSync(c)) {
        const saved = fs.readFileSync(c, "utf8").trim();
        if (saved && fs.existsSync(path.join(saved, "package.json"))) return saved;
      }
      continue;
    }
    if (fs.existsSync(path.join(c, "package.json")) &&
        fs.existsSync(path.join(c, "scripts", "start-all.mjs"))) {
      return c;
    }
  }
  return null;
}

// --- Verifica se o painel está rodando ----------------------------------------
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

// --- Sobe npm run start a partir do projeto local ------------------------------
function startStack(projectDir) {
  if (!projectDir) return false;
  console.log(`[stack] npm run start em ${projectDir}`);
  stackProcess = spawn("npm", ["run", "start"], {
    cwd: projectDir,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    shell: true, // npm no Windows precisa de shell
  });
  const log = chunk => {
    const line = chunk.toString().trim();
    if (line) console.log(`[stack] ${line}`);
  };
  stackProcess.stdout.on("data", log);
  stackProcess.stderr.on("data", log);
  stackProcess.on("exit", code => console.log(`[stack] saiu (code ${code})`));
  return true;
}

// --- Espera o painel ficar disponível -------------------------------------------
function waitForServer(timeoutMs = 90_000) {
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

// --- Tela de "sem servidor" com botão de tentar de novo ------------------------
function getNoServerHtml(projectDir) {
  const dir = projectDir || "não encontrado";
  return `data:text/html;charset=utf-8,
    <body style="font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="text-align:center;max-width:500px;padding:40px">
        <div style="font-size:48px;margin-bottom:16px">🦭</div>
        <h2 style="color:#e74c3c;margin:0 0 10px">Painel não está rodando</h2>
        <p style="color:#aaa;font-size:14px">Projeto detectado em:<br><code style="background:#16213e;padding:6px 12px;border-radius:6px;color:#e74c3c">${dir}</code></p>
        <p style="color:#777;font-size:13px;margin-top:20px">
          O app está tentando iniciar automaticamente.<br>
          Se não funcionar, abra um terminal e rode <code style="color:#e74c3c">npm run start</code>.
        </p>
        <p style="color:#555;font-size:12px;margin-top:20px">A janela conecta sozinha quando o servidor ficar pronto.</p>
      </div>
    </body>`;
}

// --- Kill limpo de TUDO ----------------------------------------------------------
function killStack() {
  if (!stackProcess) return;
  try { stackProcess.kill("SIGTERM"); } catch {}
  setTimeout(() => { try { stackProcess.kill("SIGKILL"); } catch {} }, 3_000);
  stackProcess = null;
}

// --- Janela ------------------------------------------------------------------------
async function createWindow() {
  const alreadyRunning = await isServerRunning();
  const projectDir = alreadyRunning ? null : findProjectDir();
  if (!alreadyRunning && projectDir) {
    startStack(projectDir);
  }

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
    mainWindow.loadURL(getNoServerHtml(projectDir));
    const ok = await waitForServer();
    if (ok && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(`http://localhost:${PORT}`);
    }
  }

  mainWindow.on("closed", () => { mainWindow = null; });
}

// --- Reconecta automaticamente quando o servidor aparecer ------------------------
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
