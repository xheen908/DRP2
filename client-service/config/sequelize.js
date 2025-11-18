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
    .then(() => console.log('Client Service: Erfolgreich mit der MySQL-Datenbank verbunden (Sequelize)!'))
    .catch(err => console.error('Client Service: Fehler bei der Verbindung zur MySQL-Datenbank (Sequelize):', err.stack));

// sequelize.sync({ alter: true }) // NUR FÜR ENTWICKLUNG!
//     .then(() => console.log('Client Service: Datenbank synchronisiert!'))
//     .catch(err => console.error('Client Service: Fehler bei der Synchronisierung der Datenbank:', err.stack));

module.exports = { sequelize };