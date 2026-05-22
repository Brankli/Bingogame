const { app, BrowserWindow, utilityProcess } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')

let backendProcess
let mainWindow

function startBackend() {
  // Backend and node_modules are both in app.asar.unpacked
  const appPath = path.join(process.resourcesPath, 'app.asar.unpacked');
  const backendPath = path.join(appPath, 'dist', 'main.js');

  console.log('Starting backend:', backendPath);
  console.log('Backend exists:', fs.existsSync(backendPath));
  console.log('App path:', appPath);

  if (!fs.existsSync(backendPath)) {
    console.error('Backend file not found');
    return;
  }

  // Use Electron's utilityProcess API to run Node.js code
  backendProcess = utilityProcess.fork(backendPath, [], {
    cwd: appPath,
    stdio: 'pipe',
    env: {
      ...process.env,
      ELECTRON_MODE: 'true',
      NODE_ENV: 'production'
    }
  });

  // Log backend output
  if (backendProcess.stdout) {
    backendProcess.stdout.on('data', (data) => {
      console.log('[Backend]', data.toString().trim());
    });
  }

  if (backendProcess.stderr) {
    backendProcess.stderr.on('data', (data) => {
      console.error('[Backend Error]', data.toString().trim());
    });
  }

  backendProcess.on('spawn', () => {
    console.log('Backend process spawned');
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
  });
}

function checkBackendReady(callback, maxAttempts = 30) {
  let attempts = 0

  const check = () => {
    attempts++

    http.get('http://127.0.0.1:3000/api', () => {
      console.log('Backend ready')
      callback()
    }).on('error', () => {
      if (attempts < maxAttempts) {
        console.log(`Waiting backend... ${attempts}/${maxAttempts}`)
        setTimeout(check, 1000)
      } else {
        console.error('Backend failed to start')
        callback()
      }
    })
  }

  check()
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  const frontendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar/client/dist/index.html')
    : path.join(__dirname, '../client/dist/index.html')

  console.log('Frontend path:', frontendPath)
  console.log('Exists:', fs.existsSync(frontendPath))

  if (!fs.existsSync(frontendPath)) {
    console.error('Frontend NOT FOUND')
    return
  }

  mainWindow.loadFile(frontendPath)
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  console.log('Electron app ready')
  startBackend()
  checkBackendReady(() => {
    createWindow()
  })
})

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill()
  }
  app.quit()
})
