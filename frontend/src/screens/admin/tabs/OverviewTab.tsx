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
  const breakdownVehiclesCount = vehicles.filter((v) => (v.status || '').toLowerCase().includes('break') || (v.status || '').toLowerCase().includes('maint')).length;
  const idleVehiclesCount = totalVehiclesCount - runningVehiclesCount - breakdownVehiclesCount;
  
  const chartTotalCount = totalVehiclesCount;

  const runningPct = chartTotalCount > 0 ? ((runningVehiclesCount / chartTotalCount) * 100).toFixed(1) : '0';
  const idlePct = chartTotalCount > 0 ? ((idleVehiclesCount / chartTotalCount) * 100).toFixed(1) : '0';
  const breakdownPct = chartTotalCount > 0 ? ((breakdownVehiclesCount / chartTotalCount) * 100).toFixed(1) : '0';

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
        <View style={[styles.donutCard, { flex: 1, padding: 24, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12 }, isCompact ? { marginRight: 0, marginBottom: 24 } : { marginRight: 24 }]}>
          <Text style={[styles.cardTitle, { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 20 }]}>Fleet Status Overview</Text>
          <View style={[styles.chartContentWrapper, { height: 'auto', gap: 16 }]}>
            {/* Dynamic Interactive SVG Donut Chart */}
            <View style={{ width: 120, height: 120, justifyContent: 'center', alignItems: 'center' }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Gray Circle */}
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                
                {/* Breakdown segment (Red) */}
                {breakdownVehiclesCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#EF4444"
                    strokeWidth="12"
                    strokeDasharray={`${(breakdownVehiclesCount / (chartTotalCount || 1)) * 314.16} 314.16`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                  />
                )}

                {/* Running segment (Blue) */}
                {runningVehiclesCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#1D4ED8"
                    strokeWidth="12"
                    strokeDasharray={`${(runningVehiclesCount / (chartTotalCount || 1)) * 314.16} 314.16`}
                    strokeDashoffset={-((breakdownVehiclesCount / (chartTotalCount || 1)) * 314.16)}
                    strokeLinecap="round"
                  />
                )}

                {/* Active segment (Green) */}
                {idleVehiclesCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#24D164"
                    strokeWidth="12"
                    strokeDasharray={`${(idleVehiclesCount / (chartTotalCount || 1)) * 314.16} 314.16`}
                    strokeDashoffset={-(((breakdownVehiclesCount + runningVehiclesCount) / (chartTotalCount || 1)) * 314.16)}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[styles.donutMiddleNum, { fontSize: 26, fontWeight: '900', color: '#0F172A' }]}>{chartTotalCount}</Text>
                <Text style={[styles.donutMiddleLabel, { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }]}>Vehicles</Text>
              </View>
            </View>
            
            {/* Elegant Status Progress Bars list */}
            <View style={{ flex: 1.3, gap: 10 }}>
              {/* Active segment item */}
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EFF6FF' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#24D164', marginRight: 8 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Active</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>
                    {idleVehiclesCount} <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '500' }}>({idlePct}%)</Text>
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${idlePct}%` as any, height: '100%', backgroundColor: '#24D164', borderRadius: 3 }} />
                </View>
              </View>

              {/* Running segment item */}
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EFF6FF' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1D4ED8', marginRight: 8 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Running</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>
                    {runningVehiclesCount} <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '500' }}>({runningPct}%)</Text>
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${runningPct}%` as any, height: '100%', backgroundColor: '#1D4ED8', borderRadius: 3 }} />
                </View>
              </View>

              {/* Breakdown segment item */}
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EFF6FF' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 8 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Breakdown</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>
                    {breakdownVehiclesCount} <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '500' }}>({breakdownPct}%)</Text>
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${breakdownPct}%` as any, height: '100%', backgroundColor: '#EF4444', borderRadius: 3 }} />
                </View>
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
                [...trips]
                  .sort((a, b) => {
                    const dateTimeA = `${a.startDate || ''}T${a.startTime || ''}`;
                    const dateTimeB = `${b.startDate || ''}T${b.startTime || ''}`;
                    return dateTimeB.localeCompare(dateTimeA);
                  })
                  .slice(0, 5)
                  .map((t, idx) => {
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
