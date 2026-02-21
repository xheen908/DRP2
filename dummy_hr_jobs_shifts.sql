-- Weitere HR-Daten, Schichten und Aufträge für Dummy-Mitarbeiter

USE hr_db;

-- Update der bestehenden Mitarbeiter mit mehr Details
UPDATE employees SET nationality = 'Deutsch', private_phone = '0170-1111111' WHERE user_id = 1101;
UPDATE employees SET nationality = 'Deutsch', private_phone = '0170-2222222' WHERE user_id = 1102;
UPDATE employees SET nationality = 'Deutsch', private_phone = '0170-3333333' WHERE user_id = 1103;
UPDATE employees SET nationality = 'Deutsch', private_phone = '0170-4444444' WHERE user_id = 1104;

USE job_db;

-- Neue Aufträge für die Monteure (Thomas 1101 und Kevin 1103)
INSERT IGNORE INTO jobs (job_number, title, description, location_id, status, assigned_user_id, planned_start, planned_end) VALUES
  ('DRP2026-T01', 'Wartung Solar-Wechselrichter', 'Überprüfung der Anschlüsse und Fehlerspeicher auslesen.', 13, 'Offen', 1101, '2026-02-22 08:00:00', '2026-02-22 12:00:00'),
  ('DRP2026-K01', 'Modulreinigung Sektor B', 'Spezialreinigung der verschmutzten Module nach Sturm.', 13, 'Offen', 1103, '2026-02-22 09:00:00', '2026-02-22 16:00:00'),
  ('DRP2026-T02', 'NFC-Tag Installation', 'Anbringung neuer Check-In Points im Verwaltungsgebäude.', 1, 'Offen', 1101, '2026-02-23 07:30:00', '2026-02-23 10:00:00');

USE shift_db;

-- Schichten für die nächsten Tage
INSERT IGNORE INTO shifts (user_id, start_time, end_time, status, notes) VALUES
  (1101, '2026-02-22 07:30:00', '2026-02-22 16:30:00', 'Geplant', 'Standard Tagesschicht'),
  (1103, '2026-02-22 08:30:00', '2026-02-22 17:30:00', 'Geplant', 'Einsatz Solar Park'),
  (1102, '2026-02-22 07:00:00', '2026-02-22 15:30:00', 'Geplant', 'Dispo Frühschicht'),
  (1101, '2026-02-23 07:00:00', '2026-02-23 16:00:00', 'Geplant', 'Serviceeinsatz Intern');
