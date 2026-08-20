import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

export default function VendorLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    }}>
      {/* Visible Tabs */}
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({color}) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="trips/index" options={{ title: 'Trips', tabBarIcon: ({color}) => <Ionicons name="map" size={24} color={color} /> }} />
      <Tabs.Screen name="analytics/index" options={{ title: 'Analytics', tabBarIcon: ({color}) => <Ionicons name="bar-chart" size={24} color={color} /> }} />
      <Tabs.Screen name="settlements/index" options={{ title: 'Settlements', tabBarIcon: ({color}) => <Ionicons name="cash" size={24} color={color} /> }} />

      {/* Hidden Sub-pages */}
      <Tabs.Screen name="trips/create" options={{ href: null }} />
      <Tabs.Screen name="trips/[id]" options={{ href: null }} />
      <Tabs.Screen name="drivers/index" options={{ href: null }} />
      <Tabs.Screen name="drivers/[id]" options={{ href: null }} />
      <Tabs.Screen name="merchants/index" options={{ href: null }} />
      <Tabs.Screen name="merchants/[id]" options={{ href: null }} />
    </Tabs>
  );
}
