import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { Button } from 'react-native-paper';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { useNavigation } from 'expo-router';

interface DriverSettlementGroup {
  driverId: string;
  driverName: string;
  tripsCount: number;
  totalAmount: number;
  unsettledTrips: any[];
}

export default function SettlementsList() {
  const navigation = useNavigation();
  const [unsettledGroups, setUnsettledGroups] = useState<DriverSettlementGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchUnsettledTrips = async () => {
    try {
      const res = await api.get('/trips');
      const allTrips = res.data.data || [];
      
      // Filter: Trip must be completed, have collected amount, and not yet settled
      const outstandingTrips = allTrips.filter((trip: any) => 
        (trip.status === 'COMPLETED' || trip.totalCollected > 0) && !trip.isSettled
      );

      // Group outstanding trips by driver
      const groupsMap: { [key: string]: DriverSettlementGroup } = {};
      
      outstandingTrips.forEach((trip: any) => {
        const driverId = trip.driverId;
        const driverName = trip.driver?.name || 'Unknown Driver';
        const collectedVal = parseFloat(trip.totalCollected || '0');

        if (!groupsMap[driverId]) {
          groupsMap[driverId] = {
            driverId,
            driverName,
            tripsCount: 0,
            totalAmount: 0,
            unsettledTrips: []
          };
        }
        
        groupsMap[driverId].tripsCount += 1;
        groupsMap[driverId].totalAmount += collectedVal;
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

  // Perform Settlement
  const handleSettle = async (group: DriverSettlementGroup) => {
    Alert.alert(
      'Confirm Settlement',
      `Are you sure you want to settle ${group.tripsCount} trips for ${group.driverName} totaling ${formatCurrency(group.totalAmount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle All',
          onPress: async () => {
            setSettlingId(group.driverId);
            try {
              // Loop and settle each outstanding trip
              for (const trip of group.unsettledTrips) {
                await api.post('/settlements', {
                  tripId: trip.id,
                  amount: parseFloat(trip.totalCollected || '0'),
                  notes: 'Settle cash collection from dashboard'
                });
              }
              Alert.alert('Success', `All cash collections settled for ${group.driverName}!`);
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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.infoCol}>
                <Text style={styles.driver}>{item.driverName}</Text>
                <Text style={styles.tripsText}>{item.tripsCount} Outstanding Trip{item.tripsCount > 1 ? 's' : ''}</Text>
                <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
              </View>
              <Button 
                mode="contained" 
                onPress={() => handleSettle(item)}
                loading={settlingId === item.driverId}
                disabled={settlingId !== null}
                style={styles.settleBtn}
              >
                Settle
              </Button>
            </View>
          )}
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
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  infoCol: { flex: 1, marginRight: 16 },
  driver: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  tripsText: { color: colors.textSecondary, marginBottom: 8, fontSize: 13 },
  amount: { fontSize: 17, fontWeight: 'bold', color: colors.warning },
  settleBtn: { backgroundColor: colors.primary, borderRadius: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { color: colors.textSecondary, textAlign: 'center', fontSize: 16, paddingHorizontal: 24 }
});
