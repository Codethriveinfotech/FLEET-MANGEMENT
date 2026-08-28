import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';

export default function MaintenanceTab() {
  const { maintenance, vehicles, drivers } = useDashboardData();
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterDriverId, setFilterDriverId] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const totalCost = maintenance.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);
  const breakdowns = maintenance.filter((m) => m.isBreakdownReport).length;
  const oilChanges = maintenance.filter((m) => m.oilChangeDone).length;

  // Parse DD/MM/YYYY -> Date for comparison
  const parseDate = (str: string): Date | null => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  };

  // Apply filters
  const filtered = maintenance.filter((m) => {
    const vehMatch = filterVehicleId ? m.vehicleId === filterVehicleId : true;
    const drvMatch = filterDriverId ? m.driverId === filterDriverId : true;
    const recordDate = parseDate(m.date);
    const fromMatch = filterFromDate ? (recordDate ? recordDate >= new Date(filterFromDate) : false) : true;
    const toMatch = filterToDate ? (recordDate ? recordDate <= new Date(filterToDate) : false) : true;
    return vehMatch && drvMatch && fromMatch && toMatch;
  });

  const hasFilters = filterVehicleId || filterDriverId || filterFromDate || filterToDate;

  return (
    <View style={{ flex: 1 }}>
      {/* Summary Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="construct-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Records</Text>
            <Text style={styles.statValue}>{maintenance.length}</Text>
            <Text style={styles.statTrendText}>All maintenance entries</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="cash-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Repair Cost</Text>
            <Text style={styles.statValue}>${totalCost.toFixed(2)}</Text>
            <Text style={styles.statTrendText}>Accumulated service expenses</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="flash-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Breakdown Reports</Text>
            <Text style={styles.statValue}>{breakdowns}</Text>
            <Text style={styles.statTrendText}>Emergency breakdown incidents</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#10B981' }]}>
            <Ionicons name="water-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Oil Changes Done</Text>
            <Text style={styles.statValue}>{oilChanges}</Text>
            <Text style={styles.statTrendText}>Engine oil service completed</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View style={[styles.sectionCard, { flex: 1 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>MAINTENANCE TICKETS</Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontFamily: fontStyle, marginTop: 2 }}>
              Showing {filtered.length} of {maintenance.length} records · {breakdowns > 0 ? `${breakdowns} breakdown(s)` : 'No breakdowns'}
            </Text>
          </View>
        </View>

        {/* Filter Row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {/* Filter by Vehicle */}
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
            <Ionicons name="car-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
            <select
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: 13,
                border: 'none',
                outline: 'none',
                color: filterVehicleId ? '#0F172A' : '#94A3B8',
                backgroundColor: 'transparent',
                fontFamily: fontStyle,
                cursor: 'pointer',
              } as any}
              value={filterVehicleId}
              onChange={(e) => setFilterVehicleId(e.target.value)}
            >
              <option value="">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.number} ({v.model})</option>
              ))}
            </select>
          </View>

          {/* Filter by Driver */}
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
            <Ionicons name="person-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
            <select
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: 13,
                border: 'none',
                outline: 'none',
                color: filterDriverId ? '#0F172A' : '#94A3B8',
                backgroundColor: 'transparent',
                fontFamily: fontStyle,
                cursor: 'pointer',
              } as any}
              value={filterDriverId}
              onChange={(e) => setFilterDriverId(e.target.value)}
            >
              <option value="">All Drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </View>

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

          {/* Clear Filters Button */}
          {hasFilters && (
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
              onClick={() => { setFilterVehicleId(''); setFilterDriverId(''); setFilterFromDate(''); setFilterToDate(''); }}
            >
              <Ionicons name="close-circle-outline" size={15} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700', fontFamily: fontStyle }}>Clear</Text>
            </View>
          )}
        </View>

        {/* Table Header */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 0.5, fontFamily: fontStyle }]}>S.NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4, fontFamily: fontStyle }]}>DATE / TIME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4, fontFamily: fontStyle }]}>VEHICLE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6, fontFamily: fontStyle }]}>DRIVER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>TYPE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2.5, fontFamily: fontStyle }]}>DESCRIPTION</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>SERVICE NOTES</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right', fontFamily: fontStyle }]}>COST</Text>
        </View>

        {/* Scrollable rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.table}>
            {filtered.map((m, idx) => {
              const vehicleNo = vehicles.find((v) => v.id === m.vehicleId)?.number || 'Unknown';
              const driverName = drivers.find((d) => d.id === m.driverId)?.name || 'Unknown';
              const initials = driverName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              const isBreakdown = m.isBreakdownReport;

              return (
                <View key={m.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                  {/* S.No */}
                  <Text style={[styles.tableCell, { flex: 0.5, color: '#64748B', fontWeight: 'bold', fontFamily: fontStyle }]}>{idx + 1}</Text>

                  {/* Date / Time stacked */}
                  <View style={{ flex: 1.4, flexDirection: 'column', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: fontStyle }}>{m.date}</Text>
                    {m.time ? (
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>{m.time}</Text>
                    ) : null}
                  </View>

                  {/* Vehicle plate badge */}
                  <View style={{ flex: 1.4, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: '#FFF',
                      borderWidth: 1.5,
                      borderColor: '#1E293B',
                      borderRadius: 4,
                      paddingVertical: 3,
                      paddingHorizontal: 7,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{vehicleNo}</Text>
                    </View>
                    {isBreakdown && (
                      <View style={{ marginLeft: 6, backgroundColor: '#FEF2F2', borderRadius: 4, padding: 3 }}>
                        <Ionicons name="flash" size={10} color="#EF4444" />
                      </View>
                    )}
                  </View>

                  {/* Driver avatar + name */}
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

                  {/* Maintenance Type */}
                  <Text style={[styles.tableCell, { flex: 1.5, color: '#F59E0B', fontWeight: '700', fontFamily: fontStyle }]} numberOfLines={2}>
                    {m.maintenanceType || '—'}
                  </Text>

                  {/* Description */}
                  <Text style={[styles.tableCell, { flex: 2.5, color: '#475569', fontFamily: fontStyle }]} numberOfLines={3}>
                    {m.description || '—'}
                  </Text>

                  {/* Service Notes */}
                  <Text style={[styles.tableCell, { flex: 2, color: '#64748B', fontStyle: 'italic', fontFamily: fontStyle }]} numberOfLines={3}>
                    {m.serviceNotes || '—'}
                  </Text>

                  {/* Cost */}
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: '800', color: parseFloat(m.cost) > 0 ? '#8B5CF6' : '#94A3B8', fontFamily: fontStyle }]}>
                    {parseFloat(m.cost) > 0 ? `$${m.cost}` : 'N/A'}
                  </Text>
                </View>
              );
            })}

            {filtered.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="construct-outline" size={40} color="#CBD5E1" />
                <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 12, fontFamily: fontStyle }}>
                  {maintenance.length === 0 ? 'No maintenance records found' : 'No records match the selected filters'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
