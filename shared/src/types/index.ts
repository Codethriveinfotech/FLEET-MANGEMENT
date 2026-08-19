export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DRIVER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  currentMileage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverLog {
  id: string;
  driverId: string;
  vehicleId: string;
  startTime: Date;
  endTime?: Date;
  startMileage: number;
  endMileage?: number;
  status: 'ACTIVE' | 'COMPLETED';
  notes?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string;
  date: Date;
  gallonsOrLiters: number;
  cost: number;
  odometerReading: number;
  receiptUrl?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  reportedById: string;
  description: string;
  status: 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED';
  cost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
}

// API Response Formats
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
