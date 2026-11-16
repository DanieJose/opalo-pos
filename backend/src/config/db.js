const mysql = require('mysql2/promise');
const config = require('./config');

// Creamos un pool de conexiones optimizado
let pool;
if (config.databaseUrl) {
  pool = mysql.createPool({
    uri: config.databaseUrl,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    timezone: '-06:00'
  });
} else {
  pool = mysql.createPool(config.db);
}

// Verificación inicial de conexión (no bloqueante en arranque)
pool.getConnection()
  .then((conn) => {
    console.log(`[MySQL] Conexión establecida exitosamente a la BD: "${config.db.database}" en ${config.db.host}:${config.db.port}`);
    conn.release();
  })
  .catch((err) => {
    console.warn(`[MySQL Alerta] No se pudo conectar de inmediato a la base de datos (${err.message}). Asegúrate de que MySQL esté iniciado y el esquema creado.`);
  });

module.exports = pool;

