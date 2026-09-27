// LEILÃO POKÉMON — Desktop (Electron)
// JANELA NATIVA em volta do painel. NÃO sobe processos pesados — apenas
// verifica se o servidor já está rodando e conecta. Se não estiver, mostra
// uma tela orientando o usuário.
const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const http = require("http");

const NEXT_PORT = 3000;
let mainWindow = null;

// Verifica se o painel já está rodando (evita conflito de porta)
function isServerRunning() {
  return new Promise(resolve => {
    const req = http.get(`http://127.0.0.1:${NEXT_PORT}/api/health`, res => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
  });
}

async function createWindow() {
  const running = await isServerRunning();

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

  if (running) {
    mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);
  } else {
    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <body style="font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center;max-width:600px;padding:40px">
          <h1 style="color:#e74c3c">Painel não encontrado</h1>
          <p>O servidor do painel não está rodando em <code>localhost:3000</code>.</p>
          <p style="margin-top:20px;font-size:14px;color:#aaa">
            Abra um terminal na pasta do projeto e execute:<br>
            <code style="background:#16213e;padding:8px 16px;border-radius:8px;display:inline-block;margin-top:10px;color:#e74c3c">
              npm run start
            </code>
          </p>
          <p style="margin-top:20px;font-size:13px;color:#777">
            Depois clique em "Recarregar" no menu acima.
          </p>
        </div>
      </body>`);
  }

  mainWindow.on("closed", () => { mainWindow = null; });
}

// Verifica a cada 5s se o servidor ficou disponível (após npm run start)
setInterval(async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const currentURL = mainWindow.webContents.getURL();
  if (currentURL.startsWith("data:")) {
    const running = await isServerRunning();
    if (running) mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);
  }
}, 5_000);

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
