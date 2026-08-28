import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';

export default function ReportsTab() {
  const { trips, drivers, vehicles, maintenance, fuelLogs } = useDashboardData();
  const [selectedReportType, setSelectedReportType] = useState('Trip Summary Report');
  const [duration, setDuration] = useState('1'); // '1' = 1 Month, '3' = 3 Months, '12' = 1 Year

  // Parse DD/MM/YYYY to Date
  const parseDate = (str: string): Date | null => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  // Filter based on chosen duration (Months)
  const getFilteredData = () => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(duration));

    const isWithinRange = (dateStr: string) => {
      const d = parseDate(dateStr);
      return d ? d >= cutoffDate : false;
    };

    const filteredTrips = trips.filter(t => isWithinRange(t.startDate));
    const filteredMaint = maintenance.filter(m => isWithinRange(m.date));
    const filteredFuel = fuelLogs.filter(f => isWithinRange(f.date));

    return { filteredTrips, filteredMaint, filteredFuel };
  };

  const { filteredTrips, filteredMaint, filteredFuel } = getFilteredData();

  // Excel / CSV Export Utility
  const handleDownloadExcel = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `${selectedReportType.replace(/\s+/g, '_')}_${duration}m_Report.csv`;

    if (selectedReportType === 'Trip Summary Report') {
      headers = ['S.No', 'Date', 'Time', 'Operator Driver', 'Vehicle No', 'Source', 'Destination', 'Start Odometer', 'End Odometer', 'Start HMR', 'End HMR', 'Status'];
      rows = filteredTrips.map((t, idx) => {
        const d = drivers.find(drv => drv.id === t.driverId)?.name || 'Unknown';
        const v = vehicles.find(veh => veh.id === t.vehicleId)?.number || 'Unknown';
        return [
          (idx + 1).toString(),
          t.startDate || '',
          t.startTime || '',
          d,
          v,
          t.sourceLocation || '',
          t.destinationLocation || '',
          t.startOdometer || '',
          t.endOdometer || 'Active',
          t.startHmr || '',
          t.endHmr || 'Active',
          t.status || ''
        ];
      });
    } else if (selectedReportType === 'Fuel Report') {
      headers = ['S.No', 'Date', 'Time', 'Vehicle No', 'Driver Name', 'Liters Refilled', 'Total Cost ($)', 'Odometer Reading'];
      rows = filteredFuel.map((f, idx) => {
        const v = vehicles.find(veh => veh.id === f.vehicleId)?.number || 'Unknown';
        const d = drivers.find(drv => drv.id === f.driverId)?.name || 'Unknown';
        return [
          (idx + 1).toString(),
          f.date || '',
          f.time || '',
          v,
          d,
          f.liters || '0',
          f.cost || '0',
          f.odometerReading || '0'
        ];
      });
    } else if (selectedReportType === 'Driver Performance Report') {
      headers = ['S.No', 'Driver Name', 'Total Trips', 'Day Shifts', 'Night Shifts', 'Breakdowns Count', 'Billing Days'];
      rows = drivers.map((driver, idx) => {
        const dTrips = filteredTrips.filter(t => t.driverId === driver.id);
        const dayShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('day')).length;
        const nightShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('night')).length;
        const breakdowns = dTrips.filter(t => t.isBreakdown).length;
        const billingDays = Math.max(0, dTrips.length - breakdowns);
        return [
          (idx + 1).toString(),
          driver.name || 'Unknown',
          dTrips.length.toString(),
          dayShifts.toString(),
          nightShifts.toString(),
          breakdowns.toString(),
          billingDays.toString()
        ];
      });
    } else if (selectedReportType === 'Vehicle Utilization Report') {
      headers = ['S.No', 'Vehicle No', 'Model', 'Total Trips Run', 'Total Distance Run (km)'];
      rows = vehicles.map((veh, idx) => {
        const vTrips = filteredTrips.filter(t => t.vehicleId === veh.id);
        const totalDist = vTrips.reduce((acc, t) => {
          const start = parseFloat(t.startOdometer) || 0;
          const end = parseFloat(t.endOdometer) || 0;
          return acc + (end >= start ? end - start : 0);
        }, 0);
        return [
          (idx + 1).toString(),
          veh.number || 'Unknown',
          veh.model || 'Unknown',
          vTrips.length.toString(),
          totalDist.toString()
        ];
      });
    } else if (selectedReportType === 'Maintenance Report') {
      headers = ['S.No', 'Date', 'Vehicle No', 'Driver Name', 'Type', 'Description', 'Notes', 'Cost ($)'];
      rows = filteredMaint.map((m, idx) => {
        const v = vehicles.find(veh => veh.id === m.vehicleId)?.number || 'Unknown';
        const d = drivers.find(drv => drv.id === m.driverId)?.name || 'Unknown';
        return [
          (idx + 1).toString(),
          m.date || '',
          v,
          d,
          m.maintenanceType || '',
          m.description || '',
          m.serviceNotes || '',
          m.cost || '0'
        ];
      });
    }

    // Convert array to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Trigger download in browser environment
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Left Pane: Report Types */}
      <View style={[styles.rightVehiclesPanel, { width: 280, marginRight: 24 }]}>
        <Text style={[styles.panelTitle, { marginBottom: 16, fontFamily: fontStyle }]}>Report Types</Text>
        {[
          { key: 'Trip Summary Report', label: 'Trip Summary Report', desc: 'Summary of all trips', icon: '📋' },
          { key: 'Fuel Report', label: 'Fuel Report', desc: 'Fuel consumption and refills', icon: '⛽' },
          { key: 'Driver Performance Report', label: 'Driver Performance Report', desc: 'Driver shift and billing analytics', icon: '👤' },
          { key: 'Vehicle Utilization Report', label: 'Vehicle Utilization Report', desc: 'Vehicle distance and usage stats', icon: '🚚' },
          { key: 'Maintenance Report', label: 'Maintenance Report', desc: 'Maintenance records and costs', icon: '🔧' },
        ].map((opt) => {
          const isSel = selectedReportType === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.menuItem,
                { paddingVertical: 12, paddingHorizontal: 12, backgroundColor: isSel ? '#EFF6FF' : 'transparent', borderWidth: 1, borderColor: isSel ? '#1D4ED8' : 'transparent', borderRadius: 8, marginBottom: 6 }
              ]}
              onPress={() => setSelectedReportType(opt.key)}
            >
              <Text style={{ fontSize: 14, marginRight: 10 }}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: isSel ? '#1D4ED8' : '#1E293B', fontFamily: fontStyle }}>{opt.label}</Text>
                <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Right Pane: Report Dashboard & Preview */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle }}>{selectedReportType}</Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontFamily: fontStyle }}>Live preview and export options for audit logs</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {/* Duration Selector */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 12,
            }}>
              <Ionicons name="time-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
              <select
                style={{
                  padding: '8px 4px',
                  fontSize: 13,
                  border: 'none',
                  outline: 'none',
                  color: '#0F172A',
                  backgroundColor: 'transparent',
                  fontFamily: fontStyle,
                  cursor: 'pointer',
                } as any}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="1">Last Month</option>
                <option value="3">Last 3 Months</option>
                <option value="12">Last 1 Year</option>
              </select>
            </View>

            {/* Download Report Button */}
            <TouchableOpacity
              style={[styles.panelAddBtn, { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', height: 38 }]}
              onPress={handleDownloadExcel}
            >
              <Ionicons name="download-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={[styles.panelAddBtnText, { fontFamily: fontStyle }]}>Download Excel (CSV)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Table Preview */}
        <View style={[styles.sectionCard, { flex: 1 }]}>
          <Text style={[styles.sectionTitle, { fontSize: 14, fontWeight: '800', fontFamily: fontStyle, marginBottom: 12 }]}>REPORT DATA PREVIEW</Text>
          
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {selectedReportType === 'Trip Summary Report' && (
              <View>
                <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8 }]}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.5, fontFamily: fontStyle }]}>S.NO</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>DATE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>OPERATOR</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>VEHICLE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>SOURCE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>DESTINATION</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right', fontFamily: fontStyle }]}>DIST (KM)</Text>
                </View>
                {filteredTrips.map((t, idx) => {
                  const d = drivers.find(drv => drv.id === t.driverId)?.name || 'Unknown';
                  const v = vehicles.find(veh => veh.id === t.vehicleId)?.number || 'Unknown';
                  const start = parseFloat(t.startOdometer) || 0;
                  const end = parseFloat(t.endOdometer) || 0;
                  const dist = end >= start ? (end - start) : 0;
                  return (
                    <View key={t.id} style={[styles.tableRow, { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                      <Text style={[styles.tableCell, { flex: 0.5, fontFamily: fontStyle }]}>{idx + 1}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontFamily: fontStyle }]}>{t.startDate}</Text>
                      <Text style={[styles.tableCell, { flex: 1.8, fontWeight: '700', fontFamily: fontStyle }]}>{d}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontFamily: fontStyle }]}>{v}</Text>
                      <Text style={[styles.tableCell, { flex: 2, fontFamily: fontStyle }]} numberOfLines={1}>{t.sourceLocation}</Text>
                      <Text style={[styles.tableCell, { flex: 2, fontFamily: fontStyle }]} numberOfLines={1}>{t.destinationLocation}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: '700', fontFamily: fontStyle }]}>{dist} km</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {selectedReportType === 'Fuel Report' && (
              <View>
                <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8 }]}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.5, fontFamily: fontStyle }]}>S.NO</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>DATE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>VEHICLE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>DRIVER</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>LITERS</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>COST</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>ODOMETER</Text>
                </View>
                {filteredFuel.map((f, idx) => {
                  const v = vehicles.find(veh => veh.id === f.vehicleId)?.number || 'Unknown';
                  const d = drivers.find(drv => drv.id === f.driverId)?.name || 'Unknown';
                  return (
                    <View key={f.id} style={[styles.tableRow, { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                      <Text style={[styles.tableCell, { flex: 0.5, fontFamily: fontStyle }]}>{idx + 1}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontFamily: fontStyle }]}>{f.date}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '700', fontFamily: fontStyle }]}>{v}</Text>
                      <Text style={[styles.tableCell, { flex: 1.8, fontFamily: fontStyle }]}>{d}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#0284C7', fontFamily: fontStyle }]}>{f.liters} L</Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#10B981', fontFamily: fontStyle }]}>${f.cost}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>{f.odometerReading} km</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {selectedReportType === 'Driver Performance Report' && (
              <View>
                <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8 }]}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.5, fontFamily: fontStyle }]}>S.NO</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>DRIVER NAME</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>TOTAL TRIPS</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>DAY SHIFTS</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>NIGHT SHIFTS</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>BREAKDOWNS</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>BILLING DAYS</Text>
                </View>
                {drivers.map((driver, idx) => {
                  const dTrips = filteredTrips.filter(t => t.driverId === driver.id);
                  const dayShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('day')).length;
                  const nightShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('night')).length;
                  const breakdowns = dTrips.filter(t => t.isBreakdown).length;
                  const billingDays = Math.max(0, dTrips.length - breakdowns);
                  return (
                    <View key={driver.id} style={[styles.tableRow, { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                      <Text style={[styles.tableCell, { flex: 0.5, fontFamily: fontStyle }]}>{idx + 1}</Text>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: '700', fontFamily: fontStyle }]}>{driver.name}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>{dTrips.length}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>{dayShifts}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>{nightShifts}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', color: breakdowns > 0 ? '#EF4444' : '#64748B', fontFamily: fontStyle }]}>{breakdowns}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#10B981', fontFamily: fontStyle }]}>{billingDays}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {selectedReportType === 'Vehicle Utilization Report' && (
              <View>
                <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8 }]}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.5, fontFamily: fontStyle }]}>S.NO</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>VEHICLE NO</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2.5, fontFamily: fontStyle }]}>MODEL</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>TOTAL TRIPS</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right', fontFamily: fontStyle }]}>DISTANCE RUN</Text>
                </View>
                {vehicles.map((veh, idx) => {
                  const vTrips = filteredTrips.filter(t => t.vehicleId === veh.id);
                  const totalDist = vTrips.reduce((acc, t) => {
                    const start = parseFloat(t.startOdometer) || 0;
                    const end = parseFloat(t.endOdometer) || 0;
                    return acc + (end >= start ? end - start : 0);
                  }, 0);
                  return (
                    <View key={veh.id} style={[styles.tableRow, { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                      <Text style={[styles.tableCell, { flex: 0.5, fontFamily: fontStyle }]}>{idx + 1}</Text>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: '700', fontFamily: fontStyle }]}>{veh.number}</Text>
                      <Text style={[styles.tableCell, { flex: 2.5, fontFamily: fontStyle }]}>{veh.model}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>{vTrips.length}</Text>
                      <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: '700', color: '#8B5CF6', fontFamily: fontStyle }]}>{totalDist.toLocaleString()} km</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {selectedReportType === 'Maintenance Report' && (
              <View>
                <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8 }]}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.5, fontFamily: fontStyle }]}>S.NO</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>DATE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>VEHICLE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>DRIVER</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>TYPE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>COST</Text>
                </View>
                {filteredMaint.map((m, idx) => {
                  const v = vehicles.find(veh => veh.id === m.vehicleId)?.number || 'Unknown';
                  const d = drivers.find(drv => drv.id === m.driverId)?.name || 'Unknown';
                  return (
                    <View key={m.id} style={[styles.tableRow, { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                      <Text style={[styles.tableCell, { flex: 0.5, fontFamily: fontStyle }]}>{idx + 1}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontFamily: fontStyle }]}>{m.date}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '700', fontFamily: fontStyle }]}>{v}</Text>
                      <Text style={[styles.tableCell, { flex: 1.8, fontFamily: fontStyle }]}>{d}</Text>
                      <Text style={[styles.tableCell, { flex: 2, color: '#F59E0B', fontWeight: '700', fontFamily: fontStyle }]} numberOfLines={1}>{m.maintenanceType}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#EF4444', fontFamily: fontStyle }]}>${m.cost}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
