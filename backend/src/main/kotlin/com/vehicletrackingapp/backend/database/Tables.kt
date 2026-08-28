package com.vehicletrackingapp.backend.database

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.kotlin.datetime.datetime
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.jetbrains.exposed.sql.ReferenceOption

object Users : Table("users") {
    val id = text("id")
    val name = text("name")
    val email = text("email").uniqueIndex().nullable()
    val phone = text("phone").uniqueIndex()
    val passwordHash = text("password_hash")
    val licenseNumber = text("license_number").nullable()
    val photoUri = text("photo_uri").nullable()
    val createdAt = datetime("created_at").default(Clock.System.now().toLocalDateTime(TimeZone.UTC))
    val updatedAt = datetime("updated_at").default(Clock.System.now().toLocalDateTime(TimeZone.UTC))
    override val primaryKey = PrimaryKey(id)
}

object RefreshTokens : Table("refresh_tokens") {
    val id = integer("id").autoIncrement()
    val userId = text("user_id").references(Users.id, onDelete = ReferenceOption.CASCADE)
    val token = text("token").uniqueIndex()
    val expiresAt = datetime("expires_at")
    override val primaryKey = PrimaryKey(id)
}

object Vehicles : Table("vehicles") {
    val id = text("id")
    val number = text("number").uniqueIndex()
    val model = text("model")
    val imageUri = text("image_uri").nullable()
    val assignedUserId = text("assigned_user_id").references(Users.id, onDelete = ReferenceOption.SET_NULL).nullable()
    val type = text("type").default("Truck")
    val registrationNumber = text("registration_number").default("")
    val fuelType = text("fuel_type").default("Diesel")
    val status = text("status").default("Active")
    val mileage = text("mileage").default("0")
    val insuranceStatus = text("insurance_status").default("Valid")
    override val primaryKey = PrimaryKey(id)
}

object Trips : Table("trips") {
    val id = text("id")
    val driverId = text("driver_id").references(Users.id, onDelete = ReferenceOption.CASCADE)
    val vehicleId = text("vehicle_id").references(Vehicles.id, onDelete = ReferenceOption.SET_NULL).nullable()
    
    // Start Trip
    val startDate = text("start_date").default("")
    val startTime = text("start_time").default("")
    val startOdometer = text("start_odometer").default("")
    val startOdometerPhotoUri = text("start_odometer_photo_uri").nullable()
    val startVehiclePhotoUri = text("start_vehicle_photo_uri").nullable()
    val startVehiclePlatePhotoUri = text("start_vehicle_plate_photo_uri").nullable()
    val day = text("day").default("Monday")
    val shift = text("shift").default("Day Shift")
    val startHmr = text("start_hmr").default("")
    
    // End Trip
    val endDate = text("end_date").default("")
    val endTime = text("end_time").default("")
    val endOdometer = text("end_odometer").default("")
    val endOdometerPhotoUri = text("end_odometer_photo_uri").nullable()
    val endVehiclePhotoUri = text("end_vehicle_photo_uri").nullable()
    val endVehiclePlatePhotoUri = text("end_vehicle_plate_photo_uri").nullable()
    val sheetPhotoUri = text("sheet_photo_uri").nullable()
    val endHmr = text("end_hmr").default("")
    
    // Details
    val sourceLocation = text("source_location").default("")
    val destinationLocation = text("destination_location").default("")
    val fuelLevel = text("fuel_level").default("Full")
    val tripPurpose = text("trip_purpose").default("Delivery")
    val notes = text("notes").default("")
    
    val status = text("status").default("draft")
    val isBreakdown = bool("is_breakdown").default(false)
    override val primaryKey = PrimaryKey(id)
}

object Maintenance : Table("maintenance") {
    val id = text("id")
    val vehicleId = text("vehicle_id").references(Vehicles.id, onDelete = ReferenceOption.CASCADE)
    val driverId = text("driver_id").references(Users.id, onDelete = ReferenceOption.CASCADE)
    val tripId = text("trip_id").references(Trips.id, onDelete = ReferenceOption.SET_NULL).nullable()
    val maintenanceType = text("maintenance_type").default("")
    val description = text("description")
    val date = text("date")
    val time = text("time").default("")
    val cost = text("cost")
    val serviceNotes = text("service_notes").default("")
    val billImageUri = text("bill_image_uri").nullable()
    val status = text("status").default("draft")
    val oilChangeDone = bool("oil_change_done").default(false)
    val tyreStatusOk = bool("tyre_status_ok").default(true)
    val batteryStatusOk = bool("battery_status_ok").default(true)
    val isBreakdownReport = bool("is_breakdown_report").default(false)
    override val primaryKey = PrimaryKey(id)
}

object FuelLogs : Table("fuel_logs") {
    val id = text("id")
    val vehicleId = text("vehicle_id").references(Vehicles.id, onDelete = ReferenceOption.CASCADE)
    val driverId = text("driver_id").references(Users.id, onDelete = ReferenceOption.CASCADE)
    val date = text("date")
    val time = text("time").default("")
    val liters = text("liters")
    val cost = text("cost")
    val odometerReading = text("odometer_reading").default("0")
    override val primaryKey = PrimaryKey(id)
}
