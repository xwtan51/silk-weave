/**
 * Electron main process for Silk Weave (丝纹织影) — CommonJS
 */
const { app, BrowserWindow, screen, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { pathToFileURL } = require('url');
const { existsSync, mkdirSync, copyFileSync } = require('fs');

// Enable hardware acceleration for smooth rendering
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

// Auto-update events
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;
let serverInstance = null;

async function createWindow() {
  const isDev = !app.isPackaged && !process.env.ELECTRON_PROD;

  if (isDev) {
    // Dev mode: use existing dev server (Vite on 5173 proxies /api to 3001)
    // Ensure dev DB path matches the dev server
    process.env.DB_PATH = path.join(__dirname, '..', 'silkweave.db');
  } else {
    // Production: start own Express server
    process.env.ELECTRON = '1';
    const userDataPath = app.getPath('userData');
    if (!existsSync(userDataPath)) mkdirSync(userDataPath, { recursive: true });
    const userDbPath = path.join(userDataPath, 'silkweave.db');
    if (app.isPackaged && !existsSync(userDbPath)) {
      const seedDb = path.join(process.resourcesPath, 'silkweave.db');
      if (existsSync(seedDb)) copyFileSync(seedDb, userDbPath);
    }
    process.env.DB_PATH = userDbPath;

    const serverPath = pathToFileURL(path.join(__dirname, '..', 'server.js')).href;
    const mod = await import(serverPath);
    serverInstance = mod.server;
  }

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  // Phone aspect ratio: 390×844 (iPhone 14 Pro-ish)
  const winWidth = 390;
  const winHeight = Math.min(844, screenHeight - 40);

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: Math.min(winHeight, screenWidth - 40),
    title: 'Silk Weave — 丝纹织影',
    resizable: true,
    backgroundColor: '#F9F6F0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  const url = isDev ? 'http://localhost:5173' : `http://localhost:${serverInstance.address().port}`;
  console.log(`Mode: ${isDev ? 'DEV (Vite)' : 'PROD (Express)'} → ${url}`);
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => { mainWindow = null; });

  // Auto-update: check in production only
  if (!isDev) {
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch { /* silently ignore update errors */ }
  }
}

// Update event handlers
autoUpdater.on('update-available', (info) => {
  const { Notification } = require('electron');
  new Notification({
    title: '发现新版本 / Update Found',
    body: `v${info.version} — 正在后台下载...\nv${info.version} — Downloading...`,
  }).show();
});

autoUpdater.on('update-not-available', () => {
  console.log('App is up to date');
});

autoUpdater.on('download-progress', (p) => {
  if (mainWindow) mainWindow.setProgressBar(p.percent / 100);
  console.log(`Downloading update: ${Math.floor(p.percent)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) mainWindow.setProgressBar(-1);
  const { dialog, Notification } = require('electron');
  new Notification({
    title: '更新已就绪 / Update Ready',
    body: `v${info.version} — 点击弹窗重启安装\nClick the dialog to restart and install.`,
  }).show();
  dialog.showMessageBox({
    type: 'info',
    title: '更新已就绪 / Update Ready',
    message: `新版本 v${info.version} 已下载完成，点击确定重启安装更新。\nv${info.version} has been downloaded. Click OK to restart and install.`,
    buttons: ['确定 / OK'],
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});
autoUpdater.on('error', (err) => {
  console.error('Update error:', err.message);
});

// Manual update check from renderer
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (e) {
    const { dialog } = require('electron');
    dialog.showErrorBox(
      '启动失败 / Startup Failed',
      '错误信息: ' + (e.message || String(e)) + '\n\n请将此截图发给开发者。\nPlease send this screenshot to the developer.'
    );
    app.quit();
  }
});

// Global error handlers
process.on('uncaughtException', (e) => {
  try {
    const { dialog } = require('electron');
    dialog.showErrorBox('运行错误 / Runtime Error', e.message || String(e));
  } catch {}
  app.quit();
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

app.on('window-all-closed', () => {
  if (serverInstance) serverInstance.close();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow().catch(() => {});
});
