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

  // Auto-update: check in production only (delay so page loads first)
  if (!isDev) {
    setTimeout(() => {
      try {
        autoUpdater.checkForUpdatesAndNotify();
      } catch { /* silently ignore update errors */ }
    }, 5000);
  }
}

// Update event handlers
function sendStatus(msg) {
  if (mainWindow) mainWindow.webContents.send('update-status', msg);
}

autoUpdater.on('checking-for-update', () => {
  sendStatus({ type: 'checking', text: '正在检查更新...' });
});

autoUpdater.on('update-available', (info) => {
  new (require('electron').Notification)({
    title: '发现新版本',
    body: `v${info.version} — 正在下载...`,
  }).show();
  sendStatus({ type: 'downloading', text: `发现 v${info.version}，正在下载...`, percent: 0 });
});

autoUpdater.on('update-not-available', () => {
  sendStatus({ type: 'uptodate', text: '已是最新' });
});

autoUpdater.on('download-progress', (p) => {
  if (mainWindow) mainWindow.setProgressBar(p.percent / 100);
  const mb = (n) => n ? (n / 1048576).toFixed(1) + ' MB' : '';
  const speed = p.bytesPerSecond ? (p.bytesPerSecond / 1048576).toFixed(1) + ' MB/s' : '';
  sendStatus({
    type: 'downloading',
    text: `${mb(p.transferred)} / ${mb(p.total)}  ${speed}`,
    percent: Math.floor(p.percent),
  });
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) mainWindow.setProgressBar(-1);
  sendStatus({ type: 'ready', text: '下载完成！' });
  const { dialog, Notification, shell } = require('electron');

  if (process.platform === 'win32') {
    // Windows NSIS: native auto-install works
    new Notification({ title: '更新已就绪', body: `v${info.version} — 点击重启更新` }).show();
    dialog.showMessageBox({
      type: 'info', title: '更新已就绪 / Update Ready',
      message: `v${info.version} 已下载完成。\n\n点击「重启更新」将自动安装并重启应用。`,
      buttons: ['重启更新', '稍后'],
    }).then(({ response }) => {
      if (response === 0) {
        setImmediate(() => autoUpdater.quitAndInstall());
      }
    });
    return;
  }

  // macOS unsigned: extract .zip and swap via Terminal + osascript
  new Notification({ title: '更新已就绪', body: `v${info.version} — 点击重启更新` }).show();

  const { readdirSync } = require('fs');
  const { execFileSync } = require('child_process');
  const home = app.getPath('home');

  // Find the downloaded .zip from electron-updater cache
  let zipPath = info.downloadedFile || '';
  if (!zipPath || !existsSync(zipPath)) {
    const pendingDir = path.join(home, 'Library', 'Caches', app.getName(), 'pending');
    try { mkdirSync(pendingDir, { recursive: true }); } catch {}
    try {
      const entries = readdirSync(pendingDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile() && e.name.endsWith('.zip')) {
          zipPath = path.join(pendingDir, e.name);
          break;
        }
      }
    } catch {}
  }

  // Extract the .app from the .zip to a temp location
  let newAppPath = '';
  if (zipPath && existsSync(zipPath)) {
    const extractDir = path.join(app.getPath('temp'), 'silk-weave-update');
    try {
      execFileSync('rm', ['-rf', extractDir]);
      execFileSync('ditto', ['-xk', zipPath, extractDir], { timeout: 30000 });
      const apps = readdirSync(extractDir, { withFileTypes: true });
      const appEntry = apps.find(a => a.isDirectory() && a.name.endsWith('.app'));
      if (appEntry) newAppPath = path.join(extractDir, appEntry.name);
    } catch (e) {
      console.error('extract failed:', e.message);
    }
  }

  const hasNewApp = newAppPath && existsSync(newAppPath);
  console.log('update-downloaded:', { version: info.version, zipPath, newAppPath });

  if (hasNewApp) {
    dialog.showMessageBox({
      type: 'info', title: '更新已就绪 / Update Ready',
      message: `v${info.version} 已就绪。\n\n点击「重启更新」将自动替换并重启应用。`,
      buttons: ['重启更新', '稍后'],
    }).then(({ response }) => {
      if (response === 0) {
        const { writeFileSync, chmodSync } = require('fs');
        const os = require('os');
        const tmpDir = os.tmpdir();
        const scriptPath = path.join(tmpDir, 'silk-weave-swap.command');
        const pathsFile = path.join(tmpDir, '.silk-weave-paths');
        writeFileSync(pathsFile, `${newAppPath}\n${path.dirname(newAppPath)}`);
        const swapScript = `#!/bin/bash
NEW_APP=$(head -1 "${pathsFile}")
TMP_DIR=$(tail -1 "${pathsFile}")
echo "🔄 Silk Weave 更新中..."
sleep 2
osascript -e "do shell script \\"rm -rf /Applications/Silk-Weave.app && cp -R '$NEW_APP' /Applications/Silk-Weave.app && rm -rf '$TMP_DIR'\\" with administrator privileges"
rm "${pathsFile}" "${scriptPath}"
if [ $? -eq 0 ]; then
  echo "✅ 更新完成！窗口即将关闭。"
  sleep 1
  open /Applications/Silk-Weave.app
  osascript -e 'tell application "Terminal" to close (every window whose name contains "silk-weave")' 2>/dev/null
else
  echo "❌ 更新失败，请手动安装"
  open "$TMP_DIR"
fi
`;
        writeFileSync(scriptPath, swapScript);
        chmodSync(scriptPath, 0o755);
        require('child_process').exec(`open -a Terminal "${scriptPath}"`);
        setTimeout(() => app.quit(), 1000);
      }
    });
  } else {
    dialog.showMessageBox({
      type: 'info', title: '更新已就绪 / Update Ready',
      message: `v${info.version} 已下载完成。\n\n请手动安装新版本。`,
      buttons: ['打开下载文件夹', '稍后'],
    }).then(({ response }) => {
      if (response === 0) {
        if (zipPath) shell.openPath(path.dirname(zipPath));
        else shell.openPath(path.join(home, 'Library', 'Caches', app.getName(), 'pending'));
      }
    });
  }
});

