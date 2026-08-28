package com.vehicletrackingapp.backend.models

import kotlinx.serialization.Serializable

@Serializable
data class FuelLog(
    val id: String,
    val vehicleId: String,
    val driverId: String,
    val date: String,
    val time: String = "",
    val liters: String,
    val cost: String,
    val odometerReading: String = "0"
)
