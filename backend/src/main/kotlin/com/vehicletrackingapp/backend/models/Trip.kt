package com.vehicletrackingapp.backend.models

import kotlinx.serialization.Serializable

@Serializable
data class Trip(
    val id: String,
    val driverId: String,
    val vehicleId: String?,
    val startDate: String = "",
    val startTime: String = "",
    val startOdometer: String = "",
    val startOdometerPhotoUri: String? = null,
    val startVehiclePhotoUri: String? = null,
    val startVehiclePlatePhotoUri: String? = null,
    val day: String = "Monday",
    val shift: String = "Day Shift",
    val startHmr: String = "",
    val endDate: String = "",
    val endTime: String = "",
    val endOdometer: String = "",
    val endOdometerPhotoUri: String? = null,
    val endVehiclePhotoUri: String? = null,
    val endVehiclePlatePhotoUri: String? = null,
    val sheetPhotoUri: String? = null,
    val endHmr: String = "",
    val sourceLocation: String = "",
    val destinationLocation: String = "",
    val fuelLevel: String = "Full",
    val tripPurpose: String = "Delivery",
    val notes: String = "",
    val status: String = "draft",
    val isBreakdown: Boolean = false
)
