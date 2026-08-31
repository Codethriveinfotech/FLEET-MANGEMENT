package com.vehicletrackingapp.backend.models

import kotlinx.serialization.Serializable

@Serializable
data class Vehicle(
    val id: String,
    val number: String,
    val model: String,
    val imageUri: String? = null,
    val assignedUserId: String? = null,
    val type: String = "Truck",
    val registrationNumber: String = "",
    val fuelType: String = "Diesel",
    val status: String = "Active",
    val mileage: String = "0",
    val insuranceStatus: String = "Valid",
    val place: String = ""
)
