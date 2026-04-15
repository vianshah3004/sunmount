const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const WEB_DIR = path.join(__dirname, '..', 'web');
const WEB_ENTRY = path.join(WEB_DIR, 'index.html');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    autoHideMenuBar: true,
    backgroundColor: '#f4f6fa',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (!fs.existsSync(WEB_ENTRY)) {
    dialog.showErrorBox(
      'Missing Web Build',
      'Could not find web/index.html. Run "npm run build:web" in SunmountDesktop first.'
    );
    return;
  }

  win.loadFile(WEB_ENTRY);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
