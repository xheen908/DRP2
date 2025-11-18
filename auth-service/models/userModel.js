// DRP2/auth-service/models/userModel.js
const { DataTypes } = require('sequelize');
const pool = require('../config/pool'); // Direkte Verbindung zur auth_db

// Sequelize-Instanz initialisieren
const sequelize = require('../config/sequelize').sequelize; // Import der sequelize-Instanz

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // email: { // Optional: Falls Sie E-Mail-basierte Logins/Recovery wollen
    //     type: DataTypes.STRING,
    //     allowNull: true,
    //     unique: true
    // },
    pin: {
        type: DataTypes.STRING(10), // PIN als String, max 10 Zeichen
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3 // Standardrolle 'Monteur'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    // Add other fields here:
    // created_at: {
    //     type: DataTypes.DATE,
    //     defaultValue: DataTypes.NOW
    // },
    // updated_at: {
    //     type: DataTypes.DATE,
    //     defaultValue: DataTypes.NOW
    // }
}, {
    tableName: 'users',
    timestamps: false, // Deaktiviert createdAt/updatedAt, wenn Sie diese Felder selbst verwalten
    underscored: true // <--- DIESE ZEILE HINZUGEFÜGT
});

// Definition des Role-Modells (könnte auch ein eigener Role Service sein, aber für Einfachheit hier)
const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'roles',
    timestamps: false,
    underscored: true // <--- DIESE ZEILE HINZUGEFÜGT (für Konsistenz, falls Roles auch snake_case Spalten hat)
});

// Assoziation: Ein Benutzer hat eine Rolle
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id' });


module.exports = { User, Role };