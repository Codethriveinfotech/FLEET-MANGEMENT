package com.vehicletrackingapp.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "drivers")
data class Driver(
    @PrimaryKey var id: String = "",
    var name: String = "",
    var phone: String = "",
    var licenseNumber: String = "",
    var password: String = "",
    var photoUri: String? = null,
    var email: String = ""
)

@Entity(tableName = "vehicles")
data class Vehicle(
    @PrimaryKey var id: String = "",
    var number: String = "",
    var model: String = "",
    var imageUri: String? = null,
    @com.google.gson.annotations.SerializedName("assignedUserId")
    var assignedDriverId: String? = null,
    var type: String = "Truck", // Truck, Van, etc.
    var registrationNumber: String = "",
    var fuelType: String = "Diesel",
    var status: String = "Active",
    var mileage: String = "0",
    var insuranceStatus: String = "Valid"
)

@Entity(tableName = "trips")
data class TripEntry(
    @PrimaryKey var id: String = "",
    var driverId: String = "",
    var vehicleId: String? = null,
    
    // Start Trip
    var startDate: String = "",
    var startTime: String = "",
    var startOdometer: String = "",
    var startOdometerPhotoUri: String? = null,
    var startVehiclePhotoUri: String? = null,
    var startVehiclePlatePhotoUri: String? = null,
    var day: String = "Monday",
    var shift: String = "Day Shift",
    var startHmr: String = "",
    
    // End Trip
    var endDate: String = "",
    var endTime: String = "",
    var endOdometer: String = "",
    var endOdometerPhotoUri: String? = null,
    var endVehiclePhotoUri: String? = null,
    var endVehiclePlatePhotoUri: String? = null,
    var sheetPhotoUri: String? = null,
    var endHmr: String = "",
    
    // Details
    var sourceLocation: String = "",
    var destinationLocation: String = "",
    var fuelLevel: String = "",
    var tripPurpose: String = "Delivery",
    var notes: String = "",
    
    var status: String = "draft", // draft | submitted
    var isBreakdown: Boolean = false
)

fun TripEntry.getHmrStart(): Double {
    val raw = startHmr.toDoubleOrNull() ?: 0.0
    if (raw > 0.0) return raw
    val sOdo = startOdometer.toDoubleOrNull() ?: 0.0
    return if (sOdo > 0.0) (sOdo / 15.0) else 500.0
}

fun TripEntry.getHmrEnd(): Double {
    val start = getHmrStart()
    val rawEnd = endHmr.toDoubleOrNull() ?: 0.0
    if (rawEnd > start) return rawEnd
    
    val sOdo = startOdometer.toDoubleOrNull() ?: 0.0
    val eOdo = endOdometer.toDoubleOrNull() ?: sOdo
    val diff = if (eOdo >= sOdo) eOdo - sOdo else 0.0
    return start + (diff / 15.0).coerceAtLeast(if (diff > 0) 1.0 else 0.5)
}

fun TripEntry.getHmrWorked(): Double {
    val e = getHmrEnd()
    val s = getHmrStart()
    return (e - s).coerceAtLeast(0.0)
}

@Entity(tableName = "maintenance")
data class MaintenanceRecord(
    @PrimaryKey var id: String = "",
    var vehicleId: String = "",
    var driverId: String = "",
    var tripId: String? = null,
    var maintenanceType: String = "", // Petrol, Wheel, Battery, Service, Breakdown, etc.
    var description: String = "",
    var date: String = "",
    var time: String = "",
    var cost: String = "",
    var serviceNotes: String = "",
    var billImageUri: String? = null,
    var status: String = "draft", // draft | submitted
    var oilChangeDone: Boolean = false,
    var tyreStatusOk: Boolean = true,
    var batteryStatusOk: Boolean = true,
    var isBreakdownReport: Boolean = false
)

enum class AppLanguage(val code: String, val label: String) {
    ENGLISH("en", "English"),
    TAMIL("ta", "தமிழ்"),
    HINDI("hi", "हिन्दी")
}
