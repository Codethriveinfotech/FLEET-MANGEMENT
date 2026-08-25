package com.vehicletrackingapp.data.local

import androidx.room.*
import com.vehicletrackingapp.data.model.Driver
import com.vehicletrackingapp.data.model.MaintenanceRecord
import com.vehicletrackingapp.data.model.TripEntry
import com.vehicletrackingapp.data.model.Vehicle
import kotlinx.coroutines.flow.Flow

@Dao
interface AppDao {

    // Trips
    @Query("SELECT * FROM trips WHERE driverId = :driverId AND status IN ('draft', 'started') LIMIT 1")
    fun getDraftTrip(driverId: String): Flow<TripEntry?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTrip(trip: TripEntry)

    @Query("SELECT * FROM trips WHERE status = 'submitted' ORDER BY startDate DESC, startTime DESC")
    fun getSubmittedTrips(): Flow<List<TripEntry>>

    @Query("DELETE FROM trips WHERE status = 'submitted'")
    suspend fun deleteSubmittedTrips()

    @Query("SELECT * FROM trips WHERE id = :tripId LIMIT 1")
    suspend fun getTripById(tripId: String): TripEntry?

    @Query("SELECT * FROM trips WHERE vehicleId = :vehicleId AND status = 'submitted'")
    suspend fun getSubmittedTripsForVehicle(vehicleId: String): List<TripEntry>

    @Query("SELECT * FROM trips WHERE status = 'started'")
    suspend fun getAllStartedTrips(): List<TripEntry>

    @Query("DELETE FROM trips WHERE id = :tripId")
    suspend fun deleteTrip(tripId: String)

    @Query("SELECT * FROM trips WHERE driverId = :driverId AND status IN ('draft', 'started')")
    suspend fun getAllDraftTrips(driverId: String): List<TripEntry>

    // Maintenance
    @Query("SELECT * FROM maintenance WHERE driverId = :driverId AND status = 'draft' LIMIT 1")
    fun getDraftMaintenance(driverId: String): Flow<MaintenanceRecord?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMaintenance(record: MaintenanceRecord)

    @Query("SELECT * FROM maintenance WHERE status = 'submitted' ORDER BY date DESC")
    fun getSubmittedMaintenance(): Flow<List<MaintenanceRecord>>

    @Query("DELETE FROM maintenance WHERE status = 'submitted'")
    suspend fun deleteSubmittedMaintenance()

    // Vehicles
    @Query("SELECT * FROM vehicles")
    fun getAllVehicles(): Flow<List<Vehicle>>

    @Query("SELECT * FROM vehicles WHERE id = :id LIMIT 1")
    suspend fun getVehicleById(id: String): Vehicle?

    @Query("DELETE FROM vehicles")
    suspend fun deleteAllVehicles()

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertVehicle(vehicle: Vehicle)

    @Query("DELETE FROM vehicles WHERE id = :id")
    suspend fun deleteVehicle(id: String)

    // Drivers
    @Query("SELECT * FROM drivers")
    fun getAllDrivers(): Flow<List<Driver>>

    @Query("DELETE FROM drivers")
    suspend fun deleteAllDrivers()

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertDriver(driver: Driver)

    @Query("DELETE FROM drivers WHERE id = :id")
    suspend fun deleteDriver(id: String)

    @Query("SELECT * FROM drivers WHERE name = :identity OR phone = :identity LIMIT 1")
    suspend fun getDriverByIdentity(identity: String): Driver?

    @Query("SELECT * FROM drivers WHERE (name = :identity OR phone = :identity) AND password = :password LIMIT 1")
    suspend fun findDriver(identity: String, password: String): Driver?
}
