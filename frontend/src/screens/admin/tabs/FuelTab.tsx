import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../api/client';
import { FuelLog } from '@fleettrack/shared';

export default function FuelTab() {
  const { fuelLogs, vehicles, drivers, fetchData } = useDashboardData();
  const [fuelSearch, setFuelSearch] = useState('');
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    driverId: '',
    liters: '',
    cost: '',
    odometerReading: '',
    date: '',
    time: '',
  });

  const filteredLogs = fuelLogs.filter((log) => {
    const vehNo = vehicles.find((v) => v.id === log.vehicleId)?.number || '';
    const drName = drivers.find((d) => d.id === log.driverId)?.name || '';
    return (
      vehNo.toLowerCase().includes(fuelSearch.toLowerCase()) ||
      drName.toLowerCase().includes(fuelSearch.toLowerCase())
    );
  });

  // Calculate aggregates
  const totalLiters = fuelLogs.reduce((acc, log) => acc + (parseFloat(log.liters) || 0), 0);
  const totalCost = fuelLogs.reduce((acc, log) => acc + (parseFloat(log.cost) || 0), 0);

  const openLogModal = () => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setFuelForm({
      vehicleId: vehicles[0]?.id || '',
      driverId: drivers[0]?.id || '',
      liters: '',
      cost: '',
      odometerReading: '',
      date: formattedDate,
      time: formattedTime,
    });
    setLogModalVisible(true);
  };

  const handleSaveFuelLog = async () => {
    if (!fuelForm.vehicleId || !fuelForm.driverId || !fuelForm.liters || !fuelForm.cost) {
      alert('Vehicle, driver, liters, and cost are required');
      return;
    }

    try {
      await apiClient.post('/fuel', {
        id: `fuel_${Date.now()}`,
        vehicleId: fuelForm.vehicleId,
        driverId: fuelForm.driverId,
        liters: fuelForm.liters,
        cost: fuelForm.cost,
        odometerReading: fuelForm.odometerReading || '0',
        date: fuelForm.date,
        time: fuelForm.time,
      });
      setLogModalVisible(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save fuel log');
    }
  };

  const handleDeleteFuelLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this fuel log?')) return;
    try {
      await apiClient.delete(`/fuel/${logId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete fuel log');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Dynamic Summary Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="funnel-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Fuel Consumption</Text>
            <Text style={styles.statValue}>{totalLiters.toFixed(1)} L</Text>
            <Text style={styles.statTrendText}>Logged across all vehicles</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#10B981' }]}>
            <Ionicons name="cash-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Fuel Cost</Text>
            <Text style={styles.statValue}>${totalCost.toFixed(2)}</Text>
            <Text style={styles.statTrendText}>Accumulated expenditures</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="reader-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Fuel Refills</Text>
            <Text style={styles.statValue}>{fuelLogs.length}</Text>
            <Text style={styles.statTrendText}>Registered receipts</Text>
          </View>
        </View>
      </View>

      {/* Fuel Log Table Section */}
      <View style={[styles.sectionCard, { flex: 1 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>VEHICLE FUEL LOGS</Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontFamily: fontStyle, marginTop: 2 }}>
              Showing {filteredLogs.length} of {fuelLogs.length} entries
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={openLogModal}
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addButtonText}>LOG FUEL ENTRY</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Modern Search Input */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          marginBottom: 24,
        }}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
          <TextInput
            style={{ flex: 1, fontSize: 13, color: '#0F172A', outlineStyle: 'none', fontFamily: fontStyle } as any}
            placeholder="Search fuel entries by driver name or license plate..."
            placeholderTextColor="#94A3B8"
            value={fuelSearch}
            onChangeText={setFuelSearch}
          />
        </View>

        {/* Custom Spaced Table Header Row */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 0.6, fontFamily: fontStyle }]}>S.NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6, fontFamily: fontStyle }]}>DATE / TIME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>OPERATOR DRIVER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>VEHICLE NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>FUEL QUANTITY</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>TOTAL COST</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6, textAlign: 'right', fontFamily: fontStyle }]}>ODOMETER READING</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle }]}>ACTIONS</Text>
        </View>

        {/* Scrollable table rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.table}>
            {filteredLogs.map((log, idx) => {
              const driverObj = drivers.find((d) => d.id === log.driverId);
              const driverName = driverObj?.name || 'Unknown';
              const initials = driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              const vehicleObj = vehicles.find((v) => v.id === log.vehicleId);
              const plateNo = vehicleObj?.number || 'Unknown';

              return (
                <View key={log.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                  {/* S.No */}
                  <Text style={[styles.tableCell, { flex: 0.6, color: '#64748B', fontWeight: 'bold', fontFamily: fontStyle }]}>{idx + 1}</Text>

                  {/* Date & Time stacked */}
                  <View style={{ flex: 1.6, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: fontStyle }}>{log.date}</Text>
                    {log.time ? (
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>{log.time}</Text>
                    ) : null}
                  </View>

                  {/* Operator Driver */}
                  <View style={{ flex: 1.8, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: '#3B82F615',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10,
                      borderWidth: 1,
                      borderColor: '#3B82F625',
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1D4ED8', fontFamily: fontStyle }}>{initials}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }} numberOfLines={1}>{driverName}</Text>
                  </View>

                  {/* Vehicle License Plate */}
                  <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: '#FFF',
                      borderWidth: 1.5,
                      borderColor: '#1E293B',
                      borderRadius: 4,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{plateNo}</Text>
                    </View>
                  </View>

                  {/* Quantity */}
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: '#0284C7', fontFamily: fontStyle }]}>
                    {parseFloat(log.liters).toFixed(1)} L
                  </Text>

                  {/* Cost */}
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: '#10B981', fontFamily: fontStyle }]}>
                    ${parseFloat(log.cost).toFixed(2)}
                  </Text>

                  {/* Odometer */}
                  <Text style={[styles.tableCell, { flex: 1.6, textAlign: 'right', fontWeight: '700', color: '#1E293B', fontFamily: fontStyle }]}>
                    {parseInt(log.odometerReading).toLocaleString()} km
                  </Text>

                  {/* Delete Action Button */}
                  <View style={{ flex: 1.2, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#FEF2F2',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onPress={() => handleDeleteFuelLog(log.id)}
                    >
                      <Ionicons name="trash" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Log Fuel Modal */}
      <Modal visible={logModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>LOG VEHICLE FUEL PURCHASE</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>SELECT VEHICLE</Text>
              <View style={{
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                marginBottom: 16,
                backgroundColor: '#FFFFFF',
                overflow: 'hidden',
              }}>
                <select
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 14,
                    border: 'none',
                    outline: 'none',
                    color: '#0F172A',
                    backgroundColor: 'transparent',
                    fontFamily: fontStyle,
                  }}
                  value={fuelForm.vehicleId}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.number} ({v.model})
                    </option>
                  ))}
                </select>
              </View>

              <Text style={styles.inputLabel}>SELECT DRIVER</Text>
              <View style={{
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                marginBottom: 16,
                backgroundColor: '#FFFFFF',
                overflow: 'hidden',
              }}>
                <select
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 14,
                    border: 'none',
                    outline: 'none',
                    color: '#0F172A',
                    backgroundColor: 'transparent',
                    fontFamily: fontStyle,
                  }}
                  value={fuelForm.driverId}
                  onChange={(e) => setFuelForm({ ...fuelForm, driverId: e.target.value })}
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </View>

              <Text style={styles.inputLabel}>FUEL QUANTITY (LITERS)</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. 45.5" placeholderTextColor="#94A3B8" value={fuelForm.liters} onChangeText={(val) => setFuelForm({ ...fuelForm, liters: val })} keyboardType="numeric" />
              
              <Text style={styles.inputLabel}>TOTAL COST ($)</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. 90.00" placeholderTextColor="#94A3B8" value={fuelForm.cost} onChangeText={(val) => setFuelForm({ ...fuelForm, cost: val })} keyboardType="numeric" />

              <Text style={styles.inputLabel}>CURRENT ODOMETER READING (KM)</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. 124500" placeholderTextColor="#94A3B8" value={fuelForm.odometerReading} onChangeText={(val) => setFuelForm({ ...fuelForm, odometerReading: val })} keyboardType="numeric" />

              <Text style={styles.inputLabel}>DATE</Text>
              <TextInput style={styles.modalInput} placeholder="DD/MM/YYYY" placeholderTextColor="#94A3B8" value={fuelForm.date} onChangeText={(val) => setFuelForm({ ...fuelForm, date: val })} />

              <Text style={styles.inputLabel}>TIME</Text>
              <TextInput style={styles.modalInput} placeholder="HH:MM" placeholderTextColor="#94A3B8" value={fuelForm.time} onChangeText={(val) => setFuelForm({ ...fuelForm, time: val })} />
            </ScrollView>
            
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setLogModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#475569' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1D4ED8' }]} onPress={handleSaveFuelLog}>
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>SAVE ENTRY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
