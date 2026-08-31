import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Image } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../api/client';

export default function FuelMonitorTab() {
  const { vehicles, trips, fuelLogs, maintenance, drivers } = useDashboardData();
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);

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
            <Text style={styles.statValue}>₹{totalFleetCost.toFixed(2)}</Text>
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
                  {veh.cost > 0 ? `₹${veh.cost.toFixed(2)}` : '₹0.00'}
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

      {/* Recent Fuel Refill Bills List */}
      <View style={[styles.sectionCard, { marginBottom: 24 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>
              RECENT FUEL REFILL BILLS
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontFamily: fontStyle, marginTop: 2 }}>
              Showing {(() => {
                const refills = maintenance.filter((m) => ['Diesel', 'Petrol', 'CNG'].includes(m.maintenanceType));
                const recordDates = refills.filter((m) => {
                  const recordDate = parseDate(m.date);
                  if (filterFromDate && (!recordDate || recordDate < new Date(filterFromDate))) return false;
                  if (filterToDate && (!recordDate || recordDate > new Date(filterToDate))) return false;
                  return true;
                });
                return recordDates.length;
              })()} refuel entry bill(s)
            </Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 0.5, fontFamily: fontStyle }]}>S.NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4, fontFamily: fontStyle }]}>DATE / TIME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4, fontFamily: fontStyle }]}>VEHICLE NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6, fontFamily: fontStyle }]}>DRIVER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>FUEL TYPE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2.2, fontFamily: fontStyle }]}>QTY / NOTES</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>COST</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.0, textAlign: 'center', fontFamily: fontStyle }]}>RECEIPT</Text>
        </View>

        {/* Table Rows */}
        <View style={styles.table}>
          {maintenance
            .filter((m) => {
              const isFuelType = ['Diesel', 'Petrol', 'CNG'].includes(m.maintenanceType);
              if (!isFuelType) return false;

              // Apply date filter
              const recordDate = parseDate(m.date);
              if (filterFromDate && (!recordDate || recordDate < new Date(filterFromDate))) return false;
              if (filterToDate && (!recordDate || recordDate > new Date(filterToDate))) return false;

              return true;
            })
            .sort((a, b) => {
              const dateA = parseDate(a.startDate || a.date) || new Date(0);
              const dateB = parseDate(b.startDate || b.date) || new Date(0);
              return dateB.getTime() - dateA.getTime();
            })
            .map((m, idx) => {
              const vehicleNo = vehicles.find((v) => v.id === m.vehicleId)?.number || 'Unknown';
              const driverName = drivers.find((d) => d.id === m.driverId)?.name || 'Unknown';
              const initials = driverName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={async () => {
                    try {
                      const res = await apiClient.get(`/maintenance/${m.id}`);
                      if (res.data && res.data.success) {
                        setSelectedBill(res.data.data);
                      } else {
                        setSelectedBill(m);
                      }
                    } catch (e) {
                      setSelectedBill(m);
                    }
                  }}
                  activeOpacity={0.7}
                  style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}
                >
                  {/* S.No */}
                  <Text style={[styles.tableCell, { flex: 0.5, color: '#64748B', fontWeight: 'bold', fontFamily: fontStyle }]}>{idx + 1}</Text>

                  {/* Date / Time */}
                  <View style={{ flex: 1.4, flexDirection: 'column', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: fontStyle }}>{m.date}</Text>
                    {m.time ? (
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>{m.time}</Text>
                    ) : null}
                  </View>

                  {/* Vehicle Plate Badge */}
                  <View style={{ flex: 1.4, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: '#FFF',
                      borderWidth: 1.5,
                      borderColor: '#1E293B',
                      borderRadius: 4,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{vehicleNo}</Text>
                    </View>
                  </View>

                  {/* Driver */}
                  <View style={{ flex: 1.6, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: '#EFF6FF',
                      justifyContent: 'center', alignItems: 'center',
                      marginRight: 8, borderWidth: 1, borderColor: '#BFDBFE',
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#1D4ED8', fontFamily: fontStyle }}>{initials}</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }} numberOfLines={1}>{driverName}</Text>
                  </View>

                  {/* Fuel Type */}
                  <Text style={[styles.tableCell, { flex: 1.2, color: '#0284C7', fontWeight: '700', fontFamily: fontStyle }]}>
                    {m.maintenanceType}
                  </Text>

                  {/* Liters / Notes */}
                  <Text style={[styles.tableCell, { flex: 2.2, color: '#475569', fontFamily: fontStyle }]} numberOfLines={3}>
                    {m.description || '—'}
                  </Text>

                  {/* Cost */}
                  <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '800', color: '#10B981', fontFamily: fontStyle }]}>
                    ₹{(parseFloat(m.cost) || 0).toFixed(2)}
                  </Text>

                  {/* Receipt Preview Icon */}
                  <View style={{ flex: 1.0, alignItems: 'center' }}>
                    {m.billImageUri ? (
                      <View style={{
                        padding: 6,
                        backgroundColor: '#ECFDF5',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#A7F3D0',
                      }}>
                        <Ionicons name="receipt-outline" size={14} color="#059669" />
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: fontStyle }}>—</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

          {maintenance.filter((m) => ['Diesel', 'Petrol', 'CNG'].includes(m.maintenanceType)).length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 45 }}>
              <Ionicons name="funnel-outline" size={40} color="#CBD5E1" />
              <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 12, fontFamily: fontStyle }}>
                No recent fuel refill records with bills found
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* FUEL DETAIL INSPECT MODAL */}
      <Modal
        visible={selectedBill !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBill(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setSelectedBill(null)}
        >
          <Pressable
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 32,
              width: '100%',
              maxWidth: 900,
              maxHeight: '90%',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 20,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedBill && (() => {
              const vehicleObj = vehicles.find((v) => v.id === selectedBill.vehicleId);
              const driverObj = drivers.find((d) => d.id === selectedBill.driverId);
              const vehicleNo = vehicleObj?.number || 'Unknown';
              const vehicleModel = vehicleObj?.model || '—';
              const driverName = driverObj?.name || 'Unknown Operator';

              return (
                <View style={{ flex: 1 }}>
                  {/* Modal Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', fontFamily: fontStyle }}>
                        FUEL REFILL BILL ENTRY
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>
                        Ticket ID: {selectedBill.id.toUpperCase()} • Driver: {driverName}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedBill(null)} style={{ padding: 6, backgroundColor: '#F1F5F9', borderRadius: 20 }}>
                      <Ionicons name="close" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#E2E8F0', marginBottom: 24 }} />

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {/* Left Column: Info Card */}
                    <View style={{ flex: 1, minWidth: 320, paddingRight: 24 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B', marginBottom: 16, fontFamily: fontStyle }}>
                        RECORD DATA DETAILS
                      </Text>

                      <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>CLASSIFICATION</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284C7', fontFamily: fontStyle }}>
                            {selectedBill.maintenanceType.toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>VEHICLE ASSET</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }}>
                            {vehicleNo} ({vehicleModel})
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>DATE & TIME</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F172A', fontFamily: fontStyle }}>
                            {selectedBill.date} • {selectedBill.time || '—'}
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>EXPENSE COST</Text>
                          <Text style={{ fontSize: 13, fontWeight: '900', color: '#8B5CF6', fontFamily: fontStyle }}>
                            ₹{(parseFloat(selectedBill.cost) || 0).toFixed(2)}
                          </Text>
                        </View>

                        {/* Description field */}
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'column', marginBottom: 4 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', fontFamily: fontStyle, marginBottom: 4 }}>
                            LITRE QUANTITY / NOTES
                          </Text>
                          <Text style={{ fontSize: 12, color: '#334155', fontFamily: fontStyle }}>
                            {selectedBill.description || '—'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Right Column: Bill Evidence Photo */}
                    <View style={{ flex: 1.2, minWidth: 340 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B', marginBottom: 16, fontFamily: fontStyle }}>
                        UPLOADED RECEIPT PHOTO
                      </Text>

                      <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
                        {selectedBill.billImageUri ? (
                          <TouchableOpacity onPress={() => setFullscreenImageUri(selectedBill.billImageUri)} style={{ width: '100%' }}>
                            <Image
                              source={{ uri: selectedBill.billImageUri }}
                              style={{ width: '100%', height: 260, borderRadius: 12, resizeMode: 'contain' }}
                            />
                            <Text style={{ fontSize: 11, color: '#1D4ED8', fontWeight: '700', marginTop: 10, textAlign: 'center', fontFamily: fontStyle }}>
                              Click image to enlarge fullscreen
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={{ alignItems: 'center', padding: 40 }}>
                            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
                            <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 12, fontFamily: fontStyle }}>No Invoice Bill Photo Uploaded</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* FULLSCREEN IMAGE INSPECTOR */}
      <Modal
        visible={fullscreenImageUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImageUri(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 }}
          onPress={() => setFullscreenImageUri(null)}
        >
          {fullscreenImageUri && (
            <View style={{ width: '90%', height: '90%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <Image
                source={{ uri: fullscreenImageUri }}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
              <TouchableOpacity
                onPress={() => setFullscreenImageUri(null)}
                style={{ position: 'absolute', top: 20, right: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30 }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>

      {/* Footer copyright */}
      <View style={{ marginVertical: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>
          © 2025 FleetManager. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}
