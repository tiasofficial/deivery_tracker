import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import colors from '../../constants/colors';
import { Button, IconButton } from 'react-native-paper';
import { useRouter, useNavigation } from 'expo-router';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/analytics/summary?period=today');
      if (res.data.success && res.data.data) {
        setMetrics(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSummary();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
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
          <IconButton 
            icon="logout" 
            iconColor={colors.error} 
            size={24} 
            onPress={handleLogout} 
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  date: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
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
