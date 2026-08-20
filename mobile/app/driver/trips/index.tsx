import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/formatCurrency';
import { getTripStatusColor } from '@/utils/statusHelpers';

const mockTrips = [
  { id: '1', date: '2023-10-27', stops: 4, status: 'ASSIGNED', fee: 400 },
  { id: '2', date: '2023-10-27', stops: 2, status: 'EN_ROUTE', fee: 200 },
];

export default function DriverTrips() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assigned Trips</Text>
      </View>

      <FlatList
        data={mockTrips}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/driver/trips/${item.id}`)}>
            <View style={styles.cardHeader}>
              <Text style={styles.tripId}>Trip #{item.id}</Text>
              <View style={[styles.badge, { backgroundColor: getTripStatusColor(item.status as any) + '33' }]}>
                <Text style={[styles.badgeText, { color: getTripStatusColor(item.status as any) }]}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.infoText}>{item.stops} Stops</Text>
              <Text style={styles.feeText}>Fee: {formatCurrency(item.fee)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No assigned trips for today.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  list: { padding: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tripId: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
  infoText: { color: colors.textSecondary },
  feeText: { color: colors.textPrimary, fontWeight: 'bold' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: 24 }
});
