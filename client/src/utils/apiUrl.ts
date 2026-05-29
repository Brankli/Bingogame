/**
 * Get the API URL for the current environment
 * Works for both web and Electron builds
 */
export function getApiUrl(): string {
  // Detect Electron
  const isElectron =
    navigator.userAgent.toLowerCase().includes('electron');

  // Electron desktop app
  if (isElectron) {
    console.log('🔗 Running in Electron, using http://localhost:3000');

    return 'http://localhost:3000';
  }

  // Web frontend → Render backend
  const apiUrl = 'https://bingogame-8v2z.onrender.com';

  console.log('🔗 Running in web, using', apiUrl);

  return apiUrl;
}
