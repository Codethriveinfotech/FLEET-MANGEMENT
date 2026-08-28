import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Context & Styles
import { DashboardDataProvider, useDashboardData } from '../../context/DashboardDataContext';
import { styles, fontStyle } from './AdminStyles';

// Screen Tabs
import OverviewTab from './tabs/OverviewTab';
import VehiclesTab from './tabs/VehiclesTab';
import DriversTab from './tabs/DriversTab';
import TripsTab from './tabs/TripsTab';
import MaintenanceTab from './tabs/MaintenanceTab';
import ReportsTab from './tabs/ReportsTab';
import ProfileTab from './tabs/ProfileTab';
import FuelMonitorTab from './tabs/FuelMonitorTab';
import AdminsTab from './tabs/AdminsTab';

const DashboardStack = createStackNavigator();

function DashboardLayoutContent() {
  const { user, clearAuth } = useAuthStore();
  const { loading } = useDashboardData();
  const navigation = useNavigation<any>();

  // Determine active tab route using React Navigation state
  const navState = useNavigationState((s) => s);
  const activeTab = navState ? (navState.routes[navState.index]?.name || 'overview') : 'overview';

  // Build menu items based on user role
  const isSuper = user?.role === 'SUPER_ADMIN';
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'vehicles', label: 'Vehicles', icon: 'car-outline' },
    { id: 'drivers', label: 'Drivers', icon: 'people-outline' },
    { id: 'trips', label: 'Trips', icon: 'navigate-outline' },
    { id: 'maintenance', label: 'Maintenance', icon: 'construct-outline' },
    { id: 'fuel-monitor', label: 'Fuel Monitor', icon: 'bar-chart-outline' },
    { id: 'reports', label: 'Reports', icon: 'analytics-outline' },
  ];

  if (isSuper) {
    menuItems.push({ id: 'admins', label: 'Admins', icon: 'shield-checkmark-outline' });
  }

  menuItems.push({ id: 'profile', label: 'Settings', icon: 'settings-outline' });

  const avatarChar = user?.name ? user.name[0].toUpperCase() : 'A';
  const roleLabel = user?.role === 'SUPER_ADMIN' ? 'System Owner' : 'Fleet Admin';

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation - Navy Blue Theme */}
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
          {menuItems.map((item) => {
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
                  navigation.navigate(item.id);
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

        {/* Admin footer profile info card */}
        <View style={styles.adminFooterCard}>
          <View style={styles.adminAvatar}>
            <Text style={styles.avatarText}>{avatarChar}</Text>
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.adminName} numberOfLines={1}>{user?.name || 'Admin User'}</Text>
            <Text style={styles.adminEmail} numberOfLines={1}>{user?.email || user?.phone || 'admin@system.com'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutMiniBtn} onPress={clearAuth}>
            <Ionicons name="log-out-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'overview' ? 'Dashboard' : activeTab.toUpperCase()}
          </Text>
          <View style={styles.headerRight}>
            {activeTab === 'overview' && (
              <View style={styles.headerDateContainer}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 8 }} />
                <Text style={styles.headerDateText}>May 25 - May 31, 2025</Text>
                <Ionicons name="chevron-down-outline" size={10} color="#64748B" style={{ marginLeft: 8 }} />
              </View>
            )}
            
            <TouchableOpacity style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={16} color="#64748B" />
              <View style={styles.badgeAlertDot} />
            </TouchableOpacity>
 
            <View style={styles.headerProfileBadge}>
              <View style={[styles.adminAvatar, { width: 28, height: 28, borderRadius: 14, backgroundColor: '#64748B' }]}>
                <Text style={[styles.avatarText, { fontSize: 11 }]}>{avatarChar}</Text>
              </View>
              <View style={{ marginLeft: 8, marginRight: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle }}>{user?.name || 'Admin User'}</Text>
                <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '500', fontFamily: fontStyle }}>{roleLabel}</Text>
              </View>
              <Ionicons name="chevron-down-outline" size={10} color="#64748B" />
            </View>
          </View>
        </View>
 
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color="#1D4ED8" size="large" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
              <DashboardStack.Screen name="overview" component={OverviewTab} />
              <DashboardStack.Screen name="vehicles" component={VehiclesTab} />
              <DashboardStack.Screen name="drivers" component={DriversTab} />
              <DashboardStack.Screen name="trips" component={TripsTab} />
              <DashboardStack.Screen name="maintenance" component={MaintenanceTab} />
              <DashboardStack.Screen name="fuel-monitor" component={FuelMonitorTab} />
              <DashboardStack.Screen name="reports" component={ReportsTab} />
              {isSuper && <DashboardStack.Screen name="admins" component={AdminsTab} />}
              <DashboardStack.Screen name="profile" component={ProfileTab} />
            </DashboardStack.Navigator>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardDataProvider>
      <DashboardLayoutContent />
    </DashboardDataProvider>
  );
}
