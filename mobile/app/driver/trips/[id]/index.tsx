import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Button, TextInput } from 'react-native-paper';
import { getStopStatusColor } from '@/utils/statusHelpers';
import { api } from '@/services/api';

export default function TripOverview() {
  const { id: tripId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  // State
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [transportFee, setTransportFee] = useState('');

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

  // Start Trip Handler
  const handleStartTrip = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/trips/${tripId}/start`);
      Alert.alert('Started', 'Trip status updated to IN_PROGRESS.');
      fetchTripDetails();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Trip Handler
  const handleCompleteTrip = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/trips/${tripId}/complete`);
      Alert.alert('Success', 'Trip successfully completed!');
      fetchTripDetails();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to complete trip');
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

  if (!trip) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ color: colors.textSecondary }}>Trip not found.</Text>
      </SafeAreaView>
    );
  }

  // Check if all stops are processed (either COLLECTED or SKIPPED)
  const allStopsProcessed = trip.stops && trip.stops.length > 0 && trip.stops.every((stop: any) => 
    stop.status === 'COLLECTED' || stop.status === 'SKIPPED'
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trip Route Overview</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Trip Date: {new Date(trip.tripDate).toDateString()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStopStatusColor(trip.status) + '33' }]}>
              <Text style={{ color: getStopStatusColor(trip.status), fontSize: 10, fontWeight: 'bold' }}>{trip.status}</Text>
            </View>
          </View>
          
          {trip.notes ? <Text style={styles.notesText}>Notes: {trip.notes}</Text> : null}

          {trip.status === 'ASSIGNED' && (
            <Button 
              mode="contained" 
              style={styles.actionBtn} 
              onPress={handleStartTrip}
              loading={actionLoading}
              disabled={actionLoading}
            >
              START TRIP
            </Button>
          )}

          {/* DRIVER COMPLETES TRIP */}
          {trip.status !== 'COMPLETED' && trip.status !== 'SETTLED' && allStopsProcessed && (
            <View style={styles.completionContainer}>
              <Text style={styles.completeHeader}>Complete Delivery Route</Text>
              <Button 
                mode="contained" 
                style={styles.completeBtn}
                onPress={handleCompleteTrip}
                loading={actionLoading}
                disabled={actionLoading}
              >
                SUBMIT & COMPLETE TRIP
              </Button>
            </View>
          )}

          {/* DISPLAY TRANSPORT FEE AND COLLECTED AMOUNT IF COMPLETED */}
          {(trip.status === 'COMPLETED' || trip.status === 'SETTLED') && (
            <>
              <View style={styles.feeLabelRow}>
                <Text style={styles.feeLabel}>Total Cash Collected:</Text>
                <Text style={[styles.feeValue, { color: colors.success }]}>₹{trip.totalCollected || 0}</Text>
              </View>
              <View style={styles.feeLabelRow}>
                <Text style={styles.feeLabel}>Transport Fee:</Text>
                <Text style={[styles.feeValue, { color: colors.secondary }]}>₹{trip.transportFee || 0}</Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.timelineTitle}>Timeline / Stops</Text>
        {trip.stops && trip.stops.map((stop: any, idx: number) => (
          <TouchableOpacity 
            key={stop.id} 
            style={styles.stopCard} 
            onPress={() => router.push(`/driver/trips/${trip.id}/stop/${stop.id}` as any)}
          >
            <View style={styles.stopLeft}>
              <View style={[styles.stopNumber, (stop.status === 'COLLECTED' || stop.status === 'SKIPPED') && styles.stopNumberCompleted]}>
                <Text style={styles.stopNumberText}>{idx + 1}</Text>
              </View>
              {idx < trip.stops.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.stopContent}>
              <View style={styles.stopContentHeader}>
                <Text style={styles.merchantName}>{stop.merchant?.name || 'Stop'}</Text>
                <View style={[styles.badge, { backgroundColor: getStopStatusColor(stop.status) + '22' }]}>
                  <Text style={[styles.badgeText, { color: getStopStatusColor(stop.status) }]}>{stop.status}</Text>
                </View>
              </View>
              <Text style={styles.boxText}>Address: {stop.merchant?.address || 'No Address'}</Text>
              <Text style={styles.collectedText}>
                {stop.status === 'COLLECTED' ? `Collected: ₹${stop.collectedAmount}` : 'Collection pending'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryTitle: { fontSize: 18, color: colors.textPrimary, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  notesText: { color: colors.textSecondary, marginBottom: 16, fontSize: 14 },
  actionBtn: { backgroundColor: colors.primary, borderRadius: 8, marginTop: 8 },
  
  // Timeline Styles
  timelineTitle: { fontSize: 18, color: colors.textPrimary, fontWeight: 'bold', marginBottom: 16 },
  stopCard: { flexDirection: 'row', marginBottom: 8 },
  stopLeft: { alignItems: 'center', marginRight: 12 },
  stopNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  stopNumberCompleted: { backgroundColor: colors.primary + '33', borderColor: colors.primary },
  stopNumberText: { color: colors.textPrimary, fontWeight: 'bold' },
  line: { width: 2, height: 75, backgroundColor: colors.border, marginTop: 4 },
  stopContent: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, minHeight: 90 },
  stopContentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  merchantName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  boxText: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  collectedText: { color: colors.secondary, fontSize: 13, fontWeight: 'bold' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },

  // Completion Form
  completionContainer: { marginTop: 16, padding: 12, backgroundColor: colors.surfaceAlt, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: colors.secondary },
  completeHeader: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
  feeInput: { backgroundColor: colors.surface, marginBottom: 12 },
  completeBtn: { backgroundColor: colors.secondary, borderRadius: 8 },
  
  feeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  feeLabel: { color: colors.textSecondary, fontSize: 14 },
  feeValue: { color: colors.secondary, fontSize: 16, fontWeight: 'bold' }
});
