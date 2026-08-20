import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { TextInput, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/services/api';

export default function DriverDetails() {
  const { id: driverId } = useLocalSearchParams();
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDriverDetails = async () => {
    try {
      const res = await api.get(`/drivers/${driverId}`);
      const driver = res.data.data;
      if (driver) {
        setName(driver.name);
        setEmail(driver.email);
        setPhone(driver.phone || '');
        setVehicleNo(driver.vehicleNo || '');
      }
    } catch (error) {
      console.error('Failed to load driver details:', error);
      Alert.alert('Error', 'Failed to load driver profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverDetails();
  }, [driverId]);

  // Update Profile Details
  const handleUpdateProfile = async () => {
    if (!name || !vehicleNo) {
      Alert.alert('Required', 'Name and Vehicle Number are required.');
      return;
    }
    setUpdateLoading(true);
    try {
      await api.put(`/drivers/${driverId}`, {
        name,
        phone,
        vehicleNo
      });
      Alert.alert('Success', 'Driver details successfully updated!');
      fetchDriverDetails();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Required', 'Please enter a new password.');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.patch(`/drivers/${driverId}/password`, {
        password: newPassword
      });
      Alert.alert('Success', 'Driver password changed successfully!');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Delete Driver Account
  const handleDeleteDriver = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this driver? All trips assigned to this driver will also be permanently deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await api.delete(`/drivers/${driverId}`);
              Alert.alert('Deleted', 'Driver account has been deleted.');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete driver.');
            } finally {
              setDeleteLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Driver Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* EDIT DETAILS SECTION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <Text style={styles.emailLabel}>Registered Email: {email}</Text>
          
          <TextInput
            label="Full Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
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
            label="Vehicle Number *"
            value={vehicleNo}
            onChangeText={setVehicleNo}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleUpdateProfile}
            loading={updateLoading}
            disabled={updateLoading}
            style={styles.saveBtn}
          >
            Update Profile
          </Button>
        </View>

        {/* PASSWORD CHANGE SECTION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          
          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            mode="outlined"
            secureTextEntry
            placeholder="Type new password"
            style={styles.input}
          />

          <Button
            mode="outlined"
            onPress={handleChangePassword}
            loading={passwordLoading}
            disabled={passwordLoading}
            style={styles.passwordBtn}
            textColor={colors.secondary}
          >
            Reset Password
          </Button>
        </View>

        {/* DANGER ZONE (DELETE) */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          <Text style={styles.dangerText}>Once deleted, the driver account is gone forever.</Text>
          
          <Button
            mode="contained"
            onPress={handleDeleteDriver}
            loading={deleteLoading}
            disabled={deleteLoading}
            style={styles.deleteBtn}
          >
            Delete Driver Account
          </Button>
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
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
  emailLabel: { color: colors.textSecondary, marginBottom: 16, fontSize: 14 },
  input: { marginBottom: 16, backgroundColor: colors.surfaceAlt },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 4 },
  passwordBtn: { borderColor: colors.secondary, borderWidth: 1, borderRadius: 8, paddingVertical: 4 },
  dangerCard: { borderColor: colors.error + '55', backgroundColor: '#1c1016' },
  dangerText: { color: colors.textSecondary, marginBottom: 16, fontSize: 13 },
  deleteBtn: { backgroundColor: colors.error, borderRadius: 8, paddingVertical: 4 }
});
