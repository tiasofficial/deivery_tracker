import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatCurrency';
import { api } from '@/services/api';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStopStatusColor } from '@/utils/statusHelpers';

export default function DriverHistory() {
  const router = useRouter();
  const navigation = useNavigation();

  // State
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'COMPLETED' | 'ACTIVE'>('ALL');

  const fetchTripHistory = async () => {
    try {
      const res = await api.get('/trips');
      if (res.data.success && res.data.data) {
        const allTrips = res.data.data;
        // Sort by date descending
        allTrips.sort(
          (a: any, b: any) =>
            new Date(b.tripDate || b.createdAt).getTime() - new Date(a.tripDate || a.createdAt).getTime()
        );
        setTrips(allTrips);
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

  const getRouteOverview = (stops: any[]) => {
    if (!stops || stops.length === 0) return 'No stops recorded';
    const sorted = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
    return sorted.map(s => s.merchant?.name || 'Stop').join(' ➔ ');
  };

  const isTripFinished = (t: any) => {
    if (t.status === 'COMPLETED' || t.status === 'SETTLED' || t.status === 'CANCELLED' || t.isSettled) {
      return true;
    }
    if (t.stops && t.stops.length > 0 && t.stops.every((s: any) => s.status === 'COLLECTED' || s.status === 'SKIPPED')) {
      return true;
    }
    return false;
  };

  const filteredTrips = trips.filter(t => {
    const finished = isTripFinished(t);
    if (selectedFilter === 'COMPLETED') return finished;
    if (selectedFilter === 'ACTIVE') return !finished;
    return true; // 'ALL'
  });

  // Summary Metrics
  const totalEarnedFee = trips
    .filter(t => isTripFinished(t))
    .reduce((acc, t) => acc + Number(t.transportFee || 0), 0);

  const totalCollected = trips
    .filter(t => isTripFinished(t))
    .reduce((acc, t) => acc + Number(t.totalCollected || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
      </View>

      {/* FILTER TABS */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('ALL')}
        >
          <Text style={[styles.filterText, selectedFilter === 'ALL' && styles.filterTextActive]}>
            All Trips ({trips.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'COMPLETED' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('COMPLETED')}
        >
          <Text style={[styles.filterText, selectedFilter === 'COMPLETED' && styles.filterTextActive]}>
            Completed ({trips.filter(t => isTripFinished(t)).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'ACTIVE' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('ACTIVE')}
        >
          <Text style={[styles.filterText, selectedFilter === 'ACTIVE' && styles.filterTextActive]}>
            In Progress ({trips.filter(t => !isTripFinished(t)).length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            trips.length > 0 ? (
              <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Finished</Text>
                  <Text style={styles.summaryValue}>{trips.filter(t => isTripFinished(t)).length} Trips</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Fees Earned</Text>
                  <Text style={[styles.summaryValue, { color: colors.secondary }]}>
                    {formatCurrency(totalEarnedFee)}
                  </Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isSettled = item.status === 'SETTLED' || item.isSettled;
            const finished = isTripFinished(item);
            const statusLabel = isSettled ? 'SETTLED' : finished ? 'COMPLETED' : item.status;
            const badgeColor = isSettled ? colors.success : finished ? colors.primary : getStopStatusColor(item.status);

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/driver/trips/${item.id}` as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.date}>{new Date(item.tripDate || item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badgeColor + '22' }]}>
                    <Text style={{ color: badgeColor, fontSize: 11, fontWeight: 'bold' }}>{statusLabel}</Text>
                  </View>
                </View>

                <Text style={styles.routeLabel}>Route:</Text>
                <Text style={styles.route} numberOfLines={2}>
                  {getRouteOverview(item.stops)}
                </Text>

                <View style={styles.footerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.collected}>
                      Collected:{' '}
                      <Text style={{ color: colors.textPrimary }}>
                        {formatCurrency(Number(item.totalCollected || 0))}
                      </Text>
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.feeLabel}>Transport Fee:</Text>
                    <Text style={styles.fee}>{formatCurrency(Number(item.transportFee || 0))}</Text>
                  </View>
                </View>

                <View style={styles.tapToView}>
                  <Text style={styles.tapText}>Tap to view trip breakdown →</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={54} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>
                {selectedFilter === 'COMPLETED'
                  ? 'No Completed Trips Yet'
                  : selectedFilter === 'ACTIVE'
                  ? 'No Active Trips'
                  : 'No Trips Assigned'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'COMPLETED'
                  ? 'Once your delivery routes are completed or settled, they will appear here.'
                  : 'Trips assigned by your vendor will appear here.'}
              </Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '33',
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  list: { padding: 16 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  summaryValue: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  routeLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  route: { color: colors.textPrimary, fontSize: 14, marginBottom: 12, fontWeight: '500', lineHeight: 20 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  collected: { color: colors.textSecondary, fontSize: 13 },
  feeLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 2 },
  fee: { color: colors.secondary, fontWeight: 'bold', fontSize: 15 },
  tapToView: { marginTop: 8, alignItems: 'flex-end' },
  tapText: { color: colors.primary, fontSize: 11, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  emptySubtitle: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
});
