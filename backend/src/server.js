const http = require('http');
const app = require('./app');
const config = require('./config/config');
const { initSocket } = require('./config/socket');
const { checkAndRunAutoMigration } = require('./database/autoMigrate');

const httpServer = http.createServer(app);

// Inicializar WebSockets para sincronización en tiempo real
initSocket(httpServer);

let server;

async function startServer() {
  // Ejecutar auto-migración defensiva al arrancar
  await checkAndRunAutoMigration();

  server = httpServer.listen(config.port, () => {
    console.log('================================================================');
    console.log(`💎 ÓPALO ACCESORIOS - SERVIDOR POS INICIADO`);
    console.log(`📍 Ubicación: Tocoa, Colón, Honduras`);
    console.log(`🚀 Puerto HTTP / WebSocket: http://localhost:${config.port}`);
    console.log(`📡 Entorno: ${config.nodeEnv}`);
    console.log(`🕒 ISV Base: ${config.business.isvPercentage}% | Moneda: ${config.business.currencySymbol} (${config.business.currencyCode})`);
    console.log('================================================================');
  });
}

startServer();

// Manejo ordenado de señales de terminación
const handleShutdown = () => {
  console.log('\nCerrando servidor HTTP y WebSockets de Ópalo Accesorios...');
  if (server) {
    server.close(() => {
      console.log('Servidor finalizado limpiamente.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
