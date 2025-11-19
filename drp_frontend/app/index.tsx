import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Keyboard, StatusBar as RNStatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/index';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { lightColors, darkColors } from '../constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
    const colorScheme = useColorScheme();
    const Colors = colorScheme === 'dark' ? darkColors : lightColors;

    const [pin, setPin] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isPinMode, setIsPinMode] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState<boolean>(false);

    const pinInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    useEffect(() => {
        RNStatusBar.setBarStyle(Colors.statusBarContent);
        if (Platform.OS === 'android') {
            RNStatusBar.setBackgroundColor(Colors.background);
        }
    }, [Colors.statusBarContent, Colors.background]);

    useEffect(() => {
        const checkLoginStatus = async () => {
            setLoading(true);
            try {
                const token = await SecureStore.getItemAsync('userToken');
                if (token) {
                    router.replace('/dashboard');
                }
            } catch (e) {
                console.error("Fehler beim Abrufen des Tokens:", e);
            } finally {
                setLoading(false);
            }
        };
        checkLoginStatus();
    }, []);

    const handleNext = (pinValue = pin) => {
        if (pinValue.length >= 4 && pinValue.length <= 20) {
            setErrorMessage('');
            Keyboard.dismiss();

            if (isPinMode && password) {
                handleLogin(pinValue);
            } else {
                setIsPinMode(false);
                setTimeout(() => {
                    passwordInputRef.current?.focus();
                }, 100);
            }
        } else {
            setErrorMessage('Bitte geben Sie eine 4- bis 20-stellige PIN ein.');
        }
    };

    const handleLogin = async (pinValue = pin) => {
        if (!pinValue || !password) {
            setErrorMessage('PIN und Passwort sind erforderlich.');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        Keyboard.dismiss();

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pin: pinValue, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Login erfolgreich!', data);
                Alert.alert('Login erfolgreich!', `Willkommen, ${data.user?.full_name || 'Benutzer'}!`);

                await SecureStore.setItemAsync('userToken', data.token);

                // NEU: Debug-Logs HIER hinzufügen
                console.log("Backend-Login-Response (data.user):", data.user);

                if (data.user) {
                    const employeeId = data.user.id || data.user.employee_id; // Versuche beide gängigen Namen
                    const fullName = data.user.full_name || data.user.username || 'Unbekannt'; // Versuche beide gängigen Namen
                    
                    const userDataToStore = {
                        employee_id: employeeId,
                        full_name: fullName,
                    };

                    console.log("Speichere UserData in SecureStore:", userDataToStore);
                    await SecureStore.setItemAsync('userData', JSON.stringify(userDataToStore));
                } else {
                    console.warn("data.user-Objekt ist im Login-Response nicht vorhanden.");
                }

                router.replace('/dashboard');

            } else {
                setErrorMessage(data.message || 'Login fehlgeschlagen.');
                setIsPinMode(true);
                setPin('');
                setPassword('');
                pinInputRef.current?.focus();
            }
        } catch (error) {
            console.error('Fehler beim Login:', error);
            setErrorMessage('Netzwerkfehler oder Server nicht erreichbar.');
            setIsPinMode(true);
            setPin('');
            setPassword('');
            pinInputRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setIsScanning(false);
        setPin(data);
        setErrorMessage('');
        Keyboard.dismiss();

        setTimeout(() => {
            handleNext(data);
        }, 50);
    };

    if (!permission) {
        return (
            <View style={[styles.container, { backgroundColor: Colors.background }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ color: Colors.text }}>Kamera-Berechtigungen werden geladen...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { backgroundColor: Colors.background }]}>
                <Text style={[styles.errorMessage, { color: Colors.error }]}>Keine Kamera-Berechtigung.</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: Colors.primary }]} onPress={requestPermission}>
                    <Text style={[styles.buttonText, { color: Colors.cardBackground }]}>Berechtigung erteilen</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isScanning) {
        return (
            <View style={styles.scannerContainer}>
                <CameraView
                    barcodeScannerSettings={{
                        barcodeTypes: ["code128"],
                    }}
                    onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                    style={StyleSheet.absoluteFillObject}
                />
                <TouchableOpacity style={[styles.cancelScanButton, { backgroundColor: Colors.background }]} onPress={() => setIsScanning(false)}>
                    <Text style={[styles.cancelScanButtonText, { color: Colors.text }]}>Scan abbrechen</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <View style={[styles.loginContainer, { backgroundColor: Colors.cardBackground, borderColor: Colors.borderColor }]}>
                <Text style={[styles.title, { color: Colors.text }]}>DRP Login</Text>

                {errorMessage ? <Text style={[styles.errorMessage, { color: Colors.error }]}>{errorMessage}</Text> : null}

                {isPinMode ? (
                    <View style={styles.pinGroup}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { backgroundColor: Colors.inputBackground, color: Colors.text, borderColor: Colors.borderColor }]}
                                placeholder="Badge scannen"
                                placeholderTextColor={Colors.secondary}
                                maxLength={20}
                                keyboardType="numeric"
                                value={pin}
                                onChangeText={setPin}
                                onSubmitEditing={() => handleNext()}
                                autoFocus={true}
                                ref={pinInputRef}
                            />
                            <TouchableOpacity style={styles.barcodeScanButton} onPress={() => {
                                if (permission?.granted) {
                                    setIsScanning(true);
                                } else {
                                    Alert.alert("Kamera-Berechtigung", "Bitte erteilen Sie die Kamera-Berechtigung, um Barcodes zu scannen.");
                                    requestPermission();
                                }
                            }} disabled={loading}>
                                <FontAwesome name="barcode" size={24} color={Colors.icon} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#555555' }]} onPress={() => handleNext()} disabled={loading}>
                            {loading ? <ActivityIndicator color={Colors.cardBackground} /> : <Text style={[styles.buttonText, { color: '#ffffff' }]}>Weiter</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.passwordGroup}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { backgroundColor: Colors.inputBackground, color: Colors.text, borderColor: Colors.borderColor, marginRight: 0 }]}
                                placeholder="Passwort eingeben"
                                placeholderTextColor={Colors.secondary}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                ref={passwordInputRef}
                                autoFocus={true}
                            />
                            <TouchableOpacity
                                style={styles.passwordToggle}
                                onPress={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color={Colors.icon} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#555555' }]} onPress={() => handleLogin()} disabled={loading}>
                            {loading ? <ActivityIndicator color={Colors.cardBackground} /> : <Text style={[styles.buttonText, { color: '#ffffff' }]}>Anmelden</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 50,
    },
    loginContainer: {
        padding: 30,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        width: '80%',
        maxWidth: 300,
        borderWidth: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputWrapper: {
        position: 'relative',
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderRadius: 4,
        textAlign: 'center',
        fontSize: 18,
        height: 50,
        marginRight: 10,
    },
    barcodeScanButton: {
        padding: 10,
    },
    passwordToggle: {
        padding: 10,
    },
    button: {
        padding: 10,
        borderRadius: 4,
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorMessage: {
        marginTop: 10,
        marginBottom: 10,
        textAlign: 'center',
    },
    pinGroup: {},
    passwordGroup: {},
    scannerContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        width: '100%',
        height: '100%',
    },
    cancelScanButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 15,
        alignItems: 'center',
    },
    cancelScanButtonText: {
        color: '#fff',
        fontSize: 18,
    },
});