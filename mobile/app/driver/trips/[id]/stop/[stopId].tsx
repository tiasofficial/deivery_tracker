import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/formatCurrency';
import { api } from '@/services/api';
import { parseStopFinancials } from '@/components/common/TripLedgerTable';

export default function StopDetail() {
  const { id: tripId, stopId } = useLocalSearchParams();
  const router = useRouter();

  const rawTripId = Array.isArray(tripId) ? tripId[0] : tripId;
  const rawStopId = Array.isArray(stopId) ? stopId[0] : stopId;

  const [stop, setStop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Form
  const [paymentMode, setPaymentMode] = useState<'PAID' | 'DELAYED'>('PAID');
  const [totalBillAmount, setTotalBillAmount] = useState('');
  const [collectionAmount, setCollectionAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showSkipInput, setShowSkipInput] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  const fetchStopDetails = async () => {
    if (!rawTripId || !rawStopId) return;
    try {
      const res = await api.get(`/trips/${rawTripId}`);
      const trip = res.data?.data;
      const currentStop = trip?.stops?.find((s: any) => String(s.id).trim() === String(rawStopId).trim());
      if (currentStop) {
        setStop(currentStop);
        const fin = parseStopFinancials(currentStop);

        setTotalBillAmount(fin.totalBill > 0 ? String(fin.totalBill) : '');
        setCollectionAmount(fin.collected > 0 ? String(fin.collected) : fin.isDelayed ? '0' : '');
        setRemarks(fin.cleanRemarks || '');

        if (fin.isDelayed) {
          setPaymentMode('DELAYED');
        } else {
          setPaymentMode('PAID');
        }
      } else {
        Alert.alert('Notice', 'Stop information not found in this trip.');
      }
    } catch (error: any) {
      console.error('Failed to load stop details:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load stop details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStopDetails();
  }, [rawTripId, rawStopId]);

  // Live computed amounts
  const billNum = parseFloat(totalBillAmount || '0') || 0;
  const collectedNum = parseFloat(collectionAmount || '0') || 0;
  const computedDue = Math.max(0, billNum - collectedNum);

  // Single Action: Complete & Save Stop
  const handleSaveAndComplete = async () => {
    const bill = parseFloat(totalBillAmount || '0') || 0;
    const collected = parseFloat(collectionAmount || '0') || 0;
    const due = Math.max(0, bill - collected);

    if (paymentMode === 'PAID' && bill <= 0 && collected <= 0) {
      Alert.alert('Required', 'Please enter the total bill and collected cash amount.');
      return;
    }

    if (!rawTripId || !rawStopId) return;
    setActionLoading(true);
    try {
      let finalRemarks = remarks.trim();
      if (paymentMode === 'DELAYED' && !finalRemarks) {
        finalRemarks = 'Delayed / Carry forward to next trip';
      }

      // Encode structured billing financials into skipReason for lossless persistence
      const fullReason = `[Bill: ${bill} | Due: ${due}] ${finalRemarks}`.trim();

      await api.post(`/trips/${rawTripId}/stops/${rawStopId}/collect`, {
        amount: collected,
        remarks: fullReason,
      });

      Alert.alert(
        'Success',
        paymentMode === 'DELAYED' || due > 0
          ? `Stop saved! Collected: ${formatCurrency(collected)}, Carry Forward Due: ${formatCurrency(due)}`
          : 'Stop completed and cash collected!'
      );
      router.replace({ pathname: `/driver/trips/[id]`, params: { id: rawTripId as string } });
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to complete stop');
    } finally {
      setActionLoading(false);
    }
  };

  // Skip Stop
  const handleSkip = async () => {
    if (!skipReason.trim()) {
      Alert.alert('Required', 'Please enter a reason for skipping this stop.');
      return;
    }
    if (!rawTripId || !rawStopId) return;
    setActionLoading(true);
    try {
      await api.patch(`/trips/${rawTripId}/stops/${rawStopId}/skip`, {
        reason: skipReason,
      });
      Alert.alert('Skipped', 'Stop has been skipped.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to skip stop');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!stop) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ color: colors.textSecondary }}>Stop details not found.</Text>
      </SafeAreaView>
    );
  }

  const fin = parseStopFinancials(stop);
  const isCompleted = stop.status === 'COLLECTED';
  const isDelayed = fin.isDelayed;
  const isSkipped = stop.status === 'SKIPPED';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Stop #{stop.stopOrder || 1}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* CUSTOMER CARD */}
        <View style={styles.card}>
          <View style={styles.merchantHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.merchantName}>{stop.merchant?.name || 'Customer'}</Text>
              <Text style={styles.address}>{stop.merchant?.address || 'No address provided'}</Text>
            </View>
            {stop.merchant?.phone ? (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => Linking.openURL(`tel:${stop.merchant.phone}`)}
              >
                <Text style={styles.callButtonText}>📞 Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* BOX DELIVERIES CHECKLIST */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📦 Items to Deliver</Text>
          {stop.boxes && stop.boxes.length > 0 ? (
            stop.boxes.map((boxItem: any, idx: number) => (
              <View key={idx} style={styles.boxRow}>
                <Text style={styles.boxQuantityBadge}>{boxItem.quantity} pcs</Text>
                <Text style={styles.boxName}>{boxItem.boxType?.name || 'Box'}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textSecondary }}>No boxes mapped to this stop.</Text>
          )}
        </View>

        {/* COMPLETED STATUS SUMMARY (If already saved and not in edit mode) */}
        {isCompleted && !isEditing ? (
          <View style={[styles.card, styles.completedCard]}>
            <View style={styles.completedHeader}>
              <Text style={styles.completedTitle}>
                {isDelayed ? '⏳ Payment Marked as Carry Forward' : '✅ Stop Completed & Paid'}
              </Text>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtnSmall}>
                <Text style={styles.editBtnSmallText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Bill Amount:</Text>
              <Text style={styles.summaryVal}>{formatCurrency(fin.totalBill)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cash Collected:</Text>
              <Text style={[styles.summaryVal, { color: colors.success }]}>
                {formatCurrency(fin.collected)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Due / Carry Forward:</Text>
              <Text
                style={[
                  styles.summaryVal,
                  { color: fin.due > 0 ? colors.warning : colors.textSecondary },
                ]}
              >
                {formatCurrency(fin.due)}
              </Text>
            </View>

            {fin.cleanRemarks ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remarks / Notes:</Text>
                <Text style={styles.summaryVal}>{fin.cleanRemarks}</Text>
              </View>
            ) : null}

            <Button
              mode="outlined"
              onPress={() => setIsEditing(true)}
              style={styles.editFullBtn}
              textColor={colors.primary}
            >
              Update Payment / Remarks
            </Button>
          </View>
        ) : isSkipped ? (
          <View style={styles.skippedBox}>
            <Text style={styles.skippedText}>Stop Skipped</Text>
            {stop.skipReason && <Text style={styles.reasonText}>Reason: {stop.skipReason}</Text>}
            <Button
              mode="contained"
              onPress={() => setIsEditing(true)}
              style={[styles.actionBtn, { marginTop: 12 }]}
            >
              Reopen & Complete Stop
            </Button>
          </View>
        ) : (
          /* SINGLE 1-ACTION FORM FOR DRIVER */
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>💰 Collection & Payment</Text>

            {/* PAYMENT MODE TOGGLE */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, paymentMode === 'PAID' && styles.toggleBtnActiveGreen]}
                onPress={() => {
                  setPaymentMode('PAID');
                  if (billNum > 0 && (collectedNum === 0 || !collectionAmount)) {
                    setCollectionAmount(String(billNum));
                  }
                }}
              >
                <Text style={[styles.toggleBtnText, paymentMode === 'PAID' && styles.toggleBtnTextActive]}>
                  ✓ Paid Cash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, paymentMode === 'DELAYED' && styles.toggleBtnActiveOrange]}
                onPress={() => {
                  setPaymentMode('DELAYED');
                  if (collectedNum === billNum && billNum > 0) {
                    setCollectionAmount('0');
                  }
                  if (!remarks) setRemarks('Delayed / Carry forward to next trip');
                }}
              >
                <Text style={[styles.toggleBtnText, paymentMode === 'DELAYED' && styles.toggleBtnTextActive]}>
                  ⏳ Carry Forward / Due
                </Text>
              </TouchableOpacity>
            </View>

            {/* TOTAL BILL & COLLECTED CASH INPUTS */}
            <TextInput
              label="Total Bill / Expected Amount (₹)"
              value={totalBillAmount}
              onChangeText={text => {
                setTotalBillAmount(text);
                if (paymentMode === 'PAID' && (!collectionAmount || collectionAmount === totalBillAmount)) {
                  setCollectionAmount(text);
                }
              }}
              keyboardType="numeric"
              mode="outlined"
              placeholder="e.g. 5000"
              style={styles.input}
            />

            <TextInput
              label={paymentMode === 'DELAYED' ? 'Amount Paid Now (₹) - Enter 0 if unpaid' : 'Cash Amount Collected (₹)'}
              value={collectionAmount}
              onChangeText={setCollectionAmount}
              keyboardType="numeric"
              mode="outlined"
              placeholder={paymentMode === 'DELAYED' ? '0' : 'e.g. 5000'}
              style={styles.input}
            />

            {/* DUE CALCULATION BANNER */}
            <View style={styles.dueCalculationBanner}>
              <View style={styles.dueCalculationRow}>
                <Text style={styles.dueCalculationLabel}>Due / Carry Forward:</Text>
                <Text
                  style={[
                    styles.dueCalculationValue,
                    computedDue > 0 ? { color: colors.warning } : { color: colors.success },
                  ]}
                >
                  {formatCurrency(computedDue)}
                </Text>
              </View>
              <Text style={styles.dueCalculationFormula}>
                Total ({formatCurrency(billNum)}) − Collected ({formatCurrency(collectedNum)}) = Due ({formatCurrency(computedDue)})
              </Text>
            </View>

            {/* REMARKS INPUT */}
            <TextInput
              label="Remarks / Notes (Optional)"
              value={remarks}
              onChangeText={setRemarks}
              mode="outlined"
              placeholder={paymentMode === 'DELAYED' ? 'e.g. Will pay next Monday' : 'e.g. Received via cash'}
              style={styles.input}
            />

            {/* 1-TAP SAVE & COMPLETE BUTTON */}
            <Button
              mode="contained"
              onPress={handleSaveAndComplete}
              loading={actionLoading}
              disabled={actionLoading}
              style={[
                styles.actionBtn,
                paymentMode === 'DELAYED' ? { backgroundColor: colors.warning } : { backgroundColor: colors.primary },
              ]}
              contentStyle={{ height: 50 }}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              {paymentMode === 'DELAYED' ? '✓ SAVE & MARK CARRY FORWARD' : '✓ SAVE & COMPLETE STOP'}
            </Button>

            {isEditing && (
              <Button
                mode="text"
                onPress={() => setIsEditing(false)}
                textColor={colors.textSecondary}
                style={{ marginTop: 8 }}
              >
                Cancel Edit
              </Button>
            )}
          </View>
        )}

        {/* SKIP STOP OPTION */}
        {!isCompleted && !isSkipped && (
          <View style={{ marginTop: 4, marginBottom: 24 }}>
            {showSkipInput ? (
              <View style={styles.card}>
                <TextInput
                  label="Reason for Skipping Stop"
                  value={skipReason}
                  onChangeText={setSkipReason}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g. Shop was closed"
                />
                <View style={styles.row}>
                  <Button
                    mode="contained"
                    onPress={handleSkip}
                    loading={actionLoading}
                    style={[styles.smallBtn, { backgroundColor: colors.error }]}
                  >
                    Confirm Skip
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setShowSkipInput(false)}
                    style={[styles.smallBtn, { marginLeft: 12 }]}
                    textColor={colors.textPrimary}
                  >
                    Cancel
                  </Button>
                </View>
              </View>
            ) : (
              <Button
                mode="outlined"
                onPress={() => setShowSkipInput(true)}
                style={styles.skipBtn}
                textColor={colors.error}
              >
                Skip This Stop
              </Button>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 16 },
  backText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  scroll: { padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  merchantHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  merchantName: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  address: { color: colors.textSecondary, fontSize: 13 },
  callButton: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  callButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },

  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '55',
  },
  boxQuantityBadge: {
    backgroundColor: colors.primary + '22',
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 12,
  },
  boxName: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },

  toggleContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActiveGreen: { backgroundColor: colors.success + '22', borderColor: colors.success },
  toggleBtnActiveOrange: { backgroundColor: colors.warning + '22', borderColor: colors.warning },
  toggleBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  toggleBtnTextActive: { color: colors.textPrimary, fontWeight: 'bold' },

  input: { backgroundColor: colors.surfaceAlt, marginBottom: 12 },
  actionBtn: { borderRadius: 10, marginTop: 6 },

  dueCalculationBanner: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dueCalculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueCalculationLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  dueCalculationValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  dueCalculationFormula: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },

  completedCard: { borderColor: colors.success + '88', backgroundColor: colors.surface },
  completedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  completedTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary },
  editBtnSmall: { padding: 4 },
  editBtnSmallText: { color: colors.secondary, fontWeight: 'bold', fontSize: 13 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryVal: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 14 },
  editFullBtn: { marginTop: 12, borderColor: colors.primary },

  skipBtn: { borderColor: colors.error, borderWidth: 1, borderRadius: 8 },
  skippedBox: {
    backgroundColor: colors.error + '22',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    marginBottom: 16,
  },
  skippedText: { color: colors.error, fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  reasonText: { color: colors.textSecondary, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  smallBtn: { flex: 1, borderRadius: 8 },
});
