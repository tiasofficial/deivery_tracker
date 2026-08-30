import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { Button, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { useNavigation, useRouter } from 'expo-router';

function getDestinationNames(trip: any): string {
  if (!trip.stops || trip.stops.length === 0) return 'Direct Route';
  const names = trip.stops.map((s: any) => s.merchant?.name).filter(Boolean);
  if (names.length === 0) return 'Custom Route';
  return names.join(' ➔ ');
}

export default function SettlementsScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  // Tab State: 'COLLECTIONS' = Cash Collections | 'FEES' = Transport Fees Due
  const [activeTab, setActiveTab] = useState<'COLLECTIONS' | 'FEES'>('COLLECTIONS');

  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal State for Receiving Cash Collection & Setting Transport Fee
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [collectedInput, setCollectedInput] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [submittingReceive, setSubmittingReceive] = useState(false);

  const fetchTripsData = async () => {
    try {
      const res = await api.get('/trips');
      setAllTrips(res.data.data || []);
    } catch (error) {
      console.error('Failed to load trips for settlements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTripsData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTripsData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTripsData();
  };

  // 1. CASH COLLECTIONS DUE (Driver ➔ Vendor)
  // Trips where cash was collected and not yet marked received (isSettled == false)
  const pendingCollections = allTrips.filter((trip: any) => 
    (trip.status === 'COMPLETED' || parseFloat(trip.totalCollected || '0') > 0) && !trip.isSettled
  );

  // 2. TRANSPORT FEES DUE LIST (Vendor ➔ Driver)
  // Completed trips with transportFee where fee is NOT yet paid
  const dueTransportFeeTrips = allTrips.filter((trip: any) => {
    const hasFee = parseFloat(trip.transportFee || '0') > 0;
    const isCompleted = trip.status === 'COMPLETED' || trip.isSettled;
    const isFeePaid = trip.notes && trip.notes.includes('FEE_PAID');
    return isCompleted && hasFee && !isFeePaid;
  });

  // Group Transport Fees by Driver
  const feeGroupsByDriver: { [key: string]: { driverId: string; driverName: string; totalFee: number; trips: any[] } } = {};
  dueTransportFeeTrips.forEach((trip: any) => {
    const dId = trip.driverId;
    const dName = trip.driver?.name || 'Unknown Driver';
    const feeVal = parseFloat(trip.transportFee || '0');

    if (!feeGroupsByDriver[dId]) {
      feeGroupsByDriver[dId] = {
        driverId: dId,
        driverName: dName,
        totalFee: 0,
        trips: []
      };
    }
    feeGroupsByDriver[dId].totalFee += feeVal;
    feeGroupsByDriver[dId].trips.push(trip);
  });
  const driverFeeGroups = Object.values(feeGroupsByDriver);

  // Open Cash Collection Confirmation Modal
  const openReceiveModal = (trip: any) => {
    setSelectedTrip(trip);
    setCollectedInput(String(parseFloat(trip.totalCollected || '0')));
    setFeeInput(String(parseFloat(trip.transportFee || '0')));
    setReceiveModalVisible(true);
  };

  // Confirm Cash Received & Set Transport Fee
  const handleConfirmReceive = async () => {
    if (!selectedTrip) return;
    const collectedAmount = parseFloat(collectedInput);
    const transportFee = parseFloat(feeInput);

    if (isNaN(collectedAmount) || collectedAmount < 0) {
      Alert.alert('Invalid', 'Please enter a valid collection amount.');
      return;
    }
    if (isNaN(transportFee) || transportFee < 0) {
      Alert.alert('Invalid', 'Please enter a valid transport fee.');
      return;
    }

    setSubmittingReceive(true);
    try {
      // 1. Update trip amounts
      await api.patch(`/trips/${selectedTrip.id}`, {
        totalCollected: collectedAmount,
        transportFee: transportFee
      });

      // 2. Mark collection received in settlements table
      await api.post('/settlements', {
        tripId: selectedTrip.id,
        amount: collectedAmount,
        notes: 'Cash Collection Received'
      });

      Alert.alert(
        'Success', 
        `Cash collection of ${formatCurrency(collectedAmount)} marked received!\n\nTransport fee of ${formatCurrency(transportFee)} is now added to the Transport Fees Due list.`
      );
      setReceiveModalVisible(false);
      fetchTripsData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to confirm collection.');
    } finally {
      setSubmittingReceive(false);
    }
  };

  // Mark Single Transport Fee as Paid
  const handleMarkFeePaid = async (trip: any) => {
    const feeVal = parseFloat(trip.transportFee || '0');
    const destinations = getDestinationNames(trip);
    Alert.alert(
      'Mark Transport Fee Paid',
      `Pay ${formatCurrency(feeVal)} transport fee to ${trip.driver?.name} for trip to:\n📍 ${destinations}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            setActionLoadingId(trip.id);
            try {
              const updatedNotes = (trip.notes || '').replace('FEE_PAID', '') + ' FEE_PAID';
              await api.patch(`/trips/${trip.id}`, {
                notes: updatedNotes.trim()
              });
              Alert.alert('Paid', `Transport fee of ${formatCurrency(feeVal)} marked as paid!`);
              fetchTripsData();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to mark fee as paid.');
            } finally {
              setActionLoadingId(null);
            }
          }
        }
      ]
    );
  };

  // Pay All Transport Fees for a Driver
  const handlePayAllFeesForDriver = async (group: any) => {
    Alert.alert(
      'Pay All Driver Fees',
      `Mark all ${group.trips.length} transport fees totaling ${formatCurrency(group.totalFee)} as paid to ${group.driverName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay All',
          onPress: async () => {
            setActionLoadingId(group.driverId);
            try {
              for (const trip of group.trips) {
                const updatedNotes = (trip.notes || '').replace('FEE_PAID', '') + ' FEE_PAID';
                await api.patch(`/trips/${trip.id}`, {
                  notes: updatedNotes.trim()
                });
              }
              Alert.alert('Success', `All transport fees (${formatCurrency(group.totalFee)}) marked as paid to ${group.driverName}!`);
              fetchTripsData();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to complete payments.');
            } finally {
              setActionLoadingId(null);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settlements & Fees</Text>
      </View>

      {/* TWO SEPARATE LAYOUTS TOGGLE TABS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'COLLECTIONS' && styles.tabButtonActive]}
          onPress={() => setActiveTab('COLLECTIONS')}
        >
          <Ionicons 
            name="cash-outline" 
            size={18} 
            color={activeTab === 'COLLECTIONS' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'COLLECTIONS' && styles.tabTextActive]}>
            Collections ({pendingCollections.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'FEES' && styles.tabButtonActive]}
          onPress={() => setActiveTab('FEES')}
        >
          <Ionicons 
            name="car-outline" 
            size={18} 
            color={activeTab === 'FEES' ? colors.secondary : colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'FEES' && styles.tabTextActiveSecondary]}>
            Transport Fees ({dueTransportFeeTrips.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'COLLECTIONS' ? (
        /* ========================================================================= */
        /* LAYOUT 1: CASH COLLECTIONS (DRIVER -> VENDOR)                             */
        /* ========================================================================= */
        <FlatList
          data={pendingCollections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.tabHeaderBox}>
              <Text style={styles.tabHeaderTitle}>💰 Cash Collection Received</Text>
              <Text style={styles.tabHeaderSub}>
                Mark cash received from driver on the same day and set the transport fee.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const destinations = getDestinationNames(item);
            const collected = parseFloat(item.totalCollected || '0');
            const tripDateStr = new Date(item.tripDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverName}>{item.driver?.name || 'Driver'}</Text>
                    <Text style={styles.dateText}>#{index + 1} • {tripDateStr}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.warning + '22' }]}>
                    <Text style={[styles.badgeText, { color: colors.warning }]}>Collection Pending</Text>
                  </View>
                </View>

                {/* DESTINATION NAME */}
                <View style={styles.destinationRow}>
                  <Ionicons name="navigate-circle" size={18} color={colors.primary} />
                  <Text style={styles.destinationText} numberOfLines={2}>
                    {destinations}
                  </Text>
                </View>

                {/* CASH COLLECTED */}
                <View style={styles.amountBanner}>
                  <Text style={styles.amountBannerLabel}>Cash Collected from Shops:</Text>
                  <Text style={styles.amountBannerVal}>{formatCurrency(collected)}</Text>
                </View>

                {/* ACTION: RECEIVE CASH & SET TRANSPORT FEE */}
                <Button
                  mode="contained"
                  onPress={() => openReceiveModal(item)}
                  style={styles.receiveBtn}
                  icon="checkbox-marked-circle-outline"
                >
                  Receive Cash & Set Fee
                </Button>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={56} color={colors.success} />
              <Text style={styles.emptyTitle}>All Cash Collections Received!</Text>
              <Text style={styles.emptySub}>No pending merchant cash collections from drivers.</Text>
            </View>
          }
        />
      ) : (
        /* ========================================================================= */
        /* LAYOUT 2: TRANSPORT FEES DUE LIST (VENDOR -> DRIVER)                      */
        /* ========================================================================= */
        <FlatList
          data={driverFeeGroups}
          keyExtractor={item => item.driverId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />
          }
          ListHeaderComponent={
            <View style={[styles.tabHeaderBox, { borderColor: colors.secondary + '44' }]}>
              <Text style={[styles.tabHeaderTitle, { color: colors.secondary }]}>🚚 Transport Fees Due List</Text>
              <Text style={styles.tabHeaderSub}>
                List of unpaid transport fees with destination details. Settle & mark paid whenever you decide.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.driverFeeCard}>
              {/* Driver Summary Header */}
              <View style={styles.driverFeeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverFeeName}>{item.driverName}</Text>
                  <Text style={styles.driverFeeCount}>{item.trips.length} Due Trip{item.trips.length > 1 ? 's' : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.totalFeeLabel}>Total Due Fee:</Text>
                  <Text style={styles.totalFeeVal}>{formatCurrency(item.totalFee)}</Text>
                </View>
              </View>

              {/* Pay All Button */}
              <Button
                mode="contained"
                onPress={() => handlePayAllFeesForDriver(item)}
                loading={actionLoadingId === item.driverId}
                disabled={actionLoadingId !== null}
                style={styles.payAllBtn}
                buttonColor={colors.secondary}
                textColor="#0F0F1A"
                icon="cash-multiple"
              >
                Pay All Fees to {item.driverName} ({formatCurrency(item.totalFee)})
              </Button>

              <View style={styles.divider} />

              {/* Individual Trips with Destinations */}
              <Text style={styles.dueListTitle}>Trips Fee Breakdown:</Text>
              {item.trips.map((trip: any, idx: number) => {
                const destinations = getDestinationNames(trip);
                const feeVal = parseFloat(trip.transportFee || '0');
                const tripDateStr = new Date(trip.tripDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <View key={trip.id} style={styles.dueTripItem}>
                    <View style={styles.dueTripHeader}>
                      <Text style={styles.dueTripDate}>#{idx + 1} • {tripDateStr}</Text>
                      <Text style={styles.dueTripFeeVal}>{formatCurrency(feeVal)}</Text>
                    </View>

                    {/* DESTINATION NAME */}
                    <View style={styles.destinationRow}>
                      <Ionicons name="location-sharp" size={16} color={colors.secondary} />
                      <Text style={styles.destinationText} numberOfLines={2}>
                        {destinations}
                      </Text>
                    </View>

                    <Button
                      mode="outlined"
                      onPress={() => handleMarkFeePaid(trip)}
                      loading={actionLoadingId === trip.id}
                      disabled={actionLoadingId !== null}
                      style={styles.markPaidBtn}
                      textColor={colors.secondary}
                      compact
                    >
                      Mark Fee Paid ({formatCurrency(feeVal)})
                    </Button>
                  </View>
                );
              })}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={56} color={colors.secondary} />
              <Text style={styles.emptyTitle}>No Transport Fees Due!</Text>
              <Text style={styles.emptySub}>All driver transport fees are currently marked paid.</Text>
            </View>
          }
        />
      )}

      {/* CONFIRM CASH COLLECTION & SET TRANSPORT FEE MODAL */}
      <Modal
        visible={receiveModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReceiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Receive Cash Collection</Text>
            <Text style={styles.modalSubtitle}>
              Driver: {selectedTrip?.driver?.name || 'Driver'}
            </Text>

            {selectedTrip && (
              <View style={styles.modalDestBox}>
                <Ionicons name="navigate-circle" size={16} color={colors.primary} />
                <Text style={styles.modalDestText} numberOfLines={2}>
                  {getDestinationNames(selectedTrip)}
                </Text>
              </View>
            )}

            <TextInput
              label="Cash Collected Amount (₹)"
              value={collectedInput}
              onChangeText={setCollectedInput}
              mode="outlined"
              keyboardType="numeric"
              style={styles.modalInput}
            />

            <TextInput
              label="Enter Driver Transport Fee (₹)"
              value={feeInput}
              onChangeText={setFeeInput}
              mode="outlined"
              keyboardType="numeric"
              placeholder="e.g. 300"
              style={styles.modalInput}
            />

            <Text style={styles.modalHint}>
              💡 This fee will be placed in the Transport Fees Due list for you to pay anytime.
            </Text>

            <View style={styles.modalBtnRow}>
              <Button
                mode="contained"
                onPress={handleConfirmReceive}
                loading={submittingReceive}
                disabled={submittingReceive}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                Confirm Received
              </Button>
              <Button
                mode="outlined"
                onPress={() => setReceiveModalVisible(false)}
                disabled={submittingReceive}
                style={[styles.modalBtn, { marginLeft: 8 }]}
                textColor={colors.textPrimary}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Tabs
  tabsContainer: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, margin: 16, borderRadius: 10, padding: 4 },
  tabButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabButtonActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginLeft: 6 },
  tabTextActive: { color: colors.primary, fontWeight: 'bold' },
  tabTextActiveSecondary: { color: colors.secondary, fontWeight: 'bold' },

  list: { padding: 16, paddingTop: 0 },
  tabHeaderBox: { backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: colors.primary + '44' },
  tabHeaderTitle: { fontSize: 15, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  tabHeaderSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },

  // Card Styles (Collections)
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  driverName: { fontSize: 17, fontWeight: 'bold', color: colors.textPrimary },
  dateText: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },

  destinationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, padding: 10, borderRadius: 8, marginVertical: 10 },
  destinationText: { color: colors.textPrimary, fontSize: 13, fontWeight: '500', marginLeft: 8, flex: 1 },

  amountBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 },
  amountBannerLabel: { color: colors.textSecondary, fontSize: 13 },
  amountBannerVal: { color: colors.success, fontSize: 18, fontWeight: 'bold' },
  receiveBtn: { backgroundColor: colors.primary, borderRadius: 8 },

  // Transport Fee Due Card
  driverFeeCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  driverFeeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  driverFeeName: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  driverFeeCount: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  totalFeeLabel: { fontSize: 11, color: colors.textSecondary },
  totalFeeVal: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
  payAllBtn: { borderRadius: 8, marginBottom: 12 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  dueListTitle: { fontSize: 13, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  
  dueTripItem: { backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  dueTripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  dueTripDate: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 13 },
  dueTripFeeVal: { color: colors.secondary, fontWeight: 'bold', fontSize: 15 },
  markPaidBtn: { borderColor: colors.secondary, borderRadius: 6, marginTop: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: 'bold', marginTop: 12 },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 20 },
  modalCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  modalSubtitle: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 2, marginBottom: 12 },
  modalDestBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, padding: 8, borderRadius: 8, marginBottom: 16 },
  modalDestText: { color: colors.textSecondary, fontSize: 12, marginLeft: 6, flex: 1 },
  modalInput: { backgroundColor: colors.surfaceAlt, marginBottom: 12 },
  modalHint: { fontSize: 11, color: colors.textSecondary, marginBottom: 16, fontStyle: 'italic' },
  modalBtnRow: { flexDirection: 'row' },
  modalBtn: { flex: 1, borderRadius: 8 }
});
