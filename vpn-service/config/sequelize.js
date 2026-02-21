const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'vpn_db',
    process.env.DB_USER || 'drpuser',
    process.env.DB_PASSWORD || 'drppassword',
    {
        host: process.env.DB_HOST || 'mysql-db',
        dialect: 'mysql',
        logging: false,
    }
);

module.exports = sequelize;
