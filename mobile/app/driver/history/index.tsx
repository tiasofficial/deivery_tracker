import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatCurrency';
import { api } from '@/services/api';
import { useNavigation } from 'expo-router';

export default function DriverHistory() {
  const navigation = useNavigation();

  // State
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTripHistory = async () => {
    try {
      const res = await api.get('/trips');
      if (res.data.success && res.data.data) {
        // Filter only completed, settled or cancelled trips for history
        const historyTrips = res.data.data.filter((t: any) => 
          t.status === 'COMPLETED' || t.status === 'SETTLED' || t.status === 'CANCELLED'
        );
        // Sort by date descending (latest completed first)
        historyTrips.sort((a: any, b: any) => new Date(b.tripDate).getTime() - new Date(a.tripDate).getTime());
        setTrips(historyTrips);
      }
    } catch (error) {
      console.error('Failed to load trip history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTripHistory();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTripHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTripHistory();
  };

  // Helper to compile a route route overview string: e.g. "Merchant A → Merchant B"
  const getRouteOverview = (stops: any[]) => {
    if (!stops || stops.length === 0) return 'No stops';
    // Sort by stopOrder
    const sorted = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
    return sorted.map(s => s.merchant?.name || 'Stop').join(' → ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const isSettled = item.status === 'SETTLED' || item.isSettled;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.date}>{new Date(item.tripDate).toLocaleDateString()}</Text>
                  <View style={[styles.badge, { backgroundColor: isSettled ? colors.success + '33' : colors.warning + '33' }]}>
                    <Text style={{ color: isSettled ? colors.success : colors.warning, fontSize: 10, fontWeight: 'bold' }}>
                      {isSettled ? 'SETTLED' : 'UNSETTLED'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.routeLabel}>Route:</Text>
                <Text style={styles.route} numberOfLines={2}>{getRouteOverview(item.stops)}</Text>
                <View style={styles.footerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.collected}>Collected: {formatCurrency(Number(item.totalCollected || 0))}</Text>
                    <Text style={styles.fee}>Transport Fee: {formatCurrency(Number(item.transportFee || 0))}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>Final Net:</Text>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.secondary }}>
                      {formatCurrency(Number(item.totalCollected || 0) - Number(item.transportFee || 0))}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No completed trips in your history yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  list: { padding: 16 },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  date: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  routeLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 2 },
  route: { color: colors.textPrimary, fontSize: 14, marginBottom: 12, fontWeight: '500' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  collected: { color: colors.success, fontWeight: 'bold', fontSize: 14 },
  fee: { color: colors.secondary, fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' }
});
