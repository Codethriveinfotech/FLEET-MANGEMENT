import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../api/client';
import { User } from '@fleettrack/shared';

export default function DriversTab() {
  const { drivers, fetchData } = useDashboardData();
  const [driverSearch, setDriverSearch] = useState('');
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<User | null>(null);
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    password: '',
  });

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.phone.includes(driverSearch)
  );

  const openDriverModal = (driver: User | null = null) => {
    setEditingDriver(driver);
    if (driver) {
      setDriverForm({
        name: driver.name,
        phone: driver.phone,
        email: driver.email || '',
        licenseNumber: driver.licenseNumber || '',
        password: '',
      });
    } else {
      setDriverForm({
        name: '',
        phone: '',
        email: '',
        licenseNumber: '',
        password: '',
      });
    }
    setDriverModalVisible(true);
  };

  const handleSaveDriver = async () => {
    if (!driverForm.name.trim() || !driverForm.phone.trim() || (!editingDriver && !driverForm.password)) {
      alert('Name, phone and password (for new driver) are required');
      return;
    }

    try {
      if (editingDriver) {
        await apiClient.put(`/users/${editingDriver.id}`, {
          id: editingDriver.id,
          name: driverForm.name,
          phone: driverForm.phone,
          email: driverForm.email || null,
          licenseNumber: driverForm.licenseNumber || null,
          password: driverForm.password || null,
        });
      } else {
        await apiClient.post('/auth/register', {
          id: `drv_${Date.now()}`,
          name: driverForm.name,
          phone: driverForm.phone,
          email: driverForm.email || null,
          licenseNumber: driverForm.licenseNumber || null,
          password: driverForm.password,
        });
      }
      setDriverModalVisible(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save driver');
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to permanently delete this driver?')) return;
    try {
      await apiClient.delete(`/users/${driverId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete driver');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Drivers Search & Action Card */}
      <View style={[styles.sectionCard, { flex: 1 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>OPERATOR DIRECTORY</Text>
          <TouchableOpacity
            style={[styles.addButton, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => openDriverModal()}
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addButtonText}>ADD NEW DRIVER</Text>
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
            placeholder="Search drivers by operator name, phone or email..."
            placeholderTextColor="#94A3B8"
            value={driverSearch}
            onChangeText={setDriverSearch}
          />
        </View>

        {/* Custom Spaced Modern Table Headers (Fixed) */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>OPERATOR NAME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>PHONE NUMBER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>EMAIL ADDRESS</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>LICENSE NUMBER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle }]}>ACTIONS</Text>
        </View>

        {/* Scrollable table rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.table}>
            {filteredDrivers.map((driver) => {
              const initials = driver.name ? driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR';
              return (
                <View key={driver.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                  {/* Driver Profile Column */}
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#EFF6FF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                      borderWidth: 1,
                      borderColor: '#DBEAFE',
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#1D4ED8', fontFamily: fontStyle }}>{initials}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }}>{driver.name}</Text>
                  </View>

                  <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '500', color: '#334155', fontFamily: fontStyle }]}>{driver.phone}</Text>
                  <Text style={[styles.tableCell, { flex: 2, color: '#64748B', fontFamily: fontStyle }]}>{driver.email || 'N/A'}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '700', color: '#475569', letterSpacing: 0.5, fontFamily: fontStyle }]}>{driver.licenseNumber || 'N/A'}</Text>

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
                      onPress={() => openDriverModal(driver)}
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
                      onPress={() => handleDeleteDriver(driver.id)}
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

      {/* Driver Add/Edit Modal */}
      <Modal visible={driverModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingDriver ? 'EDIT SYSTEM DRIVER' : 'REGISTER NEW DRIVER'}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput style={styles.modalInput} value={driverForm.name} onChangeText={(val) => setDriverForm({ ...driverForm, name: val })} />
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput style={styles.modalInput} value={driverForm.phone} onChangeText={(val) => setDriverForm({ ...driverForm, phone: val })} keyboardType="phone-pad" />
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput style={styles.modalInput} value={driverForm.email} onChangeText={(val) => setDriverForm({ ...driverForm, email: val })} />
              <Text style={styles.inputLabel}>LICENSE NUMBER</Text>
              <TextInput style={styles.modalInput} value={driverForm.licenseNumber} onChangeText={(val) => setDriverForm({ ...driverForm, licenseNumber: val })} />
              <Text style={styles.inputLabel}>{editingDriver ? 'PASSWORD (LEAVE EMPTY)' : 'PASSWORD'}</Text>
              <TextInput style={styles.modalInput} value={driverForm.password} onChangeText={(val) => setDriverForm({ ...driverForm, password: val })} secureTextEntry={true} />
            </ScrollView>
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setDriverModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#475569' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1D4ED8' }]} onPress={handleSaveDriver}>
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>SAVE DRIVER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
