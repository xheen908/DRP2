import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Keyboard, StatusBar as RNStatusBar, Linking, FlatList } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/index';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera'; // CameraType importieren
// import * as ImagePicker from 'expo-image-picker'; // ImagePicker ist vorerst entfernt

import { lightColors, darkColors } from '../constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomDashboardHeader } from '@/components/CustomDashboardHeader';
import { CustomTabBar } from '@/components/CustomTabBar';


interface Job {
    id: number;
    job_number: string;
    title: string;
    description: string;
    status: string;
    location_name: string;
    location_address: string;
    location_latitude: string;
    location_longitude: string;
    assigned_to_username: string;
    start_time: string; // ISO String
    end_time:   string;   // ISO String
    location_nfc_tag_id?: string; // Hinzugefügt für den Location Barcode Abgleich
    // NEU: Job Check-in/Check-out Koordinaten und tatsächliche Zeiten
    check_in_latitude?: string;
    check_in_longitude?: string;
    check_out_latitude?: string; // Hinzugefügt
    check_out_longitude?: string; // Hinzugefügt
    actual_start_time?: string; // Hinzugefügt
    actual_end_time?: string; // Hinzugefügt
}

interface UserData {
    employee_id: number;
    full_name: string;
}

export default function DashboardScreen() {
    const colorScheme = useColorScheme();
    const Colors = colorScheme === 'dark' ? darkColors : lightColors;

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('jobs');
    const insets = useSafeAreaInsets();

    const [user, setUser] = useState<UserData | null>(null);
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [isCheckingLocation, setIsCheckingLocation] = useState<boolean>(false);
    const [isCompanyLocationValid, setIsCompanyLocationValid] = useState<boolean | null>(null);
    const [companyLocationMessage, setCompanyLocationMessage] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string | null>(null);
    const [companyAddress, setCompanyAddress] = useState<string | null>(null);
    const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(false);
    const [isScanningForCheckIn, setIsScanningForCheckIn] = useState<boolean>(false);
    const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
    
    const [isScanningForCheckOut, setIsScanningForCheckOut] = useState<boolean>(false);
    const [checkOutLoading, setCheckOutLoading] = useState<boolean>(false);

    // NEU: Zustand für den aktuell führenden Job
    const [currentGuidingJob, setCurrentGuidingJob] = useState<Job | null>(null);
    // NEU: Zustand, ob der Benutzer sich am aktuellen Job-Standort befindet
    const [isAtCurrentJobLocation, setIsAtCurrentJobLocation] = useState<boolean>(false);
    // NEU: Zustand für die Distanz zum aktuellen Job
    const [distanceToCurrentJob, setDistanceToCurrentJob] = useState<number | null>(null);

    // VORERST ENTFERNT: Zustände für den Job-Start-Flow (Foto)
    // const [isTakingBeforePhoto, setIsTakingBeforePhoto] = useState<boolean>(false);
    // const [beforePhotoUri, setBeforePhotoUri] = useState<string | null>(null);
    // Nur noch für den Location Barcode Scan
    const [isScanningLocationBarcode, setIsScanningLocationBarcode] = useState<boolean>(false);
    const [scannedLocationBarcode, setScannedLocationBarcode] = useState<string | null>(null);

    // NEU: Zustand für den Job-Ende-Flow (Barcode Scan für Job-Ende)
    const [isScanningLocationBarcodeForEnd, setIsScanningLocationBarcodeForEnd] = useState<boolean>(false);


    useEffect(() => {
        RNStatusBar.setBarStyle(Colors.statusBarContent);
        if (Platform.OS === 'android') {
            RNStatusBar.setBackgroundColor(Colors.background); 
        }
    }, [Colors.statusBarContent, Colors.background]);

    // Lade Benutzerdaten beim App-Start
    useEffect(() => {
        console.log('DashboardScreen: Lade Benutzerdaten...');
        const loadUserData = async () => {
            const storedUser = await SecureStore.getItemAsync('userData');
            if (storedUser) {
                const parsedUser: UserData = JSON.parse(storedUser);
                setUser(parsedUser);
                console.log('DashboardScreen: Benutzerdaten geladen:', parsedUser);
            } else {
                console.log('DashboardScreen: Keine Benutzerdaten gefunden.');
            }
        };
        loadUserData();
    }, []);

    // Wenn sich der User ändert, den Schichtstatus prüfen
    useEffect(() => {
        if (user?.employee_id) {
            console.log('DashboardScreen: Benutzer-ID vorhanden, prüfe Schichtstatus...');
            checkCurrentShiftStatus();
        }
    }, [user?.employee_id]);

    useFocusEffect(
        useCallback(() => {
            console.log('useFocusEffect: Screen fokussiert, beginne Prüfungen...');
            // Standort und Kameraberechtigungen prüfen immer, wenn der Screen fokussiert wird
            checkUserLocation(); // This sets setIsCheckingLocation(true) and then false in finally.
            if (!cameraPermission?.granted) {
                console.log('useFocusEffect: Kamera-Berechtigung nicht erteilt, fordere an...');
                requestCameraPermission(); // KORREKTUR: requestCameraPermission aufrufen
            } else {
                console.log('useFocusEffect: Kamera-Berechtigung erteilt.');
            }

            // Jobs immer laden, wenn der Jobs-Tab aktiv ist, unabhängig vom Check-in-Status
            if (activeTab === 'jobs') {
                console.log('useFocusEffect: Jobs-Tab aktiv, lade Aufträge...');
                fetchJobs();
            }

            // Schichtstatus regelmäßig aktualisieren, wenn der Stempeluhr-Tab aktiv ist
            let intervalId: NodeJS.Timeout | undefined;
            if (activeTab === 'stempeluhr' && user?.employee_id) {
                console.log('useFocusEffect: Stempeluhr-Tab aktiv, starte Intervall für Schichtstatusprüfung.');
                intervalId = setInterval(() => {
                    checkCurrentShiftStatus();
                }, 10000); // Alle 10 Sekunden den Schichtstatus prüfen
            }
            
            return () => {
                console.log('useFocusEffect: Cleanup bei Unmount/Re-render.');
                if (intervalId) clearInterval(intervalId); // Cleanup bei Unmount
            };
        }, [activeTab, user?.employee_id, locationPermission, cameraPermission])
    );

    // NEU: useEffect, um den ersten Job abzurufen und die Routenführung zu starten, 
    // wenn der Mitarbeiter eingecheckt und am Firmenstandort ist.
    useEffect(() => {
        if (hasCheckedIn && isCompanyLocationValid) {
            console.log('DashboardScreen: Mitarbeiter eingecheckt und am Firmenstandort, suche nächsten Job.');
            fetchNextJobForGuidance();
        } else {
            setCurrentGuidingJob(null); // Setze den führenden Job zurück, wenn nicht eingecheckt
            setIsAtCurrentJobLocation(false); // Auch diesen Status zurücksetzen
            setDistanceToCurrentJob(null); // Auch Distanz zurücksetzen
            // Reset Job-Start-Flow States
            setScannedLocationBarcode(null);
            // setBeforePhotoUri(null); // VORERST ENTFERNT
        }
    }, [hasCheckedIn, isCompanyLocationValid, user?.employee_id]);

    // NEU: useEffect, der reagiert, wenn currentGuidingJob gesetzt wird, um den Standort zu prüfen
    useEffect(() => {
        if (currentGuidingJob) {
            checkIfUserIsAtJobLocation(currentGuidingJob);
            // Für die Echtzeitortung in Phase 2 würden wir hier einen Location-Listener starten
            // der kontinuierlich die Distanz prüft und setIsAtCurrentJobLocation aktualisiert.
        }
        // NEU: Wenn der Job gestartet wurde, aber noch nicht beendet ist, Location Scan für Ende zurücksetzen
        if (currentGuidingJob?.status === 'IN_PROGRESS') {
            setIsScanningLocationBarcodeForEnd(false); // Reset, falls man den Scanner verlassen hat
        }
    }, [currentGuidingJob]);

    const checkCurrentShiftStatus = async () => {
        console.log('checkCurrentShiftStatus: Startet...');
        if (!user?.employee_id) {
            console.warn('checkCurrentShiftStatus: Keine Benutzer-ID für Schichtstatusprüfung verfügbar.');
            setHasCheckedIn(false);
            return;
        }

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert('Nicht autorisiert', 'Bitte melden Sie sich erneut an.');
                router.replace('/');
                return;
            }

            console.log('checkCurrentShiftStatus: Rufe API auf:', `${API_BASE_URL}/api/shifts/status/${user.employee_id}`);
            const response = await fetch(`${API_BASE_URL}/api/shifts/status/${user.employee_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // ANPASSUNG: Prüfe, ob 'shifts' im Array vorhanden ist und mindestens eine Schicht existiert
                if (data.shifts && data.shifts.length > 0) {
                    // NEU: Logik zur Überprüfung der offenen Schicht
                    const openShiftExists = data.shifts.some((shift: any) => !shift.check_out_time);
                    setHasCheckedIn(openShiftExists);
                    console.log('checkCurrentShiftStatus: API-Antwort erfolgreich, offene Schicht gefunden:', openShiftExists);
                } else {
                    setHasCheckedIn(false);
                    console.log('checkCurrentShiftStatus: API-Antwort erfolgreich, keine Schichten oder keine offene Schicht gefunden.');
                }
            } else if (response.status === 404) {
                 console.log('checkCurrentShiftStatus: Keine offene Schicht gefunden (404).');
                 setHasCheckedIn(false);
            }
            else {
                console.error('checkCurrentShiftStatus: Fehler beim Abrufen des Schichtstatus:', response.status, await response.text());
                setHasCheckedIn(false);
            }
        } catch (err) {
            console.error('checkCurrentShiftStatus: Netzwerkfehler beim Abrufen des Schichtstatus:', err);
            setHasCheckedIn(false);
        }
    };


    const checkUserLocation = async () => {
        console.log('checkUserLocation: Startet...');
        setIsCheckingLocation(true);
        setError(null);
        setCompanyLocationMessage(null);
        setIsCompanyLocationValid(null);

        let { status } = await Location.requestForegroundPermissionsAsync();
        console.log('checkUserLocation: Standortberechtigung Status:', status);
        if (status !== 'granted') {
            setCompanyLocationMessage('Standortberechtigung wurde nicht erteilt. Der Check-in/Check-out ist nicht möglich.');
            setIsCheckingLocation(false);
            console.log('checkUserLocation: Standortberechtigung nicht erteilt, beendet.');
            return;
        }

        try {
            console.log('checkUserLocation: Hole aktuelle Standortdaten...');
            let currentLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentLocation.coords;
            console.log('checkUserLocation: Aktueller Standort:', latitude, longitude);

            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert('Nicht autorisiert', 'Bitte melden Sie sich erneut an.');
                router.replace('/');
                return;
            }

            console.log('checkUserLocation: Sende Standort zur Validierung an API...');
            const response = await fetch(`${API_BASE_URL}/api/locations/validate-company-location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ latitude, longitude }),
            });

            const data = await response.json();
            console.log('checkUserLocation: API-Antwort Standortvalidierung:', data);

            if (response.ok) {
                setIsCompanyLocationValid(data.isValid);
                setCompanyLocationMessage(data.message);
                setCompanyName(data.companyName);
                setCompanyAddress(data.companyAddress);
                console.log('checkUserLocation: Standortvalidierung erfolgreich. isValid:', data.isValid);
            } else {
                setError(data.message || 'Fehler beim Validieren des Standorts.');
                setIsCompanyLocationValid(false);
                console.error('checkUserLocation: Fehler bei Standortvalidierung. Nachricht:', data.message);
            }
        } catch (err) {
            console.error('checkUserLocation: Fehler beim Abrufen/Validieren des Standorts:', err);
            setError('Netzwerkfehler oder Server nicht erreichbar für Standortvalidierung.');
            setIsCompanyLocationValid(false);
        } finally {
            setIsCheckingLocation(false);
            console.log('checkUserLocation: Beendet. setIsCheckingLocation(false).');
        }
    };

    // NEU: Funktion zum Abrufen des nächsten ausstehenden Jobs für die Routenführung
    const fetchNextJobForGuidance = async () => {
        console.log('fetchNextJobForGuidance: Suche nächsten Job für Routenführung...');
        if (!user?.employee_id) {
            console.warn('fetchNextJobForGuidance: Keine Benutzer-ID verfügbar.');
            return;
        }

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert('Nicht autorisiert', 'Bitte melden Sie sich erneut an.');
                router.replace('/');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/jobs/next-for-employee/${user.employee_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data: Job | null = await response.json();
                if (data) {
                    setCurrentGuidingJob(data);
                    console.log('fetchNextJobForGuidance: Nächster Job gefunden:', data.title);
                } else {
                    setCurrentGuidingJob(null);
                    console.log('fetchNextJobForGuidance: Keine ausstehenden Jobs für Routenführung gefunden.');
                }
            } else if (response.status === 404) {
                setCurrentGuidingJob(null);
                console.log('fetchNextJobForGuidance: Keine ausstehenden Jobs gefunden (404).');
            } else {
                console.error('fetchNextJobForGuidance: Fehler beim Abrufen des nächsten Jobs:', response.status, await response.text());
                setCurrentGuidingJob(null);
            }
        } catch (err) {
            console.error('fetchNextJobForGuidance: Netzwerkfehler beim Abrufen des nächsten Jobs:', err);
            setCurrentGuidingJob(null);
        }
    };

    // NEU: Funktion zum Starten der Navigation
    const startNavigation = (latitude: string, longitude: string, destinationName: string = "Ziel") => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${latitude},${longitude}`;
        const label = encodeURIComponent(destinationName);
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url).catch(err => console.error('Fehler beim Öffnen der Navigations-App:', err));
        } else {
            Alert.alert('Navigationsfehler', 'Konnte Navigations-URL nicht erstellen.');
        }
    };

    // NEU: Hilfsfunktion zur Berechnung der Distanz zwischen zwei GPS-Punkten (Haversine-Formel)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Meter
        const φ1 = lat1 * Math.PI/180; // φ, λ in Radian
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const d = R * c; // Distanz in Metern
        return d;
    };

    // NEU: Funktion zum Überprüfen, ob sich der Benutzer am Job-Standort befindet
    const checkIfUserIsAtJobLocation = async (job: Job) => {
        setDistanceToCurrentJob(null); // Distanz zurücksetzen
        if (!job?.location_latitude || !job?.location_longitude) {
            setIsAtCurrentJobLocation(false);
            return;
        }

        try {
            let currentLocation = await Location.getCurrentPositionAsync({});
            const { latitude: userLat, longitude: userLon } = currentLocation.coords;

            const jobLat = parseFloat(job.location_latitude);
            const jobLon = parseFloat(job.location_longitude);

            const distance = calculateDistance(userLat, userLon, jobLat, jobLon);
            const threshold = 50; // 50 Meter als Schwellenwert für "am Standort"

            setIsAtCurrentJobLocation(distance < threshold);
            setDistanceToCurrentJob(distance); // Distanz setzen
            console.log(`Distanz zum Job (${job.title}): ${distance.toFixed(2)}m. Am Standort: ${distance < threshold}`);
        } catch (err) {
            console.error('Fehler beim Überprüfen des Job-Standorts:', err);
            setIsAtCurrentJobLocation(false);
            setDistanceToCurrentJob(null); // Distanz bei Fehler zurücksetzen
        }
    };

    // NEU: Startet den Flow zum Scannen des Location-Barcodes
    const startLocationBarcodeScan = async () => {
        if (!cameraPermission?.granted) {
            Alert.alert("Kamera-Berechtigung", "Bitte erteilen Sie die Kamera-Berechtigung, um Barcodes zu scannen.");
            requestCameraPermission();
            return;
        }
        setIsScanningLocationBarcode(true);
    };

    // NEU: Handler für den Location-Barcode-Scan
    const handleLocationBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
        setIsScanningLocationBarcode(false);
        if (currentGuidingJob && data === currentGuidingJob.location_nfc_tag_id) { // Annahme: Location hat nfc_tag_id als Barcode
            setScannedLocationBarcode(data);
            Alert.alert('Barcode erfolgreich gescannt!', 'Job wird gestartet.');
            // Direkt zum Job Check-in übergehen, ohne Foto
            handleJobCheckIn(data); // Übergabe des gescannten Barcodes
        } else {
            Alert.alert('Falscher Barcode', 'Der gescannte Barcode stimmt nicht mit dem aktuellen Auftrag überein.');
            setScannedLocationBarcode(null); // Barcode zurücksetzen, falls falsch
        }
    };

    // NEU: Führt den eigentlichen Job-Check-in durch (jetzt ohne Foto)
    const handleJobCheckIn = async (scannedBarcode: string) => {
        if (!user || !user.employee_id || !currentGuidingJob || !scannedBarcode) {
            Alert.alert('Fehler', 'Nicht alle erforderlichen Daten für den Job-Start sind verfügbar.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert('Nicht autorisiert', 'Bitte melden Sie sich erneut an.');
                router.replace('/');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentLocation.coords;

            // Dann den Job-Check-in durchführen (ohne Foto-Upload)
            const response = await fetch(`${API_BASE_URL}/api/jobs/${currentGuidingJob.id}/start`, { // NEU: Spezifischer Job-Start-Endpunkt
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    employee_id: user.employee_id,
                    location_barcode: scannedBarcode,
                    check_in_latitude: latitude,
                    check_in_longitude: longitude,
                    // before_photo_url ist vorerst entfernt
                }),
            });

            const responseData = await response.json();
            if (response.ok) {
                Alert.alert('Job gestartet!', responseData.message);
                // Status des aktuellen Jobs im Frontend aktualisieren
                setCurrentGuidingJob(prevJob => prevJob ? { ...prevJob, status: 'IN_PROGRESS' } : null);
                // Hier würden wir Phase 2 starten: Hintergrund-Zeit-Tracking und Ortung
                console.log('Job erfolgreich gestartet. Hintergrund-Tracking würde hier beginnen.');
            } else {
                setError(responseData.message || 'Job-Start fehlgeschlagen.');
                Alert.alert('Job-Start fehlgeschlagen', responseData.message || 'Ein Fehler ist aufgetreten.');
            }

        } catch (err) {
            console.error('Fehler beim Job-Start:', err);
            setError('Netzwerkfehler oder Server nicht erreichbar für Job-Start.');
            Alert.alert('Netzwerkfehler', 'Der Server ist derzeit nicht erreichbar.');
        } finally {
            setLoading(false);
            setScannedLocationBarcode(null); // Barcode zurücksetzen
            // setBeforePhotoUri(null); // Foto-URI zurücksetzen (entfernt)
        }
    };


    const startCheckInScan = async () => {
        console.log('startCheckInScan: Startet Barcode-Scan für Check-in.');
        if (!cameraPermission?.granted) {
            Alert.alert("Kamera-Berechtigung", "Bitte erteilen Sie die Kamera-Berechtigung, um Barcodes zu scannen.");
            requestCameraPermission();
            return;
        }
        setIsScanningForCheckIn(true);
        console.log('startCheckInScan: setIsScanningForCheckIn(true).');
    };

    const handleCheckInBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
        console.log('handleCheckInBarcodeScanned: Barcode gescannt, Typ:', type, 'Daten:', data);
        setIsScanningForCheckIn(false);

        if (!user || !user.employee_id) {
            Alert.alert('Fehler', 'Benutzerdaten nicht verfügbar. Bitte melden Sie sich erneut an.');
            router.replace('/');
            console.error('handleCheckInBarcodeScanned: Benutzerdaten fehlen.');
            return;
        }
        if (isCompanyLocationValid === false) {
             Alert.alert('Standortfehler', companyLocationMessage || 'Sie befinden sich nicht am Firmenstandort.');
             console.warn('handleCheckInBarcodeScanned: Nicht am Firmenstandort.');
             return;
        }

        setCheckInLoading(true);
        setError(null);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) { 
                Alert.alert('Nicht autorisiert', 'Bitte melden Sie sich erneut an.');
                router.replace('/');
                return;
            }

            console.log('handleCheckInBarcodeScanned: Hole aktuelle Standortdaten für Check-in...');
            let currentLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentLocation.coords;
            console.log('handleCheckInBarcodeScanned: Aktueller Standort für Check-in:', latitude, longitude);

            console.log('handleCheckInBarcodeScanned: Sende Check-in-Daten an API...');
            const response = await fetch(`${API_BASE_URL}/api/shifts/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    employee_id: user.employee_id,
                    check_in_time: new Date().toISOString(),
                    check_in_latitude: latitude,
                    check_in_longitude: longitude,
                    badge_id_scanned: data,
                }),
            });

            const responseData = await response.json();
            console.log('handleCheckInBarcodeScanned: Check-in API-Antwort:', responseData);

            if (response.ok) {
                Alert.alert('Check-in erfolgreich!', responseData.message);
                setHasCheckedIn(true);
                // NEU: Nach erfolgreichem Check-in, versuchen Sie, den nächsten Job abzurufen
                fetchNextJobForGuidance(); 
                console.log('handleCheckInBarcodeScanned: Check-in erfolgreich.');
            } else {
                setError(responseData.message || 'Check-in fehlgeschlagen.');
                Alert.alert('Check-in fehlgeschlagen', responseData.message || 'Ein Fehler ist aufgetreten.');
                console.error('handleCheckInBarcodeScanned: Check-in fehlgeschlagen. Nachricht:', responseData.message);
            }

        } catch (err) {
            console.error('handleCheckInBarcodeScanned: Fehler beim Check-in:', err);
            setError('Netzwerkfehler oder Server nicht erreichbar für Check-in.');
            Alert.alert('Netzwerkfehler', 'Der Server ist derzeit nicht erreichbar.');
        } finally {
            setCheckInLoading(false);
            console.log('handleCheckInBarcodeScanned: Beendet. setCheckInLoading(false).');
            checkCurrentShiftStatus(); 
        }
    };

    const startCheckOutScan = async () => {
        console.log('startCheckOutScan: Startet Barcode-Scan für Check-out.');
        if (!cameraPermission?.granted) {
            Alert.alert("Kamera-Berechtigung", "Bitte erteilen Sie die Kamera-Berechtigung, um Barcodes zu scannen.");
            requestCameraPermission();
            return;
        }
        setIsScanningForCheckOut(true);
        console.log('startCheckOutScan: setIsScanningForCheckOut(true).');
    };

    const handleCheckOutBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
        console.log('handleCheckOutBarcodeScanned: Barcode gescannt, Typ:', type, 'Daten:', data);
        setIsScanningForCheckOut(false);

        if (!user || !user.employee_id) {
            Alert.alert('Fehler', 'Benutzerdaten nicht verfügbar. Bitte melden Sie sich erneut an.');
            router.replace('/');
            console.error('handleCheckOutBarcodeScanned: Benutzerdaten fehlen.');
            return;
        }
        if (isCompanyLocationValid === false) {
            Alert.alert('Standortfehler', companyLocationMessage || 'Sie befinden sich nicht am Firmenstandort.');
            console.warn('handleCheckOutBarcodeScanned: Nicht am Firmenstandort.');
            return;
        }

        setCheckOutLoading(true);
        setError(null);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) { 
                Alert.alert('Nicht autorisiert', 'Bitte melden Sie sich erneut an.');
                router.replace('/');
                return;
            }

            console.log('handleCheckOutBarcodeScanned: Hole aktuelle Standortdaten für Check-out...');
            let currentLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentLocation.coords;
            console.log('handleCheckOutBarcodeScanned: Aktueller Standort für Check-out:', latitude, longitude);

            console.log('handleCheckOutBarcodeScanned: Sende Check-out-Daten an API...');
            const response = await fetch(`${API_BASE_URL}/api/shifts/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    employee_id: user.employee_id,
                    check_out_time: new Date().toISOString(),
                    check_out_latitude: latitude,
                    check_out_longitude: longitude,
                    badge_id_scanned: data,
                }),
            });

            const responseData = await response.json();
            console.log('handleCheckOutBarcodeScanned: Check-out API-Antwort:', responseData);

            if (response.ok) {
                Alert.alert('Check-out erfolgreich!', responseData.message);
                setHasCheckedIn(false);
                setCurrentGuidingJob(null); // NEU: Führenden Job nach dem Check-out zurücksetzen
                setIsAtCurrentJobLocation(false); // Auch diesen Status zurücksetzen
                setDistanceToCurrentJob(null); // Auch Distanz zurücksetzen
                console.log('handleCheckOutBarcodeScanned: Check-out erfolgreich.');
            } else {
                setError(responseData.message || 'Check-out fehlgeschlagen.');
                Alert.alert('Check-out fehlgeschlagen', responseData.message || 'Ein Fehler ist aufgetreten.');
                console.error('handleCheckOutBarcodeScanned: Check-out fehlgeschlagen. Nachricht:', responseData.message);
            }

        } catch (err) {
            console.error('handleCheckOutBarcodeScanned: Fehler beim Check-out:', err);
            setError('Netzwerkfehler oder Server nicht erreichbar für Check-out.');
            Alert.alert('Netzwerkfehler', 'Der Server ist derzeit nicht erreichbar.');
        } finally {
            setCheckOutLoading(false);
            console.log('handleCheckOutBarcodeScanned: Beendet. setCheckInLoading(false).');
            checkCurrentShiftStatus();
        }
    };

    // NEU: Startet den Flow zum Scannen des Location-Barcodes für das Job-Ende
    const startLocationBarcodeScanForEnd = async () => {
        if (!cameraPermission?.granted) {
            Alert.alert("Kamera-Berechtigung", "Bitte erteilen Sie die Kamera-Berechtigung, um Barcodes zu scannen.");
            requestCameraPermission();
            return;
        }
        setIsScanningLocationBarcodeForEnd(true);
    };

    // NEU: Handler für den Location-Barcode-Scan am Job-Ende
    const handleLocationBarcodeScannedForEnd = async ({ type, data }: { type: string; data: string }) => {
        setIsScanningLocationBarcodeForEnd(false);
        if (currentGuidingJob && data === currentGuidingJob.location_nfc_tag_id) { 
            Alert.alert('Barcode erfolgreich gescannt!', 'Job wird beendet.');
            handleJobCheckOut(data); // Übergabe des gescannten Barcodes an neue Check-out Funktion
        } else {
            Alert.alert('Falscher Barcode', 'Der gescannte Barcode stimmt nicht mit dem aktuellen Auftrag überein.');
        }
    };

    // NEU: Führt den eigentlichen Job-Check-out durch
    const handleJobCheckOut = async (scannedBarcode: string) => {
        if (!user || !user.employee_id || !currentGuidingJob || !scannedBarcode) {
            Alert.alert('Fehler', 'Nicht alle erforderlichen Daten für den Job-Abschluss sind verfügbar.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert('Nicht autorisiert', 'Bitte melden Sie sich erneut an.');
                router.replace('/');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentLocation.coords;

            const response = await fetch(`${API_BASE_URL}/api/jobs/${currentGuidingJob.id}/end`, { // NEU: Spezifischer Job-End-Endpunkt
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    employee_id: user.employee_id,
                    location_barcode: scannedBarcode,
                    check_out_latitude: latitude,
                    check_out_longitude: longitude,
                }),
            });

            const responseData = await response.json();
            if (response.ok) {
                Alert.alert('Job beendet!', responseData.message);
                // Status des aktuellen Jobs im Frontend aktualisieren
                setCurrentGuidingJob(prevJob => prevJob ? { ...prevJob, status: 'COMPLETED', actual_end_time: new Date().toISOString() } : null);
                console.log('Job erfolgreich beendet.');
                fetchJobs(); // Auftragsliste aktualisieren
            } else {
                setError(responseData.message || 'Job-Abschluss fehlgeschlagen.');
                Alert.alert('Job-Abschluss fehlgeschlagen', responseData.message || 'Ein Fehler ist aufgetreten.');
            }

        } catch (err) {
            console.error('Fehler beim Job-Abschluss:', err);
            setError('Netzwerkfehler oder Server nicht erreichbar für Job-Abschluss.');
            Alert.alert('Netzwerkfehler', 'Der Server ist derzeit nicht erreichbar.');
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert('Nicht autorisiert', 'Bitte melden Sie sich erneut an.');
                router.replace('/');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/jobs`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data: Job[] = await response.json();
                setJobs(data);
            } else if (response.status === 401 || response.status === 403) {
                Alert.alert('Sitzung abgelaufen', 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
                await SecureStore.deleteItemAsync('userToken');
                await SecureStore.deleteItemAsync('userData');
                router.replace('/');
            }
            else {
                const errorData = await response.json();
                setError(errorData.message || 'Fehler beim Abrufen der Aufträge.');
            }
        } catch (err) {
            console.error('Fehler beim Abrufen der Aufträge:', err);
            setError('Netzwerkfehler oder Server nicht erreichbar.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (isoString: string) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderJobItem = ({ item }: { item: Job }) => (
        <View style={[styles.jobCard, { backgroundColor: Colors.cardBackground, borderColor: Colors.borderColor }]}>
            <Text style={[styles.jobTitle, { color: Colors.text }]}>{item.title} ({item.job_number})</Text>
            <Text style={[styles.jobDescription, { color: Colors.text }]}>{item.description}</Text>
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.secondary }]}>Status:</Text>
                <Text style={[styles.detailValue, { color: Colors.text }]}>{item.status}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.secondary }]}>Einsatzort:</Text>
                <Text style={[styles.detailValue, { color: Colors.text }]}>{item.location_name}, {item.location_address}</Text>
            </View>
            {item.location_latitude != null && item.location_longitude != null && (
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: Colors.secondary }]}>GPS:</Text>
                    <Text style={[styles.detailValue, { color: Colors.text }]}>
                        {parseFloat(item.location_latitude).toFixed(4).replace('.', ',')},
                        {parseFloat(item.location_longitude).toFixed(4).replace('.', ',')}
                    </Text>
                </View>
            )}
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.secondary }]}>Geplanter Start:</Text>
                <Text style={[styles.detailValue, { color: Colors.text }]}>{formatDateTime(item.start_time)}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.secondary }]}>Geplantes Ende:</Text>
                <Text style={[styles.detailValue, { color: Colors.text }]}>{formatDateTime(item.end_time)}</Text>
            </View>
            <TouchableOpacity style={[styles.viewDetailsButton, { backgroundColor: '#555555' }]}>
            <Text style={[styles.viewDetailsButtonText, { color: '#ffffff' }]}>Details ansehen</Text>
            </TouchableOpacity>
        </View>
    );

    // renderContent-Funktion WIRD HIER DEFINIERT, BEVOR SIE VERWENDET WIRD
    const renderContent = () => {
        // Scanner für Job-Location-Barcode beim Start
        if (isScanningLocationBarcode && cameraPermission?.granted) {
            return (
                <View style={styles.scannerFullScreenContainer}>
                    <CameraView
                        onBarcodeScanned={isScanningLocationBarcode ? handleLocationBarcodeScanned : undefined}
                        barcodeScannerSettings={{
                            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code93', 'code128', 'datamatrix', 'qr'],
                        }}
                        style={StyleSheet.absoluteFillObject}
                        // facing={CameraType.back} // DIESE ZEILE WURDE ENTFERNT
                    />
                    <TouchableOpacity 
                        style={styles.cancelScanButton} 
                        onPress={() => setIsScanningLocationBarcode(false)}
                    >
                        <Text style={styles.cancelScanButtonText}>Location Barcode Scan abbrechen</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // NEU: Scanner für Job-Location-Barcode beim Ende
        if (isScanningLocationBarcodeForEnd && cameraPermission?.granted) {
            return (
                <View style={styles.scannerFullScreenContainer}>
                    <CameraView
                        onBarcodeScanned={isScanningLocationBarcodeForEnd ? handleLocationBarcodeScannedForEnd : undefined}
                        barcodeScannerSettings={{
                            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code93', 'code128', 'datamatrix', 'qr'],
                        }}
                        style={StyleSheet.absoluteFillObject}
                        // facing={CameraType.back} // DIESE ZEILE WURDE ENTFERNT
                    />
                    <TouchableOpacity 
                        style={styles.cancelScanButton} 
                        onPress={() => setIsScanningLocationBarcodeForEnd(false)}
                    >
                        <Text style={styles.cancelScanButtonText}>Location Barcode Scan (Ende) abbrechen</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (activeTab === 'stempeluhr') {
            return (
                <View style={styles.stempeluhrContentArea}> {/* Angepasster Container */}
                    <Text style={[styles.stempeluhrWelcomeMessage, { color: Colors.text }]}> {/* Angepasster Style */}
                        Guten Morgen, {user?.full_name || 'Mitarbeiter'}!
                    </Text>

                    {isCheckingLocation ? (
                        <ActivityIndicator size="large" color={Colors.primary} />
                    ) : (
                        <>
                            {companyLocationMessage && (
                                <Text style={[
                                    styles.locationMessage, 
                                    { color: isCompanyLocationValid ? Colors.success : Colors.error }
                                ]}>
                                    {companyLocationMessage}
                                </Text>
                            )}
                            {companyName && companyAddress && (
                                <Text style={[styles.locationDetails, { color: Colors.secondary }]}>
                                    Standort: {companyName}, {companyAddress}
                                </Text>
                            )}

                            {!hasCheckedIn ? (
                                isCompanyLocationValid === true && (
                                    <TouchableOpacity 
                                        style={[styles.checkInButton, { backgroundColor: Colors.success }]} 
                                        onPress={startCheckInScan} 
                                        disabled={checkInLoading || isScanningForCheckIn}
                                    >
                                        {checkInLoading ? <ActivityIndicator color={Colors.cardBackground} /> : <Text style={[styles.checkInButtonText, { color: Colors.text }]}>Einstempeln</Text>}
                                    </TouchableOpacity>
                                )
                            ) : (
                                <>
                                    {isCompanyLocationValid === true && (
                                        <TouchableOpacity 
                                            style={[styles.checkOutButton, { backgroundColor: Colors.error }]}
                                            onPress={startCheckOutScan} 
                                            disabled={checkOutLoading || isScanningForCheckOut}
                                        >
                                            {checkOutLoading ? <ActivityIndicator color={Colors.cardBackground} /> : <Text style={[styles.checkOutButtonText, { color: Colors.text }]}>Ausstempeln</Text>}
                                        </TouchableOpacity>
                                    )}
                                    {/* NEU: Anzeige für den nächsten Job und Navigations-Button */}
                                    {currentGuidingJob && (
                                        <View style={[styles.guidanceBox, { borderColor: Colors.borderColor, backgroundColor: Colors.cardBackground }]}> {/* Box wieder als Card */}
                                            <Text style={[styles.guidanceTitle, { color: Colors.text }]}>Nächster Auftrag:</Text>
                                            <Text style={[styles.guidanceJobTitle, { color: Colors.text }]}>{currentGuidingJob.title}</Text>
                                            <Text style={[styles.guidanceJobLocation, { color: Colors.secondary }]}>{currentGuidingJob.location_name}</Text>
                                            {/* Anzeige der Adresse */}
                                            <Text style={[styles.guidanceJobAddress, { color: Colors.text }]}>{currentGuidingJob.location_address}</Text>

                                            {/* Anzeige der Fälligkeit mit Bedingung */}
                                            {currentGuidingJob.start_time && (
                                                <Text style={[styles.guidanceDueDate, { color: Colors.secondary }]}>
                                                    Fällig: <Text style={new Date(currentGuidingJob.start_time) < new Date() ? styles.guidanceImportant : { color: Colors.secondary }}>
                                                        {new Date(currentGuidingJob.start_time) < new Date() ? 'WICHTIG! Termin überschritten! (' : ''}
                                                        {formatDateTime(currentGuidingJob.start_time)}
                                                        {new Date(currentGuidingJob.start_time) < new Date() ? ')' : ''}
                                                    </Text>
                                                </Text>
                                            )}

                                            {/* Anzeige der Distanz */}
                                            {distanceToCurrentJob !== null && (
                                                <Text style={[styles.guidanceDistance, { color: Colors.secondary }]}>
                                                    Entfernung: {distanceToCurrentJob >= 1000 ? `${(distanceToCurrentJob / 1000).toFixed(2)} km` : `${distanceToCurrentJob.toFixed(0)} m`}
                                                </Text>
                                            )}

                                            {/* Logik für "Route starten" vs. "Job starten" */}
                                            {currentGuidingJob.location_latitude && currentGuidingJob.location_longitude && !isAtCurrentJobLocation && (
                                                <TouchableOpacity 
                                                    style={[styles.navigateButton, { backgroundColor: Colors.primary }]}
                                                    onPress={() => startNavigation(
                                                        currentGuidingJob.location_latitude,
                                                        currentGuidingJob.location_longitude,
                                                        currentGuidingJob.location_name
                                                    )}
                                                >
                                                    <FontAwesome name="location-arrow" size={20} color={Colors.cardBackground} style={{ marginRight: 10 }} />
                                                    <Text style={[styles.navigateButtonText, { color: Colors.cardBackground }]}>Route starten</Text>
                                                </TouchableOpacity>
                                            )}
                                            {currentGuidingJob.location_latitude && currentGuidingJob.location_longitude && isAtCurrentJobLocation && currentGuidingJob.status === 'PENDING' && ( // "PENDING" oder "ASSIGNED"
                                                <TouchableOpacity 
                                                    style={[styles.jobStartButton, { backgroundColor: Colors.success }]} 
                                                    onPress={startLocationBarcodeScan} // Startet den Location Barcode Scan
                                                >
                                                    <FontAwesome name="play-circle" size={20} color={Colors.text} style={{ marginRight: 10 }} />
                                                    <Text style={[styles.jobStartButtonText, { color: Colors.text }]}>Job starten</Text>
                                                </TouchableOpacity>
                                            )}
                                            {currentGuidingJob.location_latitude && currentGuidingJob.location_longitude && isAtCurrentJobLocation && currentGuidingJob.status === 'IN_PROGRESS' && (
                                                <>
                                                    <Text style={[styles.atLocationText, { color: Colors.success, marginBottom: 10 }]}>Job ist im Gange!</Text>
                                                    <TouchableOpacity 
                                                        style={[styles.jobEndButton, { backgroundColor: Colors.error }]} // NEU: Style für Job beenden
                                                        onPress={startLocationBarcodeScanForEnd} // Startet den Location Barcode Scan zum Beenden
                                                    >
                                                        <FontAwesome name="stop-circle" size={20} color={Colors.cardBackground} style={{ marginRight: 10 }} />
                                                        <Text style={[styles.jobEndButtonText, { color: Colors.cardBackground }]}>Job beenden</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                            {currentGuidingJob.location_latitude && currentGuidingJob.location_longitude && isAtCurrentJobLocation && currentGuidingJob.status === 'COMPLETED' && (
                                                <Text style={[styles.atLocationText, { color: Colors.success }]}>Job abgeschlossen!</Text>
                                            )}
                                            {/* Falls andere Status oder nicht zugeordnet, aber am Standort */}
                                            {currentGuidingJob.location_latitude && currentGuidingJob.location_longitude && isAtCurrentJobLocation && currentGuidingJob.status !== 'PENDING' && currentGuidingJob.status !== 'IN_PROGRESS' && currentGuidingJob.status !== 'COMPLETED' && (
                                                <Text style={[styles.atLocationText, { color: Colors.success }]}>Sie sind am Einsatzort!</Text>
                                            )}
                                        </View>
                                    )}
                                </>
                            )}

                            {isCompanyLocationValid === false && (
                                <TouchableOpacity 
                                    style={[styles.checkInButton, { backgroundColor: '#555555' }]} 
                                    onPress={checkUserLocation} 
                                    disabled={isCheckingLocation}
                                >
                                    {isCheckingLocation ? <ActivityIndicator color={Colors.cardBackground} /> : <Text style={[styles.checkInButtonText, { color: '#ffffff' }]}>Standort erneut prüfen</Text>}
                                </TouchableOpacity>
                            )}

                            {error && <Text style={[styles.errorMessage, { color: Colors.error }]}>{error}</Text>}
                        </>
                    )}
                </View>
            );
        } else if (activeTab === 'jobs') {
            return loading ? (
                <ActivityIndicator size="large" color={Colors.primary} />
            ) : error ? (
                <Text style={[styles.errorMessage, { color: Colors.error }]}>{error}</Text>
            ) : jobs.length === 0 ? (
                <Text style={[styles.noJobsMessage, { color: Colors.text }]}>Keine Aufträge verfügbar.</Text>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderJobItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.jobsListContent} // NEU: Angepasster Style für Jobs-Liste
                    onRefresh={fetchJobs}
                    refreshing={loading}
                />
            );
        } else if (activeTab === 'profile') {
            return (
                <View style={[styles.tabContent, { backgroundColor: Colors.background }]}>
                    <Text style={[styles.tabTitle, { color: Colors.text }]}>Profil</Text>
                    <Text style={{ color: Colors.text }}>Profilinformationen kommen hierher.</Text>
                </View>
            );
        } else if (activeTab === 'settings') {
            return (
                <View style={[styles.tabContent, { backgroundColor: Colors.background }]}>
                    <Text style={[styles.tabTitle, { color: Colors.text }]}>Einstellungen</Text>
                    <Text style={{ color: Colors.text }}>App-Einstellungen kommen hierher.</Text>
                </View>
            );
        }
        return null;
    };

    return (
        <View style={[styles.fullScreenContainer, { backgroundColor: Colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    header: () => <CustomDashboardHeader Colors={Colors} />,
                    title: 'Mein Dashboard',
                }}
            />

            {/* Barcode-Scanner für Check-in/Check-out, der den gesamten Bildschirm einnimmt, wenn aktiv */}
            {(isScanningForCheckIn || isScanningForCheckOut) && cameraPermission?.granted ? (
                <View style={styles.scannerFullScreenContainer}>
                    <CameraView
                        onBarcodeScanned={isScanningForCheckIn ? handleCheckInBarcodeScanned : handleCheckOutBarcodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code93', 'code128', 'datamatrix', 'qr'],
                        }}
                        style={StyleSheet.absoluteFillObject}
                        // facing={CameraType.back} // DIESE ZEILE WURDE ENTFERNT
                    />
                    <TouchableOpacity 
                        style={styles.cancelScanButton} 
                        onPress={() => {
                            setIsScanningForCheckIn(false);
                            setIsScanningForCheckOut(false);
                            console.log('Scanner abgebrochen.');
                        }}
                    >
                        <Text style={styles.cancelScanButtonText}>Scan abbrechen</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.contentArea}>
                    {renderContent()}
                </View>
            )}

            <CustomTabBar activeTab={activeTab} setActiveTab={setActiveTab} Colors={Colors} />
        </View>
    );
}

// Styles für Header und Footer sind in CustomDashboardHeader.tsx und CustomTabBar.tsx definiert.
// Diese Styles sind nur für Komponenten in dieser Datei relevant.
const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
    },
    scannerFullScreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    contentArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: { 
        // paddingHorizontal: 15,
        // paddingBottom: 20,
        // paddingTop: 10,
        // minHeight: '100%',
    },
    // Angepasster Style für den Inhalt der Jobs-Liste
    jobsListContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
        paddingTop: 10,
        width: '100%', 
    },
    jobCard: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        width: '100%',
        maxWidth: 600,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1, 
    },
    jobTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    jobDescription: {
        fontSize: 16,
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        width: 120,
    },
    detailValue: {
        fontSize: 14,
        flex: 1,
    },
    viewDetailsButton: {
        paddingVertical: 8,
        borderRadius: 5,
        marginTop: 10,
        alignItems: 'center',
        backgroundColor: '#555555',
    },
    viewDetailsButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    errorMessage: {
        marginTop: 10,
        marginBottom: 10,
        textAlign: 'center',
    },
    noJobsMessage: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 20,
    },
    tabContent: { 
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        width: '100%',
    },
    // Style für den Stempeluhr-Tab ohne Card
    stempeluhrContentArea: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        width: '100%',
    },
    // Style für die Welcome Message ohne Card
    stempeluhrWelcomeMessage: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 20, 
    },
    locationMessage: {
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
    },
    locationDetails: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    checkInButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 5,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    checkInButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    checkOutButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 5,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    checkOutButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    cancelScanButton: {
        backgroundColor: 'rgba(0,0,0,0.6)', 
        padding: 15,
        alignItems: 'center',
        width: '100%',
    },
    cancelScanButtonText: {
        color: '#fff', 
        fontSize: 18,
    },
    // Styles für die Routenführung
    guidanceBox: {
        marginTop: 20,
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        width: '90%',
        maxWidth: 400,
        borderWidth: 1,
        alignItems: 'center',
    },
    guidanceTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    guidanceJobTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    guidanceJobLocation: {
        fontSize: 14,
        marginBottom: 5, 
        textAlign: 'center',
    },
    // Style für die Job-Adresse
    guidanceJobAddress: {
        fontSize: 14,
        marginBottom: 5, 
        textAlign: 'center',
    },
    // Style für die Distanzanzeige
    guidanceDistance: {
        fontSize: 14,
        marginBottom: 5, 
        textAlign: 'center',
    },
    // Style für die Fälligkeit
    guidanceDueDate: {
        fontSize: 14,
        marginBottom: 15,
        textAlign: 'center',
    },
    // Style für den wichtigen Termin (überschritten)
    guidanceImportant: {
        color: 'red',
        fontWeight: 'bold',
    },
    navigateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    navigateButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    // NEU: Style für den Job Start Button
    jobStartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 10, // Etwas Abstand zum vorherigen Element
    },
    jobStartButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    // NEU: Style für den Job End Button
    jobEndButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 10,
    },
    jobEndButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Style für die "Am Standort" Nachricht
    atLocationText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        textAlign: 'center',
    },
});