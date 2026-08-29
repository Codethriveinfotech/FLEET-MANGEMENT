import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Image } from 'react-native';
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
      <View style={[styles.sectionCard, { flex: 1, padding: 24 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#EFF6FF',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 14
            }}>
              <Ionicons name="car" size={24} color="#1D4ED8" />
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle, marginBottom: 2 }}>Vehicle List</Text>
              <Text style={{ fontSize: 12, color: '#64748B', fontFamily: fontStyle }}>Manage and track your vehicles</Text>
            </View>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: '#1D4ED8',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
            onPress={() => openVehicleModal()}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontFamily: fontStyle }}>Add Vehicle</Text>
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

        {/* Custom Spaced Modern Table Headers (Fixed to Match Screenshot) */}
        <View style={[styles.tableHeaderRow, {
          backgroundColor: '#F1F5F9',
          borderBottomWidth: 0,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          marginBottom: 16,
          alignItems: 'center'
        }]}>
          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="card" size={14} color="#0052CC" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', fontFamily: fontStyle }}>Plate Number</Text>
          </View>
          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="car" size={14} color="#0052CC" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', fontFamily: fontStyle }}>Model</Text>
          </View>
          <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pricetag" size={14} color="#0052CC" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', fontFamily: fontStyle }}>Type</Text>
          </View>
          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="document-text" size={14} color="#0052CC" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', fontFamily: fontStyle }}>Registration No</Text>
          </View>
          <View style={{ flex: 1.6, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="speedometer" size={14} color="#0052CC" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', fontFamily: fontStyle }}>Mileage</Text>
          </View>
          <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="settings" size={14} color="#0052CC" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', fontFamily: fontStyle }}>Actions</Text>
          </View>
        </View>

        {/* Scrollable table rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 4 }}>
            {filteredVehicles.map((veh) => {
              const displayPlate = veh.number || 'UNKNOWN';
              const isTruck = !veh.type || veh.type.toLowerCase().includes('truck');
              const tagBg = isTruck ? '#EFF6FF' : '#FFF7ED';
              const tagBorder = isTruck ? '#DBEAFE' : '#FFEDD5';
              const tagText = isTruck ? '#1D4ED8' : '#EA580C';

              return (
                <View key={veh.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderColor: '#F1F5F9',
                }}>
                  {/* Plate Badge design with IND flag */}
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      flexDirection: 'row',
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 6,
                      overflow: 'hidden',
                      height: 38,
                      alignItems: 'center',
                      minWidth: 130
                    }}>
                      <View style={{
                        width: 18,
                        height: '100%',
                        backgroundColor: '#0052CC',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 2
                      }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFD700', marginBottom: 2 }} />
                        <Text style={{ fontSize: 5, fontWeight: '900', color: '#FFFFFF' }}>IND</Text>
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 8, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{displayPlate}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Model column with vehicle thumbnail image */}
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                      source={{ uri: isTruck ? "https://cdn-icons-png.flaticon.com/128/744/744465.png" : "https://cdn-icons-png.flaticon.com/128/741/741407.png" }}
                      style={{ width: 34, height: 34, marginRight: 12, resizeMode: 'contain' }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', fontFamily: fontStyle }}>{veh.model}</Text>
                  </View>

                  {/* Pill Badge */}
                  <View style={{ flex: 1.2 }}>
                    <View style={{
                      alignSelf: 'flex-start',
                      backgroundColor: tagBg,
                      borderColor: tagBorder,
                      borderWidth: 1,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: tagText, fontFamily: fontStyle }}>{(veh.type || 'Truck').toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Registration No */}
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontSize: 13, color: '#64748B', fontFamily: fontStyle }}>{veh.registrationNumber}</Text>
                  </View>

                  {/* Mileage with green speedometer icon */}
                  <View style={{ flex: 1.6, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="speedometer-outline" size={14} color="#24D164" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', fontFamily: fontStyle }}>
                      {veh.mileage ? `${Number(veh.mileage).toLocaleString()}` : '0'} km
                    </Text>
                  </View>

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

