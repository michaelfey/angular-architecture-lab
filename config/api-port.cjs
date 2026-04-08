const defaultApiPort = 3001;

function resolveApiPort() {
  const rawPort = process.env.API_PORT || process.env.PORT;
  const port = Number(rawPort || defaultApiPort);

  return Number.isInteger(port) && port > 0 ? port : defaultApiPort;
}

module.exports = {
  defaultApiPort,
  resolveApiPort
};
