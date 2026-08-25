import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useRouter, useNavigation } from 'expo-router';
import colors from '../../constants/colors';
import { api } from '@/services/api';

export default function PickupRequests() {
  const router = useRouter();
  const navigation = useNavigation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/pickup-requests');
      if (res.data.success && res.data.data) {
        setRequests(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const sub = navigation.addListener('focus', fetchRequests);
    return sub;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleApprove = async (id: string, boxCount: number, driverId: string) => {
    try {
      await api.patch(`/pickup-requests/${id}`, { status: 'APPROVED' });
      router.push({
        pathname: '/vendor/trips/create',
        params: {
          driverId,
          adHocBoxes: boxCount
        }
      });
    } catch (e: any) {
      Alert.alert('Error', 'Failed to approve request.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={() => router.back()}>← Back</Text>
        <Text style={styles.title}>Pickup Requests</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.driverName}>Driver: {item.driver?.name}</Text>
              <View style={[styles.badge, { backgroundColor: item.status === 'PENDING' ? colors.warning + '33' : colors.success + '33' }]}>
                <Text style={{ color: item.status === 'PENDING' ? colors.warning : colors.success, fontSize: 10, fontWeight: 'bold' }}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.boxes}>Parcels Requested: {item.boxCount}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>

            {item.status === 'PENDING' && (
              <Button 
                mode="contained" 
                style={styles.approveBtn}
                onPress=y() => handleApprove(item.id, item.boxCount, item.driverId)}
              >
                Create Trip for this Request
              </Button>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pickup requests found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  backBtn: { color: colors.primary, fontSize: 16, fontWeight: 'bold', marginRight: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  list: { padding: 16 },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  driverName: { fontWeight: 'bold', fontSize: 16, color: colors.textPrimary },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  boxes: { fontSize: 15, color: colors.textSecondary, marginBottom: 8 },
  date: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  approveBtn: { backgroundColor: colors.primary, borderRadius: 8 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 }
});
