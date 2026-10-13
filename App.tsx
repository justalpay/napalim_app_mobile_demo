import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProvider } from './src/context/AppContext';
import { ChatRoomModal } from './src/components/ChatRoomModal';
import { InAppToast } from './src/components/InAppToast';
import { Colors } from './src/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <ChatRoomModal />
          <InAppToast />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
});
