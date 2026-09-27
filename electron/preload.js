// Preload: ponte segura entre o Electron e a página web (contextIsolation).
// Por enquanto só expõe a versão do app — suficiente para o painel.
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("desktop", { version: process.versions.electron });
