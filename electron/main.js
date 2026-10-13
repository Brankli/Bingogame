const { app, BrowserWindow, utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let backendProcess = null;
let mainWindow = null;
let isQuitting = false;

// Start the NestJS backend
function startBackend() {
  const appPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked')
    : path.join(__dirname, '..');

  const backendPath = path.join(
    appPath,
    'dist',
    'main.js'
  );

  console.log('Starting backend:', backendPath);
  console.log('Backend exists:', fs.existsSync(backendPath));
  console.log('App path:', appPath);

  if (!fs.existsSync(backendPath)) {
    console.error('Backend file not found:', backendPath);
    return false;
  }

  try {
    backendProcess = utilityProcess.fork(
      backendPath,
      [],
      {
        cwd: appPath,
        stdio: 'pipe',
        env: {
          ...process.env,
          ELECTRON_MODE: 'true',
          NODE_ENV: 'development',
          PORT: '3000',
          CORS_ORIGIN: 'http://127.0.0.1:3000',
          SECRET_KEY:
            process.env.SECRET_KEY ||
            'bingo-desktop-local-secret-key-change-this-32',
          ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
          ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
        }
      }
    );

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
      backendProcess = null;

      if (!isQuitting && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'backend-stopped',
          'The Bingo backend has stopped.'
        );
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to start backend:', error);
    backendProcess = null;
    return false;
  }
}

// Check whether the backend is ready
function checkBackendReady(maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      if (isQuitting) {
        reject(new Error('Application is quitting.'));
        return;
      }

      attempts++;

      const request = http.get(
        'http://127.0.0.1:3000/',
        (response) => {
          // Any HTTP response confirms that a server answered.
          response.resume();

          console.log('Backend responded with status:', response.statusCode);
          resolve();
        }
      );

      request.setTimeout(2000, () => {
        request.destroy(new Error('Backend request timed out.'));
      });

      request.on('error', () => {
        if (attempts < maxAttempts) {
          console.log(
            `Waiting for backend... ${attempts}/${maxAttempts}`
          );
          setTimeout(check, 1000);
        } else {
          reject(
            new Error(
              'Backend failed to start after 30 attempts.'
            )
          );
        }
      });
    };

    check();
  });
}

// Create the Electron window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1000,
    minHeight: 650,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL('http://127.0.0.1:3000')
    .catch((error) => {
      console.error('Failed to load Bingo Game:', error);
    });

  // Developer tools are available only in development.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start the backend and then open the app
app.whenReady().then(async () => {
  console.log('Electron app ready');

  const started = startBackend();

  if (!started) {
    console.error('Cannot open Bingo Game because the backend did not start.');
    app.quit();
    return;
  }

  try {
    await checkBackendReady();
    if (!isQuitting) {
      createWindow();
    }
  } catch (error) {
    console.error('Bingo Game startup failed:', error);
    app.quit();
  }
});

// macOS: reopen the window when the app is activated
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && backendProcess) {
    createWindow();
  }
});

// Stop the backend when Electron exits
app.on('before-quit', () => {
  isQuitting = true;

  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (error) {
      console.error('Failed to stop backend:', error);
    }

    backendProcess = null;
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
