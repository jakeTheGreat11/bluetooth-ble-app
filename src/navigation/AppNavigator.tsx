import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ScanScreen } from '../screens/ScanScreen';
import { SpamScreen } from '../screens/SpamScreen';
import { LearnScreen } from '../screens/LearnScreen';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen
        name="Broadcast"
        component={SpamScreen}
        options={{ title: 'Broadcast Lab' }}
      />
      <Tab.Screen name="Learn" component={LearnScreen} />
    </Tab.Navigator>
  );
}