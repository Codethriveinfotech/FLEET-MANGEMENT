package com.vehicletrackingapp.backend.repository

import com.vehicletrackingapp.backend.database.Vehicles
import com.vehicletrackingapp.backend.models.Vehicle
import com.vehicletrackingapp.backend.utils.dbQuery
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq

interface VehicleRepository {
    suspend fun createVehicle(vehicle: Vehicle): Vehicle?
    suspend fun findById(id: String): Vehicle?
    suspend fun getAllVehicles(): List<Vehicle>
    suspend fun getVehiclesByDriver(driverId: String): List<Vehicle>
    suspend fun updateVehicle(vehicle: Vehicle): Boolean
    suspend fun deleteVehicle(id: String): Boolean
}

class VehicleRepositoryImpl : VehicleRepository {
    private fun resultRowToVehicle(row: ResultRow) = Vehicle(
        id = row[Vehicles.id],
        number = row[Vehicles.number],
        model = row[Vehicles.model],
        imageUri = row[Vehicles.imageUri],
        assignedUserId = row[Vehicles.assignedUserId],
        type = row[Vehicles.type],
        registrationNumber = row[Vehicles.registrationNumber],
        fuelType = row[Vehicles.fuelType],
        status = row[Vehicles.status],
        mileage = row[Vehicles.mileage],
        insuranceStatus = row[Vehicles.insuranceStatus],
        place = row[Vehicles.place]
    )

    override suspend fun createVehicle(vehicle: Vehicle): Vehicle? = dbQuery {
        val insertStatement = Vehicles.insert {
            it[id] = vehicle.id
            it[number] = vehicle.number
            it[model] = vehicle.model
            it[imageUri] = vehicle.imageUri
            it[assignedUserId] = vehicle.assignedUserId
            it[type] = vehicle.type
            it[registrationNumber] = vehicle.registrationNumber
            it[fuelType] = vehicle.fuelType
            it[status] = vehicle.status
            it[mileage] = vehicle.mileage
            it[insuranceStatus] = vehicle.insuranceStatus
            it[place] = vehicle.place
        }
        insertStatement.resultedValues?.singleOrNull()?.let(::resultRowToVehicle)
    }

    override suspend fun findById(id: String): Vehicle? = dbQuery {
        Vehicles.select { Vehicles.id eq id }
            .map(::resultRowToVehicle)
            .singleOrNull()
    }

    override suspend fun getAllVehicles(): List<Vehicle> = dbQuery {
        Vehicles.selectAll().map(::resultRowToVehicle)
    }

    override suspend fun getVehiclesByDriver(driverId: String): List<Vehicle> = dbQuery {
        Vehicles.select { Vehicles.assignedUserId eq driverId }
            .map(::resultRowToVehicle)
    }

    override suspend fun updateVehicle(vehicle: Vehicle): Boolean = dbQuery {
        Vehicles.update({ Vehicles.id eq vehicle.id }) {
            it[number] = vehicle.number
            it[model] = vehicle.model
            it[imageUri] = vehicle.imageUri
            it[assignedUserId] = vehicle.assignedUserId
            it[type] = vehicle.type
            it[registrationNumber] = vehicle.registrationNumber
            it[fuelType] = vehicle.fuelType
            it[status] = vehicle.status
            it[mileage] = vehicle.mileage
            it[insuranceStatus] = vehicle.insuranceStatus
            it[place] = vehicle.place
        } > 0
    }

    override suspend fun deleteVehicle(id: String): Boolean = dbQuery {
        Vehicles.deleteWhere { Vehicles.id eq id } > 0
    }
}
