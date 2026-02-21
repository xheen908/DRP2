-- Komplettierungs-Skript für HR-Daten aller Benutzer

USE hr_db;

-- 1. Sicherstellen, dass die Alt-User auch in employees existieren
INSERT IGNORE INTO employees (user_id, first_name, last_name, email, date_of_birth, date_of_hire, department, salary, status, gender, marital_status, nationality, work_location, work_schedule_type) VALUES
  (1006, 'Sarah', 'Manager', 'sarah.manager@drp.de', '1982-04-12', '2020-01-01', 'Management', 6500.00, 'active', 'weiblich', 'Verheiratet', 'Deutsch', 'Duisburg', 'Vollzeit'),
  (1009, 'Dieter', 'Disponent', 'dieter.disponent@drp.de', '1975-11-30', '2021-06-15', 'Disposition', 3800.00, 'active', 'männlich', 'Geschieden', 'Deutsch', 'Duisburg', 'Vollzeit'),
  (1015, 'Ronny', 'Weber', 'ronny.weber@drp.de', '1992-07-22', '2022-03-01', 'Technik', 3300.00, 'active', 'männlich', 'Ledig', 'Deutsch', 'Duisburg', 'Vollzeit');

-- 2. Bankdetails für alle (IDs 1-7)
INSERT IGNORE INTO employee_bank_details (employee_id, bank_name, iban, bic, created_at, updated_at) VALUES
  (1, 'Sparkasse Duisburg', 'DE12345678901234567801', 'WELADED1DUI', NOW(), NOW()),
  (2, 'Commerzbank', 'DE12345678901234567802', 'COBADEDFFRA', NOW(), NOW()),
  (3, 'Deutsche Bank', 'DE12345678901234567803', 'DEUTDEDBHAM', NOW(), NOW()),
  (4, 'ING-DiBa', 'DE12345678901234567804', 'INGDEDFFXXX', NOW(), NOW()),
  (5, 'Sparkasse Duisburg', 'DE12345678901234567805', 'WELADED1DUI', NOW(), NOW()), -- Sarah
  (6, 'Postbank', 'DE12345678901234567806', 'PBNKDEDFBON', NOW(), NOW()),    -- Dieter
  (7, 'Volksbank', 'DE12345678901234567807', 'GENODED1XXX', NOW(), NOW());    -- Ronny

-- 3. Steuer & Sozialversicherung
INSERT IGNORE INTO employee_tax_social_security (employee_id, tax_id_number, social_security_number, health_insurance_provider, tax_class, child_allowances, church_tax_applicable, religion, created_at, updated_at) VALUES
  (1, '11223344551', '150590T04501', 'AOK Rheinland', 1, 0.0, 1, 'evangelisch', NOW(), NOW()),
  (2, '11223344552', '220885M04502', 'TK - Techniker Krankenkasse', 3, 1.0, 0, 'konfessionslos', NOW(), NOW()),
  (3, '11223344553', '011295K04503', 'Barmer', 1, 0.0, 0, 'konfessionslos', NOW(), NOW()),
  (4, '11223344554', '100380P04504', 'DAK Gesundheit', 3, 2.0, 1, 'katholisch', NOW(), NOW()),
  (5, '11223344555', '120482S04505', 'TK - Techniker Krankenkasse', 3, 1.0, 0, 'konfessionslos', NOW(), NOW()),
  (6, '11223344556', '301175D04506', 'AOK Rheinland', 2, 0.5, 1, 'katholisch', NOW(), NOW()),
  (7, '11223344557', '220792R04507', 'Barmer', 1, 0.0, 0, 'konfessionslos', NOW(), NOW());

-- 4. Notfallkontakte
INSERT IGNORE INTO emergency_contacts (employee_id, full_name, relationship, phone_number, email, created_at, updated_at) VALUES
  (1, 'Sabine Tester', 'Mutter', '0171-9988771', 'sabine@tester.de', NOW(), NOW()),
  (2, 'Markus Muster', 'Ehepartner', '0171-9988772', 'markus@muster.de', NOW(), NOW()),
  (3, 'Lena Kollege', 'Schwester', '0171-9988773', 'lena@kollege.de', NOW(), NOW()),
  (4, 'Hans Personal', 'Ehepartner', '0171-9988774', 'hans@personal.de', NOW(), NOW()),
  (5, 'Peter Manager', 'Ehepartner', '0171-9988775', 'peter@manager.de', NOW(), NOW()),
  (6, 'Monika Disponent', 'Ex-Frau', '0171-9988776', 'monika@disponent.de', NOW(), NOW()),
  (7, 'Helga Weber', 'Mutter', '0171-9988777', 'helga@weber.de', NOW(), NOW());
