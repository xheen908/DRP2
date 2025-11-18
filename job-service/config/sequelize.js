const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

sequelize.authenticate()
    .then(() => console.log('Job Service: Erfolgreich mit der MySQL-Datenbank verbunden (Sequelize)!'))
    .catch(err => console.error('Job Service: Fehler bei der Verbindung zur MySQL-Datenbank (Sequelize):\n', err)); // Geändert zu err

sequelize.sync({ alter: true }) // WICHTIG: Diese Zeile ist weiterhin entkommentiert.
    .then(() => console.log('Job Service: Datenbank synchronisiert!'))
    .catch(err => console.error('Job Service: Fehler bei der Synchronisierung der Datenbank:\n', err)); // Geändert zu err

module.exports = { sequelize };