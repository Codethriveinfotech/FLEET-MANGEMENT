import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';

export default function FuelMonitorTab() {
  const { vehicles, trips, fuelLogs } = useDashboardData();
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Parse DD/MM/YYYY -> Date
  const parseDate = (str: string): Date | null => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  };

  // Apply date filter to fuelLogs
  const filteredFuelLogs = fuelLogs.filter((f) => {
    const d = parseDate(f.date);
    if (filterFromDate && (!d || d < new Date(filterFromDate))) return false;
    if (filterToDate && (!d || d > new Date(filterToDate))) return false;
    return true;
  });

  const hasDateFilter = filterFromDate || filterToDate;

  // Compute stats per vehicle (using filtered logs)
  const vehiclePerformance = vehicles.map((veh) => {
    // Distance
    const vehTrips = trips.filter((t) => t.vehicleId === veh.id && (t.status === 'submitted' || t.status === 'completed'));
    const totalDist = vehTrips.reduce((acc, t) => {
      const start = parseFloat(t.startOdometer) || 0;
      const end = parseFloat(t.endOdometer) || 0;
      return acc + (end >= start ? end - start : 0);
    }, 0);

    // Fuel Logs (filtered by date)
    const vehFuel = filteredFuelLogs.filter((f) => f.vehicleId === veh.id);
    const totalLiters = vehFuel.reduce((acc, f) => acc + (parseFloat(f.liters) || 0), 0);
    const totalCost = vehFuel.reduce((acc, f) => acc + (parseFloat(f.cost) || 0), 0);

    // Economy (km/L)
    const economy = totalLiters > 0 ? (totalDist / totalLiters) : 0;

    return {
      id: veh.id,
      number: veh.number || 'Unknown',
      model: veh.model || 'Unknown',
      distance: totalDist,
      liters: totalLiters,
      cost: totalCost,
      economy: economy,
      refillCount: vehFuel.length,
    };
  });

  // Fleet wide aggregates
  const totalFleetDistance = vehiclePerformance.reduce((acc, v) => acc + v.distance, 0);
  const totalFleetLiters = vehiclePerformance.reduce((acc, v) => acc + v.liters, 0);
  const totalFleetCost = vehiclePerformance.reduce((acc, v) => acc + v.cost, 0);
  const fleetAvgEconomy = totalFleetLiters > 0 ? (totalFleetDistance / totalFleetLiters) : 0;

  // Efficiency warnings count (e.g. economy below 5.0 km/L for heavy trucks or 8.0 km/L)
  const warningsCount = vehiclePerformance.filter(v => v.economy > 0 && v.economy < 6.0).length;

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {/* Overview Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#10B981' }]}>
            <Ionicons name="speedometer-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Fleet Avg. Economy</Text>
            <Text style={styles.statValue}>{fleetAvgEconomy > 0 ? `${fleetAvgEconomy.toFixed(2)} km/L` : 'N/A'}</Text>
            <Text style={styles.statTrendText}>Overall distance vs consumption</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="funnel-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Fuel Consumption</Text>
            <Text style={styles.statValue}>{totalFleetLiters.toFixed(1)} L</Text>
            <Text style={styles.statTrendText}>Cumulative liters refilled</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="cash-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Fuel Cost</Text>
            <Text style={styles.statValue}>${totalFleetCost.toFixed(2)}</Text>
            <Text style={styles.statTrendText}>Total money spent on fuel</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: warningsCount > 0 ? '#EF4444' : '#10B981' }]}>
            <Ionicons name="alert-circle-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Efficiency Warnings</Text>
            <Text style={styles.statValue}>{warningsCount}</Text>
            <Text style={[styles.statTrendText, { color: warningsCount > 0 ? '#EF4444' : '#64748B', fontWeight: warningsCount > 0 ? '700' : '400' }]}>
              {warningsCount > 0 ? 'Vehicles below 6.0 km/L economy' : 'All vehicles running efficiently'}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Monitoring Board */}
      <View style={[styles.sectionCard, { marginBottom: 24 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>
              VEHICLE FUEL MONITOR LEADERBOARD
            </Text>
            {hasDateFilter && (
              <Text style={{ fontSize: 11, color: '#64748B', fontFamily: fontStyle, marginTop: 2 }}>
                Filtered: {filterFromDate || '—'} → {filterToDate || '—'} · {filteredFuelLogs.length} fuel log(s)
              </Text>
            )}
          </View>
        </View>

        {/* Date Filter Row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {/* From Date */}
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 12,
            overflow: 'hidden',
          }}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 11, color: '#64748B', marginRight: 6, fontFamily: fontStyle }}>From</Text>
            <input
              type="date"
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 13,
                border: 'none',
                outline: 'none',
                color: filterFromDate ? '#0F172A' : '#94A3B8',
                backgroundColor: 'transparent',
                fontFamily: fontStyle,
                cursor: 'pointer',
              } as any}
              value={filterFromDate}
              onChange={(e: any) => setFilterFromDate(e.target.value)}
            />
          </View>

          {/* To Date */}
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 12,
            overflow: 'hidden',
          }}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 11, color: '#64748B', marginRight: 6, fontFamily: fontStyle }}>To</Text>
            <input
              type="date"
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 13,
                border: 'none',
                outline: 'none',
                color: filterToDate ? '#0F172A' : '#94A3B8',
                backgroundColor: 'transparent',
                fontFamily: fontStyle,
                cursor: 'pointer',
              } as any}
              value={filterToDate}
              onChange={(e: any) => setFilterToDate(e.target.value)}
            />
          </View>

          {/* Clear */}
          {hasDateFilter && (
            <View
              style={{
                borderWidth: 1,
                borderColor: '#FEE2E2',
                borderRadius: 10,
                backgroundColor: '#FEF2F2',
                paddingHorizontal: 16,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                cursor: 'pointer',
              } as any}
              // @ts-ignore
              onClick={() => { setFilterFromDate(''); setFilterToDate(''); }}
            >
              <Ionicons name="close-circle-outline" size={15} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700', fontFamily: fontStyle }}>Clear</Text>
            </View>
          )}
        </View>

        {/* Custom Spaced Table Header Row */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 0.6, fontFamily: fontStyle }]}>S.NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>VEHICLE NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>MODEL</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>DISTANCE RUN</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>FUEL CONSUMED</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>FUEL EXPENSES</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.8, textAlign: 'right', fontFamily: fontStyle }]}>AVG ECONOMY</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'center', fontFamily: fontStyle }]}>STATUS</Text>
        </View>

        {/* Table Rows */}
        <View style={styles.table}>
          {vehiclePerformance.map((veh, idx) => {
            const isLowEconomy = veh.economy > 0 && veh.economy < 6.0;
            const statusLabel = veh.economy === 0 ? 'No Data' : (isLowEconomy ? 'High Usage' : 'Efficient');
            const statusColor = veh.economy === 0 ? '#64748B' : (isLowEconomy ? '#EF4444' : '#10B981');
            const statusBg = veh.economy === 0 ? '#F1F5F9' : (isLowEconomy ? '#FEF2F2' : '#F0FDF4');
            const statusBorder = veh.economy === 0 ? '#E2E8F0' : (isLowEconomy ? '#FEE2E2' : '#DCFCE7');

            return (
              <View key={veh.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                {/* S.No */}
                <Text style={[styles.tableCell, { flex: 0.6, color: '#64748B', fontWeight: 'bold', fontFamily: fontStyle }]}>{idx + 1}</Text>

                {/* Plate badge */}
                <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: '#FFF',
                    borderWidth: 1.5,
                    borderColor: '#1E293B',
                    borderRadius: 4,
                    paddingVertical: 3,
                    paddingHorizontal: 8,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{veh.number}</Text>
                  </View>
                </View>

                {/* Model */}
                <Text style={[styles.tableCell, { flex: 2, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }]}>{veh.model}</Text>

                {/* Distance */}
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '600', color: '#334155', fontFamily: fontStyle }]}>
                  {veh.distance.toLocaleString()} km
                </Text>

                {/* Fuel Quantity */}
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: '#0284C7', fontFamily: fontStyle }]}>
                  {veh.liters > 0 ? `${veh.liters.toFixed(1)} L` : '0.0 L'}
                </Text>

                {/* Expenses */}
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: '#10B981', fontFamily: fontStyle }]}>
                  {veh.cost > 0 ? `$${veh.cost.toFixed(2)}` : '$0.00'}
                </Text>

                {/* Avg Economy */}
                <Text style={[styles.tableCell, { flex: 1.8, textAlign: 'right', fontWeight: '800', color: statusColor, fontFamily: fontStyle }]}>
                  {veh.economy > 0 ? `${veh.economy.toFixed(2)} km/L` : 'N/A'}
                </Text>

                {/* Status Badge */}
                <View style={{ flex: 1.5, alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: statusBg,
                    borderColor: statusBorder,
                    borderWidth: 1,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: statusColor, fontFamily: fontStyle }}>
                      {statusLabel.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>



      {/* Footer copyright */}
      <View style={{ marginVertical: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>
          © 2025 FleetManager. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}
