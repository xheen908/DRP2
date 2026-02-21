-- Dummy-Daten für Angestellte (Users + Employees)

USE auth_db;

-- Neue Benutzer in auth_db.users
INSERT IGNORE INTO users (id, role_id, full_name, pin, password, is_active) VALUES
  (1101, 4, 'Thomas Tester', '111111', '$2b$10$s4lugBs5pd5PcbaXH30hHegTXkwUF/ADLzb/7VoNWN2Lpq61QCYdK', 1),
  (1102, 3, 'Marina Muster', '222222', '$2b$10$s4lugBs5pd5PcbaXH30hHegTXkwUF/ADLzb/7VoNWN2Lpq61QCYdK', 1),
  (1103, 4, 'Kevin Kollege', '444444', '$2b$10$s4lugBs5pd5PcbaXH30hHegTXkwUF/ADLzb/7VoNWN2Lpq61QCYdK', 1),
  (1104, 2, 'Petra Personal', '555555', '$2b$10$s4lugBs5pd5PcbaXH30hHegTXkwUF/ADLzb/7VoNWN2Lpq61QCYdK', 1);

USE hr_db;

-- Entsprechende Einträge in hr_db.employees
INSERT IGNORE INTO employees (user_id, first_name, last_name, email, date_of_birth, date_of_hire, department, salary, status, gender, marital_status, work_location, work_schedule_type) VALUES
  (1101, 'Thomas', 'Tester', 'thomas.tester@drp-dummy.de', '1990-05-15', '2024-01-10', 'Technik', 3200.00, 'active', 'männlich', 'Ledig', 'Duisburg', 'Vollzeit'),
  (1102, 'Marina', 'Muster', 'marina.muster@drp-dummy.de', '1985-08-22', '2023-11-01', 'Disposition', 3500.00, 'active', 'weiblich', 'Verheiratet', 'Duisburg', 'Vollzeit'),
  (1103, 'Kevin', 'Kollege', 'kevin.kollege@drp-dummy.de', '1995-12-01', '2024-02-15', 'Technik', 3100.00, 'active', 'männlich', 'Ledig', 'Duisburg', 'Teilzeit'),
  (1104, 'Petra', 'Personal', 'petra.personal@drp-dummy.de', '1980-03-10', '2020-05-01', 'HR', 5000.00, 'active', 'weiblich', 'Verheiratet', 'Duisburg', 'Vollzeit');
