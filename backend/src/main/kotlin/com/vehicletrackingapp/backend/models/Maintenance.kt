package com.vehicletrackingapp.backend.models

import kotlinx.serialization.Serializable

@Serializable
data class Maintenance(
    val id: String,
    val vehicleId: String,
    val driverId: String,
    val tripId: String? = null,
    val maintenanceType: String = "",
    val description: String,
    val date: String,
    val time: String = "",
    val cost: String,
    val serviceNotes: String = "",
    val billImageUri: String? = null,
    val status: String = "draft",
    val oilChangeDone: Boolean = false,
    val tyreStatusOk: Boolean = true,
    val batteryStatusOk: Boolean = true,
    val isBreakdownReport: Boolean = false
)
