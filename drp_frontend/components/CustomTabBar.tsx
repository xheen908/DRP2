import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../constants/theme'; // Importiere das Typ-Interface

interface CustomTabBarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    Colors: ThemeColors;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({ activeTab, setActiveTab, Colors }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[footerStyles.footerContainer, { paddingBottom: insets.bottom, backgroundColor: Colors.cardBackground, borderTopColor: Colors.borderColor }]}>
            <TouchableOpacity
                style={[footerStyles.footerButton, activeTab === 'jobs' && footerStyles.activeButton]}
                onPress={() => setActiveTab('jobs')}
            >
                <FontAwesome name="clipboard" size={24} color={activeTab === 'jobs' ? Colors.activeIcon : Colors.icon} />
                <Text style={[footerStyles.footerButtonText, { color: activeTab === 'jobs' ? Colors.activeIcon : Colors.icon }, activeTab === 'jobs' && footerStyles.activeButtonText]}>Aufträge</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[footerStyles.footerButton, activeTab === 'stempeluhr' && footerStyles.activeButton]}
                onPress={() => setActiveTab('stempeluhr')}
            >
                <FontAwesome name="clock-o" size={24} color={activeTab === 'stempeluhr' ? Colors.activeIcon : Colors.icon} />
                <Text style={[footerStyles.footerButtonText, { color: activeTab === 'stempeluhr' ? Colors.activeIcon : Colors.icon }, activeTab === 'stempeluhr' && footerStyles.activeButtonText]}>Stempeluhr</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[footerStyles.footerButton, activeTab === 'profile' && footerStyles.activeButton]}
                onPress={() => setActiveTab('profile')}
            >
                <FontAwesome name="user" size={24} color={activeTab === 'profile' ? Colors.activeIcon : Colors.icon} />
                <Text style={[footerStyles.footerButtonText, { color: activeTab === 'profile' ? Colors.activeIcon : Colors.icon }, activeTab === 'profile' && footerStyles.activeButtonText]}>Profil</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[footerStyles.footerButton, activeTab === 'settings' && footerStyles.activeButton]}
                onPress={() => setActiveTab('settings')}
            >
                <FontAwesome name="cog" size={24} color={activeTab === 'settings' ? Colors.activeIcon : Colors.icon} />
                <Text style={[footerStyles.footerButtonText, { color: activeTab === 'settings' ? Colors.activeIcon : Colors.icon }, activeTab === 'settings' && footerStyles.activeButtonText]}>Einstellungen</Text>
            </TouchableOpacity>
        </View>
    );
};

const footerStyles = StyleSheet.create({
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingVertical: 10,
        width: '100%',
    },
    footerButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 5,
        minHeight: 50,
        justifyContent: 'center',
    },
    footerButtonText: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    activeButton: {
    },
    activeButtonText: {
        fontWeight: 'bold',
    },
});