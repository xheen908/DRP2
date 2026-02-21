const { Employee, EmployeeAddress, EmployeeBankDetail, EmployeeTaxSocialSecurity, EmergencyContact } = require('../models/hrModel'); // Alle Modelle importiert
const { Op } = require('sequelize'); // Importiere Op für komplexere Abfragen, falls benötigt

// Helper-Funktion zum Erstellen/Aktualisieren von verknüpften Daten
async function handleAssociatedData(employee, data) {
    // Adressen (können mehrere sein)
    if (data.addresses && Array.isArray(data.addresses)) {
        // IDs der aktuellen Adressen, die gesendet wurden
        const sentAddressIds = data.addresses.filter(addr => addr.id).map(addr => addr.id);
        // Alle bestehenden Adressen des Mitarbeiters abrufen
        const existingAddresses = await EmployeeAddress.findAll({ where: { employeeId: employee.id } });
        
        // Adressen löschen, die nicht mehr gesendet wurden
        for (const existingAddr of existingAddresses) {
            if (!sentAddressIds.includes(existingAddr.id)) {
                await existingAddr.destroy();
            }
        }

        // Neue Adressen erstellen oder bestehende aktualisieren
        for (const addressData of data.addresses) {
            if (addressData.id) {
                const existingAddress = await EmployeeAddress.findByPk(addressData.id);
                if (existingAddress && existingAddress.employeeId === employee.id) {
                    await existingAddress.update(addressData);
                }
            } else {
                await EmployeeAddress.create({ ...addressData, employeeId: employee.id });
            }
        }
    } else { // Wenn keine Adressen gesendet wurden, alle bestehenden löschen
        await EmployeeAddress.destroy({ where: { employeeId: employee.id } });
    }

    // Bankdetails (eine einzige)
    if (data.bankDetails) {
        let existingBankDetails = await EmployeeBankDetail.findOne({ where: { employeeId: employee.id } });
        if (existingBankDetails) {
            // Wenn der gesendete Datensatz eine ID hat und diese der bestehenden ID entspricht, oder keine ID hat (dann update immer den existierenden)
            if (data.bankDetails.id && existingBankDetails.id !== data.bankDetails.id) {
                // Dies sollte nicht passieren, wenn die Frontend-Logik stimmt.
                // Wenn es doch passiert und wir eine andere ID bekommen, ist das ein Konflikt.
                // Für Einfachheit, löschen wir den alten und erstellen einen neuen.
                await existingBankDetails.destroy();
                await EmployeeBankDetail.create({ ...data.bankDetails, employeeId: employee.id });
            } else {
                await existingBankDetails.update(data.bankDetails);
            }
        } else if (data.bankDetails.bankName || data.bankDetails.iban || data.bankDetails.bic) { // Nur erstellen, wenn Daten vorhanden sind
            await EmployeeBankDetail.create({ ...data.bankDetails, employeeId: employee.id });
        }
    } else { // Wenn keine Bankdetails gesendet wurden, bestehende löschen
        await EmployeeBankDetail.destroy({ where: { employeeId: employee.id } });
    }

    // Steuer- und Sozialversicherungsdaten (eine einzige)
    if (data.taxSocialSecurity) {
        console.log(`[HR Controller Debug] Empfangene taxSocialSecurity Daten:`, data.taxSocialSecurity);
        let existingTaxSocialSecurity = await EmployeeTaxSocialSecurity.findOne({ where: { employeeId: employee.id } });
        console.log(`[HR Controller Debug] Bestehende taxSocialSecurity für employeeId ${employee.id}:`, existingTaxSocialSecurity ? existingTaxSocialSecurity.toJSON() : 'Nicht gefunden');

        if (existingTaxSocialSecurity) {
            // Bestehende Steuerdaten aktualisieren
            await existingTaxSocialSecurity.update(data.taxSocialSecurity);
            console.log(`[HR Controller Debug] taxSocialSecurity für employeeId ${employee.id} aktualisiert.`);
        } else {
            // Neue Steuerdaten erstellen, wenn essentielle Daten vorhanden sind
            if (data.taxSocialSecurity.taxIdNumber || data.taxSocialSecurity.socialSecurityNumber) {
                await EmployeeTaxSocialSecurity.create({ ...data.taxSocialSecurity, employeeId: employee.id });
                console.log(`[HR Controller Debug] Neue taxSocialSecurity für employeeId ${employee.id} erstellt.`);
            } else {
                console.log(`[HR Controller Debug] Keine essentiellen taxSocialSecurity Daten zum Erstellen für employeeId ${employee.id}.`);
            }
        }
    } else { // Wenn keine Steuerdaten gesendet wurden, bestehende löschen
        await EmployeeTaxSocialSecurity.destroy({ where: { employeeId: employee.id } });
        console.log(`[HR Controller Debug] Bestehende taxSocialSecurity für employeeId ${employee.id} gelöscht (keine Daten im Request).`);
    }

    // Notfallkontakte (können mehrere sein)
    if (data.emergencyContacts && Array.isArray(data.emergencyContacts)) {
        const sentContactIds = data.emergencyContacts.filter(contact => contact.id).map(contact => contact.id);
        const existingContacts = await EmergencyContact.findAll({ where: { employeeId: employee.id } });

        for (const existingContact of existingContacts) {
            if (!sentContactIds.includes(existingContact.id)) {
                await existingContact.destroy();
            }
        }

        for (const contactData of data.emergencyContacts) {
            if (contactData.id) {
                const existingContact = await EmergencyContact.findByPk(contactData.id);
                if (existingContact && existingContact.employeeId === employee.id) {
                    await existingContact.update(contactData);
                }
            } else {
                await EmergencyContact.create({ ...contactData, employeeId: employee.id });
            }
        }
    } else { // Wenn keine Notfallkontakte gesendet wurden, alle bestehenden löschen
        await EmergencyContact.destroy({ where: { employeeId: employee.id } });
    }
}


