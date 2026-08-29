import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';

export default function TripsTab() {
  const { trips, drivers, vehicles } = useDashboardData();
  const [tripDriverFilter, setTripDriverFilter] = useState('');
  const [tripVehicleFilter, setTripVehicleFilter] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);

  // Parse DD/MM/YYYY -> Date
  const parseDate = (str: string): Date | null => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  };

  const filteredTrips = trips.filter((t) => {
    if (tripDriverFilter && t.driverId !== tripDriverFilter) return false;
    if (tripVehicleFilter && t.vehicleId !== tripVehicleFilter) return false;
    const recordDate = parseDate(t.startDate);
    if (filterFromDate && (!recordDate || recordDate < new Date(filterFromDate))) return false;
    if (filterToDate && (!recordDate || recordDate > new Date(filterToDate))) return false;
    return true;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    const dateA = parseDate(a.startDate) || new Date(0);
    const dateB = parseDate(b.startDate) || new Date(0);
    if (dateB.getTime() !== dateA.getTime()) {
      return dateB.getTime() - dateA.getTime();
    }
    const timeA = a.startTime || '';
    const timeB = b.startTime || '';
    return timeB.localeCompare(timeA);
  });

  const hasFilters = tripDriverFilter || tripVehicleFilter || filterFromDate || filterToDate;

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.sectionCard, { flex: 1 }]}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>TRIP LOGS HISTORY</Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontFamily: fontStyle, marginTop: 2 }}>
              Showing {filteredTrips.length} of {trips.length} total missions
            </Text>
          </View>
        </View>

        {/* Modern Filter Row */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          borderRadius: 12,
          padding: 12,
          marginBottom: 24,
          zIndex: 10,
        }}>
          <Ionicons name="filter-outline" size={18} color="#64748B" style={{ marginRight: 12 }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginRight: 16, fontFamily: fontStyle }}>Filter by:</Text>

          {/* Driver Dropdown Trigger */}
          <View style={{ position: 'relative', marginRight: 12, zIndex: 12 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
              onPress={() => {
                setDriverDropdownOpen(!driverDropdownOpen);
                setVehicleDropdownOpen(false);
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', fontFamily: fontStyle, marginRight: 6 }}>
                Driver: {tripDriverFilter ? (drivers.find(d => d.id === tripDriverFilter)?.name || 'Selected') : 'All'}
              </Text>
              <Ionicons name="chevron-down-outline" size={12} color="#64748B" />
            </TouchableOpacity>

            {driverDropdownOpen && (
              <View style={{
                position: 'absolute',
                top: 38,
                left: 0,
                width: 200,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                padding: 6,
              }}>
                <ScrollView style={{ maxHeight: 200 }}>
                  <TouchableOpacity
                    style={{ padding: 8, borderRadius: 6, backgroundColor: !tripDriverFilter ? '#EFF6FF' : 'transparent' }}
                    onPress={() => {
                      setTripDriverFilter('');
                      setDriverDropdownOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: !tripDriverFilter ? '700' : '500', color: !tripDriverFilter ? '#1D4ED8' : '#334155', fontFamily: fontStyle }}>All Drivers</Text>
                  </TouchableOpacity>
                  {drivers.map((d) => {
                    const isSel = tripDriverFilter === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={{ padding: 8, borderRadius: 6, backgroundColor: isSel ? '#EFF6FF' : 'transparent', marginTop: 2 }}
                        onPress={() => {
                          setTripDriverFilter(d.id);
                          setDriverDropdownOpen(false);
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: isSel ? '700' : '500', color: isSel ? '#1D4ED8' : '#334155', fontFamily: fontStyle }}>{d.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Vehicle Dropdown Trigger */}
          <View style={{ position: 'relative', marginRight: 12, zIndex: 11 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
              onPress={() => {
                setVehicleDropdownOpen(!vehicleDropdownOpen);
                setDriverDropdownOpen(false);
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', fontFamily: fontStyle, marginRight: 6 }}>
                Vehicle: {tripVehicleFilter ? (vehicles.find(v => v.id === tripVehicleFilter)?.number || 'Selected') : 'All'}
              </Text>
              <Ionicons name="chevron-down-outline" size={12} color="#64748B" />
            </TouchableOpacity>

            {vehicleDropdownOpen && (
              <View style={{
                position: 'absolute',
                top: 38,
                left: 0,
                width: 200,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                padding: 6,
              }}>
                <ScrollView style={{ maxHeight: 200 }}>
                  <TouchableOpacity
                    style={{ padding: 8, borderRadius: 6, backgroundColor: !tripVehicleFilter ? '#EFF6FF' : 'transparent' }}
                    onPress={() => {
                      setTripVehicleFilter('');
                      setVehicleDropdownOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: !tripVehicleFilter ? '700' : '500', color: !tripVehicleFilter ? '#1D4ED8' : '#334155', fontFamily: fontStyle }}>All Vehicles</Text>
                  </TouchableOpacity>
                  {vehicles.map((v) => {
                    const isSel = tripVehicleFilter === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={{ padding: 8, borderRadius: 6, backgroundColor: isSel ? '#EFF6FF' : 'transparent', marginTop: 2 }}
                        onPress={() => {
                          setTripVehicleFilter(v.id);
                          setVehicleDropdownOpen(false);
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: isSel ? '700' : '500', color: isSel ? '#1D4ED8' : '#334155', fontFamily: fontStyle }}>{v.number}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* From Date */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 8,
            paddingVertical: 4,
            paddingHorizontal: 12,
            marginRight: 12,
            overflow: 'hidden',
          }}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4, fontFamily: fontStyle }}>From</Text>
            <input
              type="date"
              style={{
                padding: '4px 0',
                fontSize: 12,
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
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 8,
            paddingVertical: 4,
            paddingHorizontal: 12,
            marginRight: 12,
            overflow: 'hidden',
          }}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4, fontFamily: fontStyle }}>To</Text>
            <input
              type="date"
              style={{
                padding: '4px 0',
                fontSize: 12,
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

          {/* Clear Button */}
          {hasFilters ? (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FEF2F2',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
              onPress={() => {
                setTripDriverFilter('');
                setTripVehicleFilter('');
                setFilterFromDate('');
                setFilterToDate('');
              }}
            >
              <Ionicons name="refresh-outline" size={12} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444', fontFamily: fontStyle }}>Reset Filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Custom Spaced Table Header Row (Fixed) */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 0.6, fontFamily: fontStyle }]}>S.NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6, fontFamily: fontStyle }]}>START TIME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6, fontFamily: fontStyle }]}>END TIME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>OPERATOR DRIVER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.3, fontFamily: fontStyle }]}>VEHICLE NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>SOURCE LOCATION</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>DESTINATION</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6, textAlign: 'right', fontFamily: fontStyle }]}>ODOMETER PROGRESS</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right', fontFamily: fontStyle }]}>END HMR</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.0, textAlign: 'center', fontFamily: fontStyle }]}>STATUS</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.9, textAlign: 'center', fontFamily: fontStyle }]}>BREAKDOWN</Text>
        </View>

        {/* Scrollable table rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.table}>
            {sortedTrips.map((trip, idx) => {
              const driverObj = drivers.find((d) => d.id === trip.driverId);
              const driverName = driverObj?.name || 'Unknown';
              const initials = driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              const vehicleObj = vehicles.find((v) => v.id === trip.vehicleId);
              const plateNo = vehicleObj?.number || 'Unknown';

              // Status badges
              const isDone = trip.status === 'submitted' || trip.status === 'completed';
              const statusBg = isDone ? '#EFF6FF' : '#FFF7ED';
              const statusBorder = isDone ? '#DBEAFE' : '#FFEDD5';
              const statusText = isDone ? '#1D4ED8' : '#EA580C';

              return (
                <View key={trip.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                  {/* S.No Cell */}
                  <Text style={[styles.tableCell, { flex: 0.6, color: '#64748B', fontWeight: 'bold', fontFamily: fontStyle }]}>{idx + 1}</Text>

                  {/* Start Time Cell */}
                  <View style={{ flex: 1.6, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: fontStyle }}>{trip.startDate}</Text>
                    {trip.startTime ? (
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>{trip.startTime}</Text>
                    ) : null}
                  </View>

                  {/* End Time Cell */}
                  <View style={{ flex: 1.6, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    {trip.endDate ? (
                      <>
                        <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: fontStyle }}>{trip.endDate}</Text>
                        {trip.endTime ? (
                          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>{trip.endTime}</Text>
                        ) : null}
                      </>
                    ) : (
                      <Text style={{ fontSize: 12, color: isDone ? '#64748B' : '#10B981', fontWeight: isDone ? '500' : '700', fontFamily: fontStyle }}>
                        {isDone ? 'N/A' : 'Active'}
                      </Text>
                    )}
                  </View>

                  {/* Driver avatar cell */}
                  <View style={{ flex: 1.8, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: '#F59E0B15',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10,
                      borderWidth: 1,
                      borderColor: '#F59E0B25',
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#EA580C', fontFamily: fontStyle }}>{initials}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }} numberOfLines={1}>{driverName}</Text>
                  </View>

                  {/* Vehicle plate cell */}
                  <View style={{ flex: 1.3, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: '#FFF',
                      borderWidth: 1.5,
                      borderColor: '#1E293B',
                      borderRadius: 4,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{plateNo}</Text>
                    </View>
                  </View>

                  {/* Source/Destination cells */}
                  <Text style={[styles.tableCell, { flex: 1.8, color: '#334155', fontWeight: '500', fontFamily: fontStyle }]} numberOfLines={1}>{trip.sourceLocation}</Text>
                  <Text style={[styles.tableCell, { flex: 1.8, color: '#334155', fontWeight: '500', fontFamily: fontStyle }]} numberOfLines={1}>{trip.destinationLocation}</Text>

                  {/* Odometer progress */}
                  <Text style={[styles.tableCell, { flex: 1.6, textAlign: 'right', fontWeight: '700', color: '#1E293B', fontFamily: fontStyle }]}>
                    {trip.startOdometer} km <Text style={{ color: '#94A3B8', fontWeight: '500' }}>→</Text> {trip.endOdometer ? `${trip.endOdometer} km` : 'Active'}
                  </Text>

                  {/* HMR End Only */}
                  <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#0284C7', fontFamily: fontStyle }]}>
                    {trip.endHmr ? `${trip.endHmr} hrs` : '—'}
                  </Text>

                  {/* Status pill badge */}
                  <View style={{ flex: 1.0, alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: statusBg,
                      borderColor: statusBorder,
                      borderWidth: 1,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: statusText, fontFamily: fontStyle }}>
                        {isDone ? 'COMPLETED' : 'ACTIVE'}
                      </Text>
                    </View>
                  </View>

                  {/* Breakdown badge */}
                  <View style={{ flex: 0.9, alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: trip.isBreakdown ? '#FEF2F2' : '#F0FDF4',
                      borderColor: trip.isBreakdown ? '#FECACA' : '#BBF7D0',
                      borderWidth: 1,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: trip.isBreakdown ? '#DC2626' : '#16A34A', fontFamily: fontStyle }}>
                        {trip.isBreakdown ? 'YES' : 'NO'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
