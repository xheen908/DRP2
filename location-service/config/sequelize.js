const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('Initialisiere Sequelize...');
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: console.log, // Setze auf console.log, um SQL-Queries in der Konsole zu sehen
    }
);

sequelize.authenticate()
    .then(() => {
        console.log('Datenbankverbindung erfolgreich hergestellt.');
    })
    .catch(err => {
        console.error('Fehler beim Herstellen der Datenbankverbindung:', err);
    });

module.exports = sequelize;