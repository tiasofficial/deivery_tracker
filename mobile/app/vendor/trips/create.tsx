import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  
  // Form State
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState(params.driverId as string || '');
  const [tripDate, setTripDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [stops, setStops] = useState<StopItem[]>([
    {
      merchantName: '',
      boxes: [{ boxType: '', quantity: (params.adHocBoxes as string) || '1' }]
    }
  ]);

  const [availableBoxTypes, setAvailableBoxTypes] = useState<{ id?: string; name: string }[]>([
    { name: 'Phenyl' },
    { name: 'Bata Box' },
    { name: 'Nirmal Box' },
    { name: 'Bala Box' }
  ]);

  const fetchData = async () => {
    try {
      const driversRes = await api.get('/drivers');
      if (driversRes.data.success && driversRes.data.data) {
        const list = driversRes.data.data;
        setDrivers(list);
        if (list.length > 0 && !selectedDriverId) {
          setSelectedDriverId(list[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load drivers list:', error);
    }
    
    try {
      const boxTypesRes = await api.get('/boxtypes');
      if (boxTypesRes.data.success && boxTypesRes.data.data) {
        const list = boxTypesRes.data.data.map((b: any) => ({ id: b.id, name: b.name }));
        if (list.length > 0) {
          // Merge default Phenyl if not already present
          const hasPhenyl = list.some((item: any) => item.name.toLowerCase() === 'phenyl');
          const merged = hasPhenyl ? list : [{ name: 'Phenyl' }, ...list];
          setAvailableBoxTypes(merged);
        }
      }
    } catch (error) {
      console.error('Failed to load box types:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const performDelete = async (item: { id?: string; name: string }) => {
    // Immediately remove from UI list
    setAvailableBoxTypes(prev => prev.filter(b => b.name !== item.name));
    
    try {
      if (item.id) {
        await api.delete(`/boxtypes/${item.id}`);
      } else {
        await api.delete(`/boxtypes/${encodeURIComponent(item.name)}`);
      }
    } catch (err) {
      console.log('Error deleting on backend:', err);
    }
  };

  const handleDeleteBoxType = (item: { id?: string; name: string }) => {
    if (Platform.OS === 'web') {
      performDelete(item);
      return;
    }

    Alert.alert(
      'Delete Saved Item',
      `Are you sure you want to delete "${item.name}" from your item list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(item)
        }
      ]
    );
  };

  // Date picker handler
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTripDate(selectedDate);
    }
  };

  // Add/Remove Stops
  const addStop = () => {
    setStops(prev => [...prev, { merchantName: '', boxes: [{ boxType: '', quantity: '1' }] }]);
  };

  const removeStop = (stopIdx: number) => {
    if (stops.length === 1) return;
    setStops(prev => prev.filter((_, idx) => idx !== stopIdx));
  };

  const updateStopMerchant = (stopIdx: number, text: string) => {
    const updated = [...stops];
    updated[stopIdx].merchantName = text;
    setStops(updated);
  };

  // Add/Remove Box Types within a stop
  const addBoxItem = (stopIdx: number) => {
    const updated = [...stops];
    updated[stopIdx].boxes.push({ boxType: '', quantity: '1' });
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

  // Reset all inputs
  const resetForm = () => {
    setNotes('');
    setTripDate(new Date());
    setStops([
      {
        merchantName: '',
        boxes: [{ boxType: '', quantity: '1' }]
      }
    ]);
  };

  // Submit Trip
  const handleSubmit = async () => {
    // Validation
    for (let i = 0; i < stops.length; i++) {
      if (!stops[i].merchantName.trim()) {
        const msg = `Please enter a merchant name for Stop #${i + 1}`;
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Required', msg);
        return;
      }
      for (let j = 0; j < stops[i].boxes.length; j++) {
        if (!stops[i].boxes[j].boxType.trim()) {
          const msg = `Please enter or select an item name for item #${j + 1} at Stop #${i + 1}`;
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Required', msg);
          return;
        }
        const qty = parseInt(stops[i].boxes[j].quantity);
        if (isNaN(qty) || qty <= 0) {
          const msg = `Please enter a valid quantity for item #${j + 1} at Stop #${i + 1}`;
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Required', msg);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Map frontend models to API body formats
      const apiStops = stops.map((s, idx) => ({
        merchantName: s.merchantName.trim(),
        stopOrder: idx + 1,
        boxes: s.boxes.map(b => ({
          boxName: b.boxType.trim(),
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

      // Add any newly typed custom box names into availableBoxTypes permanently
      const newItems = stops.flatMap(s => s.boxes.map(b => b.boxType.trim())).filter(n => n.length > 0);
      setAvailableBoxTypes(prev => {
        const existing = new Set(prev.map(p => p.name.toLowerCase()));
        const additions = newItems.filter(name => !existing.has(name.toLowerCase())).map(name => ({ name }));
        return [...prev, ...additions];
      });

      // Automatically reset form
      resetForm();

      if (Platform.OS === 'web') {
        alert('Trip successfully created!');
      } else {
        Alert.alert('Success', 'Trip successfully created!');
      }
      router.back();
    } catch (e: any) {
      const errMsg = e?.response?.data?.message || 'Failed to create trip';
      Platform.OS === 'web' ? alert(errMsg) : Alert.alert('Error', errMsg);
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
                <View style={styles.inputRow}>
                  <TextInput
                    label="Item Name"
                    value={box.boxType}
                    onChangeText={(text) => updateBoxType(stopIdx, boxIdx, text)}
                    mode="outlined"
                    style={styles.itemNameInput}
                    placeholder="Type item name or choose chip"
                  />
                  <TextInput
                    label={Platform.OS === 'web' ? "Quantity" : "Qty"}
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
                      style={styles.deleteBoxBtn}
                    />
                  )}
                </View>
                
                {/* Quick Select Chips with Delete Option */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6, paddingBottom: 4 }}>
                  {availableBoxTypes.map(item => {
                    const isSelected = item.name.toLowerCase() === (box.boxType || '').trim().toLowerCase();
                    return (
                      <View
                        key={item.id || item.name}
                        style={[
                          styles.boxChip,
                          isSelected && styles.boxChipSelected,
                          { marginRight: 8, flexDirection: 'row', alignItems: 'center' }
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => updateBoxType(stopIdx, boxIdx, item.name)}
                          style={{ paddingVertical: 2, paddingLeft: 2, paddingRight: 4 }}
                        >
                          <Text style={[styles.boxChipText, isSelected && styles.boxChipTextSelected]}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>

                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            handleDeleteBoxType(item);
                          }}
                          style={({ pressed }) => [
                            styles.chipDeleteBtn,
                            pressed && { opacity: 0.6 }
                          ]}
                          hitSlop={8}
                        >
                          <Ionicons 
                            name="close-circle" 
                            size={16} 
                            color={isSelected ? colors.primary : colors.error} 
                          />
                        </Pressable>
                      </View>
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
  boxRow: { marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  itemNameInput: { 
    flex: Platform.OS === 'web' ? 2 : 1, 
    maxWidth: Platform.OS === 'web' ? 360 : undefined, 
    backgroundColor: colors.surfaceAlt 
  },
  qtyInput: { 
    width: Platform.OS === 'web' ? 150 : 85, 
    marginLeft: 10, 
    backgroundColor: colors.surfaceAlt 
  },
  deleteBoxBtn: { margin: 0, marginLeft: 4 },
  boxChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  boxChipSelected: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  boxChipText: { color: colors.textSecondary, fontSize: 12 },
  boxChipTextSelected: { color: colors.primary, fontWeight: 'bold' },
  chipDeleteBtn: {
    marginLeft: 6,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {})
  },
  addBoxBtn: { alignSelf: 'flex-start', marginTop: 8 },
  addStopBtn: { borderColor: colors.secondary, marginBottom: 32, paddingVertical: 4 },
  submitBtn: { backgroundColor: colors.primary, marginBottom: 40, borderRadius: 10 },
  submitBtnContent: { paddingVertical: 8 }
});
