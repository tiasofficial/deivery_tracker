import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, TextInput } from 'react-native-paper';
import { formatCurrency } from '@/utils/formatCurrency';
import { api } from '@/services/api';

export default function StopDetail() {
  const { id: tripId, stopId } = useLocalSearchParams();
  const router = useRouter();

  const rawTripId = Array.isArray(tripId) ? tripId[0] : tripId;
  const rawStopId = Array.isArray(stopId) ? stopId[0] : stopId;
  
  const [stop, setStop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [showSkipInput, setShowSkipInput] = useState(false);

  const fetchStopDetails = async () => {
    if (!rawTripId || !rawStopId) return;
    try {
      const res = await api.get(`/trips/${rawTripId}`);
      const trip = res.data?.data;
      const currentStop = trip?.stops?.find((s: any) => String(s.id).trim() === String(rawStopId).trim());
      if (currentStop) {
        setStop(currentStop);
        setCollectionAmount(currentStop.collectedAmount ? String(currentStop.collectedAmount) : '');
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

  // Arrive Stop
  const handleArrive = async () => {
    if (!rawTripId || !rawStopId) return;
    setActionLoading(true);
    try {
      await api.patch(`/trips/${rawTripId}/stops/${rawStopId}/arrive`);
      Alert.alert('Arrived', 'You have arrived at the stop location.');
      fetchStopDetails();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Deliver Stop
  const handleDeliver = async () => {
    if (!rawTripId || !rawStopId) return;
    setActionLoading(true);
    try {
      await api.patch(`/trips/${rawTripId}/stops/${rawStopId}/deliver`);
      Alert.alert('Delivered', 'Deliveries marked as complete.');
      fetchStopDetails();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Collect Cash & Complete
  const handleCollect = async () => {
    if (!collectionAmount) {
      Alert.alert('Required', 'Please enter the collected cash amount.');
      return;
    }
    if (!rawTripId || !rawStopId) return;
    setActionLoading(true);
    try {
      await api.post(`/trips/${rawTripId}/stops/${rawStopId}/collect`, {
        amount: parseFloat(collectionAmount)
      });
      router.replace({ pathname: `/driver/trips/[id]`, params: { id: rawTripId as string } });
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit collection');
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
        reason: skipReason
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Stop Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* MERCHANT CARD */}
        <View style={styles.card}>
          <Text style={styles.merchantName}>{stop.merchant?.name || 'Unknown Merchant'}</Text>
          <Text style={styles.address}>{stop.merchant?.address || 'No address provided'}</Text>
          {stop.merchant?.phone && (
            <Text style={styles.phone}>Phone: {stop.merchant.phone}</Text>
          )}
        </View>

        {/* BOX DELIVERIES CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Deliveries</Text>
          {stop.boxes && stop.boxes.length > 0 ? (
            stop.boxes.map((boxItem: any, idx: number) => (
              <Text key={idx} style={styles.boxItem}>
                • {boxItem.quantity}x {boxItem.boxType?.name || 'Box Item'}
              </Text>
            ))
          ) : (
            <Text style={{ color: colors.textSecondary }}>No boxes mapped to this stop.</Text>
          )}
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <Text style={styles.statusLabel}>Current Status: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{stop.status}</Text></Text>

          {stop.status === 'PENDING' && (
            <Button 
              mode="contained" 
              onPress={handleArrive} 
              loading={actionLoading}
              disabled={actionLoading}
              style={styles.actionBtn}
            >
              Mark Arrived
            </Button>
          )}
          
          {stop.status === 'ARRIVED' && (
            <Button 
              mode="contained" 
              onPress={handleDeliver} 
              loading={actionLoading}
              disabled={actionLoading}
              style={styles.actionBtn}
            >
              Mark Delivered
            </Button>
          )}
          
          {stop.status === 'DELIVERED' && (
            <>
              <TextInput 
                label="Collection Amount (₹)" 
                value={collectionAmount} 
                onChangeText={setCollectionAmount} 
                keyboardType="numeric" 
                mode="outlined" 
                style={styles.input} 
              />
              <Button 
                mode="contained" 
                onPress={handleCollect} 
                loading={actionLoading}
                disabled={actionLoading}
                style={styles.actionBtn}
              >
                Submit Collection
              </Button>
            </>
          )}
          
          {stop.status === 'COLLECTED' && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Stop Completed Successfully!</Text>
              <Text style={styles.collectedText}>Collected: {formatCurrency(parseFloat(stop.collectedAmount || '0'))}</Text>
            </View>
          )}

          {stop.status === 'SKIPPED' && (
            <View style={styles.skippedBox}>
              <Text style={styles.skippedText}>Stop Skipped</Text>
              {stop.skipReason && <Text style={styles.reasonText}>Reason: {stop.skipReason}</Text>}
            </View>
          )}

          {/* SKIP STOP INTERACTION */}
          {stop.status !== 'COLLECTED' && stop.status !== 'SKIPPED' && (
            <View style={{ marginTop: 12 }}>
              {showSkipInput ? (
                <>
                  <TextInput
                    label="Reason for Skipping"
                    value={skipReason}
                    onChangeText={setSkipReason}
                    mode="outlined"
                    style={styles.input}
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
                </>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16 },
  backText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  scroll: { padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  merchantName: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  address: { color: colors.textSecondary, marginBottom: 4 },
  phone: { color: colors.primary, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  boxItem: { color: colors.textSecondary, marginBottom: 6, fontSize: 14 },
  actions: { marginTop: 8 },
  statusLabel: { color: colors.textSecondary, marginBottom: 16, fontSize: 15 },
  actionBtn: { backgroundColor: colors.primary, marginBottom: 16, paddingVertical: 6, borderRadius: 8 },
  input: { backgroundColor: colors.surfaceAlt, marginBottom: 16 },
  skipBtn: { borderColor: colors.error, borderWidth: 1, borderRadius: 8 },
  successBox: { backgroundColor: colors.success + '22', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.success },
  successText: { color: colors.success, fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  collectedText: { color: colors.textPrimary, fontSize: 14 },
  skippedBox: { backgroundColor: colors.error + '22', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.error },
  skippedText: { color: colors.error, fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  reasonText: { color: colors.textSecondary, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  smallBtn: { flex: 1, borderRadius: 8 }
});
