import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import colors from '../../constants/colors';
import { api } from '@/services/api';

export default function RequestPickup() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  
  const [boxCount, setBoxCount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!boxCount || isNaN(Number(boxCount)) || Number(boxCount) <= 0) {
      Alert.alert('Invalid', 'Please enter a valid number of parcels.');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/pickup-requests', {
        boxCount: Number(boxCount),
        vendorId: user?.vendorId
      });
      Alert.alert('Success', 'Pickup request sent to the vendor!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send pickup request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={() => router.back()}>← Back</Text>
        <Text style={styles.title}>Request Ad-hoc Pickup</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.info}>
          Use this to notify the vendor that you are picking up extra parcels. The vendor can then approve this and create a formal trip.
        </Text>
        
        <TextInput
          label="Number of Parcels"
          value={boxCount}
          onChangeText={setBoxCount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
        
        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
        >
          SEND REQUEST
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  backBtn: { color: colors.primary, fontSize: 16, fontWeight: 'bold', marginRight: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  content: { padding: 16 },
  info: { color: colors.textSecondary, marginBottom: 20, fontSize: 14, lineHeight: 20 },
  input: { marginBottom: 24, backgroundColor: colors.surface },
  submitBtn: { paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 8 }
});
