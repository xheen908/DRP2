const moment = require('moment-timezone');
const fs = require('fs');

const employees = [
    { id: 1015, name: 'Ronny Weber' },
    { id: 1101, name: 'Thomas Tester' },
    { id: 1102, name: 'Marina Muster' },
    { id: 1103, name: 'Kevin Kollege' },
    { id: 1104, name: 'Petra Personal' },
    { id: 1006, name: 'Sarah Manager' },
    { id: 1009, name: 'Dieter Disponent' }
];

let sql = "USE shift_db;\n";
sql += "DELETE FROM shifts WHERE start_time >= '2026-01-01 00:00:00' AND start_time < '2026-02-01 00:00:00';\n";
sql += "INSERT INTO shifts (user_id, start_time, end_time, status, notes, total_work_hours, break_duration_minutes, night_hours, sunday_hours) VALUES\n";

const entries = [];

for (let day = 1; day <= 31; day++) {
    const date = moment.tz(`2026-01-${day < 10 ? '0' + day : day}`, 'Europe/Berlin');
    const dayOfWeek = date.day();

    if (dayOfWeek === 6 || dayOfWeek === 0) {
        // Weekend handled separately or skipped
    } else {
        employees.forEach(emp => {
            const startTime = date.clone().hour(8).minute(0);
            const endTime = date.clone().hour(16).minute(30); // 8h net usually
            let notes = "Regulär";
            let night = 0, sun = 0;

            if (emp.id === 1015 && day % 3 === 0) {
                endTime.hour(19).minute(0); // Long day
                notes = "Überstunden";
            }

            const grossMin = endTime.diff(startTime, 'minutes');
            const brk = grossMin >= 540 ? 45 : 30;
            const netH = (grossMin - brk) / 60;

            entries.push(`(${emp.id}, '${startTime.format('YYYY-MM-DD HH:mm:ss')}', '${endTime.format('YYYY-MM-DD HH:mm:ss')}', 'Abgeschlossen', '${notes}', ${netH.toFixed(2)}, ${brk}, ${night.toFixed(2)}, ${sun.toFixed(2)})`);
        });
    }
}

// Add one specific Sunday for Ronny
entries.push(`(1015, '2026-01-11 10:00:00', '2026-01-11 18:00:00', 'Abgeschlossen', 'Sonntagsschicht', 7.50, 30, 0, 8.0)`);

sql += entries.join(",\n") + ";";
fs.writeFileSync('/app/demo_january.sql', sql);
console.log("SQL file generated in container.");
