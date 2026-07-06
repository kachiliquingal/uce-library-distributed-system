const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1150,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    title: 'UCE Library - Estación Digital & Terminal de Gestión Bibliotecaria',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Enables smooth CORS calls to AWS API Gateway from local desktop client
    },
    icon: path.join(__dirname, 'icon.png')
  });

  // Remove default Windows menu bar for a clean, modern kiosk/native look
  Menu.setApplicationMenu(null);

  mainWindow.loadFile('index.html');
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