autoUpdater.on('error', (err) => {
  sendStatus({ type: 'error', text: err.message || '更新失败' });
});

// Manual update check from renderer
ipcMain.on('check-for-updates', async () => {
  const { dialog } = require('electron');

  // Timeout fallback: if no event fires within 30s, show error
  let timeout;
  const clearTimer = () => { if (timeout) { clearTimeout(timeout); timeout = null; } };
  const armTimer = () => {
    clearTimer();
    timeout = setTimeout(() => {
      sendStatus({ type: 'error', text: '检查超时，请检查网络连接' });
      dialog.showErrorBox('检查超时 / Check Timed Out', '无法连接 GitHub，请检查网络。\nCannot reach GitHub. Please check your network.');
    }, 30000);
  };

  try {
    // Wrap autoUpdater.emit to catch the first event (any kind) and disarm the timeout
    const origEmit = autoUpdater.emit.bind(autoUpdater);
    const eventNames = ['checking-for-update', 'update-available', 'update-not-available', 'error'];
    const wrappedEmit = function(event, ...args) {
      if (eventNames.includes(event)) clearTimer();
      // Restore on first relevant event (so we don't interfere with future checks)
      if (event !== 'download-progress') {
        autoUpdater.emit = origEmit;
      }
      return origEmit(event, ...args);
    };
    autoUpdater.emit = wrappedEmit;
    armTimer();

    const result = autoUpdater.checkForUpdates();
    // If checkForUpdates returns null, it means a check is already in progress
    if (result === null || result === undefined) {
      // Give it a moment to fire checking-for-update; if not, it's stuck
      setTimeout(() => {
        if (timeout) { // timer still armed = no event fired
          clearTimer();
          sendStatus({ type: 'uptodate', text: '已是最新' });
        }
      }, 3000);
    }
  } catch (e) {
    clearTimer();
    sendStatus({ type: 'error', text: e.message || '检查失败' });
  }
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
