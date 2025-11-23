const { Sequelize } = require('sequelize');
require('dotenv').config(); 

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false, // Setze dies auf true für SQL-Logging
        define: {
            timestamps: true, // Fügt createdAt und updatedAt Spalten hinzu
            underscored: true, // Verwendet snake_case für Spaltennamen
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

sequelize.authenticate()
    .then(() => console.log('HR Service: Erfolgreich mit der MySQL-Datenbank verbunden (Sequelize)!'))
    .catch(err => console.error('HR Service: Fehler bei der Verbindung zur MySQL-Datenbank (Sequelize):', err.stack));

module.exports = { sequelize };