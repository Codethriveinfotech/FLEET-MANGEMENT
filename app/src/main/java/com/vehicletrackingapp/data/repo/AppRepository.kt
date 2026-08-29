package com.vehicletrackingapp.data.repo

import android.content.Context
import android.util.Log
import com.vehicletrackingapp.data.local.AppDao
import com.vehicletrackingapp.data.local.AppDatabase
import com.vehicletrackingapp.data.model.Driver
import com.vehicletrackingapp.data.model.MaintenanceRecord
import com.vehicletrackingapp.data.model.TripEntry
import com.vehicletrackingapp.data.model.Vehicle
import com.vehicletrackingapp.data.remote.ApiService
import com.vehicletrackingapp.data.remote.LoginRequest
import com.vehicletrackingapp.data.remote.RetrofitClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Enterprise Repository with Offline-First architecture.
 * Room database is the single source of truth.
 */
object AppRepository {

    private var sessionManager: com.vehicletrackingapp.data.local.SessionManager? = null
    lateinit var api: ApiService
        private set
    
    private lateinit var dao: AppDao

    private val _isConnected = MutableStateFlow(true)
    val isConnected: Flow<Boolean> = _isConnected.asStateFlow()

    fun init(context: Context) {
        if (sessionManager != null) return
        val sm = com.vehicletrackingapp.data.local.SessionManager(context)
        sessionManager = sm
        api = RetrofitClient.create(sm)
        dao = AppDatabase.getDatabase(context).dao()
        
        CoroutineScope(Dispatchers.IO).launch {
            syncPendingData()
        }
    }

    suspend fun findDriver(identity: String, password: String): Driver? = try {
        // Resolve identity to phone number if they typed a username (to support old backend version currently on Render)
        val localDriver = dao.getDriverByIdentity(identity)
        val loginIdentity = localDriver?.phone ?: identity

        // Try remote login first
        val response = api.login(LoginRequest(loginIdentity, password))
        if (response.isSuccessful && response.body()?.success == true) {
            val authData = response.body()?.data
            if (authData != null) {
                sessionManager?.saveAuthToken(authData.accessToken)
                sessionManager?.saveSession(authData.user.id, authData.user.name, "driver")
                val driver = Driver(
                    id = authData.user.id,
                    name = authData.user.name,
                    phone = authData.user.phone,
                    email = authData.user.email ?: "",
                    licenseNumber = authData.user.licenseNumber ?: "",
                    photoUri = authData.user.photoUri ?: "",
                    password = password
                )
                dao.upsertDriver(driver) // Cache locally
                syncPendingData()
                driver
            } else null
        } else {
            // Fallback to local check if remote fails
            dao.findDriver(identity, password)?.also { driver ->
                sessionManager?.saveSession(driver.id, driver.name, "driver")
            }
        }
    } catch (e: Exception) {
        Log.e("AppRepository", "findDriver error, falling back to local", e)
        dao.findDriver(identity, password)?.also { driver ->
            sessionManager?.saveSession(driver.id, driver.name, "driver")
        }
    }

    suspend fun loginAdmin(username: String, password: String): Boolean = try {
        val response = api.login(LoginRequest(username, password))
        if (response.isSuccessful && response.body()?.success == true) {
            val authData = response.body()?.data
            if (authData != null) {
                sessionManager?.saveAuthToken(authData.accessToken)
                sessionManager?.saveSession(authData.user.id, authData.user.name, "admin")
                syncPendingData()
                true
            } else false
        } else {
            false
        }
    } catch (e: Exception) {
        Log.e("AppRepository", "loginAdmin error", e)
        false
    }

    suspend fun updateAdminCredentials(username: String, password: String): Boolean = try {
        val response = api.updateUser("admin_id", com.vehicletrackingapp.data.remote.UserDto(
            id = "admin_id",
            name = "System Admin",
            email = "admin@system.com",
            phone = username,
            licenseNumber = null,
            photoUri = null,
            password = password
        ))
        if (response.isSuccessful) {
            sessionManager?.saveSession("admin_id", "System Admin", "admin")
            true
        } else {
            false
        }
    } catch (e: Exception) {
        Log.e("AppRepository", "updateAdminCredentials error", e)
        false
    }

    suspend fun signUp(driver: Driver) { 
        try { 
            dao.upsertDriver(driver) // Save locally first
            val request = com.vehicletrackingapp.data.remote.RegisterRequest(
                id = driver.id,
                name = driver.name,
                email = driver.email,
                phone = driver.phone,
                password = driver.password,
                licenseNumber = driver.licenseNumber,
                photoUri = driver.photoUri
            )
            api.signUp(request)
        } catch (e: Exception) {
            Log.e("AppRepository", "SignUp sync failed", e)
        } 
    }
    
    fun getAllVehicles(): Flow<List<Vehicle>> = dao.getAllVehicles()

