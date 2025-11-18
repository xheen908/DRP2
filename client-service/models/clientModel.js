const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize').sequelize;

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact_person: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    }
    // created_at und updated_at werden von Sequelize standardmäßig hinzugefügt,
    // wenn timestamps: true in den Optionen ist. Wenn nicht, müssten Sie sie hier definieren.
}, {
    tableName: 'clients',
    timestamps: true // Sequelize fügt created_at und updated_at automatisch hinzu
});

module.exports = Client;