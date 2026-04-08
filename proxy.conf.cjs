const { resolveApiPort } = require('./config/api-port.cjs');

module.exports = {
  '/api': {
    target: `http://localhost:${resolveApiPort()}`,
    secure: false,
    changeOrigin: true,
    logLevel: 'warn'
  }
};
