import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User, Vehicle, FuelLog } from '@fleettrack/shared';

interface DashboardDataContextType {
  drivers: User[];
  setDrivers: React.Dispatch<React.SetStateAction<User[]>>;
  admins: User[];
  setAdmins: React.Dispatch<React.SetStateAction<User[]>>;
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  trips: any[];
  setTrips: React.Dispatch<React.SetStateAction<any[]>>;
  maintenance: any[];
  setMaintenance: React.Dispatch<React.SetStateAction<any[]>>;
  fuelLogs: FuelLog[];
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLog[]>>;
  loading: boolean;
  isLiveBlinking: boolean;
  fetchData: (quiet?: boolean) => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLiveBlinking, setIsLiveBlinking] = useState(true);

  const fetchData = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const ts = Date.now();
      const config = {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };
      const [drRes, vRes, tRes, mRes, fRes] = await Promise.all([
        apiClient.get(`/users?_t=${ts}`, config),
        apiClient.get(`/vehicles?_t=${ts}`, config),
        apiClient.get(`/trips?_t=${ts}`, config),
        apiClient.get(`/maintenance?_t=${ts}`, config),
        apiClient.get(`/fuel?_t=${ts}`, config),
      ]);

      if (drRes.data.success) {
        const allDrivers = drRes.data.data.filter((u: any) => u.role === 'DRIVER' || (!u.role && u.phone !== 'admin'));
        const allAdmins = drRes.data.data.filter((u: any) => u.role === 'ADMIN');
        setDrivers(allDrivers);
        setAdmins(allAdmins);
      }
      if (vRes.data.success) setVehicles(vRes.data.data);
      if (tRes.data.success) setTrips(tRes.data.data);
      if (mRes.data.success) setMaintenance(mRes.data.data);
      if (fRes.data.success) setFuelLogs(fRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

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

  return (
    <DashboardDataContext.Provider
      value={{
        drivers,
        setDrivers,
        admins,
        setAdmins,
        vehicles,
        setVehicles,
        trips,
        setTrips,
        maintenance,
        setMaintenance,
        fuelLogs,
        setFuelLogs,
        loading,
        isLiveBlinking,
        fetchData,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}
