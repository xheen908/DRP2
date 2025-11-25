// DRP2/payroll-service/models/payrollModel.js

// Diese Funktion definiert die Sequelize-Modelle und ihre Assoziationen.
// Sie nimmt die sequelize-Instanz und DataTypes als Argumente.
const defineModels = (sequelize, DataTypes) => {
    // Definition des PayrollRun Modells
    const PayrollRun = sequelize.define('PayrollRun', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 12,
            }
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 2000, // Beispiel: Mindestjahr
            }
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Calculated', 'Approved', 'Paid', 'Cancelled'),
            allowNull: false,
            defaultValue: 'Pending',
        },
        totalGrossSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        totalNetSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        calculationDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        approvalDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        paymentDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        createdByUserId: {
            type: DataTypes.STRING, // UUID oder INT, je nach Auth-Service User ID
            allowNull: false,
        },
        lastModifiedDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'payroll_runs',
        timestamps: true, // createdAt, updatedAt
        underscored: true, // Spaltennamen in snake_case
    });

    // Definition des Payslip Modells
    const Payslip = sequelize.define('Payslip', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        payrollRunId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'payroll_runs', // Referenziert die Tabelle payroll_runs
                key: 'id',
            }
        },
        employeeId: {
            type: DataTypes.STRING, // UUID oder INT, je nach HR-Service Employee ID
            allowNull: false,
        },
        grossSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        netSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        taxAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        socialSecurityAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        healthInsuranceAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        pensionInsuranceAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        unemploymentInsuranceAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        careInsuranceAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        taxClass: {
            type: DataTypes.STRING, // Lohnsteuerklasse (z.B. I, II, III, IV, V, VI)
            allowNull: true,
        },
        childAllowances: {
            type: DataTypes.DECIMAL(2, 1), // Kinderfreibeträge
            allowNull: true,
        },
        maritalStatus: {
            type: DataTypes.STRING, // Familienstand
            allowNull: true,
        },
        payrollPeriodStart: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        payrollPeriodEnd: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        payslipDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('Calculated', 'Generated', 'Issued', 'Paid'), // <-- HIER WURDE 'Generated' HINZUGEFÜGT
            allowNull: false,
            defaultValue: 'Calculated',
        },
        documentPath: {
            type: DataTypes.STRING, // Pfad zum generierten PDF-Dokument
            allowNull: true,
        },
    }, {
        tableName: 'payslips',
        timestamps: true,
        underscored: true,
    });

    // Assoziationen
    PayrollRun.hasMany(Payslip, { as: 'payslips', foreignKey: 'payrollRunId' });
    Payslip.belongsTo(PayrollRun, { as: 'payrollRun', foreignKey: 'payrollRunId' });

    // Rückgabe der definierten Modelle, falls direkt benötigt
    return { PayrollRun, Payslip };
};

module.exports = defineModels; // Exportiere die Funktion