// Alle Mitarbeiter abrufen
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [
                { model: EmployeeAddress, as: 'addresses' },
                { model: EmployeeBankDetail, as: 'bankDetails' },
                { model: EmployeeTaxSocialSecurity, as: 'taxSocialSecurity' },
                { model: EmergencyContact, as: 'emergencyContacts' },
            ],
        });
        res.status(200).json(employees);
    } catch (error) {
        console.error('Fehler beim Abrufen der Mitarbeiter (Controller):', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Mitarbeiter.' });
    }
};

// Mitarbeiter anhand der internen HR ID abrufen
exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            include: [
                { model: EmployeeAddress, as: 'addresses' },
                { model: EmployeeBankDetail, as: 'bankDetails' },
                { model: EmployeeTaxSocialSecurity, as: 'taxSocialSecurity' },
                { model: EmergencyContact, as: 'emergencyContacts' },
            ],
        });
        if (!employee) {
            return res.status(404).json({ message: 'Mitarbeiter nicht gefunden.' });
        }
        res.status(200).json(employee);
    } catch (error) {
        console.error('Fehler beim Abrufen des Mitarbeiters (Controller):', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen des Mitarbeiters.' });
    }
};

// Mitarbeiter anhand der userId (aus Auth Service) abrufen - NEUER ENDPUNKT für den Auth Service
exports.getEmployeeByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const employee = await Employee.findOne({
            where: { userId: userId },
            include: [
                { model: EmployeeAddress, as: 'addresses' },
                { model: EmployeeBankDetail, as: 'bankDetails' },
                { model: EmployeeTaxSocialSecurity, as: 'taxSocialSecurity' },
                { model: EmergencyContact, as: 'emergencyContacts' },
            ],
        });

        if (!employee) {
            console.log(`[HR Service Debug] Kein Mitarbeiter gefunden für userId: ${userId}`);
            return res.status(404).json({ message: 'Mitarbeiter mit dieser Benutzer-ID nicht gefunden.' });
        }

        console.log(`[HR Service Debug] Gefundener Mitarbeiter für userId ${userId}:`, employee.toJSON());
        
        res.status(200).json(employee);
    } catch (error) {
        console.error(`[HR Service Debug] Fehler beim Abrufen von Mitarbeiter mit UserId ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen des Mitarbeiters.' });
    }
};

const fetch = require('node-fetch'); // Für Kommunikation mit anderen Services

const VPN_SERVICE_URL = process.env.VPN_SERVICE_URL || 'http://vpn-service:3800';

// Einen neuen Mitarbeiter erstellen
exports.createEmployee = async (req, res) => {
    try {
        const {
            userId, firstName, lastName, email, gender, maritalStatus, nationality,
            dateOfBirth, privatePhone, dateOfHire, department,
            workLocation, workScheduleType, annualLeaveEntitlement,
            salary, status,
            addresses, bankDetails, taxSocialSecurity, emergencyContacts
        } = req.body;

        if (!userId || !firstName || !lastName || !dateOfHire) {
            return res.status(400).json({ message: 'Benutzer ID, Vorname, Nachname und Einstellungsdatum sind erforderlich.' });
        }

        const newEmployee = await Employee.create({
            userId, firstName, lastName, email, gender, maritalStatus, nationality,
            dateOfBirth, privatePhone, dateOfHire, department,
            workLocation, workScheduleType, annualLeaveEntitlement,
            salary, status
        });

        await handleAssociatedData(newEmployee, { addresses, bankDetails, taxSocialSecurity, emergencyContacts });
        
        // --- AUTOMATISCHE VPN ERSTELLUNG ---
        try {
            console.log(`[HR Service] Triggering automatic VPN setup for userId ${userId}...`);
            await fetch(`${VPN_SERVICE_URL}/api/vpn/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    deviceName: 'Workstation_' + lastName
                })
            });
            console.log(`[HR Service] VPN auto-setup requested for user ${userId}.`);
        } catch (vpnError) {
            console.error(`[HR Service] Failed to trigger VPN auto-setup:`, vpnError.message);
        }

        // Den neu erstellten Mitarbeiter mit allen zugehörigen Daten zurückgeben
        const createdEmployeeWithAssociations = await Employee.findByPk(newEmployee.id, {
            include: [
                { model: EmployeeAddress, as: 'addresses' },
                { model: EmployeeBankDetail, as: 'bankDetails' },
                { model: EmployeeTaxSocialSecurity, as: 'taxSocialSecurity' },
                { model: EmergencyContact, as: 'emergencyContacts' },
            ],
        });

        res.status(201).json(createdEmployeeWithAssociations);
    } catch (error) {
        console.error('Fehler beim Erstellen eines Mitarbeiters (Controller):', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Ein Mitarbeiterdatensatz für diesen Benutzer existiert bereits.' });
        }
        res.status(500).json({ message: 'Interner Serverfehler beim Erstellen des Mitarbeiters.', error: error.message });
    }
};

