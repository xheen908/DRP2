import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar as RNStatusBar } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LightDarkColors } from '../constants/theme'; // Importiere das Typ-Interface

interface CustomDashboardHeaderProps {
    Colors: LightDarkColors; // Verwende das importierte Typ-Interface
}

export const CustomDashboardHeader: React.FC<CustomDashboardHeaderProps> = ({ Colors }) => {
    const handleLogout = async () => {
        Alert.alert(
            'Abmelden',
            'Möchten Sie sich wirklich abmelden?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Ja',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('userToken');
                        await SecureStore.deleteItemAsync('userData');
                        router.replace('/');
                    },
                },
            ],
            { cancelable: false }
        );
    };

    return (
        <View style={[headerStyles.headerContainer, { backgroundColor: Colors.headerBackground }]}>
            <Text style={[headerStyles.headerTitle, { color: Colors.headerText }]}>DRP App</Text>
            <TouchableOpacity
                onPress={handleLogout}
                style={headerStyles.menuButton}
            >
                <FontAwesome name="sign-out" size={24} color={Colors.headerIcon} />
            </TouchableOpacity>
        </View>
    );
};

const headerStyles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : Constants.statusBarHeight,
        paddingBottom: 10,
        width: '100%',
        height: Platform.OS === 'android' ? (60 + (RNStatusBar.currentHeight || 0)) : (90 + (Constants.statusBarHeight || 0)),
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    menuButton: {
        padding: 5,
    },
});