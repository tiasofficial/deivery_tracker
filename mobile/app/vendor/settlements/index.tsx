import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { Button, IconButton } from 'react-native-paper';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { useNavigation, useRouter } from 'expo-router';

interface DriverSettlementGroup {
  driverId: string;
  driverName: string;
  tripsCount: number;
  totalCollected: number;
  totalTransportFee: number;
  unsettledTrips: any[];
}

function getRelativeDays(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function SettlementsList() {
  const navigation = useNavigation();
  const router = useRouter();
  const [unsettledGroups, setUnsettledGroups] = useState<DriverSettlementGroup[]>([]);
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchUnsettledTrips = async () => {
    try {
      const res = await api.get('/trips');
      const allTrips = res.data.data || [];
      
      // Filter: Trip must be completed, have collected amount or transport fee, and not yet settled
      const outstandingTrips = allTrips.filter((trip: any) => 
        (trip.status === 'COMPLETED' || parseFloat(trip.totalCollected || '0') > 0) && !trip.isSettled
      );

      // Group outstanding trips by driver
      const groupsMap: { [key: string]: DriverSettlementGroup } = {};
      
      outstandingTrips.forEach((trip: any) => {
        const driverId = trip.driverId;
        const driverName = trip.driver?.name || 'Unknown Driver';
        const collectedVal = parseFloat(trip.totalCollected || '0');
        const feeVal = parseFloat(trip.transportFee || '0');

        if (!groupsMap[driverId]) {
          groupsMap[driverId] = {
            driverId,
            driverName,
            tripsCount: 0,
            totalCollected: 0,
            totalTransportFee: 0,
            unsettledTrips: []
          };
        }
        
        groupsMap[driverId].tripsCount += 1;
        groupsMap[driverId].totalCollected += collectedVal;
        groupsMap[driverId].totalTransportFee += feeVal;
        groupsMap[driverId].unsettledTrips.push(trip);
      });

      setUnsettledGroups(Object.values(groupsMap));
    } catch (error) {
      console.error('Failed to load settlements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUnsettledTrips();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUnsettledTrips();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUnsettledTrips();
  };

  const toggleExpand = (driverId: string) => {
    setExpandedDriverId(prev => (prev === driverId ? null : driverId));
  };

  // Perform Settlement for a single trip
  const handleSettleSingleTrip = async (trip: any, driverName: string) => {
    const collected = parseFloat(trip.totalCollected || '0');
    const fee = parseFloat(trip.transportFee || '0');
    Alert.alert(
      'Confirm Settlement',
      `Settle this trip for ${driverName}?\n\nCollected Amount: ${formatCurrency(collected)}\nTransport Fee: ${formatCurrency(fee)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle Trip',
          onPress: async () => {
            setSettlingId(trip.id);
            try {
              await api.post('/settlements', {
                tripId: trip.id,
                amount: collected,
                notes: 'Settled single trip from settlements dashboard'
              });
              Alert.alert('Success', 'Trip settled successfully!');
              fetchUnsettledTrips();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to settle trip.');
            } finally {
              setSettlingId(null);
            }
          }
        }
      ]
    );
  };

  // Perform Settlement for all trips of a driver
  const handleSettleAll = async (group: DriverSettlementGroup) => {
    Alert.alert(
      'Confirm Settle All',
      `Are you sure you want to settle all ${group.tripsCount} trips for ${group.driverName}?\n\nTotal Collected: ${formatCurrency(group.totalCollected)}\nTotal Transport Fee: ${formatCurrency(group.totalTransportFee)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle All',
          onPress: async () => {
            setSettlingId(group.driverId);
            try {
              for (const trip of group.unsettledTrips) {
                await api.post('/settlements', {
                  tripId: trip.id,
                  amount: parseFloat(trip.totalCollected || '0'),
                  notes: 'Settle cash collection from dashboard'
                });
              }
              Alert.alert('Success', `All trips settled for ${group.driverName}!`);
              fetchUnsettledTrips();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to complete settlement.');
            } finally {
              setSettlingId(null);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settlements</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={unsettledGroups}
          keyExtractor={item => item.driverId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const isExpanded = expandedDriverId === item.driverId;
            return (
              <View style={styles.card}>
                {/* Click driver row to expand/collapse trips */}
                <TouchableOpacity 
                  style={styles.cardHeader} 
                  onPress={() => toggleExpand(item.driverId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.driverInfo}>
                    <Text style={styles.driver}>{item.driverName}</Text>
                    <Text style={styles.tripsCountBadge}>
                      {item.tripsCount} Unsettled Trip{item.tripsCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <IconButton 
                    icon={isExpanded ? "chevron-up" : "chevron-down"} 
                    iconColor={colors.primary} 
                    size={24}
                    style={{ margin: 0 }}
                  />
                </TouchableOpacity>

                {/* Driver Totals Row */}
                <View style={styles.totalsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Total Collected</Text>
                    <Text style={[styles.metricValue, { color: colors.success }]}>
                      {formatCurrency(item.totalCollected)}
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Transport Fee</Text>
                    <Text style={[styles.metricValue, { color: colors.secondary }]}>
                      {formatCurrency(item.totalTransportFee)}
                    </Text>
                  </View>
                </View>

                {/* Settle All Button */}
                <Button 
                  mode="contained" 
                  onPress={() => handleSettleAll(item)}
                  loading={settlingId === item.driverId}
                  disabled={settlingId !== null}
                  style={styles.settleAllBtn}
                  icon="check-all"
                >
                  Settle All Trips ({item.tripsCount})
                </Button>

                {/* Expanded Trips Breakdown */}
                {isExpanded && (
                  <View style={styles.expandedContainer}>
                    <Text style={styles.breakdownTitle}>Trips Breakdown (Click to View/Edit):</Text>
                    {item.unsettledTrips.map((trip: any, idx: number) => {
                      const tripCollected = parseFloat(trip.totalCollected || '0');
                      const tripFee = parseFloat(trip.transportFee || '0');
                      const tripDateStr = new Date(trip.tripDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });

                      return (
                        <View key={trip.id} style={styles.tripItemCard}>
                          <TouchableOpacity 
                            style={styles.tripItemHeader}
                            onPress={() => router.push({ pathname: '/vendor/trips/[id]', params: { id: trip.id } })}
                          >
                            <View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.tripDateText}>#{idx + 1} • {tripDateStr}</Text>
                                <View style={styles.ageBadge}>
                                  <Text style={styles.ageBadgeText}>{getRelativeDays(trip.tripDate)}</Text>
                                </View>
                              </View>
                              <Text style={styles.tripStopsText}>{trip.stops?.length || 0} Stops</Text>
                            </View>
                            <Text style={styles.viewEditLink}>View/Edit →</Text>
                          </TouchableOpacity>

                          <View style={styles.tripItemAmounts}>
                            <View style={styles.amountCol}>
                              <Text style={styles.amountColLabel}>Collected:</Text>
                              <Text style={[styles.amountColVal, { color: colors.success }]}>
                                {formatCurrency(tripCollected)}
                              </Text>
                            </View>
                            <View style={styles.amountCol}>
                              <Text style={styles.amountColLabel}>Transport Fee:</Text>
                              <Text style={[styles.amountColVal, { color: colors.secondary }]}>
                                {formatCurrency(tripFee)}
                              </Text>
                            </View>
                          </View>

                          <Button
                            mode="outlined"
                            onPress={() => handleSettleSingleTrip(trip, item.driverName)}
                            loading={settlingId === trip.id}
                            disabled={settlingId !== null}
                            style={styles.settleSingleBtn}
                            textColor={colors.primary}
                            compact
                          >
                            Settle This Trip
                          </Button>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>All driver cash collections are fully settled! 🎉</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverInfo: { flex: 1 },
  driver: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  tripsCountBadge: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surfaceAlt, borderRadius: 8, padding: 12, marginVertical: 12, alignItems: 'center' },
  metricBox: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: 'bold' },
  metricDivider: { width: 1, height: '80%', backgroundColor: colors.border },

  settleAllBtn: { backgroundColor: colors.primary, borderRadius: 8, marginTop: 4 },
  
  expandedContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  breakdownTitle: { fontSize: 13, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 10 },
  tripItemCard: { backgroundColor: colors.surfaceAlt, borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  tripItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tripDateText: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 14 },
  ageBadge: { backgroundColor: colors.primary + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  ageBadgeText: { color: colors.primary, fontSize: 10, fontWeight: 'bold' },
  tripStopsText: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  viewEditLink: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },
  
  tripItemAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6, paddingVertical: 6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border + '55' },
  amountCol: { flex: 1 },
  amountColLabel: { color: colors.textSecondary, fontSize: 11 },
  amountColVal: { fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  
  settleSingleBtn: { borderColor: colors.primary, marginTop: 6, borderRadius: 6 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { color: colors.textSecondary, textAlign: 'center', fontSize: 16, paddingHorizontal: 24 }
});
