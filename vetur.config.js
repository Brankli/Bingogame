/** @type {import('vls').VeturConfig} */
module.exports = {
  projects: [
    {
      root: './client',
      package: './client/package.json',
      tsconfig: './client/tsconfig.json',
      jsconfig: './client/jsconfig.json',
      globalComponents: ['./client/src/components/**/*.vue'],
    },
  ],
};
