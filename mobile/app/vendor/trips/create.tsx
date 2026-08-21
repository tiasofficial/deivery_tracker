import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '@/services/api';

interface BoxItem {
  boxType: string;
  quantity: string;
}

interface StopItem {
  merchantName: string;
  boxes: BoxItem[];
}



export default function CreateTrip() {
  const router = useRouter();
  
  // Form State
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [tripDate, setTripDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [stops, setStops] = useState<StopItem[]>([
    {
      merchantName: '',
      boxes: [{ boxType: 'Bata Box', quantity: '1' }]
    }
  ]);

  const [availableBoxTypes, setAvailableBoxTypes] = useState<string[]>(['Bata Box', 'Nirmal Box', 'Bala Box']);

  // Load live drivers and box types from database
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const driversRes = await api.get('/drivers');
        if (driversRes.data.success && driversRes.data.data) {
          const list = driversRes.data.data;
          setDrivers(list);
          if (list.length > 0) {
            setSelectedDriverId(list[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load drivers list:', error);
      }
      
      try {
        const boxTypesRes = await api.get('/boxtypes');
        if (boxTypesRes.data.success && boxTypesRes.data.data) {
          const names = boxTypesRes.data.data.map((b: any) => b.name);
          if (names.length > 0) {
            setAvailableBoxTypes(names);
          }
        }
      } catch (error) {
        console.error('Failed to load box types:', error);
      }
    };
    fetchData();
  }, []);

  // Date picker handler
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTripDate(selectedDate);
    }
  };

  // Add/Remove Stops
  const addStop = () => {
    setStops([...stops, { merchantName: '', boxes: [{ boxType: 'Bata Box', quantity: '1' }] }]);
  };

  const removeStop = (stopIdx: number) => {
    if (stops.length === 1) return;
    setStops(stops.filter((_, idx) => idx !== stopIdx));
  };

  const updateStopMerchant = (stopIdx: number, text: string) => {
    const updated = [...stops];
    updated[stopIdx].merchantName = text;
    setStops(updated);
  };

  // Add/Remove Box Types within a stop
  const addBoxItem = (stopIdx: number) => {
    const updated = [...stops];
    updated[stopIdx].boxes.push({ boxType: 'Bata Box', quantity: '1' });
    setStops(updated);
  };

  const removeBoxItem = (stopIdx: number, boxIdx: number) => {
    const updated = [...stops];
    if (updated[stopIdx].boxes.length === 1) return;
    updated[stopIdx].boxes = updated[stopIdx].boxes.filter((_, idx) => idx !== boxIdx);
    setStops(updated);
  };

  const updateBoxType = (stopIdx: number, boxIdx: number, type: string) => {
    const updated = [...stops];
    updated[stopIdx].boxes[boxIdx].boxType = type;
    setStops(updated);
  };

  const updateBoxQuantity = (stopIdx: number, boxIdx: number, qty: string) => {
    const updated = [...stops];
    updated[stopIdx].boxes[boxIdx].quantity = qty;
    setStops(updated);
  };

  // Submit Trip
  const handleSubmit = async () => {
    // Validation
    for (let i = 0; i < stops.length; i++) {
      if (!stops[i].merchantName.trim()) {
        Alert.alert('Required', `Please enter a merchant name for Stop #${i + 1}`);
        return;
      }
      for (let j = 0; j < stops[i].boxes.length; j++) {
        const qty = parseInt(stops[i].boxes[j].quantity);
        if (isNaN(qty) || qty <= 0) {
          Alert.alert('Required', `Please enter a valid quantity for item #${j + 1} at Stop #${i + 1}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Map frontend models to API body formats
      const apiStops = stops.map((s, idx) => ({
        merchantName: s.merchantName,
        stopOrder: idx + 1,
        boxes: s.boxes.map(b => ({
          boxName: b.boxType,
          quantity: parseInt(b.quantity)
        }))
      }));

      const body = {
        driverId: selectedDriverId,
        tripDate: tripDate.toISOString(),
        transportFee: 0,
        notes,
        stops: apiStops
      };

      await api.post('/trips', body);
      Alert.alert('Success', 'Trip successfully created!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create New Trip</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* DRIVER SELECTION */}
        <Text style={styles.sectionLabel}>Select Driver</Text>
        <View style={styles.driverPickerRow}>
          {drivers.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontStyle: 'italic', paddingLeft: 8 }}>
              No active drivers registered. Please add them first.
            </Text>
          ) : (
            drivers.map(driver => {
              const isSelected = driver.id === selectedDriverId;
              return (
                <TouchableOpacity
                  key={driver.id}
                  style={[styles.driverCard, isSelected && styles.driverCardSelected]}
                  onPress={() => setSelectedDriverId(driver.id)}
                >
                  <Text style={[styles.driverName, isSelected && styles.driverNameSelected]}>{driver.name}</Text>
                  <Text style={styles.driverEmail}>{driver.email}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* DATE */}
        <View style={styles.formRow}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDatePicker(true)}>
            <TextInput
              label="Trip Date"
              value={tripDate.toDateString()}
              mode="outlined"
              editable={false}
              pointerEvents="none"
              style={styles.flexInput}
            />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={tripDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <TextInput
          label="Trip Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          style={styles.notesInput}
          multiline
          numberOfLines={2}
        />

        {/* STOPS BUILDER */}
        <Text style={styles.sectionLabel}>Route Builder (Stops & Deliveries)</Text>
        {stops.map((stop, stopIdx) => (
          <View key={stopIdx} style={styles.stopCard}>
            <View style={styles.stopHeader}>
              <Text style={styles.stopTitle}>Stop #{stopIdx + 1}</Text>
              {stops.length > 1 && (
                <TouchableOpacity onPress={() => removeStop(stopIdx)}>
                  <Text style={styles.removeText}>Remove Stop</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              label="Merchant Name"
              value={stop.merchantName}
              onChangeText={(text) => updateStopMerchant(stopIdx, text)}
              mode="outlined"
              style={styles.input}
              placeholder="e.g. Alpha Traders"
            />

            {/* BOX ITEMS LIST */}
            <Text style={styles.itemsLabel}>Deliveries at this Stop</Text>
            {stop.boxes.map((box, boxIdx) => (
              <View key={boxIdx} style={styles.boxRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    label="Item Name"
                    value={box.boxType}
                    onChangeText={(text) => updateBoxType(stopIdx, boxIdx, text)}
                    mode="outlined"
                    style={{ flex: 1, backgroundColor: colors.surfaceAlt }}
                    placeholder="Type or select below"
                  />
                  <TextInput
                    label="Qty"
                    value={box.quantity}
                    onChangeText={(qty) => updateBoxQuantity(stopIdx, boxIdx, qty)}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.qtyInput}
                  />
                  {stop.boxes.length > 1 && (
                    <IconButton
                      icon="delete"
                      iconColor={colors.error}
                      size={20}
                      onPress={() => removeBoxItem(stopIdx, boxIdx)}
                      style={{ margin: 0 }}
                    />
                  )}
                </View>
                
                {/* Quick Select Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, paddingBottom: 4 }}>
                  {availableBoxTypes.map(type => {
                    const isSelected = type === box.boxType;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.boxChip, isSelected && styles.boxChipSelected, { marginRight: 8 }]}
                        onPress={() => updateBoxType(stopIdx, boxIdx, type)}
                      >
                        <Text style={[styles.boxChipText, isSelected && styles.boxChipTextSelected]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ))}

            <Button
              mode="outlined"
              onPress={() => addBoxItem(stopIdx)}
              style={styles.addBoxBtn}
              textColor={colors.secondary}
              compact
            >
              + Add Item Box
            </Button>
          </View>
        ))}

        <Button
          mode="outlined"
          onPress={addStop}
          style={styles.addStopBtn}
          textColor={colors.secondary}
        >
          + Add Another Stop
        </Button>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
          contentStyle={styles.submitBtnContent}
        >
          Dispatch Trip Route
        </Button>
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
  sectionLabel: { fontSize: 16, color: colors.textPrimary, fontWeight: 'bold', marginBottom: 12, marginTop: 12 },
  driverPickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  driverCard: { flex: 1, backgroundColor: colors.surface, padding: 12, borderRadius: 10, marginHorizontal: 4, borderWidth: 1, borderColor: colors.border },
  driverCardSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  driverName: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 15 },
  driverNameSelected: { color: colors.primary },
  driverEmail: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  formRow: { flexDirection: 'row', marginBottom: 16 },
  dateSelector: { flex: 1 },
  flexInput: { flex: 1, backgroundColor: colors.surfaceAlt },
  notesInput: { backgroundColor: colors.surfaceAlt, marginBottom: 24 },
  stopCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  stopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stopTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: 'bold' },
  removeText: { color: colors.error, fontSize: 13 },
  input: { marginBottom: 12, backgroundColor: colors.surfaceAlt },
  itemsLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 8, marginTop: 4 },
  boxRow: { marginBottom: 12 },
  pickerContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  boxChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  boxChipSelected: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  boxChipText: { color: colors.textSecondary, fontSize: 12 },
  boxChipTextSelected: { color: colors.primary, fontWeight: 'bold' },
  qtyInput: { width: 60, height: 40, backgroundColor: colors.surfaceAlt, marginLeft: 8 },
  addBoxBtn: { alignSelf: 'flex-start', marginTop: 8 },
  addStopBtn: { borderColor: colors.secondary, marginBottom: 32, paddingVertical: 4 },
  submitBtn: { backgroundColor: colors.primary, marginBottom: 40, borderRadius: 10 },
  submitBtnContent: { paddingVertical: 8 }
});
