import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';

export default function MaintenanceTab() {
  const { maintenance, vehicles } = useDashboardData();

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.sectionCard, { flex: 1 }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle, marginBottom: 20 }]}>MAINTENANCE TICKETS</Text>

        {/* Table Header */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>DATE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>VEHICLE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>TYPE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3, fontFamily: fontStyle }]}>DESCRIPTION</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>COST</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle }]}>STATUS</Text>
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
                <View style={{ flex: 1.2, alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: m.status === 'submitted' ? '#F0FDF4' : '#FEF2F2',
                    borderColor: m.status === 'submitted' ? '#DCFCE7' : '#FEE2E2',
                    borderWidth: 1,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                  }}>
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '800',
                      color: m.status === 'submitted' ? '#16A34A' : '#DC2626',
                      fontFamily: fontStyle,
                    }}>
                      {m.status === 'submitted' ? 'RESOLVED' : 'REPORTED'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
