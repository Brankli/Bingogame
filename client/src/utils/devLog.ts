/** Logs only in development — keeps production console clean */
export const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

export const devWarn = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args);
  }
};
