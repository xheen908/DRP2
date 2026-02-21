-- Payroll-Daten für die neuen Dummy-Mitarbeiter (Februar 2026)

USE payroll_db;

-- Sicherstellen, dass ein Payroll Run für Feb 2026 existiert (ID 1 existiert evtl. schon, daher INSERT IGNORE)
INSERT IGNORE INTO payroll_runs (id, month, year, status, created_by_user_id, created_at, updated_at) VALUES 
  (1, 2, 2026, 'Pending', '1006', NOW(), NOW());

-- Payslips für Thomas (ID 1101 -> Employee 1), Marina (1102 -> 2), Kevin (1103 -> 3)
INSERT IGNORE INTO payslips (payroll_run_id, employee_id, gross_salary, net_salary, tax_amount, social_security_amount, tax_class, marital_status, payroll_period_start, payroll_period_end, payslip_date, created_at, updated_at) VALUES
  (1, '1', 3200.00, 2150.40, 480.00, 569.60, 'I', 'Ledig', '2026-02-01', '2026-02-28', '2026-02-21', NOW(), NOW()),
  (1, '2', 3500.00, 2600.50, 350.00, 549.50, 'III', 'Verheiratet', '2026-02-01', '2026-02-28', '2026-02-21', NOW(), NOW()),
  (1, '3', 3100.00, 2080.00, 465.00, 555.00, 'I', 'Ledig', '2026-02-01', '2026-02-28', '2026-02-21', NOW(), NOW());
