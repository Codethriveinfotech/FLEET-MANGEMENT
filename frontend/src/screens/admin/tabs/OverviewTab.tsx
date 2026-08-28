import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function OverviewTab() {
  const { drivers, vehicles, trips } = useDashboardData();
  const navigation = useNavigation<any>();

  const activeTripsCount = trips.filter((t) => t.status === 'started').length;

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {/* Top 5 Metric Cards matching exact user request */}
      <View style={styles.statsGrid}>
        {/* Card 1: Total Drivers */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#10B981' }]}>
            <Ionicons name="people" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Drivers</Text>
            <Text style={styles.statValue}>{drivers.length || 98}</Text>
            <Text style={styles.statTrendText}>
              <Text style={{ color: '#10B981', fontWeight: 'bold' }}>↑ 6.3%</Text> vs last month
            </Text>
          </View>
        </View>

        {/* Card 2: Total Vehicles */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="car-sport" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Vehicles</Text>
            <Text style={styles.statValue}>{vehicles.length || 120}</Text>
            <Text style={styles.statTrendText}>
              <Text style={{ color: '#10B981', fontWeight: 'bold' }}>↑ 8.5%</Text> vs last month
            </Text>
          </View>
        </View>

        {/* Card 3: Live Trips */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="pulse" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Live Trips</Text>
            <Text style={styles.statValue}>{activeTripsCount || 24}</Text>
            <Text style={styles.statTrendText}>
              <Text style={{ color: '#10B981', fontWeight: 'bold' }}>↑ 12.1%</Text> vs yesterday
            </Text>
          </View>
        </View>

        {/* Card 4: Breakdown */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="alert-circle" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Breakdown</Text>
            <Text style={styles.statValue}>{trips.filter(t => t.isBreakdown).length || 5}</Text>
            <Text style={[styles.statTrendText, { color: '#EF4444', fontWeight: '700' }]}>3 Urgent</Text>
          </View>
        </View>

        {/* Card 5: Total Trips */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#6366F1' }]}>
            <Ionicons name="git-commit" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Trips</Text>
            <Text style={styles.statValue}>{trips.length || 245}</Text>
            <Text style={styles.statTrendText}>
              <Text style={{ color: '#10B981', fontWeight: 'bold' }}>↑ 12.7%</Text> vs last month
            </Text>
          </View>
        </View>
      </View>

      {/* Middle Row: Fleet Overview (Donut) & Recent Trips (Table) */}
      <View style={styles.trackingChartRow}>
        {/* Fleet Overview Donut Chart */}
        <View style={[styles.donutCard, { flex: 1, marginRight: 24 }]}>
          <Text style={styles.cardTitle}>Fleet Overview</Text>
          <View style={styles.chartContentWrapper}>
            <View style={styles.donutCircle}>
              <View style={styles.donutInnerCircle}>
                <Text style={styles.donutMiddleNum}>{vehicles.length || 120}</Text>
                <Text style={styles.donutMiddleLabel}>Total</Text>
              </View>
            </View>
            
            <View style={styles.donutLegend}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#24D164' }]} />
                <Text style={styles.legendLabel}>Running</Text>
                <Text style={styles.legendVal}>89 (74.2%)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#1D4ED8' }]} />
                <Text style={styles.legendLabel}>Idle</Text>
                <Text style={styles.legendVal}>15 (12.5%)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                <Text style={styles.legendLabel}>Stopped</Text>
                <Text style={styles.legendVal}>10 (8.3%)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
                <Text style={styles.legendLabel}>Offline</Text>
                <Text style={styles.legendVal}>6 (5.0%)</Text>
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
          <View style={styles.table}>
            <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8 }]}>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Trip ID</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Vehicle</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Driver</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Route</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Status</Text>
            </View>

            {(trips.length > 0 ? trips.slice(0, 5) : [
              { id: 'TRP-2025-245', veh: 'TN 09 AB 1234', drv: 'Karthik R', route: 'Coimbatore → Chennai', date: 'May 31, 2025', status: 'Completed' },
              { id: 'TRP-2025-244', veh: 'TN 01 CD 5678', drv: 'Manoj S', route: 'Coimbatore → Madurai', date: 'May 31, 2025', status: 'Completed' },
              { id: 'TRP-2025-243', veh: 'TN 22 EF 9012', drv: 'Ramesh P', route: 'Chennai → Salem', date: 'May 31, 2025', status: 'Completed' },
              { id: 'TRP-2025-242', veh: 'TN 05 GH 3456', drv: 'Suresh B', route: 'Madurai → Trichy', date: 'May 31, 2025', status: 'In Progress' },
              { id: 'TRP-2025-241', veh: 'TN 18 IJ 7890', drv: 'Vignesh M', route: 'Coimbatore → Erode', date: 'May 31, 2025', status: 'In Progress' },
            ]).map((t, idx) => {
              const tripIdStr = t.id.startsWith('TRP') ? t.id : `TRP-2026-${t.id.substring(0, 3).toUpperCase()}`;
              const vehicleNo = t.veh || (vehicles.find((v) => v.id === t.vehicleId)?.number || 'TN 09 AB 1234');
              const driverName = t.drv || (drivers.find((d) => d.id === t.driverId)?.name || 'Karthik R');
              const routeStr = t.route || `${t.sourceLocation} → ${t.destinationLocation}`;
              const dateStr = t.date || t.startDate;
              const statusStr = t.status || (t.status === 'submitted' ? 'Completed' : 'In Progress');
              const statusColor = statusStr === 'Completed' ? '#24D164' : '#1D4ED8';

              return (
                <View key={idx} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 10 }]}>
                  <Text style={[styles.tableCell, { flex: 1.2, fontWeight: '700', color: '#1E293B' }]}>{tripIdStr}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, fontWeight: '700', color: '#1E293B' }]}>{vehicleNo}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, color: '#475569' }]}>{driverName}</Text>
                  <Text style={[styles.tableCell, { flex: 2, color: '#475569' }]} numberOfLines={1}>{routeStr}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5, color: '#64748B' }]}>{dateStr}</Text>
                  <View style={{ flex: 1.2, alignItems: 'center' }}>
                    <View style={{ backgroundColor: statusColor + '15', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: statusColor }}>{statusStr}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
