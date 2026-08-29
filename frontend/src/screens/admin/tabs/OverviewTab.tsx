import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function OverviewTab() {
  const { drivers, vehicles, trips } = useDashboardData();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isCompact = width < 1024;

  const activeTripsCount = trips.filter((t) => t.status === 'started').length;
  const breakdownCount = trips.filter((t) => t.isBreakdown).length;

  // Dynamic calculations for vehicle stats
  const totalVehiclesCount = vehicles.length;
  const runningVehiclesCount = vehicles.filter((v) => (v.status || '').toLowerCase() === 'running').length;
  const idleVehiclesCount = vehicles.filter((v) => (v.status || '').toLowerCase() === 'active').length;
  const breakdownVehiclesCount = vehicles.filter((v) => (v.status || '').toLowerCase().includes('break') || (v.status || '').toLowerCase().includes('maint')).length;
  const inactiveVehiclesCount = totalVehiclesCount - runningVehiclesCount - idleVehiclesCount - breakdownVehiclesCount;

  const runningPct = totalVehiclesCount > 0 ? ((runningVehiclesCount / totalVehiclesCount) * 100).toFixed(1) : '0';
  const idlePct = totalVehiclesCount > 0 ? ((idleVehiclesCount / totalVehiclesCount) * 100).toFixed(1) : '0';
  const breakdownPct = totalVehiclesCount > 0 ? ((breakdownVehiclesCount / totalVehiclesCount) * 100).toFixed(1) : '0';
  const inactivePct = totalVehiclesCount > 0 ? ((inactiveVehiclesCount / totalVehiclesCount) * 100).toFixed(1) : '0';

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {/* Top 5 Metric Cards */}
      <View style={styles.statsGrid}>
        {/* Card 1: Total Drivers */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#10B981' }]}>
            <Ionicons name="people" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Drivers</Text>
            <Text style={styles.statValue}>{drivers.length}</Text>
            <Text style={styles.statTrendText}>Registered operators</Text>
          </View>
        </View>

        {/* Card 2: Total Vehicles */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="car-sport" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Vehicles</Text>
            <Text style={styles.statValue}>{totalVehiclesCount}</Text>
            <Text style={styles.statTrendText}>Registered vehicles</Text>
          </View>
        </View>

        {/* Card 3: Live Trips */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="pulse" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Live Trips</Text>
            <Text style={styles.statValue}>{activeTripsCount}</Text>
            <Text style={styles.statTrendText}>Trips currently running</Text>
          </View>
        </View>

        {/* Card 4: Breakdown */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="alert-circle" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Breakdowns</Text>
            <Text style={styles.statValue}>{breakdownCount}</Text>
            <Text style={[styles.statTrendText, { color: breakdownCount > 0 ? '#EF4444' : '#64748B', fontWeight: '700' }]}>
              {breakdownCount} reported incidents
            </Text>
          </View>
        </View>

        {/* Card 5: Total Trips */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#6366F1' }]}>
            <Ionicons name="git-commit" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Trips</Text>
            <Text style={styles.statValue}>{trips.length}</Text>
            <Text style={styles.statTrendText}>Trips historically logged</Text>
          </View>
        </View>
      </View>

      {/* Middle Row: Fleet Overview (Donut) & Recent Trips (Table) */}
      <View style={[styles.trackingChartRow, isCompact && { flexDirection: 'column' }]}>
        {/* Fleet Overview Donut Chart */}
        <View style={[styles.donutCard, { flex: 1 }, isCompact ? { marginRight: 0, marginBottom: 24 } : { marginRight: 24 }]}>
          <Text style={styles.cardTitle}>Fleet Overview</Text>
          <View style={styles.chartContentWrapper}>
            {/* Dynamic Interactive SVG Donut Chart */}
            <View style={{ width: 110, height: 110, justifyContent: 'center', alignItems: 'center' }}>
              <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Gray Circle */}
                <circle cx="55" cy="55" r="45" fill="transparent" stroke="#F1F5F9" strokeWidth="10" />
                
                {/* Inactive segment (Grey) */}
                {inactiveVehiclesCount > 0 && (
                  <circle
                    cx="55"
                    cy="55"
                    r="45"
                    fill="transparent"
                    stroke="#94A3B8"
                    strokeWidth="10"
                    strokeDasharray={`${(inactiveVehiclesCount / (totalVehiclesCount || 1)) * 282.7} 282.7`}
                    strokeDashoffset={0}
                  />
                )}

                {/* Breakdown segment (Red) */}
                {breakdownVehiclesCount > 0 && (
                  <circle
                    cx="55"
                    cy="55"
                    r="45"
                    fill="transparent"
                    stroke="#EF4444"
                    strokeWidth="10"
                    strokeDasharray={`${(breakdownVehiclesCount / (totalVehiclesCount || 1)) * 282.7} 282.7`}
                    strokeDashoffset={-((inactiveVehiclesCount / (totalVehiclesCount || 1)) * 282.7)}
                  />
                )}

                {/* Running segment (Blue) */}
                {runningVehiclesCount > 0 && (
                  <circle
                    cx="55"
                    cy="55"
                    r="45"
                    fill="transparent"
                    stroke="#1D4ED8"
                    strokeWidth="10"
                    strokeDasharray={`${(runningVehiclesCount / (totalVehiclesCount || 1)) * 282.7} 282.7`}
                    strokeDashoffset={-(((inactiveVehiclesCount + breakdownVehiclesCount) / (totalVehiclesCount || 1)) * 282.7)}
                  />
                )}

                {/* Idle segment (Green) */}
                {idleVehiclesCount > 0 && (
                  <circle
                    cx="55"
                    cy="55"
                    r="45"
                    fill="transparent"
                    stroke="#24D164"
                    strokeWidth="10"
                    strokeDasharray={`${(idleVehiclesCount / (totalVehiclesCount || 1)) * 282.7} 282.7`}
                    strokeDashoffset={-(((inactiveVehiclesCount + breakdownVehiclesCount + runningVehiclesCount) / (totalVehiclesCount || 1)) * 282.7)}
                  />
                )}
              </svg>
              <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.donutMiddleNum}>{totalVehiclesCount}</Text>
                <Text style={styles.donutMiddleLabel}>Total</Text>
              </View>
            </View>
            
            <View style={styles.donutLegend}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#24D164' }]} />
                <Text style={[styles.legendLabel, { width: 90 }]}>Idle</Text>
                <Text style={styles.legendVal}>{idleVehiclesCount} ({idlePct}%)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#1D4ED8' }]} />
                <Text style={[styles.legendLabel, { width: 90 }]}>Running</Text>
                <Text style={styles.legendVal}>{runningVehiclesCount} ({runningPct}%)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.legendLabel, { width: 90 }]}>Breakdown</Text>
                <Text style={styles.legendVal}>{breakdownVehiclesCount} ({breakdownPct}%)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
                <Text style={[styles.legendLabel, { width: 90 }]}>Inactive</Text>
                <Text style={styles.legendVal}>{inactiveVehiclesCount} ({inactivePct}%)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Trips Table */}
        <View style={[styles.sectionCard, { flex: 1.5, padding: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.cardTitle}>Recent Trips</Text>
            <TouchableOpacity onPress={() => navigation.navigate('trips')}>
              <Text style={{ fontSize: 11, color: '#1D4ED8', fontWeight: '700' }}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal={width < 768} showsHorizontalScrollIndicator={false}>
            <View style={[styles.table, width < 768 && { minWidth: 650 }]}>
              <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8 }]}>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Trip ID</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Vehicle</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Driver</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>Route</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Status</Text>
              </View>

              {trips.length > 0 ? (
                trips.slice(0, 5).map((t, idx) => {
                  const vehicleNo = vehicles.find((v) => v.id === t.vehicleId)?.number || '—';
                  const driverName = drivers.find((d) => d.id === t.driverId)?.name || '—';
                  const routeStr = (t.sourceLocation && t.destinationLocation) ? `${t.sourceLocation} → ${t.destinationLocation}` : 'No route';
                  const dateStr = t.startDate || '—';
                  const statusStr = t.status === 'submitted' ? 'Completed' : t.status === 'started' ? 'In Progress' : 'Draft';
                  const statusColor = statusStr === 'Completed' ? '#24D164' : statusStr === 'In Progress' ? '#1D4ED8' : '#64748B';

                  return (
                    <View key={idx} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 10 }]}>
                      <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '700', color: '#1E293B' }]}>{t.id.substring(0, 8).toUpperCase()}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '700', color: '#1E293B' }]}>{vehicleNo}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, color: '#475569' }]}>{driverName}</Text>
                      <Text style={[styles.tableCell, { flex: 2.2, color: '#475569' }]} numberOfLines={1}>{routeStr}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, color: '#64748B' }]}>{dateStr}</Text>
                      <View style={{ flex: 1.2, alignItems: 'center' }}>
                        <View style={{ backgroundColor: statusColor + '15', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: statusColor }}>{statusStr}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="map-outline" size={32} color="#CBD5E1" />
                  <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 10 }}>No recent trips logged in the database</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Footer Copyright brand text */}
      <View style={{ marginVertical: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>
          © 2025 FleetManager. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}
