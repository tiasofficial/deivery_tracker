import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import colors from '../../constants/colors';
import { api } from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore(state => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success && res.data.data) {
        await login(res.data.data.user, res.data.data.token);
      } else {
        Alert.alert('Login Failed', res.data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error?.response?.data?.message || 'Network request failed. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, '#3b34b1']} style={styles.header}>
        <Text style={styles.title}>DeliveryTrack</Text>
        <Text style={styles.subtitle}>Welcome back</Text>
      </LinearGradient>
      
      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
        />
        
        <Button 
          mode="contained" 
          onPress={handleLogin} 
          loading={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Login
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 250, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#e0e0e0' },
  form: { flex: 1, padding: 24, marginTop: -30, backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  input: { marginBottom: 16, backgroundColor: colors.surfaceAlt },
  button: { marginTop: 8, borderRadius: 8, backgroundColor: colors.primary },
  buttonContent: { paddingVertical: 8 },
  linkText: { color: colors.secondary, textAlign: 'center', marginTop: 24 }
});
