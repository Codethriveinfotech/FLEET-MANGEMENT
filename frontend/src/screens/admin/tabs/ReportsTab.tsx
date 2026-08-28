import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';

export default function ReportsTab() {
  const { trips, drivers, vehicles, maintenance } = useDashboardData();
  const [selectedReportType, setSelectedReportType] = useState('Trip Summary Report');
  const [reportMonth] = useState('This Month');
  const [spreadsheetVisible, setSpreadsheetVisible] = useState(false);
  const [spreadsheetTab, setSpreadsheetTab] = useState(0);

  const reportDriverFilter = '';
  const reportVehicleFilter = '';
  const reportDateRange = 'all';

  const getOperatorPerformanceStats = () => {
    return drivers.map((driver) => {
      const driverTrips = trips.filter((t) => t.driverId === driver.id);
      const uniqueDays = [...new Set(driverTrips.map((t) => t.startDate))].length;
      const dayShifts = driverTrips.filter((t) => (t.shift || '').toLowerCase().includes('day')).length;
      const nightShifts = driverTrips.filter((t) => (t.shift || '').toLowerCase().includes('night')).length;
      const breakdowns = driverTrips.filter((t) => t.isBreakdown).length;
      
      const sundays = driverTrips.filter((t) => {
        const parts = (t.startDate || '').split('/');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          return d.getDay() === 0;
        }
        return false;
      }).length;

      const billingDays = driverTrips.length - breakdowns;

      return {
        id: driver.id,
        name: driver.name,
        totalMissions: driverTrips.length,
        uniqueDays,
        dayShifts,
        nightShifts,
        sundays,
        breakdowns,
        billingDays: billingDays < 0 ? 0 : billingDays,
      };
    });
  };

  const parseDateStr = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date(0);
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const filteredReportsTrips = trips.filter((t) => {
    if (reportDriverFilter && t.driverId !== reportDriverFilter) return false;
    if (reportVehicleFilter && t.vehicleId !== reportVehicleFilter) return false;
    if (reportDateRange === 'all') return true;

    const tripDate = parseDateStr(t.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reportDateRange === 'today') {
      return tripDate.getTime() === today.getTime();
    } else if (reportDateRange === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return tripDate.getTime() === yesterday.getTime();
    } else if (reportDateRange === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - today.getDay());
      return tripDate >= startOfWeek;
    } else if (reportDateRange === 'month') {
      return (
        tripDate.getMonth() === today.getMonth() &&
        tripDate.getFullYear() === today.getFullYear()
      );
    }
    return true;
  });

  let reportDistance = 0;
  filteredReportsTrips.forEach((t) => {
    const start = parseFloat(t.startOdometer) || 0;
    const end = parseFloat(t.endOdometer) || 0;
    if (end >= start) {
      reportDistance += end - start;
    }
  });

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Left Pane: Report Options */}
      <View style={[styles.rightVehiclesPanel, { width: 280, marginRight: 24 }]}>
        <Text style={[styles.panelTitle, { marginBottom: 16, fontFamily: fontStyle }]}>Reports</Text>
        {[
          { key: 'Trip Summary Report', label: 'Trip Summary Report', desc: 'Summary of all trips', icon: '📋' },
          { key: 'Fuel Report', label: 'Fuel Report', desc: 'Fuel consumption and refills', icon: '⛽' },
          { key: 'Driver Performance Report', label: 'Driver Performance Report', desc: 'Driver behavior and performance', icon: '👤' },
          { key: 'Vehicle Utilization Report', label: 'Vehicle Utilization Report', desc: 'Vehicle usage and idle time', icon: '🚚' },
          { key: 'Maintenance Report', label: 'Maintenance Report', desc: 'Maintenance history and costs', icon: '🔧' },
        ].map((opt) => {
          const isSel = selectedReportType === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.menuItem,
                { paddingVertical: 12, paddingHorizontal: 12, backgroundColor: isSel ? '#EFF6FF' : 'transparent', borderWidth: 1, borderColor: isSel ? '#1D4ED8' : 'transparent' }
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

      {/* Right Pane: Report Dashboard details */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle }}>{selectedReportType}</Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontFamily: fontStyle }}>Analytical insights for the fleet</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.panelSearchBar, { width: 120, height: 36, paddingHorizontal: 8, marginRight: 12, justifyContent: 'center' }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E293B', fontFamily: fontStyle }}>{reportMonth}</Text>
            </View>
            <TouchableOpacity
              style={[styles.panelAddBtn, { backgroundColor: '#1D4ED8', flexDirection: 'row', alignItems: 'center', height: 36 }]}
              onPress={() => {
                setSpreadsheetTab(0);
                setSpreadsheetVisible(true);
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', marginRight: 4 }}>📊</Text>
              <Text style={[styles.panelAddBtnText, { fontFamily: fontStyle }]}>View Spreadsheet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statLabel, { fontFamily: fontStyle }]}>Total Distance</Text>
              <Text style={[styles.statValue, { fontFamily: fontStyle }]}>{reportDistance.toLocaleString()} km</Text>
              <Text style={[styles.statTrendText, { fontFamily: fontStyle }]}>
                <Text style={{ color: '#24D164', fontWeight: 'bold' }}>▲ 7.2%</Text> vs last month
              </Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statLabel, { fontFamily: fontStyle }]}>Total Fuel</Text>
              <Text style={[styles.statValue, { fontFamily: fontStyle }]}>1,240 L</Text>
              <Text style={[styles.statTrendText, { fontFamily: fontStyle }]}>
                <Text style={{ color: '#24D164', fontWeight: 'bold' }}>▲ 6.1%</Text> vs last month
              </Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statLabel, { fontFamily: fontStyle }]}>Total Trips</Text>
              <Text style={[styles.statValue, { fontFamily: fontStyle }]}>{filteredReportsTrips.length}</Text>
              <Text style={[styles.statTrendText, { fontFamily: fontStyle }]}>
                <Text style={{ color: '#24D164', fontWeight: 'bold' }}>▲ 9.5%</Text> vs last month
              </Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statLabel, { fontFamily: fontStyle }]}>Avg. Efficiency</Text>
              <Text style={[styles.statValue, { fontFamily: fontStyle }]}>8.9 km/L</Text>
              <Text style={[styles.statTrendText, { fontFamily: fontStyle }]}>
                <Text style={{ color: '#24D164', fontWeight: 'bold' }}>▲ 4.3%</Text> vs last month
              </Text>
            </View>
          </View>
        </View>

        {/* Visualizations Section */}
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          {/* Distance Overview SVG Line Chart */}
          <View style={[styles.mapCard, { flex: 1, marginRight: 16, height: 320 }]}>
            <Text style={styles.cardTitle}>Distance Overview</Text>
            <View style={{ flex: 1, justifyContent: 'flex-end', position: 'relative' }}>
              <View style={{ position: 'absolute', left: 0, bottom: 40, width: '100%', height: 160, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }}>
                <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, height: 1, backgroundColor: '#F1F5F9' }} />
                <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0, height: 1, backgroundColor: '#F1F5F9' }} />
                <View style={{ position: 'absolute', bottom: 120, left: 0, right: 0, height: 1, backgroundColor: '#F1F5F9' }} />
                
                <View style={{ width: '90%', height: '100%', marginLeft: 15, justifyContent: 'flex-end' }}>
                  <View style={{ position: 'absolute', bottom: 30, left: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                  <View style={{ position: 'absolute', bottom: 65, left: 60, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                  <View style={{ position: 'absolute', bottom: 45, left: 110, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                  <View style={{ position: 'absolute', bottom: 110, left: 160, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                  <View style={{ position: 'absolute', bottom: 90, left: 210, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                  <View style={{ position: 'absolute', bottom: 125, left: 260, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                  
                  <View style={{ position: 'absolute', bottom: 30, left: 14, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '35deg' }], transformOrigin: 'left' }} />
                  <View style={{ position: 'absolute', bottom: 65, left: 64, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '-22deg' }], transformOrigin: 'left' }} />
                  <View style={{ position: 'absolute', bottom: 45, left: 114, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '52deg' }], transformOrigin: 'left' }} />
                  <View style={{ position: 'absolute', bottom: 110, left: 164, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '-22deg' }], transformOrigin: 'left' }} />
                  <View style={{ position: 'absolute', bottom: 90, left: 214, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '35deg' }], transformOrigin: 'left' }} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingLeft: 20, paddingTop: 10 }}>
                <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>1 May</Text>
                <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>8 May</Text>
                <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>15 May</Text>
                <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>22 May</Text>
                <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>29 May</Text>
              </View>
            </View>
          </View>

          {/* Fuel Consumption Vertical Bar Chart */}
          <View style={[styles.donutCard, { flex: 1, height: 320, padding: 20 }]}>
            <Text style={[styles.cardTitle, { fontFamily: fontStyle }]}>Fuel Consumption</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, paddingHorizontal: 10 }}>
              {[35, 60, 48, 80, 55, 68, 42, 90, 62, 75].map((val, idx) => (
                <View key={idx} style={{ alignItems: 'center', width: '8%' }}>
                  <View style={{ height: (val * 1.5), width: '100%', backgroundColor: '#3B82F6', borderRadius: 4 }} />
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10 }}>
              <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>1 May</Text>
              <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>8 May</Text>
              <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>15 May</Text>
              <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>22 May</Text>
              <Text style={{ fontSize: 9, color: '#94A3B8', fontFamily: fontStyle }}>29 May</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Spreadsheet Viewer Modal */}
      <Modal
        visible={spreadsheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSpreadsheetVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(15, 23, 42, 0.6)' }]}>
          <View style={[styles.modalCard, { width: '95%', maxWidth: 1100, height: '85%', padding: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#1D4ED8', letterSpacing: 1.5, fontFamily: fontStyle }}>SPREADSHEET VIEW</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 2, fontFamily: fontStyle }}>Analytical Audit Sheets</Text>
              </View>
              <TouchableOpacity
                style={[styles.panelAddBtn, { backgroundColor: '#FF3B30', justifyContent: 'center' }]}
                onPress={() => setSpreadsheetVisible(false)}
              >
                <Text style={[styles.panelAddBtnText, { fontFamily: fontStyle }]}>Close Sheet</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Tabs */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
              {['MISSION TRAVEL LOGS', 'OPERATOR PERFORMANCE'].map((tabLabel, idx) => {
                const isTabSel = spreadsheetTab === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={{ paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 2, borderColor: isTabSel ? '#1D4ED8' : 'transparent', marginRight: 16 }}
                    onPress={() => setSpreadsheetTab(idx)}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: isTabSel ? '#1D4ED8' : '#64748B', fontFamily: fontStyle }}>{tabLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Spreadsheet Table Grids */}
            <View style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
              {spreadsheetTab === 0 ? (
                // TAB 1: MISSION TRAVEL LOGS
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ width: 1500 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#0F243E', paddingVertical: 10, paddingHorizontal: 12 }}>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>DATE</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>DAY</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>SHIFT</Text>
                      <Text style={{ width: 140, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>OPERATOR</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>VEHICLE</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>START KM</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>END KM</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>START HMR</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>END HMR</Text>
                      <Text style={{ width: 110, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>HMR WORKED</Text>
                      <Text style={{ width: 110, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>STATUS</Text>
                      <Text style={{ width: 300, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>MAINTENANCE DETAILS</Text>
                    </View>

                    <ScrollView style={{ flex: 1 }}>
                      {trips.map((trip, index) => {
                        const driverName = drivers.find((d) => d.id === trip.driverId)?.name || 'Unknown';
                        const vehicleNo = vehicles.find((v) => v.id === trip.vehicleId)?.number || 'Unknown';
                        const statusStr = trip.isBreakdown ? 'BREAKDOWN' : 'YES';

                        const startHmrVal = parseFloat(trip.startHmr) || 0;
                        const endHmrVal = parseFloat(trip.endHmr) || 0;
                        const hmrWorked = endHmrVal >= startHmrVal ? (endHmrVal - startHmrVal).toFixed(1) : '0.0';

                        const tripMaint = maintenance.filter((m) => m.tripId === trip.id);
                        const maintStr = tripMaint.length === 0 ? 'None' : tripMaint.map(m => `${m.maintenanceType}: $${m.cost} (${m.description})`).join(' | ');

                        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

                        return (
                          <View key={trip.id} style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: rowBg, borderBottomWidth: 1, borderColor: '#F1F5F9' }}>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{trip.startDate}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{trip.day}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{trip.shift}</Text>
                            <Text style={{ width: 140, fontSize: 11, fontWeight: '700', color: '#1E293B', fontFamily: fontStyle }}>{driverName}</Text>
                            <Text style={{ width: 120, fontSize: 11, fontWeight: '700', color: '#1E293B', fontFamily: fontStyle }}>{vehicleNo}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{trip.startOdometer}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{trip.endOdometer || 'Active'}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{startHmrVal.toFixed(1)}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{endHmrVal > 0 ? endHmrVal.toFixed(1) : 'Active'}</Text>
                            <Text style={{ width: 110, fontSize: 11, fontWeight: '700', color: '#1E293B', fontFamily: fontStyle }}>{hmrWorked}</Text>
                            <Text style={{ width: 110, fontSize: 11, fontWeight: '900', color: trip.isBreakdown ? '#FF3B30' : '#24D164', fontFamily: fontStyle }}>{statusStr}</Text>
                            <Text style={{ width: 300, fontSize: 11, color: '#64748B', fontFamily: fontStyle }} numberOfLines={1}>{maintStr}</Text>
                          </View>
                        );
                      })}
                      {trips.length === 0 && (
                        <Text style={[styles.emptyText, { fontFamily: fontStyle }]}>No spreadsheet entries available.</Text>
                      )}
                    </ScrollView>
                  </View>
                </ScrollView>
              ) : (
                // TAB 2: OPERATOR PERFORMANCE
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ width: 1000 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#0F243E', paddingVertical: 10, paddingHorizontal: 12 }}>
                      <Text style={{ width: 160, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>OPERATOR NAME</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>TOTAL MISSIONS</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>WORKING DAYS</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>DAY SHIFTS</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>NIGHT SHIFTS</Text>
                      <Text style={{ width: 130, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>SUNDAY SESSIONS</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>BREAKDOWNS</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: fontStyle }}>BILLING DAYS</Text>
                    </View>

                    <ScrollView style={{ flex: 1 }}>
                      {getOperatorPerformanceStats().map((stat, index) => {
                        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                        return (
                          <View key={stat.id} style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: rowBg, borderBottomWidth: 1, borderColor: '#F1F5F9' }}>
                            <Text style={{ width: 160, fontSize: 11, fontWeight: '700', color: '#1E293B', fontFamily: fontStyle }}>{stat.name}</Text>
                            <Text style={{ width: 120, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{stat.totalMissions}</Text>
                            <Text style={{ width: 120, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{stat.uniqueDays}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{stat.dayShifts}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{stat.nightShifts}</Text>
                            <Text style={{ width: 130, fontSize: 11, color: '#475569', fontFamily: fontStyle }}>{stat.sundays}</Text>
                            <Text style={{ width: 120, fontSize: 11, fontWeight: '900', color: stat.breakdowns > 0 ? '#FF3B30' : '#475569', fontFamily: fontStyle }}>{stat.breakdowns}</Text>
                            <Text style={{ width: 120, fontSize: 11, fontWeight: '700', color: '#24D164', fontFamily: fontStyle }}>{stat.billingDays}</Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
