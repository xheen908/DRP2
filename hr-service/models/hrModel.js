const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Employee = sequelize.define('Employee', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Beibehalten: Jeder Auth-Benutzer nur einen HR-Eintrag
        comment: 'Logische Referenz zur ID des Benutzers im Auth Service (Auth Service hat eigene DB)',
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        // unique: true, // VERSUCH: Entferne unique Constraint hier, um einen Index einzusparen
        validate: {
            isEmail: true,
        },
    },
    gender: {
        type: DataTypes.STRING(10), // z.B. 'Männlich', 'Weiblich', 'Divers'
        allowNull: true,
    },
    maritalStatus: { // GEÄNDERT ZU ENUM
        type: DataTypes.ENUM('Ledig', 'Verheiratet', 'Geschieden', 'Verwitwet', 'Eingetragene Partnerschaft', 'Unbekannt'),
        allowNull: true,
    },
    nationality: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    privatePhone: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    dateOfHire: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    workLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    workScheduleType: { // GEÄNDERT ZU ENUM
        type: DataTypes.ENUM('Vollzeit', 'Teilzeit', 'Schichtarbeit', 'Gleitzeit', 'Minijob', 'Werkstudent', 'Praktikum', 'Ausbildung', 'Unbekannt'),
        allowNull: true,
    },
    annualLeaveEntitlement: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    salary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'terminated'),
        defaultValue: 'active',
    },
}, {
    tableName: 'employees',
    timestamps: true,
    underscored: true,
    toJSON: { getters: true }
});

const EmployeeAddress = sequelize.define('EmployeeAddress', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Employee,
            key: 'id',
        }
    },
    addressType: { // GEÄNDERT ZU ENUM
        type: DataTypes.ENUM('privat', 'dienstlich', 'rechnung', 'versand', 'andere'),
        allowNull: false,
    },
    street: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    houseNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    zipCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    country: { // BLEIBT STRING für Flexibilität oder eine separate Referenztabelle
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'employee_addresses',
    timestamps: true,
    underscored: true,
});

const EmployeeBankDetail = sequelize.define('EmployeeBankDetail', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Sicherstellen, dass jeder Mitarbeiter nur eine Hauptbankverbindung hat
        references: {
            model: Employee,
            key: 'id',
        }
    },
    bankName: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    iban: {
        type: DataTypes.STRING(34),
        allowNull: false,
    },
    bic: {
        type: DataTypes.STRING(11),
        allowNull: true,
    },
}, {
    tableName: 'employee_bank_details',
    timestamps: true,
    underscored: true,
});

const EmployeeTaxSocialSecurity = sequelize.define('EmployeeTaxSocialSecurity', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Sicherstellen, dass jeder Mitarbeiter nur einen Steuersatz hat
        references: {
            model: Employee,
            key: 'id',
        }
    },
    taxIdNumber: {
        type: DataTypes.STRING(14), // Erhöht auf 14, um Format mit Leerzeichen abzudecken (XXX XXXX XXXX)
        allowNull: false,
        unique: true,
    },
    socialSecurityNumber: {
        type: DataTypes.STRING(12),
        allowNull: false,
        unique: true,
    },
    healthInsuranceProvider: { // NEUES ATTRIBUT HINZUGEFÜGT
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    taxClass: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    childAllowances: {
        type: DataTypes.DECIMAL(3,1),
        allowNull: true,
        defaultValue: 0.0,
    },
    churchTaxApplicable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    religion: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    additionalTaxAllowances: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: true,
        defaultValue: 0.00,
    },
}, {
    tableName: 'employee_tax_social_security',
    timestamps: true,
    underscored: true,
});

const EmergencyContact = sequelize.define('EmergencyContact', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Employee,
            key: 'id',
        }
    },
    fullName: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    relationship: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    phoneNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
}, {
    tableName: 'emergency_contacts',
    timestamps: true,
    underscored: true,
});

// Assoziationen definieren
Employee.hasMany(EmployeeAddress, { foreignKey: 'employeeId', as: 'addresses' });
EmployeeAddress.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasOne(EmployeeBankDetail, { foreignKey: 'employeeId', as: 'bankDetails' });
EmployeeBankDetail.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasOne(EmployeeTaxSocialSecurity, { foreignKey: 'employeeId', as: 'taxSocialSecurity' });
EmployeeTaxSocialSecurity.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(EmergencyContact, { foreignKey: 'employeeId', as: 'emergencyContacts' });
EmergencyContact.belongsTo(Employee, { foreignKey: 'employeeId' });

module.exports = {
    Employee,
    EmployeeAddress,
    EmployeeBankDetail,
    EmployeeTaxSocialSecurity,
    EmergencyContact
};