// Mitarbeiter aktualisieren
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName, lastName, email, gender, maritalStatus, nationality,
            dateOfBirth, privatePhone, dateOfHire, department,
            workLocation, workScheduleType, annualLeaveEntitlement, 
            salary, status,
            addresses, bankDetails, taxSocialSecurity, emergencyContacts
        } = req.body;

        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ message: 'Mitarbeiter nicht gefunden.' });
        }

        await employee.update({
            firstName, lastName, email, gender, maritalStatus, nationality,
            dateOfBirth, privatePhone, dateOfHire, department,
            workLocation, workScheduleType, annualLeaveEntitlement,
            salary, status
        });

        await handleAssociatedData(employee, { addresses, bankDetails, taxSocialSecurity, emergencyContacts });

        // Den aktualisierten Mitarbeiter mit allen zugehörigen Daten zurückgeben
        const updatedEmployeeWithAssociations = await Employee.findByPk(employee.id, {
            include: [
                { model: EmployeeAddress, as: 'addresses' },
                { model: EmployeeBankDetail, as: 'bankDetails' },
                { model: EmployeeTaxSocialSecurity, as: 'taxSocialSecurity' },
                { model: EmergencyContact, as: 'emergencyContacts' },
            ],
        });

        res.status(200).json({ message: 'Mitarbeiter erfolgreich aktualisiert.', employee: updatedEmployeeWithAssociations });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Mitarbeiters (Controller):', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Aktualisieren des Mitarbeiters.', error: error.message });
    }
};

