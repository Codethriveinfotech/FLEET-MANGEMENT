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

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.model.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

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
      {/* Vehicles Search & Action Card */}
      <View style={[styles.sectionCard, { flex: 1 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>FLEET INVENTORY</Text>
          <TouchableOpacity
            style={[styles.addButton, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => openVehicleModal()}
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addButtonText}>ADD VEHICLE</Text>
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
            placeholder="Search fleet by license plate, vehicle model or brand..."
            placeholderTextColor="#94A3B8"
            value={vehicleSearch}
            onChangeText={setVehicleSearch}
          />
        </View>

        {/* Custom Spaced Modern Table Headers (Fixed) */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>PLATE NUMBER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>MODEL</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>TYPE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>REGISTRATION NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>MILEAGE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle }]}>ACTIONS</Text>
        </View>

        {/* Scrollable table rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.table}>
            {filteredVehicles.map((veh) => {
              const displayPlate = veh.number || 'UNKNOWN';
              const isTruck = !veh.type || veh.type.toLowerCase().includes('truck');
              const tagBg = isTruck ? '#EFF6FF' : '#FFF7ED';
              const tagBorder = isTruck ? '#DBEAFE' : '#FFEDD5';
              const tagText = isTruck ? '#1D4ED8' : '#EA580C';

              return (
                <View key={veh.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                  {/* Plate Badge design */}
                  <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: '#FFF',
                      borderWidth: 1.5,
                      borderColor: '#1E293B',
                      borderRadius: 4,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{displayPlate}</Text>
                    </View>
                  </View>

                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }]}>{veh.model}</Text>

                  {/* Pill Badge */}
                  <View style={{ flex: 1.2 }}>
                    <View style={{
                      alignSelf: 'flex-start',
                      backgroundColor: tagBg,
                      borderColor: tagBorder,
                      borderWidth: 1,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: tagText, fontFamily: fontStyle }}>{(veh.type || 'Truck').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={[styles.tableCell, { flex: 1.8, color: '#64748B', fontFamily: fontStyle }]}>{veh.registrationNumber}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, fontWeight: '700', color: '#334155', fontFamily: fontStyle }]}>{veh.mileage ? `${veh.mileage.toLocaleString()}` : '0'} km</Text>

                  {/* Circular Icon Actions */}
                  <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#EFF6FF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 8,
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
              );
            })}
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
