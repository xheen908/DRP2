const { Sequelize } = require('sequelize');
require('dotenv').config(); // Um Umgebungsvariablen zu laden

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false // Setzen Sie dies auf true für SQL-Logging
    }
);

// Authentifizieren und synchronisieren (nur für Entwicklung, in Produktion besser Migrationen nutzen)
sequelize.authenticate()
    .then(() => console.log('Auth Service: Erfolgreich mit der MySQL-Datenbank verbunden (Sequelize)!'))
    .catch(err => console.error('Auth Service: Fehler bei der Verbindung zur MySQL-Datenbank (Sequelize):', err.stack));

// Optional: Tabellen synchronisieren (NUR FÜR ENTWICKLUNG! In Produktion Migrations-Tools verwenden)
// sequelize.sync({ alter: true }) // 'alter: true' versucht, bestehende Tabellen anzupassen
//     .then(() => console.log('Auth Service: Datenbank synchronisiert!'))
//     .catch(err => console.error('Auth Service: Fehler bei der Synchronisierung der Datenbank:', err.stack));

module.exports = { sequelize };