import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { apiClient } from '../../../api/client';

export default function MaintenanceTab() {
  const { maintenance, vehicles, fetchData } = useDashboardData();
  const [resolveMaintModalVisible, setResolveMaintModalVisible] = useState(false);
  const [resolvingMaint, setResolvingMaint] = useState<any>(null);
  const [resolveForm, setResolveForm] = useState({
    cost: '',
    serviceNotes: '',
  });

  const openResolveMaintModal = (maintRecord: any) => {
    setResolvingMaint(maintRecord);
    setResolveForm({
      cost: maintRecord.cost || '',
      serviceNotes: maintRecord.serviceNotes || '',
    });
    setResolveMaintModalVisible(true);
  };

  const handleResolveMaint = async () => {
    if (!resolveForm.cost.trim()) {
      alert('Cost is required to resolve maintenance request');
      return;
    }

    try {
      await apiClient.put(`/maintenance/${resolvingMaint.id}`, {
        ...resolvingMaint,
        cost: resolveForm.cost,
        serviceNotes: resolveForm.serviceNotes,
        status: 'submitted',
      });
      setResolveMaintModalVisible(false);
      fetchData();
    } catch (err) {
      alert('Failed to resolve maintenance request');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.sectionCard, { flex: 1 }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle, marginBottom: 20 }]}>MAINTENANCE TICKETS</Text>
        
        {/* Custom Spaced Table Header Row (Fixed) */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>DATE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>VEHICLE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>TYPE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3, fontFamily: fontStyle }]}>DESCRIPTION</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>COST</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle }]}>STATUS</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle }]}>ACTION</Text>
        </View>

        {/* Scrollable table rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.table}>
            {maintenance.map((m) => (
              <View key={m.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                <Text style={[styles.tableCell, { flex: 1.2, fontFamily: fontStyle }]}>{m.date}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold', color: '#1F232B', fontFamily: fontStyle }]}>
                  {vehicles.find((v) => v.id === m.vehicleId)?.number || 'Unknown'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5, color: '#F59E0B', fontWeight: 'bold', fontFamily: fontStyle }]}>{m.maintenanceType}</Text>
                <Text style={[styles.tableCell, { flex: 3, fontFamily: fontStyle }]} numberOfLines={2}>{m.description}</Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: 'bold', fontFamily: fontStyle }]}>
                  {m.cost ? `$${m.cost}` : 'N/A'}
                </Text>
                <Text style={[
                  styles.tableCell, 
                  { flex: 1.2, textAlign: 'center', fontWeight: 'bold', color: m.status === 'submitted' ? '#24D164' : '#FF3B30', fontFamily: fontStyle }
                ]}>
                  {m.status === 'submitted' ? 'RESOLVED' : 'REPORTED'}
                </Text>
                <View style={{ flex: 1.2, alignItems: 'center' }}>
                  {m.status !== 'submitted' ? (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1D4ED8', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }]} onPress={() => openResolveMaintModal(m)}>
                      <Text style={[styles.actionBtnText, { color: '#FFFFFF', fontFamily: fontStyle }]}>RESOLVE</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: '#94A3B8', fontSize: 12, fontFamily: fontStyle, fontWeight: '700' }}>CLOSED</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Resolve Maintenance Modal */}
      <Modal visible={resolveMaintModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>RESOLVE DEFECT / MAINTENANCE</Text>
            <Text style={styles.inputLabel}>SERVICE COST ($)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 1500" placeholderTextColor="#94A3B8" value={resolveForm.cost} onChangeText={(val) => setResolveForm({ ...resolveForm, cost: val })} keyboardType="numeric" />
            <Text style={styles.inputLabel}>COMPLETION / SERVICE NOTES</Text>
            <TextInput style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]} placeholder="Enter service details, parts replaced, etc." placeholderTextColor="#94A3B8" value={resolveForm.serviceNotes} onChangeText={(val) => setResolveForm({ ...resolveForm, serviceNotes: val })} multiline />
            
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setResolveMaintModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#475569' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1D4ED8' }]} onPress={handleResolveMaint}>
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>RESOLVE REQUEST</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
