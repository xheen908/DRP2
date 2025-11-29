const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

console.log('Definiere Location Model...');
console.log('Typ von sequelize in locationModel.js:', typeof sequelize);
if (sequelize && typeof sequelize.define === 'function') {
    console.log('sequelize.define ist eine Funktion in locationModel.js.');
} else {
    console.error('sequelize.define ist KEINE Funktion in locationModel.js! sequelize ist:', sequelize);
}

const Location = sequelize.define('Location', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
    nfc_tag_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    type: { // NEUES FELD HINZUGEFÜGT
        type: DataTypes.STRING,
        allowNull: true, // Oder false, wenn jeder Standort einen Typ haben muss
        defaultValue: 'general', // Standardwert, falls kein Typ angegeben wird
    },
    // Die folgenden Felder wurden entfernt, da sie in der Datenbank nicht vorhanden sind
    // und mit timestamps: false nicht von Sequelize verwaltet werden sollen.
    // created_at: {
    //     type: DataTypes.DATE,
    //     defaultValue: DataTypes.NOW,
    // },
    // updated_at: {
    //     type: DataTypes.DATE,
    //     defaultValue: DataTypes.NOW,
    // },
}, {
    tableName: 'locations',
    timestamps: false, // Wir verwalten created_at und updated_at manuell oder direkt in der DB
    // Da timestamps auf false gesetzt ist, sind die folgenden Zeilen überflüssig und wurden entfernt:
    // createdAt: 'created_at',
    // updatedAt: 'updated_at',
});

module.exports = Location;
console.log('Location Model exportiert. Typ von Location:', typeof Location);