import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../api/client';
import { User } from '@fleettrack/shared';

export default function AdminsTab() {
  const { admins, fetchData } = useDashboardData();
  const [adminSearch, setAdminSearch] = useState('');
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.phone.includes(adminSearch)
  );

  const openAdminModal = (admin: User | null = null) => {
    setEditingAdmin(admin);
    if (admin) {
      setAdminForm({
        name: admin.name,
        phone: admin.phone,
        email: admin.email || '',
        password: '',
      });
    } else {
      setAdminForm({
        name: '',
        phone: '',
        email: '',
        password: '',
      });
    }
    setAdminModalVisible(true);
  };

  const handleSaveAdmin = async () => {
    if (!adminForm.name.trim() || !adminForm.phone.trim() || (!editingAdmin && !adminForm.password)) {
      alert('Name, phone and password (for new admin) are required');
      return;
    }

    try {
      if (editingAdmin) {
        await apiClient.put(`/users/${editingAdmin.id}`, {
          id: editingAdmin.id,
          name: adminForm.name,
          phone: adminForm.phone,
          email: adminForm.email || null,
          role: 'ADMIN',
          password: adminForm.password || null,
        });
      } else {
        await apiClient.post('/auth/register', {
          id: `adm_${Date.now()}`,
          name: adminForm.name,
          phone: adminForm.phone,
          email: adminForm.email || null,
          role: 'ADMIN',
          password: adminForm.password,
        });
      }
      setAdminModalVisible(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save admin');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to permanently delete this admin?')) return;
    try {
      await apiClient.delete(`/users/${adminId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete admin');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Admins Search & Action Card */}
      <View style={[styles.sectionCard, { flex: 1 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>ADMINISTRATOR DIRECTORY</Text>
          <TouchableOpacity
            style={[styles.addButton, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => openAdminModal()}
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addButtonText}>ADD NEW ADMIN</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
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
            placeholder="Search admins by name, phone or email..."
            placeholderTextColor="#94A3B8"
            value={adminSearch}
            onChangeText={setAdminSearch}
          />
        </View>

        {/* Table Headers */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle, fontSize: 13 }]}>ADMIN NAME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle, fontSize: 13 }]}>PHONE NUMBER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle, fontSize: 13 }]}>EMAIL ADDRESS</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle, fontSize: 13 }]}>ACTIONS</Text>
        </View>

        {/* Scrollable table rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.table}>
            {filteredAdmins.map((admin) => {
              const initials = admin.name ? admin.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD';
              return (
                <View key={admin.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                  {/* Admin Profile */}
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#F3E8FF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                      borderWidth: 1,
                      borderColor: '#E9D5FF',
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#7E22CE', fontFamily: fontStyle }}>{initials}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }}>{admin.name}</Text>
                  </View>

                  <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '500', color: '#334155', fontFamily: fontStyle, fontSize: 14 }]}>{admin.phone}</Text>
                  <Text style={[styles.tableCell, { flex: 2, color: '#64748B', fontFamily: fontStyle, fontSize: 14 }]}>{admin.email || 'N/A'}</Text>

                  {/* Actions */}
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
                      onPress={() => openAdminModal(admin)}
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
                      onPress={() => handleDeleteAdmin(admin.id)}
                    >
                      <Ionicons name="trash" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {filteredAdmins.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="shield-outline" size={40} color="#CBD5E1" />
                <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 12, fontFamily: fontStyle }}>
                  No administrators registered yet
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Admin Add/Edit Modal */}
      <Modal visible={adminModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingAdmin ? 'EDIT ADMIN PROFILE' : 'REGISTER NEW ADMIN'}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput style={styles.modalInput} value={adminForm.name} onChangeText={(val) => setAdminForm({ ...adminForm, name: val })} />
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput style={styles.modalInput} value={adminForm.phone} onChangeText={(val) => setAdminForm({ ...adminForm, phone: val })} keyboardType="phone-pad" />
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput style={styles.modalInput} value={adminForm.email} onChangeText={(val) => setAdminForm({ ...adminForm, email: val })} />
              <Text style={styles.inputLabel}>{editingAdmin ? 'PASSWORD (LEAVE EMPTY)' : 'PASSWORD'}</Text>
              <TextInput style={styles.modalInput} value={adminForm.password} onChangeText={(val) => setAdminForm({ ...adminForm, password: val })} secureTextEntry={true} />
            </ScrollView>
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setAdminModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#475569' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1D4ED8' }]} onPress={handleSaveAdmin}>
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>SAVE ADMIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
