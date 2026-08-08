import React, { useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConsentScreen } from './src/screens/ConsentScreen';
import { AppNavigator } from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [consented, setConsented] = useState(false);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {consented ? (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      ) : (
        <ConsentScreen onAccept={() => setConsented(true)} />
      )}
    </SafeAreaProvider>
  );
}

export default App;