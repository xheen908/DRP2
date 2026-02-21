-- Demo-Schichten für Februar 2026 zur Validierung der Payroll-Logik

USE shift_db;

-- Zuerst alte Testdaten für Feb 2026 entfernen, um Duplikate zu vermeiden
DELETE FROM shifts WHERE start_time >= '2026-02-01 00:00:00' AND start_time < '2026-03-01 00:00:00';

-- Hilfskonstruktion für Massen-Inserts
INSERT INTO shifts (user_id, start_time, end_time, status, notes, night_hours, sunday_hours, total_work_hours, break_duration_minutes) VALUES
-- Ronny Weber (ID 1015) - Fokus auf Überstunden und Nacht
(1015, '2026-02-02 07:00:00', '2026-02-02 16:00:00', 'Abgeschlossen', 'Regulär', 0, 0, 8.5, 30),
(1015, '2026-02-03 07:00:00', '2026-02-03 18:00:00', 'Abgeschlossen', 'Lange Schicht (>9h)', 0, 0, 10.25, 45),
(1015, '2026-02-04 18:00:00', '2026-02-05 02:00:00', 'Abgeschlossen', 'Nachtarbeit', 6.0, 0, 7.5, 30),
(1015, '2026-02-08 10:00:00', '2026-02-08 18:00:00', 'Abgeschlossen', 'Sonntagsarbeit', 0, 8.0, 7.5, 30),
(1015, '2026-02-09 08:00:00', '2026-02-09 16:00:00', 'Abgeschlossen', 'Regulär', 0, 0, 7.5, 30),
(1015, '2026-02-10 08:00:00', '2026-02-10 16:00:00', 'Abgeschlossen', 'Regulär', 0, 0, 7.5, 30),
(1015, '2026-02-11 08:00:00', '2026-02-11 16:00:00', 'Abgeschlossen', 'Regulär', 0, 0, 7.5, 30),
(1015, '2026-02-12 08:00:00', '2026-02-12 16:00:00', 'Abgeschlossen', 'Regulär', 0, 0, 7.5, 30),

-- Thomas Tester (ID 1101)
(1101, '2026-02-02 08:00:00', '2026-02-02 16:00:00', 'Abgeschlossen', 'Standard', 0, 0, 7.5, 30),
(1101, '2026-02-03 08:00:00', '2026-02-03 16:00:00', 'Abgeschlossen', 'Standard', 0, 0, 7.5, 30),
(1101, '2026-02-04 08:00:00', '2026-02-04 16:00:00', 'Abgeschlossen', 'Standard', 0, 0, 7.5, 30),
(1101, '2026-02-05 08:00:00', '2026-02-05 16:00:00', 'Abgeschlossen', 'Standard', 0, 0, 7.5, 30),
(1101, '2026-02-06 08:00:00', '2026-02-06 16:00:00', 'Abgeschlossen', 'Standard', 0, 0, 7.5, 30),

-- Kevin Kollege (ID 1103)
(1103, '2026-02-02 07:30:00', '2026-02-02 16:30:00', 'Abgeschlossen', 'Überstunden Test', 0, 0, 8.5, 30),
(1103, '2026-02-03 07:30:00', '2026-02-03 16:30:00', 'Abgeschlossen', 'Überstunden Test', 0, 0, 8.5, 30),

-- Marina Muster (ID 1102)
(1102, '2026-02-02 09:00:00', '2026-02-02 17:00:00', 'Abgeschlossen', 'Büro', 0, 0, 7.5, 30),
(1102, '2026-02-03 09:00:00', '2026-02-03 17:00:00', 'Abgeschlossen', 'Büro', 0, 0, 7.5, 30),

-- Management & Admin ( Sarah 1006, Dieter 1009, Petra 1104 )
(1006, '2026-02-02 08:00:00', '2026-02-02 17:00:00', 'Abgeschlossen', 'Management', 0, 0, 8.5, 30),
(1009, '2026-02-02 07:00:00', '2026-02-02 15:30:00', 'Abgeschlossen', 'Dispo', 0, 0, 8.0, 30),
(1104, '2026-02-02 08:30:00', '2026-02-02 17:00:00', 'Abgeschlossen', 'HR', 0, 0, 8.0, 30);
