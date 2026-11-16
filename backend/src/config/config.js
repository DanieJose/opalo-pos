require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || process.env.MYSQL_URL || null,
  db: {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'opalo_pos_db',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    timezone: '-06:00' // Zona horaria de Honduras (UTC-6)
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret_opalo_pos_default',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  business: {
    isvPercentage: parseFloat(process.env.IMPUESTO_ISV_PORCENTAJE || '15'),
    isv18Percentage: parseFloat(process.env.IMPUESTO_ISV_18_PORCENTAJE || '18'),
    currencyCode: process.env.MONEDA_CODIGO || 'HNL',
    currencySymbol: process.env.MONEDA_SIMBOLO || 'L'
  }
};

