import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Button, TextInput, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatCurrency';
import { api } from '@/services/api';

interface TripLedgerTableProps {
  trip: any;
  onRefresh: () => void;
  canEdit?: boolean;
}

export interface StopFinancials {
  totalBill: number;
  collected: number;
  due: number;
  cleanRemarks: string;
  isDelayed: boolean;
  isCollected: boolean;
  isSkipped: boolean;
  isPending: boolean;
}

export function parseStopFinancials(stop: any): StopFinancials {
  const rawCollected = Number(stop.collectedAmount || 0);
  let totalBill = 0;
  let collected = 0;
  let due = 0;

  const rawReason = stop.skipReason || '';
  const billMatch = rawReason.match(/\[Bill:\s*([\d.]+)/i);
  const dueMatch = rawReason.match(/\[Due:\s*([\d.]+)/i);

  const isDelayed =
    stop.status === 'DELAYED' ||
    rawReason.toLowerCase().includes('delayed') ||
    rawReason.toLowerCase().includes('carry') ||
    rawReason.toLowerCase().includes('due');
  const isSkipped = stop.status === 'SKIPPED';
  const isCollected = stop.status === 'COLLECTED' && !isDelayed;
  const isPending = !stop.status || stop.status === 'PENDING';

  if (billMatch) {
    totalBill = parseFloat(billMatch[1]) || 0;
    if (dueMatch) {
      due = parseFloat(dueMatch[1]) || 0;
      collected = Math.max(0, totalBill - due);
    } else {
      collected = rawCollected;
      due = Math.max(0, totalBill - collected);
    }
  } else {
    // Legacy support for older records
    if (isDelayed) {
      if (rawCollected > 0) {
        totalBill = rawCollected;
        collected = 0; // The amount entered previously was the total bill / due amount
        due = totalBill;
      } else {
        totalBill = 0;
        collected = 0;
        due = 0;
      }
    } else if (isCollected) {
      totalBill = rawCollected;
      collected = rawCollected;
      due = 0;
    } else {
      totalBill = rawCollected;
      collected = 0;
      due = rawCollected;
    }
  }

  const cleanRemarks = rawReason.replace(/\[Bill:\s*[\d.]+\s*\|\s*Due:\s*[\d.]+\]\s*/i, '').trim();

  return {
    totalBill,
    collected,
    due,
    cleanRemarks,
    isDelayed,
    isCollected,
    isSkipped,
    isPending,
  };
}

export default function TripLedgerTable({ trip, onRefresh, canEdit = true }: TripLedgerTableProps) {
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [editTotalBill, setEditTotalBill] = useState('');
  const [editCollected, setEditCollected] = useState('');
  const [editStatus, setEditStatus] = useState<'COLLECTED' | 'DELAYED' | 'SKIPPED' | 'PENDING'>('COLLECTED');
  const [editRemarks, setEditRemarks] = useState('');

  if (!trip || !trip.stops || trip.stops.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No stop deliveries recorded for this trip.</Text>
      </View>
    );
  }

  // Extract all unique box types present across all stops in this trip
  const boxTypeMap = new Map<string, string>();
  trip.stops.forEach((stop: any) => {
    if (stop.boxes && Array.isArray(stop.boxes)) {
      stop.boxes.forEach((b: any) => {
        const id = b.boxTypeId || b.boxType?.id || b.boxType?.name || 'unknown';
        const name = b.boxType?.name || 'Box';
        if (!boxTypeMap.has(id)) {
          boxTypeMap.set(id, name);
        }
      });
    }
  });

  const boxTypeColumns = Array.from(boxTypeMap.entries()).map(([id, name]) => ({ id, name }));

  // Calculate Column Totals
  const boxTotals: { [key: string]: number } = {};
  boxTypeColumns.forEach(col => {
    boxTotals[col.id] = 0;
  });

  let totalBillSum = 0;
  let totalCollectedSum = 0;
  let totalDueSum = 0;
  const totalStopsCount = trip.stops.length;
  let completedStopsCount = 0;

  trip.stops.forEach((stop: any) => {
    if (stop.boxes && Array.isArray(stop.boxes)) {
      stop.boxes.forEach((b: any) => {
        const id = b.boxTypeId || b.boxType?.id || b.boxType?.name || 'unknown';
        if (boxTotals[id] !== undefined) {
          boxTotals[id] += Number(b.quantity || 0);
        }
      });
    }

    const fin = parseStopFinancials(stop);
    totalBillSum += fin.totalBill;
    totalCollectedSum += fin.collected;
    totalDueSum += fin.due;

    if (stop.status === 'COLLECTED' || stop.status === 'SKIPPED' || fin.isDelayed) {
      completedStopsCount += 1;
    }
  });

  const openEditModal = (stop: any) => {
    setSelectedStop(stop);
    const fin = parseStopFinancials(stop);

    setEditTotalBill(fin.totalBill > 0 ? String(fin.totalBill) : '');
    setEditCollected(fin.collected > 0 ? String(fin.collected) : fin.isDelayed ? '0' : '');

    if (fin.isSkipped) {
      setEditStatus('SKIPPED');
    } else if (fin.isDelayed) {
      setEditStatus('DELAYED');
    } else if (fin.isCollected) {
      setEditStatus('COLLECTED');
    } else {
      setEditStatus('PENDING');
    }

    setEditRemarks(fin.cleanRemarks || '');
    setModalVisible(true);
  };

  // Live computed due amount in modal
  const billNum = parseFloat(editTotalBill || '0') || 0;
  const collectedNum = parseFloat(editCollected || '0') || 0;
  const computedDue = Math.max(0, billNum - collectedNum);

  const handleSaveStop = async () => {
    if (!selectedStop) return;
    setSaving(true);
    try {
      const finalBill = parseFloat(editTotalBill || '0') || 0;
      const finalCollected = parseFloat(editCollected || '0') || 0;
      const finalDue = Math.max(0, finalBill - finalCollected);

      const finalStatus = editStatus === 'DELAYED' ? 'COLLECTED' : editStatus;
      let userRemarks = editRemarks.trim();
      if (editStatus === 'DELAYED' && !userRemarks) {
        userRemarks = 'Delayed / Carry forward to next trip';
      }

      // Encode structured billing financials into skipReason for lossless persistence
      const fullReason = `[Bill: ${finalBill} | Due: ${finalDue}] ${userRemarks}`.trim();

      await api.patch('/trips/' + trip.id + '/stops/' + selectedStop.id, {
        collectedAmount: finalCollected,
        status: finalStatus,
        skipped: editStatus === 'SKIPPED',
        skipReason: fullReason,
      });

      setModalVisible(false);
      onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update stop record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tableHeaderSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.tableHeading}>Delivery & Collection Sheet</Text>
            <Text style={styles.tableSubheading}>
              Date: {new Date(trip.tripDate).toLocaleDateString()} | Driver: {trip.driver?.name || 'Assigned'}
            </Text>
          </View>
        </View>
        <Chip style={styles.progressChip} textStyle={{ color: colors.secondary, fontSize: 11 }}>
          {completedStopsCount}/{totalStopsCount} Stops
        </Chip>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
        <View style={styles.table}>
          {/* TABLE HEADER */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.colNo, styles.headerText]}>NO</Text>
            <Text style={[styles.cell, styles.colCustomer, styles.headerText]}>CUSTOMER NAME</Text>

            {boxTypeColumns.map(col => (
              <Text key={col.id} style={[styles.cell, styles.colBox, styles.headerText]}>
                {col.name.toUpperCase()}
              </Text>
            ))}

            <Text style={[styles.cell, styles.colTotalAmt, styles.headerText]}>TOTAL AMT</Text>
            <Text style={[styles.cell, styles.colCollected, styles.headerText]}>COLLECTED</Text>
            <Text style={[styles.cell, styles.colDue, styles.headerText]}>DUE / CARRY FWD</Text>
            <Text style={[styles.cell, styles.colStatus, styles.headerText]}>STATUS / REMARKS</Text>
            {canEdit && <Text style={[styles.cell, styles.colAction, styles.headerText]}>EDIT</Text>}
          </View>

          {/* TABLE ROWS */}
          {trip.stops.map((stop: any, idx: number) => {
            const fin = parseStopFinancials(stop);

            return (
              <TouchableOpacity
                key={stop.id || idx}
                activeOpacity={canEdit ? 0.7 : 1}
                onPress={() => canEdit && openEditModal(stop)}
                style={[styles.row, idx % 2 === 1 ? styles.alternateRow : null]}
              >
                <Text style={[styles.cell, styles.colNo, styles.bodyText]}>{idx + 1}</Text>
                <View style={[styles.cell, styles.colCustomer]}>
                  <Text style={[styles.bodyText, styles.bold]} numberOfLines={1}>
                    {stop.merchant?.name || 'Customer'}
                  </Text>
                  {stop.merchant?.address ? (
                    <Text style={styles.subAddress} numberOfLines={1}>
                      {stop.merchant.address}
                    </Text>
                  ) : null}
                </View>

                {/* Box Quantities */}
                {boxTypeColumns.map(col => {
                  const match = stop.boxes?.find((b: any) => (b.boxTypeId || b.boxType?.id || b.boxType?.name) === col.id);
                  const qty = match ? match.quantity : '-';
                  return (
                    <Text key={col.id} style={[styles.cell, styles.colBox, styles.bodyText, qty !== '-' && styles.bold]}>
                      {qty}
                    </Text>
                  );
                })}

                {/* Total Bill Amount */}
                <Text style={[styles.cell, styles.colTotalAmt, styles.billText]}>
                  {formatCurrency(fin.totalBill)}
                </Text>

                {/* Collected Amount */}
                <Text style={[styles.cell, styles.colCollected, styles.collectedText]}>
                  {formatCurrency(fin.collected)}
                </Text>

                {/* Due / Carry Forward Amount */}
                <View style={[styles.cell, styles.colDue]}>
                  <Text style={[styles.dueText, fin.due > 0 ? styles.dueTextPositive : styles.dueTextZero]}>
                    {formatCurrency(fin.due)}
                  </Text>
                </View>

                {/* Status / Remarks */}
                <View style={[styles.cell, styles.colStatus]}>
                  {fin.isDelayed ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.warning + '33' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.warning }]}>DELAYED / CARRY FWD</Text>
                    </View>
                  ) : fin.isCollected ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.success + '33' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.success }]}>PAID / COLLECTED</Text>
                    </View>
                  ) : fin.isSkipped ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.error + '33' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.error }]}>SKIPPED</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: colors.textSecondary + '22' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>PENDING</Text>
                    </View>
                  )}
                  {fin.cleanRemarks ? (
                    <Text style={styles.remarkSnippet} numberOfLines={1}>
                      {fin.cleanRemarks}
                    </Text>
                  ) : null}
                </View>

                {/* Action button */}
                {canEdit && (
                  <View style={[styles.cell, styles.colAction]}>
                    <TouchableOpacity style={styles.editIconBtn} onPress={() => openEditModal(stop)}>
                      <Ionicons name="create-outline" size={16} color={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* TOTAL ROW */}
          <View style={[styles.row, styles.totalRow]}>
            <View style={[styles.cell, styles.colNo, { alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="checkmark-done" size={16} color={colors.secondary} />
            </View>
            <Text style={[styles.cell, styles.colCustomer, styles.totalText]}>TOTAL</Text>

            {boxTypeColumns.map(col => (
              <Text key={col.id} style={[styles.cell, styles.colBox, styles.totalValue]}>
                {boxTotals[col.id] || 0}
              </Text>
            ))}

            {/* Total Bill Sum */}
            <Text style={[styles.cell, styles.colTotalAmt, styles.totalBillValue]}>
              {formatCurrency(totalBillSum)}
            </Text>

            {/* Total Collected Sum */}
            <Text style={[styles.cell, styles.colCollected, styles.totalCollectedValue]}>
              {formatCurrency(totalCollectedSum)}
            </Text>

            {/* Total Due Sum */}
            <Text style={[styles.cell, styles.colDue, styles.totalDueValue]}>
              {formatCurrency(totalDueSum)}
            </Text>

            <Text style={[styles.cell, styles.colStatus, styles.totalSubText]}>
              {completedStopsCount} of {totalStopsCount} completed
            </Text>
            {canEdit && <Text style={[styles.cell, styles.colAction]}></Text>}
          </View>
        </View>
      </ScrollView>

      {/* EDIT MODAL FOR DRIVER & VENDOR */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Stop & Payment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedStop && (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.modalMerchantName}>{selectedStop.merchant?.name}</Text>
                <Text style={styles.modalMerchantAddress}>{selectedStop.merchant?.address || 'No address'}</Text>

                <View style={styles.deliveryItemsBox}>
                  <Text style={styles.deliveryItemsTitle}>Items to deliver:</Text>
                  {selectedStop.boxes?.map((b: any, idx: number) => (
                    <Text key={idx} style={styles.deliveryItemText}>
                      • {b.quantity}x {b.boxType?.name || 'Box'}
                    </Text>
                  ))}
                </View>

                {/* Status selector */}
                <Text style={styles.fieldLabel}>Payment & Stop Status:</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.statusChip, editStatus === 'COLLECTED' && styles.statusChipActiveGreen]}
                    onPress={() => {
                      setEditStatus('COLLECTED');
                      // If collected is 0 or empty, default collected to total bill
                      if (billNum > 0 && (collectedNum === 0 || !editCollected)) {
                        setEditCollected(String(billNum));
                      }
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={editStatus === 'COLLECTED' ? colors.success : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, editStatus === 'COLLECTED' && styles.chipTextActive]}>
                      Paid / Collected
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusChip, editStatus === 'DELAYED' && styles.statusChipActiveOrange]}
                    onPress={() => {
                      setEditStatus('DELAYED');
                      // If collected was equal to bill, reset to 0 for full carry forward
                      if (collectedNum === billNum && billNum > 0) {
                        setEditCollected('0');
                      }
                      if (!editRemarks) setEditRemarks('Delayed / Carry forward to next trip');
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={editStatus === 'DELAYED' ? colors.warning : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, editStatus === 'DELAYED' && styles.chipTextActive]}>
                      Carry Forward / Due
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.chipRow, { marginTop: 6 }]}>
                  <TouchableOpacity
                    style={[styles.statusChip, editStatus === 'PENDING' && styles.statusChipActiveGray]}
                    onPress={() => setEditStatus('PENDING')}
                  >
                    <Ionicons
                      name="hourglass-outline"
                      size={15}
                      color={editStatus === 'PENDING' ? colors.primary : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, editStatus === 'PENDING' && styles.chipTextActive]}>
                      Pending
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusChip, editStatus === 'SKIPPED' && styles.statusChipActiveRed]}
                    onPress={() => setEditStatus('SKIPPED')}
                  >
                    <Ionicons
                      name="close-circle"
                      size={15}
                      color={editStatus === 'SKIPPED' ? colors.error : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, editStatus === 'SKIPPED' && styles.chipTextActive]}>
                      Skipped
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Amount Inputs: Total Bill & Collected Cash */}
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    label="Total Bill / Expected Amount (₹)"
                    value={editTotalBill}
                    onChangeText={text => {
                      setEditTotalBill(text);
                      if (editStatus === 'COLLECTED' && (!editCollected || editCollected === editTotalBill)) {
                        setEditCollected(text);
                      }
                    }}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g. 5000"
                  />

                  <TextInput
                    label="Cash Amount Collected (₹)"
                    value={editCollected}
                    onChangeText={setEditCollected}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                    placeholder={editStatus === 'DELAYED' ? '0' : 'e.g. 5000'}
                  />
                </View>

                {/* Logical Payment Due Banner: Total - Collected = Due */}
                <View style={styles.dueCalculationBanner}>
                  <View style={styles.dueCalculationRow}>
                    <Text style={styles.dueCalculationLabel}>Due / Carry Forward Amount:</Text>
                    <Text
                      style={[
                        styles.dueCalculationValue,
                        computedDue > 0 ? { color: colors.warning } : { color: colors.success },
                      ]}
                    >
                      {formatCurrency(computedDue)}
                    </Text>
                  </View>
                  <Text style={styles.dueCalculationFormula}>
                    Formula: Total ({formatCurrency(billNum)}) − Collected ({formatCurrency(collectedNum)}) = Due ({formatCurrency(computedDue)})
                  </Text>
                </View>

                {/* Remarks / Reason Input */}
                <TextInput
                  label="Remarks / Delay Reason / Notes"
                  value={editRemarks}
                  onChangeText={setEditRemarks}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g. Will pay next Monday / Carry forward"
                />

                <View style={styles.modalBtnRow}>
                  <Button
                    mode="contained"
                    style={styles.saveBtn}
                    onPress={handleSaveStop}
                    loading={saving}
                    disabled={saving}
                  >
                    Save Changes
                  </Button>
                  <Button
                    mode="outlined"
                    style={styles.cancelBtn}
                    textColor={colors.textPrimary}
                    onPress={() => setModalVisible(false)}
                  >
                    Cancel
                  </Button>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  tableHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  tableSubheading: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressChip: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  horizontalScroll: {
    marginHorizontal: -4,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 48,
  },
  headerRow: {
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  alternateRow: {
    backgroundColor: colors.surfaceAlt + '44',
  },
  totalRow: {
    backgroundColor: colors.surfaceAlt,
    borderTopWidth: 2,
    borderTopColor: colors.secondary,
    borderBottomWidth: 0,
    minHeight: 52,
  },
  cell: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  headerText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  bodyText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  subAddress: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  billText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'right',
  },
  collectedText: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'right',
  },
  dueText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'right',
  },
  dueTextPositive: {
    color: colors.warning,
  },
  dueTextZero: {
    color: colors.textSecondary,
  },
  totalText: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  totalValue: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  totalBillValue: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'right',
  },
  totalCollectedValue: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'right',
  },
  totalDueValue: {
    color: colors.warning,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'right',
  },
  totalSubText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },

  // Column Widths
  colNo: { width: 44, textAlign: 'center', alignItems: 'center' },
  colCustomer: { width: 140 },
  colBox: { width: 85, textAlign: 'center', alignItems: 'center' },
  colTotalAmt: { width: 100, textAlign: 'right' },
  colCollected: { width: 100, textAlign: 'right' },
  colDue: { width: 110, textAlign: 'right' },
  colStatus: { width: 145 },
  colAction: { width: 50, alignItems: 'center', justifyContent: 'center' },

  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  remarkSnippet: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
    fontStyle: 'italic',
  },
  editIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalMerchantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalMerchantAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  deliveryItemsBox: {
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deliveryItemsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  deliveryItemText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipActiveGreen: {
    backgroundColor: colors.success + '33',
    borderColor: colors.success,
  },
  statusChipActiveOrange: {
    backgroundColor: colors.warning + '33',
    borderColor: colors.warning,
  },
  statusChipActiveGray: {
    backgroundColor: colors.textSecondary + '33',
    borderColor: colors.textSecondary,
  },
  statusChipActiveRed: {
    backgroundColor: colors.error + '33',
    borderColor: colors.error,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    marginBottom: 10,
  },
  dueCalculationBanner: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dueCalculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueCalculationLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  dueCalculationValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  dueCalculationFormula: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  cancelBtn: {
    flex: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
});