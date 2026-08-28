import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';
import { User, Vehicle, TripEntry, MaintenanceRecord } from '@fleettrack/shared';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'overview' | 'drivers' | 'vehicles' | 'trips' | 'maintenance' | 'reports' | 'profile';

export default function AdminDashboard() {
  const { user, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Database Data States
  const [drivers, setDrivers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [isLiveBlinking, setIsLiveBlinking] = useState(true);

  // Search & Filter States
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [tripDriverFilter, setTripDriverFilter] = useState('');
  const [tripVehicleFilter, setTripVehicleFilter] = useState('');
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [reportDateRange, setReportDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [reportDriverFilter, setReportDriverFilter] = useState('');
  const [reportVehicleFilter, setReportVehicleFilter] = useState('');

  // Enhanced reports/spreadsheet states
  const [selectedReportType, setSelectedReportType] = useState<string>('Trip Summary Report');
  const [spreadsheetVisible, setSpreadsheetVisible] = useState<boolean>(false);
  const [spreadsheetTab, setSpreadsheetTab] = useState<number>(0);
  const [reportMonth, setReportMonth] = useState<string>('This Month');

  // Selected Vehicle Detail Overlay
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Modals States
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<User | null>(null);
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    password: '',
  });

  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    number: '',
    model: '',
    type: 'Truck',
    registrationNumber: '',
    fuelType: 'Diesel',
    status: 'Active',
    mileage: '0',
    insuranceStatus: 'Valid',
  });

  const [resolveMaintModalVisible, setResolveMaintModalVisible] = useState(false);
  const [resolvingMaint, setResolvingMaint] = useState<any>(null);
  const [resolveForm, setResolveForm] = useState({
    cost: '',
    serviceNotes: '',
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  // Fetch Data Function (with quiet mode option for polling)
  const fetchData = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [drRes, vRes, tRes, mRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/vehicles'),
        apiClient.get('/trips'),
        apiClient.get('/maintenance'),
      ]);

      if (drRes.data.success) {
        const allDrivers = drRes.data.data.filter((u: any) => u.phone !== 'admin');
        setDrivers(allDrivers);
      }
      if (vRes.data.success) setVehicles(vRes.data.data);
      if (tRes.data.success) setTrips(tRes.data.data);
      if (mRes.data.success) setMaintenance(mRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  // Real-time automatic polling & blinking indicator
  useEffect(() => {
    fetchData(); // Initial load

    const pollInterval = setInterval(() => {
      fetchData(true);
    }, 5000);

    const blinkInterval = setInterval(() => {
      setIsLiveBlinking((prev) => !prev);
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(blinkInterval);
    };
  }, []);

  // Drivers CRUD
  const openDriverModal = (driver: User | null = null) => {
    setEditingDriver(driver);
    if (driver) {
      setDriverForm({
        name: driver.name,
        phone: driver.phone,
        email: driver.email || '',
        licenseNumber: driver.licenseNumber || '',
        password: '',
      });
    } else {
      setDriverForm({
        name: '',
        phone: '',
        email: '',
        licenseNumber: '',
        password: '',
      });
    }
    setDriverModalVisible(true);
  };

  const handleSaveDriver = async () => {
    if (!driverForm.name.trim() || !driverForm.phone.trim() || (!editingDriver && !driverForm.password)) {
      alert('Name, phone and password (for new driver) are required');
      return;
    }

    try {
      if (editingDriver) {
        await apiClient.put(`/users/${editingDriver.id}`, {
          id: editingDriver.id,
          name: driverForm.name,
          phone: driverForm.phone,
          email: driverForm.email || null,
          licenseNumber: driverForm.licenseNumber || null,
          password: driverForm.password || null,
        });
      } else {
        await apiClient.post('/auth/register', {
          id: `drv_${Date.now()}`,
          name: driverForm.name,
          phone: driverForm.phone,
          email: driverForm.email || null,
          licenseNumber: driverForm.licenseNumber || null,
          password: driverForm.password,
        });
      }
      setDriverModalVisible(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save driver');
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to permanently delete this driver?')) return;
    try {
      await apiClient.delete(`/users/${driverId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete driver');
    }
  };

  // Vehicles CRUD
  const openVehicleModal = (veh: Vehicle | null = null) => {
    setEditingVehicle(veh);
    if (veh) {
      setVehicleForm({
        number: veh.number,
        model: veh.model,
        type: veh.type || 'Truck',
        registrationNumber: veh.registrationNumber,
        fuelType: veh.fuelType || 'Diesel',
        status: veh.status || 'Active',
        mileage: veh.mileage || '0',
        insuranceStatus: veh.insuranceStatus || 'Valid',
      });
    } else {
      setVehicleForm({
        number: '',
        model: '',
        type: 'Truck',
        registrationNumber: '',
        fuelType: 'Diesel',
        status: 'Active',
        mileage: '0',
        insuranceStatus: 'Valid',
      });
    }
    setVehicleModalVisible(true);
  };

  const handleSaveVehicle = async () => {
    if (!vehicleForm.number.trim() || !vehicleForm.model.trim() || !vehicleForm.registrationNumber.trim()) {
      alert('Plate number, model and registration number are required');
      return;
    }

    try {
      if (editingVehicle) {
        await apiClient.put(`/vehicles/${editingVehicle.id}`, {
          ...editingVehicle,
          number: vehicleForm.number,
          model: vehicleForm.model,
          type: vehicleForm.type,
          registrationNumber: vehicleForm.registrationNumber,
          fuelType: vehicleForm.fuelType,
          status: vehicleForm.status,
          mileage: vehicleForm.mileage,
          insuranceStatus: vehicleForm.insuranceStatus,
        });
      } else {
        await apiClient.post('/vehicles', {
          id: `veh_${Date.now()}`,
          number: vehicleForm.number,
          model: vehicleForm.model,
          type: vehicleForm.type,
          registrationNumber: vehicleForm.registrationNumber,
          fuelType: vehicleForm.fuelType,
          status: vehicleForm.status,
          mileage: vehicleForm.mileage,
          insuranceStatus: vehicleForm.insuranceStatus,
        });
      }
      setVehicleModalVisible(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleDeleteVehicle = async (vehId: string) => {
    if (!confirm('Are you sure you want to permanently delete this vehicle?')) return;
    try {
      await apiClient.delete(`/vehicles/${vehId}`);
      setSelectedVehicle(null);
      fetchData();
    } catch (err) {
      alert('Failed to delete vehicle');
    }
  };

  // Resolve Maintenance Request
  const openResolveMaintModal = (maintRecord: any) => {
    setResolvingMaint(maintRecord);
    setResolveForm({
      cost: maintRecord.cost || '',
      serviceNotes: maintRecord.serviceNotes || '',
    });
    setResolveMaintModalVisible(true);
  };

  const handleResolveMaint = async () => {
    if (!resolveForm.cost.trim()) {
      alert('Cost is required to resolve maintenance request');
      return;
    }

    try {
      await apiClient.put(`/maintenance/${resolvingMaint.id}`, {
        ...resolvingMaint,
        cost: resolveForm.cost,
        serviceNotes: resolveForm.serviceNotes,
        status: 'submitted',
      });
      setResolveMaintModalVisible(false);
      fetchData();
    } catch (err) {
      alert('Failed to resolve maintenance request');
    }
  };

  // Update Profile
  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      setProfileStatus('Name and phone number are required');
      return;
    }

    try {
      await apiClient.put(`/users/${user?.id}`, {
        id: user?.id,
        name: profileForm.name,
        email: profileForm.email || null,
        phone: profileForm.phone,
        password: profileForm.password || null,
      });
      setProfileStatus('Profile credentials updated successfully!');
      setTimeout(() => setProfileStatus(null), 3000);
    } catch (err) {
      setProfileStatus('Failed to update credentials');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Trip ID',
      'Driver Name',
      'Vehicle Plate',
      'Start Date',
      'Start Time',
      'Start Odometer',
      'End Date',
      'End Time',
      'End Odometer',
      'Source Location',
      'Destination Location',
      'Notes',
      'Status',
    ];

    const rows = filteredTrips.map((t) => [
      t.id,
      drivers.find((d) => d.id === t.driverId)?.name || 'Unknown',
      vehicles.find((v) => v.id === t.vehicleId)?.number || 'Unknown',
      t.startDate,
      t.startTime,
      t.startOdometer,
      t.endDate || '',
      t.endTime || '',
      t.endOdometer || '',
      t.sourceLocation,
      t.destinationLocation,
      t.notes,
      t.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    if (Platform.OS === 'web') {
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `FleetReport_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('CSV Exported: ' + rows.length + ' rows.');
    }
  };

  // Filter Computations
  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.phone.includes(driverSearch)
  );

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

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.model.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const filteredTrips = trips.filter((t) => {
    if (tripDriverFilter && t.driverId !== tripDriverFilter) return false;
    if (tripVehicleFilter && t.vehicleId !== tripVehicleFilter) return false;
    return true;
  });

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
  let breakdownCount = 0;

  filteredReportsTrips.forEach((t) => {
    const start = parseFloat(t.startOdometer) || 0;
    const end = parseFloat(t.endOdometer) || 0;
    if (end >= start) {
      reportDistance += end - start;
    }
    if (t.isBreakdown) {
      breakdownCount++;
    }
  });

  const filteredReportsMaint = maintenance.filter((m) => {
    if (reportDriverFilter && m.driverId !== reportDriverFilter) return false;
    if (reportVehicleFilter && m.vehicleId !== reportVehicleFilter) return false;

    if (reportDateRange === 'all') return true;

    const maintDate = parseDateStr(m.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reportDateRange === 'today') {
      return maintDate.getTime() === today.getTime();
    } else if (reportDateRange === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return maintDate.getTime() === yesterday.getTime();
    } else if (reportDateRange === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - today.getDay());
      return maintDate >= startOfWeek;
    } else if (reportDateRange === 'month') {
      return (
        maintDate.getMonth() === today.getMonth() &&
        maintDate.getFullYear() === today.getFullYear()
      );
    }
    return true;
  });

  let reportMaintenanceCost = 0;
  filteredReportsMaint.forEach((m) => {
    reportMaintenanceCost += parseFloat(m.cost) || 0;
  });

  // Aggregated Summary values for Overview Screen
  const totalDistance = trips
    .filter((t) => t.status === 'submitted')
    .reduce((acc, t) => {
      const start = parseFloat(t.startOdometer) || 0;
      const end = parseFloat(t.endOdometer) || 0;
      return acc + (end >= start ? end - start : 0);
    }, 0);

  const totalMaintenanceCost = maintenance
    .filter((m) => m.status === 'submitted')
    .reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);

  const activeTripsCount = trips.filter((t) => t.status === 'started').length;
  const pendingMaintenanceCount = maintenance.filter((m) => m.status === 'draft').length;

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation - Navy Blue Theme from Screenshot */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <View style={styles.miniLogo}>
            <Text style={styles.miniLogoText}>FP</Text>
          </View>
          <View>
            <Text style={styles.sidebarTitle}>FleetPro</Text>
            <Text style={styles.sidebarSubtitle}>Fleet Management</Text>
          </View>
        </View>

        <View style={styles.menuItems}>
          {[
            { id: 'overview', label: 'Dashboard', icon: 'grid-outline' },
            { id: 'vehicles', label: 'Vehicles', icon: 'car-outline' },
            { id: 'drivers', label: 'Drivers', icon: 'people-outline' },
            { id: 'trips', label: 'Trips', icon: 'navigate-outline' },
            { id: 'maintenance', label: 'Maintenance', icon: 'construct-outline' },
            { id: 'reports', label: 'Reports', icon: 'analytics-outline' },
            { id: 'profile', label: 'Settings', icon: 'settings-outline' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            const iconColor = isActive ? '#FFFFFF' : '#94A3B8';

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  isActive && styles.menuItemActive,
                ]}
                onPress={() => {
                  setActiveTab(item.id as TabType);
                  setSelectedVehicle(null);
                }}
              >
                <View style={{ marginRight: 12 }}>
                  <Ionicons name={item.icon as any} size={18} color={iconColor} />
                </View>
                <Text
                  style={[
                    styles.menuItemText,
                    isActive && styles.menuItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Admin info card at bottom of sidebar */}
        <View style={styles.adminFooterCard}>
          <View style={styles.adminAvatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.adminName} numberOfLines={1}>Admin Owner</Text>
            <Text style={styles.adminEmail} numberOfLines={1}>owner@fleetpro.com</Text>
          </View>
          <TouchableOpacity style={styles.logoutMiniBtn} onPress={clearAuth}>
            <Text style={{ fontSize: 14 }}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area - White background workspace */}
      <View style={styles.mainContent}>
        {/* Header Search & Tools (Mockup matching styling) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'overview' ? 'Dashboard' : activeTab.toUpperCase()}
          </Text>
          <View style={styles.headerRight}>
            {/* Date Range Picker Selector matching screenshot */}
            {activeTab === 'overview' && (
              <View style={styles.headerDateContainer}>
                <Text style={{ marginRight: 8, fontSize: 13 }}>📅</Text>
                <Text style={styles.headerDateText}>May 25 - May 31, 2025</Text>
                <Text style={{ marginLeft: 8, fontSize: 10, color: '#64748B' }}>▼</Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.iconCircle}>
              <Text style={{ fontSize: 16 }}>🔔</Text>
              <View style={styles.badgeAlertDot} />
            </TouchableOpacity>

            {/* Profile badge dropdown matching screenshot */}
            <View style={styles.headerProfileBadge}>
              <View style={[styles.adminAvatar, { width: 28, height: 28, borderRadius: 14, backgroundColor: '#64748B' }]}>
                <Text style={[styles.avatarText, { fontSize: 11 }]}>A</Text>
              </View>
              <View style={{ marginLeft: 8, marginRight: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A' }}>Admin User</Text>
                <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '500' }}>Fleet Owner</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#64748B' }}>▼</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color="#1D4ED8" size="large" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* OVERVIEW CONTENT - MATCHING SCREENSHOT NEW FIVE-CARD GRID */}
            {activeTab === 'overview' && (
              <ScrollView showsVerticalScrollIndicator={false}>
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
                      <TouchableOpacity onPress={() => setActiveTab('trips')}>
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
            )}

            {/* OTHER TABS RENDER - SPANNING FULL WORKSPACE WIDTH */}
            {activeTab !== 'overview' && (
              <View style={{ flex: 1 }}>
                {/* DRIVERS TAB */}
                {activeTab === 'drivers' && (
                  <View style={{ flex: 1 }}>
                    {/* Drivers Search & Action Card */}
                    <View style={styles.sectionCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>OPERATOR DIRECTORY</Text>
                        <TouchableOpacity
                          style={[styles.addButton, { flexDirection: 'row', alignItems: 'center' }]}
                          onPress={() => openDriverModal()}
                        >
                          <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.addButtonText}>ADD NEW DRIVER</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Custom Modern Search Input */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        marginBottom: 24,
                      }}>
                        <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                        <TextInput
                          style={{ flex: 1, fontSize: 13, color: '#0F172A', outlineStyle: 'none', fontFamily: fontStyle } as any}
                          placeholder="Search drivers by operator name, phone or email..."
                          placeholderTextColor="#94A3B8"
                          value={driverSearch}
                          onChangeText={setDriverSearch}
                        />
                      </View>

                      {/* Custom Spaced Modern Table */}
                      <View style={styles.table}>
                        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>OPERATOR NAME</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>PHONE NUMBER</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>EMAIL ADDRESS</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>LICENSE NUMBER</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle }]}>ACTIONS</Text>
                        </View>

                        {filteredDrivers.map((driver) => {
                          // Circle Initial Badge
                          const initials = driver.name ? driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR';
                          return (
                            <View key={driver.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                              {/* Driver Profile Column */}
                              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 18,
                                  backgroundColor: '#EFF6FF',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  marginRight: 12,
                                  borderWidth: 1,
                                  borderColor: '#DBEAFE',
                                }}>
                                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#1D4ED8', fontFamily: fontStyle }}>{initials}</Text>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }}>{driver.name}</Text>
                              </View>

                              <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '500', color: '#334155', fontFamily: fontStyle }]}>{driver.phone}</Text>
                              <Text style={[styles.tableCell, { flex: 2, color: '#64748B', fontFamily: fontStyle }]}>{driver.email || 'N/A'}</Text>
                              <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '700', color: '#475569', letterSpacing: 0.5, fontFamily: fontStyle }]}>{driver.licenseNumber || 'N/A'}</Text>

                              {/* Circular Icon Actions */}
                              <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                <TouchableOpacity
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: '#EFF6FF',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 8,
                                  }}
                                  onPress={() => openDriverModal(driver)}
                                >
                                  <Ionicons name="pencil" size={14} color="#1D4ED8" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: '#FEF2F2',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  }}
                                  onPress={() => handleDeleteDriver(driver.id)}
                                >
                                  <Ionicons name="trash" size={14} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}

                {/* VEHICLES CRUD LIST TAB */}
                {activeTab === 'vehicles' && (
                  <View style={{ flex: 1 }}>
                    {/* Vehicles Search & Action Card */}
                    <View style={styles.sectionCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>FLEET INVENTORY</Text>
                        <TouchableOpacity
                          style={[styles.addButton, { flexDirection: 'row', alignItems: 'center' }]}
                          onPress={() => openVehicleModal()}
                        >
                          <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.addButtonText}>ADD VEHICLE</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Custom Modern Search Input */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        marginBottom: 24,
                      }}>
                        <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                        <TextInput
                          style={{ flex: 1, fontSize: 13, color: '#0F172A', outlineStyle: 'none', fontFamily: fontStyle } as any}
                          placeholder="Search fleet by license plate, vehicle model or brand..."
                          placeholderTextColor="#94A3B8"
                          value={vehicleSearch}
                          onChangeText={setVehicleSearch}
                        />
                      </View>

                      {/* Custom Spaced Modern Table */}
                      <View style={styles.table}>
                        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>PLATE NUMBER</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>MODEL</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>TYPE</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.8, fontFamily: fontStyle }]}>REGISTRATION NO</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>MILEAGE</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle }]}>ACTIONS</Text>
                        </View>

                        {filteredVehicles.map((veh) => {
                          // Beautiful License Plate UI representation
                          const displayPlate = veh.number || 'UNKNOWN';
                          // Vehicle Type tags
                          const isTruck = !veh.type || veh.type.toLowerCase().includes('truck');
                          const tagBg = isTruck ? '#EFF6FF' : '#FFF7ED';
                          const tagBorder = isTruck ? '#DBEAFE' : '#FFEDD5';
                          const tagText = isTruck ? '#1D4ED8' : '#EA580C';

                          return (
                            <View key={veh.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}>
                              {/* Plate Badge design */}
                              <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{
                                  backgroundColor: '#FFF',
                                  borderWidth: 1.5,
                                  borderColor: '#1E293B',
                                  borderRadius: 4,
                                  paddingVertical: 3,
                                  paddingHorizontal: 8,
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.05,
                                  shadowRadius: 1,
                                }}>
                                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{displayPlate}</Text>
                                </View>
                              </View>

                              <Text style={[styles.tableCell, { flex: 2, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }]}>{veh.model}</Text>

                              {/* Pill Badge */}
                              <View style={{ flex: 1.2 }}>
                                <View style={{
                                  alignSelf: 'flex-start',
                                  backgroundColor: tagBg,
                                  borderColor: tagBorder,
                                  borderWidth: 1,
                                  paddingVertical: 3,
                                  paddingHorizontal: 8,
                                  borderRadius: 6,
                                }}>
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: tagText, fontFamily: fontStyle }}>{(veh.type || 'Truck').toUpperCase()}</Text>
                                </View>
                              </View>

                              <Text style={[styles.tableCell, { flex: 1.8, color: '#64748B', fontFamily: fontStyle }]}>{veh.registrationNumber}</Text>
                              <Text style={[styles.tableCell, { flex: 1.2, fontWeight: '700', color: '#334155', fontFamily: fontStyle }]}>{veh.mileage ? `${veh.mileage.toLocaleString()}` : '0'} km</Text>

                              {/* Circular Icon Actions */}
                              <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                <TouchableOpacity
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: '#EFF6FF',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 8,
                                  }}
                                  onPress={() => openVehicleModal(veh)}
                                >
                                  <Ionicons name="pencil" size={14} color="#1D4ED8" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: '#FEF2F2',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  }}
                                  onPress={() => handleDeleteVehicle(veh.id)}
                                >
                                  <Ionicons name="trash" size={14} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}

                {/* TRIP LOGS TAB */}
                {activeTab === 'trips' && (
                  <View style={styles.sectionCard}>
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

                      {/* Clear Button */}
                      {(tripDriverFilter || tripVehicleFilter) ? (
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
                          }}
                        >
                          <Ionicons name="refresh-outline" size={12} color="#EF4444" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444', fontFamily: fontStyle }}>Reset Filters</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Scrollable Table View */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ width: '100%' }}>
                      <View style={[styles.table, { minWidth: 1000 }]}>
                        {/* Table Header Row */}
                        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>START DATE</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 2, fontFamily: fontStyle }]}>OPERATOR DRIVER</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.5, fontFamily: fontStyle }]}>VEHICLE NO</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 2.2, fontFamily: fontStyle }]}>SOURCE LOCATION</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 2.2, fontFamily: fontStyle }]}>DESTINATION</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.8, textAlign: 'right', fontFamily: fontStyle }]}>ODOMETER PROGRESS</Text>
                          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', fontFamily: fontStyle }]}>STATUS</Text>
                        </View>

                        {/* Table Data Rows */}
                        {filteredTrips.map((trip) => {
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
                              {/* Date cell */}
                              <Text style={[styles.tableCell, { flex: 1.2, color: '#475569', fontWeight: '500', fontFamily: fontStyle }]}>{trip.startDate}</Text>

                              {/* Driver avatar cell */}
                              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
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
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }}>{driverName}</Text>
                              </View>

                              {/* Vehicle plate cell */}
                              <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
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
                              <Text style={[styles.tableCell, { flex: 2.2, color: '#334155', fontWeight: '500', fontFamily: fontStyle }]} numberOfLines={1}>{trip.sourceLocation}</Text>
                              <Text style={[styles.tableCell, { flex: 2.2, color: '#334155', fontWeight: '500', fontFamily: fontStyle }]} numberOfLines={1}>{trip.destinationLocation}</Text>

                              {/* Odometer progress */}
                              <Text style={[styles.tableCell, { flex: 1.8, textAlign: 'right', fontWeight: '700', color: '#1E293B', fontFamily: fontStyle }]}>
                                {trip.startOdometer} km <Text style={{ color: '#94A3B8', fontWeight: '500' }}>→</Text> {trip.endOdometer ? `${trip.endOdometer} km` : 'Active'}
                              </Text>

                              {/* Status pill badge */}
                              <View style={{ flex: 1.2, alignItems: 'center' }}>
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
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* MAINTENANCE TAB */}
                {activeTab === 'maintenance' && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>MAINTENANCE TICKETS</Text>
                    <View style={styles.table}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>DATE</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>VEHICLE</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>TYPE</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 3 }]}>DESCRIPTION</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>COST</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>STATUS</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>ACTION</Text>
                      </View>
                      {maintenance.map((m) => (
                        <View key={m.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 1.2 }]}>{m.date}</Text>
                          <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold', color: '#1F232B' }]}>{vehicles.find((v) => v.id === m.vehicleId)?.number || 'Unknown'}</Text>
                          <Text style={[styles.tableCell, { flex: 1.5, color: '#F59E0B', fontWeight: 'bold' }]}>{m.maintenanceType}</Text>
                          <Text style={[styles.tableCell, { flex: 3 }]}>{m.description}</Text>
                          <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: 'bold' }]}>{m.cost ? `$${m.cost}` : 'N/A'}</Text>
                          <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'center', fontWeight: 'bold', color: m.status === 'submitted' ? '#24D164' : '#FF3B30' }]}>{m.status === 'submitted' ? 'RESOLVED' : 'REPORTED'}</Text>
                          <View style={{ flex: 1.2, alignItems: 'center' }}>
                            {m.status !== 'submitted' ? (
                              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F4B000' }]} onPress={() => openResolveMaintModal(m)}>
                                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>RESOLVE</Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={{ color: '#8E8E93', fontSize: 12 }}>CLOSED</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && (
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    {/* Left Pane: Report Options */}
                    <View style={[styles.rightVehiclesPanel, { width: 280, marginRight: 24 }]}>
                      <Text style={[styles.panelTitle, { marginBottom: 16 }]}>Reports</Text>
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
                              <Text style={{ fontSize: 12, fontWeight: '700', color: isSel ? '#1D4ED8' : '#1E293B' }}>{opt.label}</Text>
                              <Text style={{ fontSize: 9, color: '#94A3B8' }}>{opt.desc}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Right Pane: Report Dashboard details */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <View>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{selectedReportType}</Text>
                          <Text style={{ fontSize: 11, color: '#64748B' }}>Analytical insights for the fleet</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {/* Date Range Selector Dropdown Mockup */}
                          <View style={[styles.panelSearchBar, { width: 120, height: 36, paddingHorizontal: 8, marginRight: 12 }]}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E293B' }}>{reportMonth}</Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.panelAddBtn, { backgroundColor: '#1D4ED8', flexDirection: 'row', alignItems: 'center', height: 36 }]}
                            onPress={() => {
                              setSpreadsheetTab(0);
                              setSpreadsheetVisible(true);
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', marginRight: 4 }}>📊</Text>
                            <Text style={styles.panelAddBtnText}>View Spreadsheet</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Summary Cards */}
                      <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                          <Text style={styles.statLabel}>Total Distance</Text>
                          <Text style={styles.statValue}>{reportDistance.toLocaleString()} km</Text>
                          <Text style={styles.statTrendText}>
                            <Text style={{ color: '#24D164', fontWeight: 'bold' }}>▲ 7.2%</Text> vs last month
                          </Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statLabel}>Total Fuel</Text>
                          <Text style={styles.statValue}>1,240 L</Text>
                          <Text style={styles.statTrendText}>
                            <Text style={{ color: '#24D164', fontWeight: 'bold' }}>▲ 6.1%</Text> vs last month
                          </Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statLabel}>Total Trips</Text>
                          <Text style={styles.statValue}>{filteredReportsTrips.length}</Text>
                          <Text style={styles.statTrendText}>
                            <Text style={{ color: '#24D164', fontWeight: 'bold' }}>▲ 9.5%</Text> vs last month
                          </Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statLabel}>Avg. Efficiency</Text>
                          <Text style={styles.statValue}>8.9 km/L</Text>
                          <Text style={styles.statTrendText}>
                            <Text style={{ color: '#24D164', fontWeight: 'bold' }}>▲ 4.3%</Text> vs last month
                          </Text>
                        </View>
                      </View>

                      {/* Visualizations Section */}
                      <View style={{ flexDirection: 'row', marginTop: 12 }}>
                        {/* Distance Overview SVG Line Chart */}
                        <View style={[styles.mapCard, { flex: 1, marginRight: 16, height: 320 }]}>
                          <Text style={styles.cardTitle}>Distance Overview</Text>
                          <View style={{ flex: 1, justifyContent: 'flex-end', position: 'relative' }}>
                            {/* Mock Line Graph using SVG or View elements */}
                            <View style={{ position: 'absolute', left: 0, bottom: 40, width: '100%', height: 160, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }}>
                              {/* Horizontal Grid lines */}
                              <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, height: 1, backgroundColor: '#F1F5F9' }} />
                              <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0, height: 1, backgroundColor: '#F1F5F9' }} />
                              <View style={{ position: 'absolute', bottom: 120, left: 0, right: 0, height: 1, backgroundColor: '#F1F5F9' }} />
                              
                              {/* SVG path mockup for the line chart */}
                              <View style={{ width: '90%', height: '100%', marginLeft: 15, justifyContent: 'flex-end' }}>
                                {/* Stylized wavy line mockup */}
                                <View style={{ position: 'absolute', bottom: 30, left: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                                <View style={{ position: 'absolute', bottom: 65, left: 60, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                                <View style={{ position: 'absolute', bottom: 45, left: 110, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                                <View style={{ position: 'absolute', bottom: 110, left: 160, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                                <View style={{ position: 'absolute', bottom: 90, left: 210, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                                <View style={{ position: 'absolute', bottom: 125, left: 260, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
                                
                                {/* Connectors */}
                                <View style={{ position: 'absolute', bottom: 30, left: 14, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '35deg' }], transformOrigin: 'left' }} />
                                <View style={{ position: 'absolute', bottom: 65, left: 64, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '-22deg' }], transformOrigin: 'left' }} />
                                <View style={{ position: 'absolute', bottom: 45, left: 114, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '52deg' }], transformOrigin: 'left' }} />
                                <View style={{ position: 'absolute', bottom: 110, left: 164, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '-22deg' }], transformOrigin: 'left' }} />
                                <View style={{ position: 'absolute', bottom: 90, left: 214, width: 48, height: 2, backgroundColor: '#1D4ED8', transform: [{ rotate: '35deg' }], transformOrigin: 'left' }} />
                              </View>
                            </View>
                            {/* X Axis Labels */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingLeft: 20, paddingTop: 10 }}>
                              <Text style={{ fontSize: 9, color: '#94A3B8' }}>1 May</Text>
                              <Text style={{ fontSize: 9, color: '#94A3B8' }}>8 May</Text>
                              <Text style={{ fontSize: 9, color: '#94A3B8' }}>15 May</Text>
                              <Text style={{ fontSize: 9, color: '#94A3B8' }}>22 May</Text>
                              <Text style={{ fontSize: 9, color: '#94A3B8' }}>29 May</Text>
                            </View>
                          </View>
                        </View>

                        {/* Fuel Consumption Vertical Bar Chart */}
                        <View style={[styles.donutCard, { flex: 1, height: 320, padding: 20 }]}>
                          <Text style={styles.cardTitle}>Fuel Consumption</Text>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, paddingHorizontal: 10 }}>
                            {/* Mock Bars */}
                            {[35, 60, 48, 80, 55, 68, 42, 90, 62, 75].map((val, idx) => (
                              <View key={idx} style={{ alignItems: 'center', width: '8%' }}>
                                <View style={{ height: (val * 1.5), width: '100%', backgroundColor: '#3B82F6', borderRadius: 4 }} />
                              </View>
                            ))}
                          </View>
                          {/* X Axis Labels */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10 }}>
                            <Text style={{ fontSize: 9, color: '#94A3B8' }}>1 May</Text>
                            <Text style={{ fontSize: 9, color: '#94A3B8' }}>8 May</Text>
                            <Text style={{ fontSize: 9, color: '#94A3B8' }}>15 May</Text>
                            <Text style={{ fontSize: 9, color: '#94A3B8' }}>22 May</Text>
                            <Text style={{ fontSize: 9, color: '#94A3B8' }}>29 May</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>ADMIN CONSOLE SECURITY</Text>
                    <View style={styles.formContainer}>
                      <Text style={styles.inputLabel}>ADMIN NAME</Text>
                      <TextInput style={styles.textInput} value={profileForm.name} onChangeText={(val) => setProfileForm({ ...profileForm, name: val })} />
                      <View style={styles.spacer} />
                      <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                      <TextInput style={styles.textInput} value={profileForm.email} onChangeText={(val) => setProfileForm({ ...profileForm, email: val })} />
                      <View style={styles.spacer} />
                      <Text style={styles.inputLabel}>NEW ACCESS PASSWORD</Text>
                      <TextInput style={styles.textInput} placeholder="Enter new password" placeholderTextColor="#8E8E93" value={profileForm.password} onChangeText={(val) => setProfileForm({ ...profileForm, password: val })} secureTextEntry />
                      {profileStatus && <Text style={styles.statusText}>{profileStatus}</Text>}
                      <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
                        <Text style={styles.saveBtnText}>COMMIT CHANGES</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Driver Add/Edit Modal */}
      <Modal visible={driverModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingDriver ? 'EDIT SYSTEM DRIVER' : 'REGISTER NEW DRIVER'}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput style={styles.modalInput} value={driverForm.name} onChangeText={(val) => setDriverForm({ ...driverForm, name: val })} />
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput style={styles.modalInput} value={driverForm.phone} onChangeText={(val) => setDriverForm({ ...driverForm, phone: val })} keyboardType="phone-pad" />
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput style={styles.modalInput} value={driverForm.email} onChangeText={(val) => setDriverForm({ ...driverForm, email: val })} />
              <Text style={styles.inputLabel}>LICENSE NUMBER</Text>
              <TextInput style={styles.modalInput} value={driverForm.licenseNumber} onChangeText={(val) => setDriverForm({ ...driverForm, licenseNumber: val })} />
              <Text style={styles.inputLabel}>{editingDriver ? 'PASSWORD (LEAVE EMPTY)' : 'PASSWORD'}</Text>
              <TextInput style={styles.modalInput} value={driverForm.password} onChangeText={(val) => setDriverForm({ ...driverForm, password: val })} secureTextEntry />
            </ScrollView>
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E2E8F0' }]} onPress={() => setDriverModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#1F232B' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F4B000' }]} onPress={handleSaveDriver}>
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>SAVE DRIVER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vehicle Add/Edit Modal */}
      <Modal visible={vehicleModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingVehicle ? 'EDIT SYSTEM VEHICLE' : 'REGISTER NEW VEHICLE'}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>PLATE NUMBER</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.number} onChangeText={(val) => setVehicleForm({ ...vehicleForm, number: val })} />
              <Text style={styles.inputLabel}>VEHICLE MODEL</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.model} onChangeText={(val) => setVehicleForm({ ...vehicleForm, model: val })} />
              <Text style={styles.inputLabel}>VEHICLE TYPE</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.type} onChangeText={(val) => setVehicleForm({ ...vehicleForm, type: val })} />
              <Text style={styles.inputLabel}>REGISTRATION NUMBER</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.registrationNumber} onChangeText={(val) => setVehicleForm({ ...vehicleForm, registrationNumber: val })} />
              <Text style={styles.inputLabel}>MILEAGE (KM)</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.mileage} onChangeText={(val) => setVehicleForm({ ...vehicleForm, mileage: val })} keyboardType="numeric" />
              <Text style={styles.inputLabel}>INSURANCE STATUS</Text>
              <TextInput style={styles.modalInput} value={vehicleForm.insuranceStatus} onChangeText={(val) => setVehicleForm({ ...vehicleForm, insuranceStatus: val })} />
            </ScrollView>
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E2E8F0' }]} onPress={() => setVehicleModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#1F232B' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F4B000' }]} onPress={handleSaveVehicle}>
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>SAVE VEHICLE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Resolve Maintenance Modal */}
      <Modal visible={resolveMaintModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>RESOLVE DEFECT / MAINTENANCE</Text>
            <Text style={styles.inputLabel}>SERVICE COST ($)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 1500" placeholderTextColor="#8E8E93" value={resolveForm.cost} onChangeText={(val) => setResolveForm({ ...resolveForm, cost: val })} keyboardType="numeric" />
            <Text style={styles.inputLabel}>COMPLETION / SERVICE NOTES</Text>
            <TextInput style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]} placeholder="Enter service details, parts replaced, etc." placeholderTextColor="#8E8E93" value={resolveForm.serviceNotes} onChangeText={(val) => setResolveForm({ ...resolveForm, serviceNotes: val })} multiline />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E2E8F0' }]} onPress={() => setResolveMaintModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#1F232B' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F4B000' }]} onPress={handleResolveMaint}>
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>RESOLVE REQUEST</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Spreadsheet Viewer Modal (Mock spreadsheet overlay matching mockup) */}
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
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#1D4ED8', letterSpacing: 1.5 }}>SPREADSHEET VIEW</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>Analytical Audit Sheets</Text>
              </View>
              <TouchableOpacity
                style={[styles.panelAddBtn, { backgroundColor: '#FF3B30' }]}
                onPress={() => setSpreadsheetVisible(false)}
              >
                <Text style={styles.panelAddBtnText}>Close Sheet</Text>
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
                    <Text style={{ fontSize: 12, fontWeight: '800', color: isTabSel ? '#1D4ED8' : '#64748B' }}>{tabLabel}</Text>
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
                    {/* Header */}
                    <View style={{ flexDirection: 'row', backgroundColor: '#0F243E', paddingVertical: 10, paddingHorizontal: 12 }}>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>DATE</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>DAY</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>SHIFT</Text>
                      <Text style={{ width: 140, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>OPERATOR</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>VEHICLE</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>START KM</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>END KM</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>START HMR</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>END HMR</Text>
                      <Text style={{ width: 110, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>HMR WORKED</Text>
                      <Text style={{ width: 110, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>STATUS</Text>
                      <Text style={{ width: 300, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>MAINTENANCE DETAILS</Text>
                    </View>

                    {/* Body Rows */}
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
                            <Text style={{ width: 100, fontSize: 11, color: '#475569' }}>{trip.startDate}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569' }}>{trip.day}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569' }}>{trip.shift}</Text>
                            <Text style={{ width: 140, fontSize: 11, fontWeight: '700', color: '#1E293B' }}>{driverName}</Text>
                            <Text style={{ width: 120, fontSize: 11, fontWeight: '700', color: '#1E293B' }}>{vehicleNo}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569' }}>{trip.startOdometer}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569' }}>{trip.endOdometer || 'Active'}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569' }}>{startHmrVal.toFixed(1)}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569' }}>{endHmrVal > 0 ? endHmrVal.toFixed(1) : 'Active'}</Text>
                            <Text style={{ width: 110, fontSize: 11, fontWeight: '700', color: '#1E293B' }}>{hmrWorked}</Text>
                            <Text style={{ width: 110, fontSize: 11, fontWeight: '900', color: trip.isBreakdown ? '#FF3B30' : '#24D164' }}>{statusStr}</Text>
                            <Text style={{ width: 300, fontSize: 11, color: '#64748B' }} numberOfLines={1}>{maintStr}</Text>
                          </View>
                        );
                      })}
                      {trips.length === 0 && (
                        <Text style={styles.emptyText}>No spreadsheet entries available.</Text>
                      )}
                    </ScrollView>
                  </View>
                </ScrollView>
              ) : (
                // TAB 2: OPERATOR PERFORMANCE
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ width: 1000 }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', backgroundColor: '#0F243E', paddingVertical: 10, paddingHorizontal: 12 }}>
                      <Text style={{ width: 160, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>OPERATOR NAME</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>TOTAL MISSIONS</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>WORKING DAYS</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>DAY SHIFTS</Text>
                      <Text style={{ width: 100, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>NIGHT SHIFTS</Text>
                      <Text style={{ width: 130, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>SUNDAY SESSIONS</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>BREAKDOWNS</Text>
                      <Text style={{ width: 120, fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>BILLING DAYS</Text>
                    </View>

                    {/* Body Rows */}
                    <ScrollView style={{ flex: 1 }}>
                      {getOperatorPerformanceStats().map((stat, index) => {
                        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                        return (
                          <View key={stat.id} style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: rowBg, borderBottomWidth: 1, borderColor: '#F1F5F9' }}>
                            <Text style={{ width: 160, fontSize: 11, fontWeight: '700', color: '#1E293B' }}>{stat.name}</Text>
                            <Text style={{ width: 120, fontSize: 11, color: '#475569' }}>{stat.totalMissions}</Text>
                            <Text style={{ width: 120, fontSize: 11, color: '#475569' }}>{stat.uniqueDays}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569' }}>{stat.dayShifts}</Text>
                            <Text style={{ width: 100, fontSize: 11, color: '#475569' }}>{stat.nightShifts}</Text>
                            <Text style={{ width: 130, fontSize: 11, color: '#475569' }}>{stat.sundays}</Text>
                            <Text style={{ width: 120, fontSize: 11, fontWeight: '900', color: stat.breakdowns > 0 ? '#FF3B30' : '#475569' }}>{stat.breakdowns}</Text>
                            <Text style={{ width: 120, fontSize: 11, fontWeight: '700', color: '#24D164' }}>{stat.billingDays}</Text>
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

const fontStyle = Platform.OS === 'web'
  ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : undefined;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC', // Crisp light background from mockup
  },
  sidebar: {
    width: 240,
    backgroundColor: '#0F243E', // Navy Blue from mockup
    padding: 24,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  miniLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1D4ED8', // Active blue highlight
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  miniLogoText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: fontStyle,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontStyle,
  },
  sidebarSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: fontStyle,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
  },
  menuItemActive: {
    backgroundColor: '#1D4ED8', // Solid blue active selection from mockup
  },
  menuIcon: {
    fontSize: 14,
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    fontFamily: fontStyle,
  },
  menuItemTextActive: {
    color: '#FFFFFF', // White text on active tab
  },
  adminFooterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    borderRadius: 16,
  },
  adminAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: fontStyle,
  },
  adminInfo: {
    flex: 1,
    marginLeft: 10,
  },
  adminName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: fontStyle,
  },
  adminEmail: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: fontStyle,
  },
  logoutMiniBtn: {
    padding: 4,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: fontStyle,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  headerDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: fontStyle,
  },
  headerProfileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 16,
  },
  alertCardCompact: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    width: 250,
    marginRight: 16,
  },
  searchIcon: {
    marginRight: 8,
    color: '#64748B',
  },
  headerSearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  badgeAlertDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 210,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 26,
    marginHorizontal: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  statIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 2,
  },
  statTrendText: {
    fontSize: 11,
    color: '#64748B',
  },
  trackingChartRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  mapCard: {
    flex: 1.2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    fontFamily: fontStyle,
  },
  mockMapContainer: {
    height: 220,
    backgroundColor: '#EFF6FF', // Light blue water/map body
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  mapBgLine1: {
    position: 'absolute',
    top: 50,
    left: -20,
    width: 400,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transform: [{ rotate: '25deg' }],
  },
  mapBgLine2: {
    position: 'absolute',
    top: 130,
    left: -20,
    width: 400,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transform: [{ rotate: '-15deg' }],
  },
  mapBgLine3: {
    position: 'absolute',
    top: 100,
    left: 80,
    width: 2,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  mapPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1D4ED8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapPinPopup: {
    position: 'absolute',
    top: 50,
    left: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    width: 150,
  },
  popupPlate: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
    fontFamily: fontStyle,
  },
  popupSpeed: {
    fontSize: 9,
    fontWeight: '700',
    color: '#24D164',
    marginBottom: 4,
    fontFamily: fontStyle,
  },
  popupLoc: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
    fontFamily: fontStyle,
  },
  popupTime: {
    fontSize: 8,
    color: '#94A3B8',
    fontFamily: fontStyle,
  },
  donutCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
  },
  chartContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 220,
  },
  donutCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 12,
    borderColor: '#24D164', // Green running default ring
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutInnerCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutMiddleNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: fontStyle,
  },
  donutMiddleLabel: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: fontStyle,
  },
  donutLegend: {
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    width: 60,
    fontFamily: fontStyle,
  },
  legendVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: fontStyle,
  },
  bottomStatCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  bottomStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 35,
    marginBottom: 12,
  },
  sparkBar: {
    width: 6,
    backgroundColor: '#24D164',
    marginRight: 4,
    borderRadius: 2,
  },
  viewAllBtn: {
    alignSelf: 'flex-start',
  },
  viewAllText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  rightVehiclesPanel: {
    width: 380,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  panelAddBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  panelAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  panelSearchRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  panelSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  panelSearchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  panelFilterBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  rightColHead: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  rightVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
    paddingVertical: 12,
  },
  miniVehicleAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiclePlateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleModelText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  vehicleStatusLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  rowCell: {
    fontSize: 11,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 30,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  pageArrow: {
    padding: 6,
  },
  pageNumber: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pageNumberActive: {
    backgroundColor: '#EFF6FF',
  },
  pageNumberText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  pageNumberTextActive: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  addButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
    marginBottom: 20,
  },
  table: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
    paddingVertical: 14,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 13,
    color: '#64748B',
  },
  tableCellActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionBtn: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailContainer: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingBottom: 16,
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  detailBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  detailItem: {
    flex: 1,
    minWidth: 200,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#0F172A',
    fontSize: 13,
  },
  dateSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  dateChipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  dateChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  formContainer: {
    maxWidth: 500,
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
  },
  spacer: {
    height: 16,
  },
  statusText: {
    color: '#24D164',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginLeft: 12,
  },
  modalBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  activityRow: {
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeDotLabel: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#24D164',
    marginRight: 10,
  },
  activityText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 12,
  },
});
