
const { app, BrowserWindow, utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { loadDeviceIdentity } = require('./device-identity');

let backendProcess = null;
let mainWindow = null;
let isQuitting = false;
let backendExitCode = null;

function loadExternalConfig() {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config && typeof config === 'object' ? config : {};
  } catch (error) {
    console.error('Failed to read external Bingo configuration:', error.message);
    return {};
  }
}

// Start the NestJS backend
async function startBackend() {
  const appPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked')
    : path.join(__dirname, '..');

  const backendPath = path.join(appPath, 'dist', 'main.js');

  console.log('======================================');
  console.log('Starting Bingo backend');
  console.log('Packaged:', app.isPackaged);
  console.log('Backend path:', backendPath);
  console.log('Backend exists:', fs.existsSync(backendPath));
  console.log('Working directory:', appPath);
  console.log('======================================');

  if (!fs.existsSync(backendPath)) {
    console.error('Backend file not found:', backendPath);
    return false;
  }

  try {
    const identity = await loadDeviceIdentity();
    const externalConfig = loadExternalConfig();
    const runtimeConfig = {
      ...process.env,
      ...externalConfig,
    };
    backendProcess = utilityProcess.fork(backendPath, [], {
      cwd: appPath,
      stdio: 'inherit',
      env: {
        ...runtimeConfig,
        ELECTRON_MODE: 'true',
        NODE_ENV: 'production',
        PORT: '3000',
        CORS_ORIGIN: 'http://127.0.0.1:3000',
        SECRET_KEY: runtimeConfig.SECRET_KEY,
        ADMIN_USERNAME: runtimeConfig.ADMIN_USERNAME,
        ADMIN_PASSWORD: runtimeConfig.ADMIN_PASSWORD,
        SYNC_DEVICE_ID: runtimeConfig.SYNC_DEVICE_ID || identity.deviceId,
        SYNC_DEVICE_SECRET:
          runtimeConfig.SYNC_DEVICE_SECRET || identity.deviceSecret,
      },
    });

    backendExitCode = null;

    backendProcess.on('spawn', () => {
      console.log('Bingo backend process spawned successfully.');
      console.log('Backend PID:', backendProcess?.pid);
    });

    backendProcess.on('error', (error) => {
      console.error('[Backend Process Error]', error);
    });

    backendProcess.on('exit', (code) => {
      console.error('[Backend Process Exit] Exit code:', code);
      backendExitCode = code;
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
    console.error('Failed to launch Bingo backend:', error);
    backendProcess = null;
    return false;
  }
}

// Wait until the backend responds
function checkBackendReady(maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    let finished = false;
    let retryTimer = null;

    const finish = (error) => {
      if (finished) return;
      finished = true;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }

      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const check = () => {
      if (isQuitting) {
        finish(new Error('Application is quitting.'));
        return;
      }

      if (!backendProcess) {
        finish(
          new Error(
            `Backend process exited before becoming ready. Exit code: ${
              backendExitCode ?? 'unknown'
            }`
          )
        );
        return;
      }

      attempts++;
      console.log(`Checking backend readiness: ${attempts}/${maxAttempts}`);

      const request = http.get('http://127.0.0.1:3000/', (response) => {
        response.resume();

        console.log(
          'Backend responded with HTTP status:',
          response.statusCode
        );

        finish();
      });

      request.setTimeout(2000, () => {
        request.destroy(new Error('Backend request timed out.'));
      });

      request.on('error', (error) => {
        if (finished) return;

        if (attempts < maxAttempts) {
          console.log(
            `Backend not ready yet (${attempts}/${maxAttempts}): ${error.message}`
          );

          retryTimer = setTimeout(check, 1000);
        } else {
          finish(
            new Error(
              'Backend failed to start after 30 attempts. Check the backend error output above.'
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
  const iconPath = app.isPackaged
    ? path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'client',
        'dist',
        'img',
        'asmat-bingo-logo.png',
      )
    : path.join(__dirname, '..', 'client', 'public', 'img', 'asmat-bingo-logo.png');

  mainWindow = new BrowserWindow({
    title: 'Asmat Bingo',
    icon: iconPath,
    width: 1300,
    height: 850,
    minWidth: 1000,
    minHeight: 650,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('Bingo page failed to load:', {
      code,
      description,
      url,
    });
  });

  mainWindow.loadURL('http://127.0.0.1:3000').catch((error) => {
    console.error('Failed to load Bingo Game:', error);
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start backend, wait for readiness, then open the app
app.whenReady().then(async () => {
  console.log('Electron app ready');

  const started = await startBackend();

  if (!started) {
    console.error('Cannot open Bingo Game: backend launch failed.');
    app.quit();
    return;
  }

  try {
    await checkBackendReady();

    if (!isQuitting) {
      console.log('Backend is ready. Opening Bingo Game window.');
      createWindow();
    }
  } catch (error) {
    console.error('Bingo Game startup failed:', error);
    app.quit();
  }
});

// macOS: reopen the window when activated
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && backendProcess) {
    createWindow();
  }
});

// Stop backend when Electron exits
app.on('before-quit', () => {
  isQuitting = true;

  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (error) {
      console.error('Failed to stop Bingo backend:', error);
    }

    backendProcess = null;
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
