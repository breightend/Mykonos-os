import { app, shell, BrowserWindow, ipcMain, nativeTheme, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import lightIcon from '../../resources/light.png?asset'
import darkIcon from '../../resources/dark.png?asset'

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
  })

  updateAppIcon()


  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function updateAppIcon() {
  if (!mainWindow) {
    // Window not created yet or already closed
    return;
  }

   const isDarkMode = nativeTheme.shouldUseDarkColors;
  //const isDarkMode = localStorage.getItem('theme') === 'night' || false
  console.log(`Theme changed: ${isDarkMode ? 'Dark' : 'Light'}`); // For debugging

  //const iconPath = isDarkMode ? darkIcon : lightIcon;
  const iconPath = lightIcon;

  try {
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) {
      console.error(`Failed to load icon image from path: ${iconPath}`);
      return; // Don't try to set an empty image
    }

    // Ensure the image isn't empty before setting
    if (!image.isEmpty()) {
      // Set window icon (Taskbar on Win/Linux)
      mainWindow.setIcon(image);

      // Set dock icon (macOS)
      if (process.platform === 'darwin') { // 'darwin' is the platform name for macOS
        app.dock.setIcon(image);
      }
    } else {
      console.warn(`Could not load icon from path: ${iconPath}`);
    }


  } catch (error) {
    console.error(`Error creating nativeImage from path ${iconPath}:`, error);
  }
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  nativeTheme.on('updated', () => {
    // Use a short debounce or setTimeout if updates fire too rapidly (optional)
    // setTimeout(updateAppIcon, 100); // e.g., wait 100ms
    updateAppIcon(); // Call the update function when the theme changes
  });


  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
