// /** Get the local API URL for the current environment. */
// export function getApiUrl(): string {
//   const isElectron =
//     navigator.userAgent.toLowerCase().includes('electron');

//   if (isElectron) {
//     return 'http://localhost:3000';
//   }

//   return process.env.VUE_APP_API_URL || 'http://localhost:3000';
// }



/**
 * Get the base URL for the API.
 *
 * Desktop: NestJS serves the Vue frontend and API
 * from the same local origin.
 *
 * Web development: Use VUE_APP_API_URL when configured.
 */
export function getApiUrl(): string {
  const isElectron =
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron');

  if (isElectron) {
    return 'http://127.0.0.1:3000';
  }

  return (
    process.env.VUE_APP_API_URL ||
    'http://127.0.0.1:3000'
  );
}
