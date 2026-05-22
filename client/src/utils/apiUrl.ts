/**
 * Get the API URL for the current environment
 * Works for both web and Electron builds
 */
export function getApiUrl(): string {
  // Check if running in Electron
  const isElectron = navigator.userAgent.toLowerCase().includes('electron');
  
  // For Electron, always use localhost:3000
  if (isElectron) {
    console.log('🔗 Running in Electron, using http://localhost:3000');
    return 'http://localhost:3000';
  }
  
  // For web, use environment variable or default
  const apiUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000';
  console.log('🔗 Running in web, using', apiUrl);
  return apiUrl;
}