    suspend fun addVehicle(vehicle: Vehicle) { 
        try { 
            dao.upsertVehicle(vehicle)
            api.saveVehicle(vehicle)
        } catch (e: Exception) {
            Log.e("AppRepository", "AddVehicle sync failed", e)
        } 
    }

    fun syncPendingData() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                fetchVehicles()
                fetchDrivers()
                fetchTrips()
                fetchMaintenance()
                Log.d("AppRepository", "Data sync complete")
            } catch (e: Exception) {
                Log.e("AppRepository", "Periodic sync failed", e)
            }
        }
    }
    
    private suspend fun fetchVehicles() {
        try {
            val response = api.getVehicles()
            _isConnected.value = response.isSuccessful
            if (response.isSuccessful) {
                val remoteData = response.body()?.data
                if (remoteData != null) {
                    val localVehicles = dao.getAllVehicles().firstOrNull() ?: emptyList()
                    val localMap = localVehicles.associateBy { it.id }
                    val toUpsert = mutableListOf<Vehicle>()

                    remoteData.forEach { remoteVehicle ->
                        val localVehicle = localMap[remoteVehicle.id]
                        if (localVehicle != null && localVehicle.status != remoteVehicle.status) {
                            try {
                                api.updateVehicle(localVehicle.id, localVehicle)
                                toUpsert.add(localVehicle)
                            } catch (e: Exception) {
                                toUpsert.add(localVehicle) // Keep local modified status to try next sync
                            }
                        } else {
                            toUpsert.add(remoteVehicle)
                        }
                    }

                    dao.deleteAllVehicles()
                    toUpsert.forEach { dao.upsertVehicle(it) }
                }
            }
        } catch (e: Exception) {
            _isConnected.value = false
        }
    }
    
    private suspend fun fetchDrivers() {
        try {
            val response = api.getAllUsers()
            if (response.isSuccessful) {
                val remoteData = response.body()?.data
                if (remoteData != null) {
                    dao.deleteAllDrivers()
                    remoteData.forEach { user ->
                        dao.upsertDriver(Driver(
                            id = user.id,
                            name = user.name,
                            phone = user.phone,
                            licenseNumber = user.licenseNumber ?: "",
                            password = user.password ?: "1234",
                            photoUri = user.photoUri,
                            email = user.email ?: ""
                        ))
                    }
                }
            }
        } catch (e: Exception) {}
    }
    
    private suspend fun fetchTrips() {
        try {
            // Offline sync: Push locally submitted unsynced trips to server first
            val localTrips = dao.getSubmittedTrips().firstOrNull() ?: emptyList()
            val failedToSyncIds = mutableSetOf<String>()

            localTrips.forEach { trip ->
                var success = false
                try {
                    val response = api.updateTrip(trip.id, trip)
                    if (response.isSuccessful) {
                        success = true
                    } else {
                        val createResponse = api.createTrip(trip)
                        if (createResponse.isSuccessful) {
                            success = true
                        }
                    }
                } catch (e: Exception) {
                    Log.e("AppRepository", "Failed to sync local trip ${trip.id} during fetch", e)
                }
                if (!success) {
                    failedToSyncIds.add(trip.id)
                }
            }

            val response = api.getAllTrips()
            if (response.isSuccessful) {
                // Delete only the synced submitted trips (those not in failedToSyncIds)
                val allLocal = dao.getAllTripsOnce()
                allLocal.filter { it.status == "submitted" && !failedToSyncIds.contains(it.id) }.forEach {
                    dao.deleteTrip(it.id)
                }
                response.body()?.data?.forEach { dao.upsertTrip(it) }
            }
        } catch (e: Exception) {
            Log.e("AppRepository", "fetchTrips error", e)
        }
    }
    
    private suspend fun fetchMaintenance() {
        try {
            // Offline sync: Push locally submitted unsynced maintenance to server first
            val localMaintenance = dao.getSubmittedMaintenance().firstOrNull() ?: emptyList()
            val failedToSyncIds = mutableSetOf<String>()

            localMaintenance.forEach { record ->
                var success = false
                try {
                    val response = api.updateMaintenance(record.id, record)
                    if (response.isSuccessful) {
                        success = true
                    } else {
                        val createResponse = api.createMaintenance(record)
                        if (createResponse.isSuccessful) {
                            success = true
                        }
                    }
                } catch (e: Exception) {
                    Log.e("AppRepository", "Failed to sync local maintenance ${record.id} during fetch", e)
                }
                if (!success) {
                    failedToSyncIds.add(record.id)
                }
            }

            val response = api.getAllMaintenance()
            if (response.isSuccessful) {
                // Delete only synced maintenance records
                val allLocal = dao.getSubmittedMaintenance().firstOrNull() ?: emptyList()
                allLocal.filter { !failedToSyncIds.contains(it.id) }.forEach {
                    dao.deleteMaintenance(it.id)
                }
                response.body()?.data?.forEach { dao.upsertMaintenance(it) }
            }
        } catch (e: Exception) {
            Log.e("AppRepository", "fetchMaintenance error", e)
        }
    }

    suspend fun updateVehicle(vehicle: Vehicle) { 
        try { 
            dao.upsertVehicle(vehicle)
            api.updateVehicle(vehicle.id, vehicle)
        } catch (e: Exception) {} 
    }
    
    suspend fun deleteVehicle(id: String) { 
        try { 
            dao.deleteVehicle(id)
            api.deleteVehicle(id)
        } catch (e: Exception) {} 
    }

    fun getAllDrivers(): Flow<List<Driver>> = dao.getAllDrivers()
    
    suspend fun updateDriver(driver: Driver) { 
        try { 
            dao.upsertDriver(driver)
            api.updateUser(driver.id, com.vehicletrackingapp.data.remote.UserDto(driver.id, driver.name, driver.email, driver.phone, driver.licenseNumber, driver.photoUri, driver.password))
        } catch (e: Exception) {} 
    }
    
    suspend fun deleteDriver(id: String) { 
        try { 
            dao.deleteDriver(id)
            api.deleteUser(id)
        } catch (e: Exception) {} 
    }

    fun getDraftTrip(driverId: String): Flow<TripEntry?> = dao.getDraftTrip(driverId)

    suspend fun getTripById(id: String): TripEntry? = dao.getTripById(id)

    suspend fun getLastTripForVehicle(vehicleId: String): TripEntry? {
        val trips = dao.getSubmittedTripsForVehicle(vehicleId)
        if (trips.isEmpty()) return null
        val sdf = java.text.SimpleDateFormat("dd/MM/yyyy hh:mm a", java.util.Locale.getDefault())
        return trips.maxByOrNull {
            try {
                val dateTimeStr = "${it.endDate} ${it.endTime}"
                sdf.parse(dateTimeStr)?.time ?: 0L
            } catch (e: Exception) {
                0L
            }
        }
    }

    suspend fun getAllStartedTrips(): List<TripEntry> = dao.getAllStartedTrips()

    suspend fun deleteTrip(id: String) {
        try {
            dao.deleteTrip(id)
            api.deleteTrip(id)
        } catch (e: Exception) {}
    }

    suspend fun discardAllDraftTrips(driverId: String) {
        try {
            val ghostTrips = dao.getAllDraftTrips(driverId)
            ghostTrips.forEach { trip ->
                try {
                    dao.deleteTrip(trip.id)
                } catch (e: Exception) {}
                
                try {
                    api.deleteTrip(trip.id)
                } catch (e: Exception) {}
            }
        } catch (e: Exception) {}
    }
    
    suspend fun upsertTrip(trip: TripEntry): Boolean { 
        return try { 
            dao.upsertTrip(trip)
            val vehicleId = trip.vehicleId
            if (trip.status == "submitted" && vehicleId != null && trip.endOdometer.isNotBlank()) {
                try {
                    dao.getVehicleById(vehicleId)?.let { vehicle ->
                        dao.upsertVehicle(vehicle.copy(mileage = trip.endOdometer))
                    }
                } catch (e: Exception) {
                    Log.e("AppRepository", "Failed to update local vehicle mileage", e)
                }
            }
            if (trip.status == "started") {
                try {
                    api.createTrip(trip)
                } catch (e: Exception) {
                    Log.e("AppRepository", "Failed to sync started trip online", e)
                }
            } else if (trip.status == "submitted") {
                try {
                    val response = api.updateTrip(trip.id, trip)
                    if (!response.isSuccessful) {
                        api.createTrip(trip)
                    }
                } catch (e: Exception) {
                    Log.e("AppRepository", "Failed to sync submitted trip online", e)
                }
            }
            true
        } catch (e: Exception) {
            Log.e("AppRepository", "Database error in upsertTrip", e)
            false
        } 
    }

    fun getAllTrips(): Flow<List<TripEntry>> = dao.getSubmittedTrips()

    fun getDraftMaintenance(driverId: String): Flow<MaintenanceRecord?> = dao.getDraftMaintenance(driverId)

    suspend fun upsertMaintenance(record: MaintenanceRecord): Boolean { 
        return try { 
            dao.upsertMaintenance(record)
            if (record.status == "submitted") {
                try {
                    val response = api.updateMaintenance(record.id, record)
                    if (!response.isSuccessful) {
                        api.createMaintenance(record)
                    }
                } catch (e: Exception) {
                    Log.e("AppRepository", "Failed to sync maintenance online", e)
                }
            }
            true
        } catch (e: Exception) {
            Log.e("AppRepository", "Database error in upsertMaintenance", e)
            false
        } 
    }

    fun getAllMaintenance(): Flow<List<MaintenanceRecord>> = dao.getSubmittedMaintenance()

    fun newId(): String = UUID.randomUUID().toString().take(8)
}
