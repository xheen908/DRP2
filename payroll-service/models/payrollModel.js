let PayrollRun;
let Payslip;

const initModels = (sequelize, DataTypes) => {
    PayrollRun = sequelize.define('PayrollRun', {
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
            },
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 2000, // Beispiel: Mindestjahr
            },
        },
        runDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.ENUM('pending', 'calculated', 'approved', 'paid', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
        },
        totalGrossSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        totalNetSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        createdByUserId: { // Referenz zum Auth Service User, der den Lauf initiiert hat
            type: DataTypes.STRING, // Oder UUID, je nach Auth Service User ID Typ
            allowNull: false,
        },
    }, {
        tableName: 'payroll_runs',
        timestamps: true,
    });

    Payslip = sequelize.define('Payslip', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        employeeId: { // Logische Referenz zur Employee ID im HR Service
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        grossSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        netSalary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        taxAmount: { // Geschätzte Lohnsteuer
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        socialSecurityAmount: { // Geschätzte Sozialabgaben gesamt
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        healthInsuranceEmployeeShare: { // Krankenversicherung AN-Anteil
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        nursingInsuranceEmployeeShare: { // Pflegeversicherung AN-Anteil
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        pensionInsuranceEmployeeShare: { // Rentenversicherung AN-Anteil
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        unemploymentInsuranceEmployeeShare: { // Arbeitslosenversicherung AN-Anteil
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        employerSocialSecurityTotal: { // Sozialabgaben AG-Anteil gesamt
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        otherDeductions: { // JSON für sonstige Abzüge (z.B. VWL, Pfändungen)
            type: DataTypes.JSON,
            allowNull: true,
        },
        bonuses: { // JSON für Boni oder Prämien
            type: DataTypes.JSON,
            allowNull: true,
        },
        allowances: { // JSON für Zulagen (z.B. Fahrtkostenzuschuss)
            type: DataTypes.JSON,
            allowNull: true,
        },
        taxClass: { // Lohnsteuerklasse
            type: DataTypes.ENUM('I', 'II', 'III', 'IV', 'IV/IV', 'V', 'VI'),
            allowNull: true,
        },
        childAllowances: { // Kinderfreibeträge
            type: DataTypes.DECIMAL(3, 1),
            allowNull: true,
            defaultValue: 0.0,
        },
        maritalStatus: { // Familienstand (aus HR Service zur Info)
            type: DataTypes.ENUM('Ledig', 'Verheiratet', 'Geschieden', 'Verwitwet', 'Eingetragene Partnerschaft', 'Unbekannt'),
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
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.ENUM('generated', 'distributed', 'corrected', 'cancelled'),
            allowNull: false,
            defaultValue: 'generated',
        },
        documentPath: { // Pfad zur generierten PDF-Abrechnung
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Weitere relevante Felder, z.B. kumulierte Jahreswerte könnten hier eingefügt werden
    }, {
        tableName: 'payslips',
        timestamps: true,
    });

    // Beziehungen definieren
    PayrollRun.hasMany(Payslip, {
        foreignKey: 'payrollRunId',
        onDelete: 'CASCADE',
    });
    Payslip.belongsTo(PayrollRun, {
        foreignKey: 'payrollRunId',
    });

    return { PayrollRun, Payslip };
};

module.exports = { initModels, PayrollRun, Payslip };