import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

export default function DriverLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({color}) => <Ionicons name="today" size={24} color={color} /> }} />
      <Tabs.Screen name="history/index" options={{ title: 'History', tabBarIcon: ({color}) => <Ionicons name="time" size={24} color={color} /> }} />
      
      {/* Hide internal sub-screens from tab navigator */}
      <Tabs.Screen name="request-pickup" options={{ href: null }} />
      <Tabs.Screen name="trips/index" options={{ href: null }} />
      <Tabs.Screen name="trips/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="trips/[id]/stop/[stopId]" options={{ href: null }} />
    </Tabs>
  );
}
