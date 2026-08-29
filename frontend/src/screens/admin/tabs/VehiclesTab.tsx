import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../api/client';
import { Vehicle } from '@fleettrack/shared';

export default function VehiclesTab() {
  const { vehicles, fetchData } = useDashboardData();
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Running' | 'Breakdown'>('All');
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    number: '',
    model: '',
    type: 'Truck',
    registrationNumber: '',
    fuelType: 'Diesel',
    status: 'Active',
    mileage: '0',
    insuranceStatus: 'Valid',
  });

  // Calculate statistics dynamically
  const totalCount = vehicles.length;
  const activeCount = vehicles.filter(v => (v.status || '').toLowerCase() === 'active').length;
  const runningCount = vehicles.filter(v => (v.status || '').toLowerCase() === 'running').length;
  const breakdownCount = vehicles.filter(v => (v.status || '').toLowerCase().includes('break')).length;

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.model.toLowerCase().includes(vehicleSearch.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Active') return matchesSearch && (v.status || '').toLowerCase() === 'active';
    if (statusFilter === 'Running') return matchesSearch && (v.status || '').toLowerCase() === 'running';
    if (statusFilter === 'Breakdown') return matchesSearch && (v.status || '').toLowerCase().includes('break');
    return matchesSearch;
  });

  const openVehicleModal = (veh: Vehicle | null = null) => {
    setEditingVehicle(veh);
    if (veh) {
      setVehicleForm({
        number: veh.number,
        model: veh.model,
        type: veh.type || 'Truck',
        registrationNumber: veh.registrationNumber,
        fuelType: veh.fuelType || 'Diesel',
        status: veh.status || 'Active',
        mileage: String(veh.mileage || '0'),
        insuranceStatus: veh.insuranceStatus || 'Valid',
      });
    } else {
      setVehicleForm({
        number: '',
        model: '',
        type: 'Truck',
        registrationNumber: '',
        fuelType: 'Diesel',
        status: 'Active',
        mileage: '0',
        insuranceStatus: 'Valid',
      });
    }
    setVehicleModalVisible(true);
  };

  const handleSaveVehicle = async () => {
    if (!vehicleForm.number.trim() || !vehicleForm.model.trim() || !vehicleForm.registrationNumber.trim()) {
      alert('Plate number, model and registration number are required');
      return;
    }

    try {
      if (editingVehicle) {
        await apiClient.put(`/vehicles/${editingVehicle.id}`, {
          ...editingVehicle,
          number: vehicleForm.number,
          model: vehicleForm.model,
          type: vehicleForm.type,
          registrationNumber: vehicleForm.registrationNumber,
          fuelType: vehicleForm.fuelType,
          status: vehicleForm.status,
          mileage: parseInt(vehicleForm.mileage) || 0,
          insuranceStatus: vehicleForm.insuranceStatus,
        });
      } else {
        await apiClient.post('/vehicles', {
          id: `veh_${Date.now()}`,
          number: vehicleForm.number,
          model: vehicleForm.model,
          type: vehicleForm.type,
          registrationNumber: vehicleForm.registrationNumber,
          fuelType: vehicleForm.fuelType,
          status: vehicleForm.status,
          mileage: parseInt(vehicleForm.mileage) || 0,
          insuranceStatus: vehicleForm.insuranceStatus,
        });
      }
      setVehicleModalVisible(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleDeleteVehicle = async (vehId: string) => {
    if (!confirm('Are you sure you want to permanently delete this vehicle?')) return;
    try {
      await apiClient.delete(`/vehicles/${vehId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete vehicle');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Top Fleet Analytics Cards */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
        {/* Total Fleet Card */}
        <View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="car-outline" size={22} color="#1D4ED8" />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', fontFamily: fontStyle, letterSpacing: 0.5 }}>TOTAL FLEET</Text>
            <Text style={{ fontSize: 20, color: '#0F172A', fontWeight: '900', fontFamily: fontStyle }}>{totalCount} Vehicles</Text>
          </View>
        </View>

        {/* Active/Running Card */}
        <View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', fontFamily: fontStyle, letterSpacing: 0.5 }}>OPERATIONAL</Text>
            <Text style={{ fontSize: 20, color: '#0F172A', fontWeight: '900', fontFamily: fontStyle }}>{activeCount + runningCount} Online</Text>
          </View>
        </View>

        {/* Breakdown Card */}
        <View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', fontFamily: fontStyle, letterSpacing: 0.5 }}>WORKSHOP / ISSUES</Text>
            <Text style={{ fontSize: 20, color: '#0F172A', fontWeight: '900', fontFamily: fontStyle }}>{breakdownCount} Incidents</Text>
          </View>
        </View>
      </View>

      {/* Vehicles Search & Action Card */}
      <View style={[styles.sectionCard, { flex: 1, padding: 24, marginTop: 0 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={[styles.sectionTitle, { fontSize: 18, fontWeight: '800', fontFamily: fontStyle, color: '#0F172A', marginBottom: 4 }]}>Fleet Registry</Text>
            <Text style={{ fontSize: 12, color: '#64748B', fontFamily: fontStyle }}>Audit status, registration, fuel logs, and telemetry specs for the active fleet.</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 }]}
            onPress={() => openVehicleModal()}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={[styles.addButtonText, { fontWeight: '700' }]}>ADD NEW VEHICLE</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Toolbar: Search Bar + Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          {/* Custom Modern Search Input */}
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <TextInput
              style={{ flex: 1, fontSize: 13, color: '#0F172A', outlineStyle: 'none', fontFamily: fontStyle } as any}
              placeholder="Search fleet by license plate, vehicle model or brand..."
              placeholderTextColor="#94A3B8"
              value={vehicleSearch}
              onChangeText={setVehicleSearch}
            />
          </View>

          {/* Status Filter Pills */}
          <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 3 }}>
            {(['All', 'Active', 'Running', 'Breakdown'] as const).map((filter) => {
              const active = statusFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setStatusFilter(filter)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: active ? '#FFFFFF' : 'transparent',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: active ? 0.05 : 0,
                    shadowRadius: 2,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#1D4ED8' : '#64748B', fontFamily: fontStyle }}>{filter.toUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Scrollable list of 1-by-1 beautiful vehicle cards */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12, paddingBottom: 20 }}>
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((veh) => {
                const displayPlate = veh.number || 'UNKNOWN';
                const isTruck = !veh.type || veh.type.toLowerCase().includes('truck');
                const iconName = isTruck ? 'bus' : 'car-sport';
                const iconBg = isTruck ? '#EFF6FF' : '#FFF7ED';
                const iconColor = isTruck ? '#1D4ED8' : '#EA580C';
                
                const isRunning = (veh.status || '').toLowerCase() === 'running';
                const isBreakdown = (veh.status || '').toLowerCase().includes('break');
                const statusColor = isRunning ? '#2563EB' : isBreakdown ? '#EF4444' : '#10B981';
                const statusText = isRunning ? 'Running' : isBreakdown ? 'Breakdown' : 'Active';

                return (
                  <View
                    key={veh.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#F1F5F9',
                      borderRadius: 16,
                      padding: 16,
                      shadowColor: '#0F172A',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.015,
                      shadowRadius: 6,
                    }}
                  >
                    {/* Left Section: Vehicle Icon & Primary Info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 3.5, gap: 14 }}>
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: iconBg,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Ionicons name={iconName} size={22} color={iconColor} />
                      </View>
                      <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{
                            backgroundColor: '#FFF',
                            borderWidth: 1.5,
                            borderColor: '#1E293B',
                            borderRadius: 4,
                            paddingVertical: 2,
                            paddingHorizontal: 8,
                          }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{displayPlate}</Text>
                          </View>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle }}>{veh.model}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', letterSpacing: 0.5, fontFamily: fontStyle }}>
                          {(veh.type || 'Truck').toUpperCase()} • REG: {veh.registrationNumber || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {/* Middle Section: Operating Telemetry Info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 4.5, justifyContent: 'space-around' }}>
                      {/* Mileage */}
                      <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700', fontFamily: fontStyle, letterSpacing: 0.5 }}>MILEAGE</Text>
                        <Text style={{ fontSize: 13, color: '#334155', fontWeight: '800', fontFamily: fontStyle }}>{veh.mileage ? `${veh.mileage.toLocaleString()}` : '0'} km</Text>
                      </View>

                      {/* Fuel Type */}
                      <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700', fontFamily: fontStyle, letterSpacing: 0.5 }}>FUEL TYPE</Text>
                        <Text style={{ fontSize: 13, color: '#475569', fontWeight: '700', fontFamily: fontStyle }}>{veh.fuelType || 'Diesel'}</Text>
                      </View>

                      {/* Insurance Status */}
                      <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700', fontFamily: fontStyle, letterSpacing: 0.5 }}>INSURANCE</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="shield-checkmark" size={12} color={veh.insuranceStatus === 'Valid' ? '#10B981' : '#EA580C'} style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 12, color: veh.insuranceStatus === 'Valid' ? '#10B981' : '#EA580C', fontWeight: '700', fontFamily: fontStyle }}>{veh.insuranceStatus || 'Valid'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Right Section: Status Badge & Actions */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 2, justifyContent: 'flex-end', gap: 14 }}>
                      <View style={{ backgroundColor: statusColor + '12', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor, marginRight: 6 }} />
                        <Text style={{ fontSize: 10, fontWeight: '800', color: statusColor }}>{statusText.toUpperCase()}</Text>
                      </View>

                      {/* Actions */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#EFF6FF',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => openVehicleModal(veh)}
                        >
                          <Ionicons name="pencil" size={14} color="#1D4ED8" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#FEF2F2',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => handleDeleteVehicle(veh.id)}
                        >
                          <Ionicons name="trash" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 50 }}>
                <Ionicons name="car-outline" size={48} color="#CBD5E1" />
                <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: '600', marginTop: 12, fontFamily: fontStyle }}>No vehicles match the filter criteria</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Vehicle Add/Edit Modal */}
      <Modal visible={vehicleModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingVehicle ? 'EDIT SYSTEM VEHICLE' : 'REGISTER NEW VEHICLE'}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>PLATE NUMBER</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.number} onChangeText={(val) => setVehicleForm({ ...vehicleForm, number: val })} />
              <Text style={styles.inputLabel}>MODEL</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.model} onChangeText={(val) => setVehicleForm({ ...vehicleForm, model: val })} />
              <Text style={styles.inputLabel}>VEHICLE TYPE</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.type} onChangeText={(val) => setVehicleForm({ ...vehicleForm, type: val })} />
              <Text style={styles.inputLabel}>REGISTRATION NUMBER</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.registrationNumber} onChangeText={(val) => setVehicleForm({ ...vehicleForm, registrationNumber: val })} />
              <Text style={styles.inputLabel}>FUEL TYPE</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.fuelType} onChangeText={(val) => setVehicleForm({ ...vehicleForm, fuelType: val })} />
              <Text style={styles.inputLabel}>MILEAGE (KM)</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.mileage} onChangeText={(val) => setVehicleForm({ ...vehicleForm, mileage: val })} keyboardType="numeric" />
              <Text style={styles.inputLabel}>INSURANCE STATUS</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.insuranceStatus} onChangeText={(val) => setVehicleForm({ ...vehicleForm, insuranceStatus: val })} />
            </ScrollView>
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setVehicleModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#475569' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1D4ED8' }]} onPress={handleSaveVehicle}>
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>SAVE VEHICLE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
