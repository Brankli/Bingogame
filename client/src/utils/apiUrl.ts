/** Get the local API URL for the current environment. */
export function getApiUrl(): string {
  const isElectron =
    navigator.userAgent.toLowerCase().includes('electron');

  if (isElectron) {
    return 'http://localhost:3000';
  }

  return process.env.VUE_APP_API_URL || 'http://localhost:3000';
}
