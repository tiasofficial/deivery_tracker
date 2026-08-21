import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { FAB } from 'react-native-paper';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { getTripStatusColor } from '@/utils/statusHelpers';
import { formatDate } from '@/utils/formatDate';

export default function TripsList() {
  const router = useRouter();
  const navigation = useNavigation();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    try {
      const res = await api.get('/trips');
      setTrips(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    // Refresh when focus returns to the list screen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTrips();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Trips</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => router.push(`/vendor/trips/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.driverName}>{item.driver?.name || 'Unassigned'}</Text>
                  <View style={[styles.badge, { backgroundColor: getTripStatusColor(item.status) + '22', marginLeft: 8 }]}>
                    <Text style={[styles.badgeText, { color: getTripStatusColor(item.status) }]}>{item.status}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation(); // prevent card press
                    Alert.alert('Delete Trip', 'Are you sure you want to delete this trip permanently?', [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await api.delete(`/trips/${item.id}`);
                            fetchTrips();
                          } catch(err) {
                            Alert.alert('Error', 'Failed to delete trip');
                          }
                        }
                      }
                    ]);
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={16} color={colors.textSecondary} />
                  <Text style={styles.infoText}>{formatDate(item.tripDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color={colors.textSecondary} />
                  <Text style={styles.infoText}>{item.stops?.length || 0} Stops</Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feeText}>Fee: {formatCurrency(parseFloat(item.transportFee))}</Text>
                  {item.totalCollected !== null && (
                    <Text style={styles.collectedText}>Collected: {formatCurrency(parseFloat(item.totalCollected))}</Text>
                  )}
                </View>
                {item.totalCollected !== null && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>Net Final:</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.secondary }}>
                      {formatCurrency(parseFloat(item.totalCollected) - parseFloat(item.transportFee))}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.empty}>No trips created yet.</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/vendor/trips/create')}
        color="#fff"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  list: { padding: 16, paddingBottom: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  driverName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { color: colors.textSecondary, marginLeft: 6, fontSize: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  feeText: { color: colors.textSecondary, fontSize: 14 },
  collectedText: { color: colors.success, fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: 12, fontSize: 16 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: colors.primary }
});
