// DRP2/shift-service/models/shiftModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Shift = sequelize.define('Shift', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employee_id: { // Geändert von user_id zu employee_id
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    check_in_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    check_in_latitude: {
        type: DataTypes.DECIMAL(10, 7), // Passend zum SQL-Schema
        allowNull: false,
    },
    check_in_longitude: {
        type: DataTypes.DECIMAL(10, 7), // Passend zum SQL-Schema
        allowNull: false,
    },
    badge_id_scanned: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY, // Nur Datum, z.B. 'YYYY-MM-DD'
        allowNull: false,
    },
    check_out_time: {
        type: DataTypes.DATE,
        allowNull: true, // Kann NULL sein, wenn die Schicht noch offen ist
    },
    check_out_latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true, // Kann NULL sein
    },
    check_out_longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true, // Kann NULL sein
    },
    // created_at und updated_at werden von Sequelize automatisch verwaltet,
    // wenn timestamps: true gesetzt ist.
    // Wenn Sie sie explizit verwalten möchten (wie im DRP-Backend), lassen Sie timestamps: false und definieren Sie sie hier.
    // Für Konsistenz mit DRP/drp_backend behalten wir die explizite Definition bei.
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'shifts',
    timestamps: false, // Setzen Sie dies auf false, wenn Sie created_at/updated_at manuell definieren
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Shift;