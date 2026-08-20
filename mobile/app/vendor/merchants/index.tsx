import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { FAB } from 'react-native-paper';

const mockMerchants = [
  { id: '1', name: 'Alpha Traders', address: '123 Logistics Park', stops: 45, collected: 250000 },
  { id: '2', name: 'Beta Store', address: '45 Hub City', stops: 32, collected: 150000 },
];

export default function MerchantsList() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Merchants</Text>
      </View>

      <FlatList
        data={mockMerchants}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>Total Stops: {item.stops}</Text>
              <Text style={styles.collected}>₹{item.collected}</Text>
            </View>
          </View>
        )}
      />

      <FAB icon="plus" style={styles.fab} color="#fff" onPress={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  list: { padding: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  address: { color: colors.textSecondary, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statText: { color: colors.textSecondary },
  collected: { fontWeight: 'bold', color: colors.success },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: colors.primary }
});
