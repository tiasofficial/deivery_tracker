import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import colors from '../../constants/colors';
import { Button, IconButton } from 'react-native-paper';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';

export default function VendorDashboard() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();
  const navigation = useNavigation();

  // Summary Metrics State
  const [metrics, setMetrics] = useState({
    totalTrips: 0,
    totalCollection: 0,
    activeDrivers: 0,
    unsettledBalance: 0
  });
  const [pendingPickupCount, setPendingPickupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Analytics Summary
      const res = await api.get('/analytics/summary?period=today');
      if (res.data.success && res.data.data) {
        setMetrics(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary metrics:', error);
    }

    try {
      // 2. Fetch Pending Pickup Requests for live notification
      const pickupRes = await api.get('/pickup-requests');
      if (pickupRes.data.success && pickupRes.data.data) {
        const pending = pickupRes.data.data.filter((r: any) => r.status === 'PENDING');
        setPendingPickupCount(pending.length);
      }
    } catch (error) {
      console.error('Failed to fetch pickup requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });

    // Real-time polling every 8 seconds for incoming driver pickup requests
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

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
            <Text style={styles.greeting}>Hello, {user?.name || 'Vendor'}</Text>
            <Text style={styles.date}>{new Date().toDateString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              style={styles.bellButton}
              onPress={() => router.push('/vendor/pickup-requests' as any)}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
              {pendingPickupCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{pendingPickupCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <IconButton 
              icon="logout" 
              iconColor={colors.error} 
              size={24} 
              onPress={handleLogout} 
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* 🚨 LIVE NOTIFICATION BANNER FOR AD-HOC PICKUPS */}
            {pendingPickupCount > 0 && (
              <TouchableOpacity 
                style={styles.notificationBanner}
                onPress={() => router.push('/vendor/pickup-requests' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.notificationIconBox}>
                  <Ionicons name="alert-circle" size={26} color="#FFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.notificationTitle}>
                    🔔 {pendingPickupCount} Ad-Hoc Pickup Request{pendingPickupCount > 1 ? 's' : ''}!
                  </Text>
                  <Text style={styles.notificationSub}>
                    Driver has requested parcel pickups. Tap to approve and create trips.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.warning} />
              </TouchableOpacity>
            )}

            {/* METRICS ROW 1 */}
            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push('/vendor/trips')}
              >
                <Text style={styles.statLabel}>Today's Trips</Text>
                <Text style={styles.statValue}>{metrics.totalTrips}</Text>
              </TouchableOpacity>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Today's Collection</Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {formatCurrency(metrics.totalCollection)}
                </Text>
              </View>
            </View>

            {/* METRICS ROW 2 */}
            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push('/vendor/drivers')}
              >
                <Text style={styles.statLabel}>Active Drivers</Text>
                <Text style={styles.statValue}>{metrics.activeDrivers}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push('/vendor/settlements')}
              >
                <Text style={styles.statLabel}>Unsettled Balance</Text>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {formatCurrency(metrics.unsettledBalance)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtonsRow}>
              <Button 
                mode="contained" 
                onPress={() => router.push('/vendor/trips/create')}
                style={[styles.actionBtn, { flex: 1, marginRight: 8 }]}
                contentStyle={styles.btnContent}
                icon="plus"
              >
                Create Trip
              </Button>

              <Button 
                mode="outlined" 
                onPress={() => router.push('/vendor/drivers')}
                style={[styles.actionBtnOutline, { flex: 1, marginLeft: 8 }]}
                contentStyle={styles.btnContent}
                textColor={colors.secondary}
                icon="account-group"
              >
                Manage Drivers
              </Button>
            </View>

            <Button 
              mode="contained" 
              buttonColor={pendingPickupCount > 0 ? colors.warning : colors.secondary}
              textColor="#0F0F1A"
              onPress={() => router.push('/vendor/pickup-requests' as any)}
              style={[styles.actionBtn, { marginTop: 16 }]}
              contentStyle={styles.btnContent}
              icon={pendingPickupCount > 0 ? "bell-ring" : "inbox"}
            >
              {pendingPickupCount > 0 
                ? `🚨 ${pendingPickupCount} PENDING PICKUP REQUEST${pendingPickupCount > 1 ? 'S' : ''}` 
                : "Ad-Hoc Pickup Requests"}
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16 },
  header: { marginBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  date: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  bellButton: { padding: 8, position: 'relative', marginRight: 4 },
  bellBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.error, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  bellBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  notificationBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d1808', borderWidth: 1.5, borderColor: colors.warning, borderRadius: 14, padding: 14, marginBottom: 20 },
  notificationIconBox: { backgroundColor: colors.warning, borderRadius: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  notificationTitle: { fontSize: 15, fontWeight: 'bold', color: colors.warning },
  notificationSub: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginHorizontal: 4, borderWidth: 1, borderColor: colors.border },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  center: { marginTop: 40, alignItems: 'center' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  actionBtn: { backgroundColor: colors.primary, borderRadius: 12 },
  actionBtnOutline: { borderColor: colors.secondary, borderWidth: 1, borderRadius: 12 },
  btnContent: { paddingVertical: 8 }
});