// Mitarbeiter anhand der userId aktualisieren (für Auth Service)
exports.updateEmployeeByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            firstName, lastName, email, gender, maritalStatus, nationality,
            dateOfBirth, privatePhone, dateOfHire, department,
            workLocation, workScheduleType, annualLeaveEntitlement,
            salary, status,
            addresses, bankDetails, taxSocialSecurity, emergencyContacts
        } = req.body;

        const employee = await Employee.findOne({ where: { userId: userId } });
        if (!employee) {
            return res.status(404).json({ message: 'Mitarbeiter mit dieser Benutzer-ID nicht gefunden.' });
        }

        await employee.update({
            firstName, lastName, email, gender, maritalStatus, nationality,
            dateOfBirth, privatePhone, dateOfHire, department,
            workLocation, workScheduleType, annualLeaveEntitlement,
            salary, status
        });

        await handleAssociatedData(employee, { addresses, bankDetails, taxSocialSecurity, emergencyContacts });

        // Den aktualisierten Mitarbeiter mit allen zugehörigen Daten zurückgeben
        const updatedEmployeeWithAssociations = await Employee.findOne({
            where: { userId: userId },
            include: [
                { model: EmployeeAddress, as: 'addresses' },
                { model: EmployeeBankDetail, as: 'bankDetails' },
                { model: EmployeeTaxSocialSecurity, as: 'taxSocialSecurity' },
                { model: EmergencyContact, as: 'emergencyContacts' },
            ],
        });

        res.status(200).json({ message: 'Mitarbeiter erfolgreich aktualisiert.', employee: updatedEmployeeWithAssociations });
    } catch (error) {
        console.error(`Fehler beim Aktualisieren des Mitarbeiters mit UserId ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Interner Serverfehler beim Aktualisieren des Mitarbeiters.', error: error.message });
    }
};


// Mitarbeiter löschen
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ message: 'Mitarbeiter nicht gefunden.' });
        }

        // Zuerst die abhängigen Datensätze löschen (oder Sequelize cascade delete verwenden, falls konfiguriert)
        await EmployeeAddress.destroy({ where: { employeeId: id } });
        await EmployeeBankDetail.destroy({ where: { employeeId: id } });
        await EmployeeTaxSocialSecurity.destroy({ where: { employeeId: id } });
        await EmergencyContact.destroy({ where: { employeeId: id } });

        await employee.destroy();
        res.status(200).json({ message: 'Mitarbeiter und zugehörige Daten erfolgreich gelöscht.' });
    } catch (error) {
        console.error('Fehler beim Löschen des Mitarbeiters (Controller):', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Löschen des Mitarbeiters.', error: error.message });
    }
};

// Mitarbeiter anhand der userId löschen (für Auth Service)
exports.deleteEmployeeByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const employee = await Employee.findOne({ where: { userId: userId } });
        if (!employee) {
            console.log(`[HR Service Debug] Kein Mitarbeiter gefunden für userId ${userId} zum Löschen.`);
            return res.status(200).json({ message: 'Kein Mitarbeiter mit dieser Benutzer-ID gefunden oder bereits gelöscht.' });
        }

        const employeeId = employee.id;
        // Zuerst die abhängigen Datensätze löschen
        await EmployeeAddress.destroy({ where: { employeeId: employeeId } });
        await EmployeeBankDetail.destroy({ where: { employeeId: employeeId } });
        await EmployeeTaxSocialSecurity.destroy({ where: { employeeId: employeeId } });
        await EmergencyContact.destroy({ where: { employeeId: employeeId } });

        await employee.destroy();
        res.status(200).json({ message: 'Mitarbeiter und zugehörige Daten erfolgreich gelöscht.' });
    } catch (error) {
        console.error(`Fehler beim Löschen des Mitarbeiters mit UserId ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Interner Serverfehler beim Löschen des Mitarbeiters.', error: error.message });
    }
};