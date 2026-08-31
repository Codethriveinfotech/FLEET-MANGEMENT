import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Image } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';

export default function MaintenanceTab() {
  const { maintenance, vehicles, drivers } = useDashboardData();
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterDriverId, setFilterDriverId] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);

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

  // Card stats — always reflect the filtered set
  const totalCost = filtered.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);
  const breakdowns = filtered.filter((m) => m.isBreakdownReport).length;
  const oilChanges = filtered.filter((m) => m.oilChangeDone).length;

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
            <Text style={styles.statValue}>{filtered.length}</Text>
            <Text style={styles.statTrendText}>
              {hasFilters ? `Filtered from ${maintenance.length} total` : 'All maintenance entries'}
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="cash-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.statLabel}>Total Repair Cost</Text>
            <Text style={styles.statValue}>₹{totalCost.toFixed(2)}</Text>
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
          <Text style={[styles.tableHeaderCell, { flex: 1.3, fontFamily: fontStyle }]}>DATE / TIME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>VEHICLE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>DRIVER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.3, fontFamily: fontStyle }]}>TYPE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2.2, fontFamily: fontStyle }]}>DESCRIPTION</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>SERVICE NOTES</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.0, textAlign: 'right', fontFamily: fontStyle }]}>COST</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center', fontFamily: fontStyle }]}>BILL</Text>
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
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedBill(m)}
                  activeOpacity={0.7}
                  style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}
                >
                  {/* S.No */}
                  <Text style={[styles.tableCell, { flex: 0.5, color: '#64748B', fontWeight: 'bold', fontFamily: fontStyle }]}>{idx + 1}</Text>

                  {/* Date / Time stacked */}
                  <View style={{ flex: 1.3, flexDirection: 'column', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: fontStyle }}>{m.date}</Text>
                    {m.time ? (
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>{m.time}</Text>
                    ) : null}
                  </View>

                  {/* Vehicle plate badge */}
                  <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center' }}>
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
                  <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
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
                  <Text style={[styles.tableCell, { flex: 1.3, color: '#F59E0B', fontWeight: '700', fontFamily: fontStyle }]} numberOfLines={2}>
                    {m.maintenanceType || '—'}
                  </Text>

                  {/* Description */}
                  <Text style={[styles.tableCell, { flex: 2.2, color: '#475569', fontFamily: fontStyle }]} numberOfLines={3}>
                    {m.description || '—'}
                  </Text>

                  {/* Service Notes */}
                  <Text style={[styles.tableCell, { flex: 1.8, color: '#64748B', fontStyle: 'italic', fontFamily: fontStyle }]} numberOfLines={3}>
                    {m.serviceNotes || '—'}
                  </Text>

                  {/* Cost */}
                  <Text style={[styles.tableCell, { flex: 1.0, textAlign: 'right', fontWeight: '800', color: parseFloat(m.cost) > 0 ? '#8B5CF6' : '#94A3B8', fontFamily: fontStyle }]}>
                    {parseFloat(m.cost) > 0 ? `₹${m.cost}` : 'N/A'}
                  </Text>

                  {/* Bill icon */}
                  <View style={{ flex: 0.8, alignItems: 'center' }}>
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

      {/* MAINTENANCE DETAIL INSPECT MODAL */}
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
              const isRefill = ['Diesel', 'Petrol', 'CNG'].includes(selectedBill.maintenanceType);
              const isBreakdown = selectedBill.isBreakdownReport;

              return (
                <View style={{ flex: 1 }}>
                  {/* Modal Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', fontFamily: fontStyle }}>
                        {isRefill ? 'FUEL REFILL BILL ENTRY' : (isBreakdown ? 'BREAKDOWN INCIDENT REPORT' : 'MAINTENANCE SERVICE RECORD')}
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
                          <Text style={{ fontSize: 12, fontWeight: '800', color: isRefill ? '#0284C7' : (isBreakdown ? '#EF4444' : '#F59E0B'), fontFamily: fontStyle }}>
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
                            {parseFloat(selectedBill.cost) > 0 ? `₹${selectedBill.cost}` : '₹0 (Breakdown/Warranty)'}
                          </Text>
                        </View>

                        {/* Description field */}
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'column', marginBottom: 10 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', fontFamily: fontStyle, marginBottom: 4 }}>
                            {isRefill ? 'LITRE QUANTITY / NOTES' : 'ISSUE DESCRIPTION'}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#334155', fontFamily: fontStyle }}>
                            {selectedBill.description || '—'}
                          </Text>
                        </View>

                        {/* Service notes if any */}
                        {selectedBill.serviceNotes ? (
                          <>
                            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                            <View style={{ flexDirection: 'column', marginBottom: 10 }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', fontFamily: fontStyle, marginBottom: 4 }}>SERVICE RESOLUTION NOTES</Text>
                              <Text style={{ fontSize: 12, color: '#475569', fontFamily: fontStyle, fontStyle: 'italic' }}>
                                "{selectedBill.serviceNotes}"
                              </Text>
                            </View>
                          </>
                        ) : null}

                        {/* Checklist details for normal service */}
                        {!isRefill && !isBreakdown && (
                          <>
                            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', fontFamily: fontStyle, marginBottom: 6 }}>SAFETY CHECKLIST</Text>
                            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name={selectedBill.oilChangeDone ? "checkmark-circle" : "close-circle"} size={14} color={selectedBill.oilChangeDone ? "#10B981" : "#94A3B8"} />
                                <Text style={{ fontSize: 11, color: '#475569', marginLeft: 4, fontFamily: fontStyle }}>Oil Change</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name={selectedBill.tyreStatusOk ? "checkmark-circle" : "close-circle"} size={14} color={selectedBill.tyreStatusOk ? "#10B981" : "#EF4444"} />
                                <Text style={{ fontSize: 11, color: '#475569', marginLeft: 4, fontFamily: fontStyle }}>Tyres OK</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name={selectedBill.batteryStatusOk ? "checkmark-circle" : "close-circle"} size={14} color={selectedBill.batteryStatusOk ? "#10B981" : "#EF4444"} />
                                <Text style={{ fontSize: 11, color: '#475569', marginLeft: 4, fontFamily: fontStyle }}>Battery OK</Text>
                              </View>
                            </View>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Right Column: Bill Evidence Photo */}
                    <View style={{ flex: 1.2, minWidth: 340 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B', marginBottom: 16, fontFamily: fontStyle }}>
                        UPLOADED INVOICE / BILL PHOTO
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
    </View>
  );
}
