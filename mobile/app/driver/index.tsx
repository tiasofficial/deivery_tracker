import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import colors from '../../constants/colors';
import { Button, IconButton } from 'react-native-paper';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { getStopStatusColor } from '@/utils/statusHelpers';

export default function DriverDashboard() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();
  const navigation = useNavigation();

  // State
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignedTrips = async () => {
    try {
      const res = await api.get('/trips');
      if (res.data.success && res.data.data) {
        const rawTrips = res.data.data;
        setAllTrips(rawTrips);

        // Active trips are those not yet SETTLED
        const active = rawTrips.filter((t: any) => 
          t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || (t.status === 'COMPLETED' && !t.isSettled)
        );
        setActiveTrips(active);
      }
    } catch (error) {
      console.error('Failed to load driver trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignedTrips();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAssignedTrips();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignedTrips();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const pendingCount = activeTrips.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;
  const settledCount = allTrips.filter(t => t.status === 'SETTLED' || t.isSettled).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name}</Text>
            <Text style={styles.date}>{new Date().toDateString()}</Text>
          </View>
          <IconButton 
            icon="logout" 
            iconColor={colors.error} 
            size={24} 
            onPress={handleLogout} 
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Trips</Text>
            <Text style={[styles.statValue, { color: pendingCount > 0 ? colors.warning : colors.textPrimary }]}>
              {pendingCount}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Trips</Text>
            <Text style={styles.statValue}>{allTrips.length}</Text>
          </View>
        </View>

        <Button
          mode="contained"
          icon="truck-fast"
          style={styles.requestBtn}
          buttonColor={colors.secondary}
          onPress={() => router.push('/driver/request-pickup' as any)}
        >
          REQUEST AD-HOC PICKUP
        </Button>

        <Text style={styles.sectionTitle}>Assigned Trips</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : activeTrips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={54} color={colors.success} />
            <Text style={styles.emptyTitle}>
              {allTrips.length > 0 ? 'All Trips Completed & Settled!' : 'No Active Trips'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {allTrips.length > 0 
                ? `You have ${allTrips.length} finished delivery route(s). You can view all breakdown details in History.`
                : 'No delivery routes are currently assigned to you by your vendor.'}
            </Text>
            {allTrips.length > 0 && (
              <Button
                mode="outlined"
                icon="time-outline"
                style={styles.historyBtn}
                textColor={colors.primary}
                onPress={() => router.push('/driver/history' as any)}
              >
                View Trip History ({allTrips.length})
              </Button>
            )}
          </View>
        ) : (
          activeTrips.map((trip) => (
            <TouchableOpacity 
              key={trip.id}
              style={styles.tripCard} 
              onPress={() => router.push({ pathname: `/driver/trips/[id]`, params: { id: trip.id } })}
            >
              <View style={styles.tripHeader}>
                <Text style={styles.tripId}>Trip on {new Date(trip.tripDate).toLocaleDateString()}</Text>
                <View style={[styles.badge, { backgroundColor: getStopStatusColor(trip.status) + '22' }]}>
                  <Text style={[styles.badgeText, { color: getStopStatusColor(trip.status) }]}>{trip.status}</Text>
                </View>
              </View>
              <View style={styles.routeContainer}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={styles.routeText}>{trip.stops?.length || 0} Delivery Stops</Text>
              </View>
              <Button 
                mode="contained" 
                style={styles.actionBtn} 
                onPress={() => router.push({ pathname: `/driver/trips/[id]`, params: { id: trip.id } })}
              >
                View Route
              </Button>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  date: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginHorizontal: 4, borderWidth: 1, borderColor: colors.border },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
  tripCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripId: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  routeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routeText: { color: colors.textSecondary, marginLeft: 8 },
  actionBtn: { backgroundColor: colors.primary, borderRadius: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: 'bold', marginTop: 12, textAlign: 'center' },
  emptySubtitle: { color: colors.textSecondary, marginTop: 6, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  historyBtn: { marginTop: 16, borderColor: colors.primary },
  requestBtn: { marginBottom: 24, borderRadius: 8 }
});
