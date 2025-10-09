import { app, shell, BrowserWindow, ipcMain, nativeTheme, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { existsSync, readFileSync } from 'fs'
import lightIcon from '../../resources/light.png?asset'
import darkIcon from '../../resources/dark.png?asset'
import { autoUpdater } from 'electron-updater'

let mainWindow;
let serverConfig = null;

// Función para cargar configuración del servidor
function loadServerConfig() {
  try {
    // Buscar el archivo de configuración en diferentes ubicaciones
    const configPaths = [
      join(__dirname, '../../../server-config.json'),
      join(__dirname, '../../server-config.json'),
      join(process.resourcesPath, 'server-config.json'),
      join(app.getPath('userData'), 'server-config.json')
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        console.log('📁 Cargando configuración desde:', configPath)
        const configData = readFileSync(configPath, 'utf8')
        serverConfig = JSON.parse(configData)
        console.log('✅ Configuración del servidor cargada:', serverConfig.server)
        return serverConfig
      }
    }

    console.log('⚠️ No se encontró archivo de configuración, usando defaults')
    return null
  } catch (error) {
    console.error('❌ Error cargando configuración del servidor:', error)
    return null
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
  })

  updateAppIcon()

  console.log('Creating window...')
  console.log('Is development:', is.dev)
  console.log('__dirname:', __dirname)
  console.log('Process env ELECTRON_RENDERER_URL:', process.env['ELECTRON_RENDERER_URL'])

  mainWindow.on('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow.show()

    mainWindow.focus()
    mainWindow.moveTop()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle page load events
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Page started loading')
  })

  mainWindow.webContents.on('did-stop-loading', () => {
    console.log('Page stopped loading')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading')
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load page:', errorCode, errorDescription, validatedURL)
  })

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready')
    // Add multiple checks to debug React mounting
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        console.log('=== REACT DEBUGGING ===');
        console.log('React root element exists:', !!document.getElementById('root'));
        console.log('Root element content:', document.getElementById('root').innerHTML.length);
        console.log('Body content length:', document.body.innerHTML.length);
        console.log('Scripts loaded:', document.scripts.length);
        console.log('Window React:', typeof window.React);
        console.log('Window ReactDOM:', typeof window.ReactDOM);
        console.log('Global errors:', window.errorCount || 0);
        
        // Check CSS and styling
        console.log('=== CSS DEBUGGING ===');
        console.log('CSS files loaded:', document.styleSheets.length);
        console.log('Tailwind classes test:', getComputedStyle(document.body).backgroundColor);
        console.log('Body computed styles:', {
          display: getComputedStyle(document.body).display,
          visibility: getComputedStyle(document.body).visibility,
          opacity: getComputedStyle(document.body).opacity,
          backgroundColor: getComputedStyle(document.body).backgroundColor
        });
        
        // Check if root has any computed styles that might hide content
        const rootElement = document.getElementById('root');
        if (rootElement) {
          console.log('Root computed styles:', {
            display: getComputedStyle(rootElement).display,
            visibility: getComputedStyle(rootElement).visibility,
            opacity: getComputedStyle(rootElement).opacity,
            position: getComputedStyle(rootElement).position,
            zIndex: getComputedStyle(rootElement).zIndex
          });
        }
        
        // Check for any errors in console
        const originalError = console.error;
        let errorCount = 0;
        console.error = function(...args) {
          errorCount++;
          window.errorCount = errorCount;
          originalError.apply(console, args);
        };
        
        // Try to manually trigger React if it's not mounted
        if (document.getElementById('root').innerHTML.length === 0) {
          console.log('⚠️ Root is empty, React may not have mounted');
          console.log('Available window properties:', Object.keys(window).filter(k => k.includes('React') || k.includes('react')));
        }
      `)
    }, 1000)

    // Additional check after more time
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        console.log('=== DELAYED CHECK (3s) ===');
        const root = document.getElementById('root');
        console.log('Root content length:', root.innerHTML.length);
        console.log('Any React components rendered:', document.querySelector('[data-reactroot]') !== null);
        console.log('CSS loaded:', document.styleSheets.length);
        
        // If root is still empty, try to force some content for testing
        if (root.innerHTML.length === 0) {
          console.log('🔧 FORCING TEST CONTENT INTO ROOT');
          root.innerHTML = '<div style="background: red; color: white; padding: 20px; position: fixed; top: 0; left: 0; z-index: 9999;">TEST: If you see this, HTML/CSS works but React failed to mount</div>';
          
          // Also check if React is available globally
          console.log('Available global variables:', Object.keys(window).filter(k => k.toLowerCase().includes('react')));
        }
      `)
    }, 3000)
  })

  // Handle console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Renderer console (${level}):`, message)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    console.log('Loading development URL:', process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // Enhanced debugging for production builds
    console.log('=== PRODUCTION BUILD DEBUG ===')
    console.log('Process resourcesPath:', process.resourcesPath)
    console.log('App path:', app.getAppPath())
    console.log('__dirname:', __dirname)
    console.log('app.isPackaged:', app.isPackaged)

    // List possible HTML paths
    const possiblePaths = [
      join(__dirname, '../renderer/index.html'),
      join(process.resourcesPath, 'app/out/renderer/index.html'),
      join(process.resourcesPath, 'out/renderer/index.html'),
      join(app.getAppPath(), 'out/renderer/index.html'),
      join(app.getAppPath(), 'dist/renderer/index.html'),
      join(__dirname, '../../out/renderer/index.html'),
      join(__dirname, '../../../out/renderer/index.html')
    ]

    console.log('Checking possible HTML paths:')
    let foundPath = null

    for (const path of possiblePaths) {
      const exists = existsSync(path)
      console.log(`${exists ? '✓' : '✗'} ${path}`)
      if (exists && !foundPath) {
        foundPath = path
      }
    }

    if (foundPath) {
      console.log('Loading HTML from:', foundPath)
      mainWindow.loadFile(foundPath)
    } else {
      console.error('No HTML file found at any expected location!')
      console.log('Current directory contents:')
      try {
        const fs = require('fs')
        console.log('__dirname contents:', fs.readdirSync(__dirname))
        console.log('Parent directory contents:', fs.readdirSync(join(__dirname, '..')))
      } catch (e) {
        console.error('Error listing directories:', e)
      }
    }
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
  // Cargar configuración del servidor al inicio
  loadServerConfig()

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

  autoUpdater.checkForUpdatesAndNotify();
  });


  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handler para obtener configuración del servidor
  ipcMain.handle('get-server-config', () => {
    if (!serverConfig) {
      serverConfig = loadServerConfig()
    }
    return serverConfig?.server || {
      url: 'http://190.3.63.58:8000',
      timeout: 8000,
      retries: 3
    }
  })

  // IPC handler para obtener información de la app
  ipcMain.handle('get-app-info', () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      isPackaged: app.isPackaged,
      isDev: is.dev
    }
  })

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
