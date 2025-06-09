/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */
console.log('🔥 app.js lancé !');
const RPC = require('discord-rpc');
const fetch = require('node-fetch');

const clientId = '1255494029995540571'; // Ton ID Discord App
RPC.register(clientId);

const rpc = new RPC.Client({ transport: 'ipc' });

// 🔄 Fonction pour obtenir les joueurs en ligne via mcstatus.io
async function getPlayerCount() {
  try {
    const response = await fetch('https://api.mcstatus.io/v2/status/java/play.prisoncraft.fr');
    const data = await response.json();
    const players = data.players;
    return `${players.online}/${players.max} joueurs connectés`;
  } catch (err) {
    console.error('❌ Erreur API mcstatus.io :', err);
    return 'Serveur injoignable';
  }
}

// 🔁 Lorsque la connexion RPC est prête
rpc.on('ready', async () => {
  console.log('✅ RPC prêt');

  const updatePresence = async () => {
    const playerCount = await getPlayerCount();
    console.log(`🟢 Mise à jour RPC : ${playerCount}`);

    try {
      await rpc.setActivity({
        details: playerCount,
        state: 'PrisonCraft V2.6',
        startTimestamp: new Date(),
        largeImageKey: 'logo',
        largeImageText: 'PrisonCraft',
        buttons: [
          { label: 'Rejoindre le Discord', url: 'https://discord.gg/dEqMqZ9yqQ' },
          { label: 'Jouer maintenant', url: 'https://prisoncraft.fr' }
        ]
      });
      console.log('✅ Activité envoyée');
    } catch (err) {
      console.error('❌ Erreur setActivity', err);
    }
  };

  // Mise à jour initiale + répétition toutes les 60s
  await updatePresence();
  setInterval(updatePresence, 60 * 1000);
});

rpc.login({ clientId }).catch(err => {
  console.error('❌ Erreur RPC login :', err);
});


rpc.login({ clientId }).catch(console.error);


rpc.on('connected', () => console.log('✅ Discord RPC connecté'));
rpc.on('error', err => console.error('❌ Erreur RPC :', err));
const { app, ipcMain, nativeTheme } = require('electron');
const { Microsoft } = require('minecraft-java-core');
const { autoUpdater } = require('electron-updater')
async function getPlayerCount() {
  try {
    const response = await fetch('https://api.mcstatus.io/v2/status/java/mc312.boxtoplay.com:26786'); // ou ton IP
    const data = await response.json();
    const players = data.players;
    return `${players.online}/${players.max} joueurs connectés`;
  } catch (err) {
    console.error('Erreur API mcstatus.io :', err);
    return 'Serveur injoignable';
  }
}

const path = require('path');
const fs = require('fs');

const UpdateWindow = require("./assets/js/windows/updateWindow.js");
const MainWindow = require("./assets/js/windows/mainWindow.js");

let dev = process.env.NODE_ENV === 'dev';

if (dev) {
    let appPath = path.resolve('./data/Launcher').replace(/\\/g, '/');
    let appdata = path.resolve('./data').replace(/\\/g, '/');
    if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
    if (!fs.existsSync(appdata)) fs.mkdirSync(appdata, { recursive: true });
    app.setPath('userData', appPath);
    app.setPath('appData', appdata)
}

if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(() => {
    if (dev) return MainWindow.createWindow()
    UpdateWindow.createWindow()
});

ipcMain.on('main-window-open', () => MainWindow.createWindow())
ipcMain.on('main-window-dev-tools', () => MainWindow.getWindow().webContents.openDevTools({ mode: 'detach' }))
ipcMain.on('main-window-dev-tools-close', () => MainWindow.getWindow().webContents.closeDevTools())
ipcMain.on('main-window-close', () => MainWindow.destroyWindow())
ipcMain.on('main-window-reload', () => MainWindow.getWindow().reload())
ipcMain.on('main-window-progress', (event, options) => MainWindow.getWindow().setProgressBar(options.progress / options.size))
ipcMain.on('main-window-progress-reset', () => MainWindow.getWindow().setProgressBar(-1))
ipcMain.on('main-window-progress-load', () => MainWindow.getWindow().setProgressBar(2))
ipcMain.on('main-window-minimize', () => MainWindow.getWindow().minimize())

ipcMain.on('update-window-close', () => UpdateWindow.destroyWindow())
ipcMain.on('update-window-dev-tools', () => UpdateWindow.getWindow().webContents.openDevTools({ mode: 'detach' }))
ipcMain.on('update-window-progress', (event, options) => UpdateWindow.getWindow().setProgressBar(options.progress / options.size))
ipcMain.on('update-window-progress-reset', () => UpdateWindow.getWindow().setProgressBar(-1))
ipcMain.on('update-window-progress-load', () => UpdateWindow.getWindow().setProgressBar(2))

ipcMain.handle('path-user-data', () => app.getPath('userData'))
ipcMain.handle('appData', e => app.getPath('appData'))

ipcMain.on('main-window-maximize', () => {
    if (MainWindow.getWindow().isMaximized()) {
        MainWindow.getWindow().unmaximize();
    } else {
        MainWindow.getWindow().maximize();
    }
})

ipcMain.on('main-window-hide', () => MainWindow.getWindow().hide())
ipcMain.on('main-window-show', () => MainWindow.getWindow().show())

ipcMain.handle('Microsoft-window', async (_, client_id) => {
    return await new Microsoft(client_id).getAuth();
})

ipcMain.handle('is-dark-theme', (_, theme) => {
    if (theme === 'dark') return true
    if (theme === 'light') return false
    return nativeTheme.shouldUseDarkColors;
})

app.on('window-all-closed', () => app.quit());

autoUpdater.autoDownload = false;

ipcMain.handle('update-app', async () => {
    return await new Promise(async (resolve, reject) => {
        autoUpdater.checkForUpdates().then(res => {
            resolve(res);
        }).catch(error => {
            reject({
                error: true,
                message: error
            })
        })
    })
})

autoUpdater.on('update-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('updateAvailable');
});

ipcMain.on('start-update', () => {
    autoUpdater.downloadUpdate();
})

autoUpdater.on('update-not-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('update-not-available');
});

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (progress) => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('download-progress', progress);
})

autoUpdater.on('error', (err) => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('error', err);
});