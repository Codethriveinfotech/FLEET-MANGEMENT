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
      <View style={[styles.sectionCard, {
        flex: 1,
        padding: 24,
        borderRadius: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
      }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#EFF6FF',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 14,
              borderWidth: 1,
              borderColor: '#DBEAFE',
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
              shadowColor: '#1D4ED8',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
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
          backgroundColor: '#F8FAFC',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 11,
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

        {/* Custom Spaced Modern Table Headers */}
        <View style={[styles.tableHeaderRow, {
          backgroundColor: '#F8FAFC',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 10,
          marginBottom: 16,
          alignItems: 'center'
        }]}>
          <View style={{ flex: 1.6 }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', fontFamily: fontStyle, letterSpacing: 0.3 }}>Plate Number</Text></View>
          <View style={{ flex: 1.2 }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', fontFamily: fontStyle, letterSpacing: 0.3 }}>Type</Text></View>
          <View style={{ flex: 1.8 }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', fontFamily: fontStyle, letterSpacing: 0.3 }}>Model</Text></View>
          <View style={{ flex: 1.3 }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', fontFamily: fontStyle, letterSpacing: 0.3 }}>Fuel Type</Text></View>
          <View style={{ flex: 1.8 }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', fontFamily: fontStyle, letterSpacing: 0.3 }}>Registration No.</Text></View>
          <View style={{ flex: 1.5 }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', fontFamily: fontStyle, letterSpacing: 0.3 }}>Mileage</Text></View>
          <View style={{ flex: 1.3 }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', fontFamily: fontStyle, letterSpacing: 0.3 }}>Status</Text></View>
          <View style={{ flex: 1.2, alignItems: 'center' }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', fontFamily: fontStyle, letterSpacing: 0.3 }}>Actions</Text></View>
        </View>

        {/* Scrollable table rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 4 }}>
            {filteredVehicles.map((veh) => {
              const displayPlate = veh.number || 'UNKNOWN';
              const modelName = veh.model || '—';
              const regNo = veh.registrationNumber || '—';
              const mileageVal = veh.mileage ? `${Number(veh.mileage).toLocaleString()} km` : '0 km';
              
              // Resolve Type Icon & Color
              const vType = (veh.type || 'Truck').toLowerCase();
              let typeIcon: any = 'bus-outline';
              let typeColor = '#2563EB';
              let typeLabel = 'Truck';
              
              if (vType.includes('sedan')) {
                typeIcon = 'car-sport';
                typeColor = '#3B82F6';
                typeLabel = 'Sedan';
              } else if (vType.includes('hatchback') || vType.includes('hatch')) {
                typeIcon = 'car-sport';
                typeColor = '#10B981';
                typeLabel = 'Hatchback';
              } else if (vType.includes('suv')) {
                typeIcon = 'car';
                typeColor = '#8B5CF6';
                typeLabel = 'SUV';
              } else if (vType.includes('van')) {
                typeIcon = 'car';
                typeColor = '#4F46E5';
                typeLabel = 'Van';
              }
              
              // Resolve Status Badge styling
              const vStatus = (veh.status || 'Active').toLowerCase();
              let statusBg = '#E8F5E9';
              let statusTextColor = '#2E7D32';
              let statusText = 'Active';
              let statusDotColor = '#10B981';
              
              if (vStatus.includes('main')) {
                statusBg = '#FFF3E0';
                statusTextColor = '#E65100';
                statusText = 'In Maintenance';
                statusDotColor = '#EA580C';
              } else if (vStatus.includes('inact')) {
                statusBg = '#ECEFF1';
                statusTextColor = '#455A64';
                statusText = 'Inactive';
                statusDotColor = '#64748B';
              }

              return (
                <View key={veh.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderColor: '#F8FAFC',
                }}>
                  {/* Plate Number (White pill badge with rounded border & custom letter spacing) */}
                  <View style={{ flex: 1.6, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#CBD5E1',
                      borderRadius: 8,
                      paddingVertical: 5,
                      paddingHorizontal: 12,
                      alignSelf: 'flex-start',
                      shadowColor: '#0F172A',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.02,
                      shadowRadius: 4,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E293B', fontFamily: 'monospace', letterSpacing: 0.5 }}>{displayPlate.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Type (Colored icon next to type text) */}
                  <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={typeIcon} size={15} color={typeColor} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, color: typeColor, fontWeight: '600', fontFamily: fontStyle }}>{typeLabel}</Text>
                  </View>

                  {/* Model */}
                  <View style={{ flex: 1.8 }}>
                    <Text style={{ fontSize: 13, color: '#475569', fontFamily: fontStyle, fontWeight: '500' }}>{modelName}</Text>
                  </View>

                  {/* Fuel Type */}
                  <View style={{ flex: 1.3 }}>
                    <Text style={{ fontSize: 13, color: '#475569', fontFamily: fontStyle }}>{veh.fuelType || 'Diesel'}</Text>
                  </View>

                  {/* Registration No */}
                  <View style={{ flex: 1.8 }}>
                    <Text style={{ fontSize: 13, color: '#64748B', fontFamily: 'monospace' }}>{regNo}</Text>
                  </View>

                  {/* Mileage with green speedometer icon */}
                  <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="speedometer-outline" size={14} color="#24D164" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', fontFamily: fontStyle }}>{mileageVal}</Text>
                  </View>

                  {/* Status Pill Badge with colored indicator dot */}
                  <View style={{ flex: 1.3, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: statusBg,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusDotColor, marginRight: 6 }} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: statusTextColor, fontFamily: fontStyle }}>{statusText}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#EFF6FF',
                        borderWidth: 1,
                        borderColor: '#DBEAFE',
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
                        borderWidth: 1,
                        borderColor: '#FEE2E2',
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
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {['Sedan', 'Hatchback', 'SUV', 'Truck', 'Van'].map((t) => {
                  const isSel = vehicleForm.type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setVehicleForm({ ...vehicleForm, type: t })}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isSel ? '#1D4ED8' : '#E2E8F0',
                        backgroundColor: isSel ? '#EFF6FF' : '#FFFFFF',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isSel ? '#1D4ED8' : '#475569' }}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>REGISTRATION NUMBER</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.registrationNumber} onChangeText={(val) => setVehicleForm({ ...vehicleForm, registrationNumber: val })} />
              
              <Text style={styles.inputLabel}>FUEL TYPE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {['Diesel', 'Petrol', 'CNG', 'Electric'].map((f) => {
                  const isSel = vehicleForm.fuelType === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setVehicleForm({ ...vehicleForm, fuelType: f })}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isSel ? '#1D4ED8' : '#E2E8F0',
                        backgroundColor: isSel ? '#EFF6FF' : '#FFFFFF',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isSel ? '#1D4ED8' : '#475569' }}>{f}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

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

