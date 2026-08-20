import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Button, TextInput } from 'react-native-paper';
import { getTripStatusColor, getStopStatusColor } from '@/utils/statusHelpers';
import { formatCurrency } from '@/utils/formatCurrency';
import { api } from '@/services/api';

export default function VendorTripDetail() {
  const { id: tripId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  // State
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settleLoading, setSettleLoading] = useState(false);

  // Edit mode state (Bug 6)
  const [editMode, setEditMode] = useState(false);
  const [editCollected, setEditCollected] = useState('');
  const [editFee, setEditFee] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchTripDetails = async () => {
    try {
      const res = await api.get(`/trips/${tripId}`);
      if (res.data.success && res.data.data) {
        setTrip(res.data.data);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to fetch trip details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTripDetails();
    });
    return unsubscribe;
  }, [navigation, tripId]);

  // Enter edit mode — pre-fill current values
  const handleStartEdit = () => {
    setEditCollected(String(Number(trip.totalCollected || 0)));
    setEditFee(String(Number(trip.transportFee || 0)));
    setEditMode(true);
  };

  // Save edited values back to server
  const handleSaveEdit = async () => {
    const collected = parseFloat(editCollected);
    const fee = parseFloat(editFee);
    if (isNaN(collected) || collected < 0) {
      Alert.alert('Invalid', 'Please enter a valid total collected amount.');
      return;
    }
    if (isNaN(fee) || fee < 0) {
      Alert.alert('Invalid', 'Please enter a valid transport fee.');
      return;
    }
    setSaveLoading(true);
    try {
      await api.patch(`/trips/${tripId}`, {
        totalCollected: collected,
        transportFee: fee,
      });
      Alert.alert('Saved', 'Trip amounts updated successfully.');
      setEditMode(false);
      fetchTripDetails();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Settle Trip Handler — now settles the NET amount (collected - fee)
  const handleSettleTrip = async () => {
    const netAmount = Number(trip.totalCollected || 0) - Number(trip.transportFee || 0);
    Alert.alert(
      'Confirm Settlement',
      `Settle net amount of ${formatCurrency(netAmount)} with driver ${trip.driver?.name}?\n\n(Collected: ${formatCurrency(Number(trip.totalCollected || 0))} − Fee: ${formatCurrency(Number(trip.transportFee || 0))})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle Cash',
          onPress: async () => {
            setSettleLoading(true);
            try {
              await api.post('/settlements', {
                tripId: trip.id,
                amount: netAmount,
                notes: 'Settled from trip details screen'
              });
              Alert.alert('Success', 'Trip cash balance settled successfully!');
              fetchTripDetails();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to settle trip');
            } finally {
              setSettleLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ color: colors.textSecondary }}>Trip details not found.</Text>
      </SafeAreaView>
    );
  }

  const netAmount = Number(trip.totalCollected || 0) - Number(trip.transportFee || 0);
  const canEdit = trip.status === 'COMPLETED' && !trip.isSettled;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trip Detail Overview</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.summaryCard}>
            <Text style={styles.driverLabel}>Assigned Driver:</Text>
            <Text style={styles.driverName}>{trip.driver?.name || 'Driver'}</Text>
            <Text style={styles.driverEmail}>{trip.driver?.email}</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.row}>
              <Text style={styles.label}>Trip Status:</Text>
              <View style={[styles.badge, { backgroundColor: getTripStatusColor(trip.status) + '33' }]}>
                <Text style={[styles.badgeText, { color: getTripStatusColor(trip.status) }]}>{trip.status}</Text>
              </View>
            </View>

            {/* EDIT MODE — show editable inputs */}
            {editMode ? (
              <View style={styles.editContainer}>
                <Text style={styles.editTitle}>✏️ Edit Before Settling</Text>
                <TextInput
                  label="Total Collected (₹)"
                  value={editCollected}
                  onChangeText={setEditCollected}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.editInput}
                />
                <TextInput
                  label="Transport Fee (₹)"
                  value={editFee}
                  onChangeText={setEditFee}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.editInput}
                />
                {/* Live preview of net amount while editing */}
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Net Amount Preview:</Text>
                  <Text style={styles.previewValue}>
                    {formatCurrency(Math.max(0, parseFloat(editCollected || '0') - parseFloat(editFee || '0')))}
                  </Text>
                </View>
                <View style={styles.editBtnRow}>
                  <Button
                    mode="contained"
                    onPress={handleSaveEdit}
                    loading={saveLoading}
                    disabled={saveLoading}
                    style={[styles.editBtn, { backgroundColor: colors.secondary }]}
                  >
                    Save Changes
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setEditMode(false)}
                    disabled={saveLoading}
                    style={[styles.editBtn, { marginLeft: 8 }]}
                    textColor={colors.textPrimary}
                  >
                    Cancel
                  </Button>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Transport Fee:</Text>
                  <Text style={styles.value}>{formatCurrency(Number(trip.transportFee || 0))}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Total Collected:</Text>
                  <Text style={[styles.value, { color: colors.success, fontSize: 18 }]}>
                    {formatCurrency(Number(trip.totalCollected || 0))}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Final Amount (Net):</Text>
                  <Text style={[styles.value, { color: colors.secondary, fontSize: 18, fontWeight: 'bold' }]}>
                    {formatCurrency(netAmount)}
                  </Text>
                </View>

                {/* Edit button — only for unsettled completed trips */}
                {canEdit && (
                  <Button
                    mode="outlined"
                    onPress={handleStartEdit}
                    style={styles.editBeforeSettleBtn}
                    textColor={colors.warning}
                    icon="pencil"
                  >
                    Edit Amounts Before Settling
                  </Button>
                )}

                {/* Settle button */}
                {trip.status === 'COMPLETED' && !trip.isSettled && (
                  <Button 
                    mode="contained" 
                    style={styles.settleBtn}
                    onPress={handleSettleTrip}
                    loading={settleLoading}
                    disabled={settleLoading}
                  >
                    SETTLE NET AMOUNT ({formatCurrency(netAmount)})
                  </Button>
                )}
              </>
            )}

            {trip.isSettled && (
              <View style={styles.settledBadge}>
                <Text style={styles.settledBadgeText}>✅ CASH SETTLED WITH DRIVER</Text>
              </View>
            )}
          </View>

          <Text style={styles.timelineTitle}>Route Timeline</Text>
          {trip.stops && trip.stops.map((stop: any, idx: number) => (
            <View key={stop.id} style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <Text style={styles.merchantName}>{idx + 1}. {stop.merchant?.name || 'Stop'}</Text>
                <View style={[styles.badge, { backgroundColor: getStopStatusColor(stop.status) + '33' }]}>
                  <Text style={[styles.badgeText, { color: getStopStatusColor(stop.status) }]}>{stop.status}</Text>
                </View>
              </View>
              
              <Text style={styles.boxText}>Address: {stop.merchant?.address || 'Manual Entry'}</Text>
              
              {stop.boxes && stop.boxes.length > 0 && (
                <View style={styles.boxesList}>
                  {stop.boxes.map((box: any, bIdx: number) => (
                    <Text key={bIdx} style={styles.boxItem}>
                      • {box.quantity}x {box.boxType?.name || 'Box'}
                    </Text>
                  ))}
                </View>
              )}

              {stop.status === 'COLLECTED' && (
                <Text style={styles.collectedText}>Collected: {formatCurrency(Number(stop.collectedAmount || 0))}</Text>
              )}
              
              {stop.status === 'SKIPPED' && (
                <Text style={styles.skippedText}>Skipped: {stop.skipReason || 'No reason'}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  backBtn: { color: colors.primary, fontSize: 16, fontWeight: 'bold', marginRight: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  scroll: { padding: 16 },
  summaryCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  driverLabel: { color: colors.textSecondary, fontSize: 12 },
  driverName: { fontSize: 18, color: colors.textPrimary, fontWeight: 'bold', marginTop: 2 },
  driverEmail: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { color: colors.textSecondary, fontSize: 14 },
  value: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },

  // Edit mode styles
  editContainer: { marginTop: 8, padding: 12, backgroundColor: colors.surfaceAlt, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: colors.warning },
  editTitle: { fontSize: 14, fontWeight: 'bold', color: colors.warning, marginBottom: 12 },
  editInput: { backgroundColor: colors.surface, marginBottom: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginBottom: 12, borderTopWidth: 1, borderTopColor: colors.border },
  previewLabel: { color: colors.textSecondary, fontSize: 13 },
  previewValue: { fontSize: 16, fontWeight: 'bold', color: colors.secondary },
  editBtnRow: { flexDirection: 'row' },
  editBtn: { flex: 1, borderRadius: 8 },
  editBeforeSettleBtn: { borderColor: colors.warning, borderWidth: 1, borderRadius: 8, marginTop: 4, marginBottom: 8 },

  settleBtn: { backgroundColor: colors.secondary, borderRadius: 8, marginTop: 8 },
  settledBadge: { backgroundColor: colors.success + '22', borderRadius: 8, padding: 12, marginTop: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.success },
  settledBadgeText: { color: colors.success, fontWeight: 'bold', fontSize: 13 },
  
  timelineTitle: { fontSize: 18, color: colors.textPrimary, fontWeight: 'bold', marginBottom: 16 },
  stopCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  stopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  merchantName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  boxText: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
  boxesList: { marginBottom: 8 },
  boxItem: { color: colors.textSecondary, fontSize: 13 },
  collectedText: { color: colors.success, fontWeight: 'bold', fontSize: 14, marginTop: 4 },
  skippedText: { color: colors.error, fontStyle: 'italic', fontSize: 13, marginTop: 4 }
});
