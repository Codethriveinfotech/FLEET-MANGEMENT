export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DRIVER';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  photoUri?: string;
  role: UserRole;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  number: string;
  model: string;
  imageUri?: string;
  assignedUserId?: string; // matches Ktor database column name
  type: string;
  registrationNumber: string;
  fuelType: string;
  status: string;
  mileage: string;
  insuranceStatus: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripEntry {
  id: string;
  driverId: string;
  vehicleId?: string;
  
  // Start Trip
  startDate: string;
  startTime: string;
  startOdometer: string;
  startOdometerPhotoUri?: string;
  startVehiclePhotoUri?: string;
  startVehiclePlatePhotoUri?: string;
  day: string;
  shift: string;
  startHmr: string;
  
  // End Trip
  endDate: string;
  endTime: string;
  endOdometer: string;
  endOdometerPhotoUri?: string;
  endVehiclePhotoUri?: string;
  endVehiclePlatePhotoUri?: string;
  sheetPhotoUri?: string;
  endHmr: string;
  
  // Details
  sourceLocation: string;
  destinationLocation: string;
  fuelLevel: string;
  tripPurpose: string;
  notes: string;
  
  status: string; // draft | submitted | started
  isBreakdown: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  driverId: string;
  tripId?: string;
  maintenanceType: string;
  description: string;
  date: string;
  time: string;
  cost: string;
  serviceNotes: string;
  billImageUri?: string;
  status: string; // draft | submitted
  oilChangeDone: boolean;
  tyreStatusOk: boolean;
  batteryStatusOk: boolean;
  isBreakdownReport: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API Response Formats
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp?: string;
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
