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
        <View style={[styles.donutCard, { flex: 1, padding: 24, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }, isCompact ? { marginRight: 0, marginBottom: 24 } : { marginRight: 24 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', letterSpacing: 0.3 }}>Fleet Status Overview</Text>
            <View style={{ backgroundColor: '#F1F5F9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>Real-time</Text>
            </View>
          </View>
          
          <View style={[styles.chartContentWrapper, { height: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            {/* Glossy Gradient Donut Chart with glowing shadow effects */}
            <View style={{ width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginRight: 20 }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <defs>
                  {/* Glowing shadows */}
                  <filter id="active-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#10B981" flood-opacity="0.3" />
                  </filter>
                  <filter id="running-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#2563EB" flood-opacity="0.3" />
                  </filter>
                  <filter id="breakdown-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#EF4444" flood-opacity="0.3" />
                  </filter>

                  {/* 3D Glossy Gradients */}
                  <linearGradient id="active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#34D399" />
                    <stop offset="100%" stop-color="#059669" />
                  </linearGradient>
                  <linearGradient id="running-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#60A5FA" />
                    <stop offset="100%" stop-color="#1D4ED8" />
                  </linearGradient>
                  <linearGradient id="breakdown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#F87171" />
                    <stop offset="100%" stop-color="#B91C1C" />
                  </linearGradient>
                </defs>

                {/* Background Track Circle */}
                <circle cx="60" cy="60" r="46" fill="transparent" stroke="#F8FAFC" strokeWidth="10" />
                <circle cx="60" cy="60" r="46" fill="transparent" stroke="#E2E8F0" strokeWidth="1" opacity="0.5" />
                
                {/* Breakdown segment (Red) */}
                {breakdownVehiclesCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="transparent"
                    stroke="url(#breakdown-grad)"
                    strokeWidth="10"
                    strokeDasharray={`${(breakdownVehiclesCount / (chartTotalCount || 1)) * 289.0} 289.0`}
                    strokeDashoffset={0}
                    filter="url(#breakdown-glow)"
                    strokeLinecap="round"
                  />
                )}

                {/* Running segment (Blue) */}
                {runningVehiclesCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="transparent"
                    stroke="url(#running-grad)"
                    strokeWidth="10"
                    strokeDasharray={`${(runningVehiclesCount / (chartTotalCount || 1)) * 289.0} 289.0`}
                    strokeDashoffset={-((breakdownVehiclesCount / (chartTotalCount || 1)) * 289.0)}
                    filter="url(#running-glow)"
                    strokeLinecap="round"
                  />
                )}

                {/* Active segment (Green) */}
                {idleVehiclesCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="transparent"
                    stroke="url(#active-grad)"
                    strokeWidth="10"
                    strokeDasharray={`${(idleVehiclesCount / (chartTotalCount || 1)) * 289.0} 289.0`}
                    strokeDashoffset={-(((breakdownVehiclesCount + runningVehiclesCount) / (chartTotalCount || 1)) * 289.0)}
                    filter="url(#active-glow)"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A', lineHeight: 28 }}>{chartTotalCount}</Text>
                <Text style={{ fontSize: 8, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Fleet</Text>
              </View>
            </View>
            
            {/* Professional Table Legend */}
            <View style={{ flex: 1, gap: 12 }}>
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#F1F5F9', paddingBottom: 6, marginBottom: 4 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#94A3B8', flex: 2 }}>STATUS</Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#94A3B8', flex: 1.2, textAlign: 'right' }}>VEHICLES</Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#94A3B8', flex: 1.2, textAlign: 'right' }}>RATIO</Text>
              </View>

              {/* Active segment item */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 2 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 }} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>Active</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A', flex: 1.2, textAlign: 'right' }}>{idleVehiclesCount}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', flex: 1.2, textAlign: 'right' }}>{idlePct}%</Text>
                </View>
                <View style={{ height: 3, backgroundColor: '#F1F5F9', borderRadius: 1.5, overflow: 'hidden' }}>
                  <View style={{ width: `${idlePct}%` as any, height: '100%', backgroundColor: '#10B981' }} />
                </View>
              </View>

              {/* Running segment item */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 2 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', marginRight: 8 }} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>Running</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A', flex: 1.2, textAlign: 'right' }}>{runningVehiclesCount}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', flex: 1.2, textAlign: 'right' }}>{runningPct}%</Text>
                </View>
                <View style={{ height: 3, backgroundColor: '#F1F5F9', borderRadius: 1.5, overflow: 'hidden' }}>
                  <View style={{ width: `${runningPct}%` as any, height: '100%', backgroundColor: '#2563EB' }} />
                </View>
              </View>

              {/* Breakdown segment item */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 2 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 8 }} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>Breakdown</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A', flex: 1.2, textAlign: 'right' }}>{breakdownVehiclesCount}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', flex: 1.2, textAlign: 'right' }}>{breakdownPct}%</Text>
                </View>
                <View style={{ height: 3, backgroundColor: '#F1F5F9', borderRadius: 1.5, overflow: 'hidden' }}>
                  <View style={{ width: `${breakdownPct}%` as any, height: '100%', backgroundColor: '#EF4444' }} />
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
              <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8, alignItems: 'center' }]}>
                <View style={{ flex: 1.5 }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Trip ID</Text></View>
                <View style={{ flex: 1.8 }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Vehicle</Text></View>
                <View style={{ flex: 1.2 }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Driver</Text></View>
                <View style={{ flex: 2.2 }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Route</Text></View>
                <View style={{ flex: 1.5 }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Date</Text></View>
                <View style={{ flex: 1.2, alignItems: 'center' }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Status</Text></View>
              </View>

              {(() => {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const today1 = `${yyyy}-${mm}-${dd}`;
                const today2 = `${dd}/${mm}/${yyyy}`;
                
                const todaysTrips = trips.filter(t => t.startDate && (t.startDate === today1 || t.startDate === today2));
                const tripsToShow = todaysTrips.length > 0 ? todaysTrips : trips;
                const isShowingFallback = todaysTrips.length === 0;
                
                return tripsToShow.length > 0 ? (
                  [...tripsToShow]
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
                        <View key={idx} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 10, alignItems: 'center' }]}>
                          <View style={{ flex: 1.5 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{t.id.substring(0, 8).toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1.8 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{vehicleNo}</Text>
                          </View>
                          <View style={{ flex: 1.2 }}>
                            <Text style={{ fontSize: 13, color: '#475569' }}>{driverName}</Text>
                          </View>
                          <View style={{ flex: 2.2 }}>
                            <Text style={{ fontSize: 13, color: '#475569' }} numberOfLines={1}>{routeStr}</Text>
                          </View>
                          <View style={{ flex: 1.5 }}>
                            <Text style={{ fontSize: 13, color: '#64748B' }}>{dateStr}</Text>
                          </View>
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
                    <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 10 }}>No trips logged in the system</Text>
                  </View>
                );
              })()}
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
