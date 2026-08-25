package com.vehicletrackingapp.backend.repository

import com.vehicletrackingapp.backend.database.Trips
import com.vehicletrackingapp.backend.database.Vehicles
import com.vehicletrackingapp.backend.models.Trip
import com.vehicletrackingapp.backend.utils.dbQuery
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq

interface TripRepository {
    suspend fun createTrip(trip: Trip): Trip?
    suspend fun findById(id: String): Trip?
    suspend fun getTripsByDriver(driverId: String): List<Trip>
    suspend fun getTripsByVehicle(vehicleId: String): List<Trip>
    suspend fun updateTrip(trip: Trip): Boolean
    suspend fun deleteTrip(id: String): Boolean
    suspend fun getAllTrips(): List<Trip>
}

class TripRepositoryImpl : TripRepository {
    private fun resultRowToTrip(row: ResultRow) = Trip(
        id = row[Trips.id],
        driverId = row[Trips.driverId],
        vehicleId = row[Trips.vehicleId],
        startDate = row[Trips.startDate],
        startTime = row[Trips.startTime],
        startOdometer = row[Trips.startOdometer],
        startOdometerPhotoUri = row[Trips.startOdometerPhotoUri],
        startVehiclePhotoUri = row[Trips.startVehiclePhotoUri],
        startVehiclePlatePhotoUri = row[Trips.startVehiclePlatePhotoUri],
        day = row[Trips.day],
        shift = row[Trips.shift],
        startHmr = row[Trips.startHmr],
        endDate = row[Trips.endDate],
        endTime = row[Trips.endTime],
        endOdometer = row[Trips.endOdometer],
        endOdometerPhotoUri = row[Trips.endOdometerPhotoUri],
        endVehiclePhotoUri = row[Trips.endVehiclePhotoUri],
        endVehiclePlatePhotoUri = row[Trips.endVehiclePlatePhotoUri],
        sheetPhotoUri = row[Trips.sheetPhotoUri],
        endHmr = row[Trips.endHmr],
        sourceLocation = row[Trips.sourceLocation],
        destinationLocation = row[Trips.destinationLocation],
        fuelLevel = row[Trips.fuelLevel],
        tripPurpose = row[Trips.tripPurpose],
        notes = row[Trips.notes],
        status = row[Trips.status],
        isBreakdown = row[Trips.isBreakdown]
    )

    override suspend fun createTrip(trip: Trip): Trip? = dbQuery {
        val insertStatement = Trips.insert {
            it[id] = trip.id
            it[driverId] = trip.driverId
            it[vehicleId] = trip.vehicleId
            it[startDate] = trip.startDate
            it[startTime] = trip.startTime
            it[startOdometer] = trip.startOdometer
            it[startOdometerPhotoUri] = trip.startOdometerPhotoUri
            it[startVehiclePhotoUri] = trip.startVehiclePhotoUri
            it[startVehiclePlatePhotoUri] = trip.startVehiclePlatePhotoUri
            it[day] = trip.day
            it[shift] = trip.shift
            it[startHmr] = trip.startHmr
            it[endDate] = trip.endDate
            it[endTime] = trip.endTime
            it[endOdometer] = trip.endOdometer
            it[endOdometerPhotoUri] = trip.endOdometerPhotoUri
            it[endVehiclePhotoUri] = trip.endVehiclePhotoUri
            it[endVehiclePlatePhotoUri] = trip.endVehiclePlatePhotoUri
            it[sheetPhotoUri] = trip.sheetPhotoUri
            it[endHmr] = trip.endHmr
            it[sourceLocation] = trip.sourceLocation
            it[destinationLocation] = trip.destinationLocation
            it[fuelLevel] = trip.fuelLevel
            it[tripPurpose] = trip.tripPurpose
            it[notes] = trip.notes
            it[status] = trip.status
            it[isBreakdown] = trip.isBreakdown
        }
        if (trip.status == "submitted" && trip.vehicleId != null && trip.endOdometer.isNotBlank()) {
            Vehicles.update({ Vehicles.id eq trip.vehicleId }) {
                it[mileage] = trip.endOdometer
            }
        }
        insertStatement.resultedValues?.singleOrNull()?.let(::resultRowToTrip)
    }

    override suspend fun findById(id: String): Trip? = dbQuery {
        Trips.select { Trips.id eq id }
            .map(::resultRowToTrip)
            .singleOrNull()
    }

    override suspend fun getTripsByDriver(driverId: String): List<Trip> = dbQuery {
        Trips.select { Trips.driverId eq driverId }
            .map(::resultRowToTrip)
    }

    override suspend fun getTripsByVehicle(vehicleId: String): List<Trip> = dbQuery {
        Trips.select { Trips.vehicleId eq vehicleId }
            .map(::resultRowToTrip)
    }

    override suspend fun updateTrip(trip: Trip): Boolean = dbQuery {
        val updated = Trips.update({ Trips.id eq trip.id }) {
            it[vehicleId] = trip.vehicleId
            it[startDate] = trip.startDate
            it[startTime] = trip.startTime
            it[startOdometer] = trip.startOdometer
            it[startOdometerPhotoUri] = trip.startOdometerPhotoUri
            it[startVehiclePhotoUri] = trip.startVehiclePhotoUri
            it[startVehiclePlatePhotoUri] = trip.startVehiclePlatePhotoUri
            it[day] = trip.day
            it[shift] = trip.shift
            it[startHmr] = trip.startHmr
            it[endDate] = trip.endDate
            it[endTime] = trip.endTime
            it[endOdometer] = trip.endOdometer
            it[endOdometerPhotoUri] = trip.endOdometerPhotoUri
            it[endVehiclePhotoUri] = trip.endVehiclePhotoUri
            it[endVehiclePlatePhotoUri] = trip.endVehiclePlatePhotoUri
            it[sheetPhotoUri] = trip.sheetPhotoUri
            it[endHmr] = trip.endHmr
            it[sourceLocation] = trip.sourceLocation
            it[destinationLocation] = trip.destinationLocation
            it[fuelLevel] = trip.fuelLevel
            it[tripPurpose] = trip.tripPurpose
            it[notes] = trip.notes
            it[status] = trip.status
            it[isBreakdown] = trip.isBreakdown
        } > 0
        if (updated && trip.status == "submitted" && trip.vehicleId != null && trip.endOdometer.isNotBlank()) {
            Vehicles.update({ Vehicles.id eq trip.vehicleId }) {
                it[mileage] = trip.endOdometer
            }
        }
        updated
    }

    override suspend fun deleteTrip(id: String): Boolean = dbQuery {
        Trips.deleteWhere { Trips.id eq id } > 0
    }

    override suspend fun getAllTrips(): List<Trip> = dbQuery {
        Trips.selectAll().map(::resultRowToTrip)
    }
}
