import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { FAB, Button, TextInput, IconButton } from 'react-native-paper';
import { useRouter, useNavigation } from 'expo-router';
import { api } from '@/services/api';

export default function DriversList() {
  const router = useRouter();
  const navigation = useNavigation();
  
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Creation
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDrivers();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  const handleCreateDriver = async () => {
    if (!name || !email || !password || !vehicleNo) {
      Alert.alert('Required', 'Please fill in all required fields (Name, Email, Password, Vehicle Number).');
      return;
    }

    setCreateLoading(true);
    try {
      await api.post('/drivers', {
        name,
        email,
        phone,
        password,
        vehicleNo,
      });
      Alert.alert('Success', 'Driver account successfully created!');
      setModalVisible(false);
      
      // Reset inputs
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setVehicleNo('');
      
      fetchDrivers();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create driver account');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Drivers</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => router.push({ pathname: '/vendor/drivers/[id]', params: { id: item.id } })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
                <IconButton icon="chevron-right" iconColor={colors.textSecondary} size={20} />
              </View>
              <Text style={styles.vehicle}>Vehicle: {item.vehicleNo || 'Not Assigned'}</Text>
              <Text style={styles.email}>Email: {item.email}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>No drivers registered yet. Tap the + button to add one.</Text>
            </View>
          }
        />
      )}

      {/* FAB FOR ADDING DRIVER */}
      <FAB 
        icon="plus" 
        style={styles.fab} 
        color="#fff" 
        onPress={() => setModalVisible(true)} 
      />

      {/* ADD DRIVER MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Driver</Text>
              <IconButton icon="close" size={20} iconColor={colors.textPrimary} onPress={() => setModalVisible(false)} />
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <TextInput
                label="Full Name *"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Email Address *"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                label="Password *"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                label="Vehicle Number *"
                value={vehicleNo}
                onChangeText={setVehicleNo}
                mode="outlined"
                placeholder="e.g. MH 12 AB 1234"
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleCreateDriver}
                loading={createLoading}
                disabled={createLoading}
                style={styles.createBtn}
              >
                Create Account
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16 },
  backText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  vehicle: { color: colors.textSecondary, marginTop: 4, fontSize: 14 },
  email: { color: colors.textSecondary, marginTop: 2, fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { color: colors.textSecondary, textAlign: 'center', fontSize: 16, paddingHorizontal: 24 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: colors.primary },
  
  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  modalForm: { padding: 20, paddingBottom: 40 },
  input: { marginBottom: 16, backgroundColor: colors.surfaceAlt },
  createBtn: { backgroundColor: colors.primary, paddingVertical: 6, borderRadius: 8, marginTop: 8 }
});
