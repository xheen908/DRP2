export interface ThemeColors { // Hinzugefügt: 'export'
  background: string;
  text: string;
  primary: string;
  secondary: string;
  cardBackground: string;
  inputBackground: string;
  borderColor: string;
  error: string;
  success: string;
  icon: string; // <-- Hier wird die Farbe für inaktive Icons definiert
  statusBarContent: 'dark-content' | 'light-content';
  headerText: string;
  buttonBackground: string; // Neu hinzugefügt
  buttonText: string; // Neu hinzugefügt
  checkInButtonBackground: string; // Neu hinzugefügt
  checkInButtonText: string; // Neu hinzugefügt
  checkOutButtonBackground: string; // Neu hinzugefügt
  checkOutButtonText: string; // Neu hinzugefügt
  disabledButtonBackground: string; // Neu hinzugefügt
  disabledButtonText: string; // Neu hinzugefügt
  headerBackground: string; // Neu hinzugefügt
  headerIcon: string; // Neu hinzugefügt
  activeIcon: string; // Neu hinzugefügt
  // Weitere Farben nach Bedarf
}

export const lightColors: ThemeColors = {
  background: '#f4f4f4',
  text: '#333333',
  primary: '#007bff', // Blau für Hauptaktionen
  secondary: '#6c757d', // Grau für sekundäre Elemente
  cardBackground: '#ffffff',
  inputBackground: '#ffffff',
  borderColor: '#dddddd',
  error: 'red',
  success: 'green',
  icon: '#555555', // <-- Geändert auf 555555
  statusBarContent: 'dark-content',
  headerText: '#333333', // Header-Textfarbe für hellen Modus
  buttonBackground: '#555555',
  buttonText: '#ffffff',
  checkInButtonBackground: '#6fdc6f',
  checkInButtonText: '#ffffff',
  checkOutButtonBackground: '#ff6b6b',
  checkOutButtonText: '#ffffff',
  disabledButtonBackground: '#aaaaaa',
  disabledButtonText: '#ffffff',
  headerBackground: '#ffffff', // Header-Hintergrundfarbe für hellen Modus
  headerIcon: '#333333', // Header-Iconfarbe für hellen Modus
  activeIcon: '#007bff', // Aktive Iconfarbe für hellen Modus
};

export const darkColors: ThemeColors = {
  background: '#222222', // Ihr gewünschter dunkler Hintergrund
  text: '#ffffff',
  primary: '#888888', // Hellere blaue Farbe für Dark Mode
  secondary: '#adb5bd', // Hellere graue Farbe
  cardBackground: '#333333',
  inputBackground: '#444444',
  borderColor: '#555555',
  error: '#ff6b6b', // Hellere Rot-Nuance
  success: '#6fdc6f', // Hellere Grün-Nuance
  icon: '#888888', // <-- Geändert auf 555555
  statusBarContent: 'light-content',
  headerText: '#ffffff',
  buttonBackground: '#555555',
  buttonText: '#ffffff',
  checkInButtonBackground: '#6fdc6f',
  checkInButtonText: '#ffffff',
  checkOutButtonBackground: '#ff6b6b',
  checkOutButtonText: '#ffffff',
  disabledButtonBackground: '#555555',
  disabledButtonText: '#ffffff',
  headerBackground: '#333333', // Header-Hintergrundfarbe für dunklen Modus
  headerIcon: '#ffffff', // Header-Iconfarbe für dunklen Modus
  activeIcon: '#ffffff', // Aktive Iconfarbe für dunklen Modus
};