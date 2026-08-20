import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getTripStatusColor, getStopStatusColor } from '../../utils/statusHelpers';

interface Props { status: any; type: 'TRIP' | 'STOP'; }

export default function StatusBadge({ status, type }: Props) {
  const color = type === 'TRIP' ? getTripStatusColor(status) : getStopStatusColor(status);
  
  return (
    <View style={[styles.badge, { backgroundColor: color + '33' }]}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  text: { fontSize: 10, fontWeight: 'bold' }
});
