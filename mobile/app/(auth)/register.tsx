import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import colors from '../../constants/colors';
import { api } from '@/services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const login = useAuthStore(state => state.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'VENDOR' | 'DRIVER'>('VENDOR');
  const [vehicleNo, setVehicleNo] = useState('');
  const [loading, setLoading] = useState(false);
  const handleRegister = async () => {
    setLoading(true);
    try {
      const body: any = { name, email, phone, password, role };
      if (role === 'DRIVER') {
        body.vehicleNo = vehicleNo;
        // Connect to the seed vendor as a default for testing registration
        body.vendorCode = 'vendor@test.com'; 
      }

      const res = await api.post('/auth/register', body);
      if (res.data.success && res.data.data) {
        await login(res.data.data.user, res.data.data.token);
      } else {
        Alert.alert('Registration Failed', res.data.message || 'Failed to create account');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error?.response?.data?.message || 'Network request failed. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={[colors.primary, '#3b34b1']} style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
      </LinearGradient>
      
      <View style={styles.form}>
        <Text style={styles.label}>I am a:</Text>
        <RadioButton.Group onValueChange={newValue => setRole(newValue as 'VENDOR'|'DRIVER')} value={role}>
          <View style={styles.radioRow}>
            <View style={styles.radioItem}><RadioButton value="VENDOR" color={colors.primary} /><Text style={styles.radioText}>Vendor</Text></View>
            <View style={styles.radioItem}><RadioButton value="DRIVER" color={colors.primary} /><Text style={styles.radioText}>Driver</Text></View>
          </View>
        </RadioButton.Group>

        <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        <TextInput label="Phone" value={phone} onChangeText={setPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" />
        <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined" style={styles.input} secureTextEntry />
        
        {role === 'DRIVER' && (
          <TextInput label="Vehicle Number" value={vehicleNo} onChangeText={setVehicleNo} mode="outlined" style={styles.input} />
        )}
        
        <Button mode="contained" onPress={handleRegister} loading={loading} style={styles.button} contentStyle={styles.buttonContent}>
          Register
        </Button>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 180, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  form: { padding: 24, marginTop: -20, backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 16, elevation: 4, marginBottom: 40 },
  label: { color: colors.textSecondary, marginBottom: 8 },
  radioRow: { flexDirection: 'row', marginBottom: 16 },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  radioText: { color: colors.textPrimary },
  input: { marginBottom: 16, backgroundColor: colors.surfaceAlt },
  button: { marginTop: 8, borderRadius: 8, backgroundColor: colors.primary },
  buttonContent: { paddingVertical: 8 },
  linkText: { color: colors.secondary, textAlign: 'center', marginTop: 24 }
});
