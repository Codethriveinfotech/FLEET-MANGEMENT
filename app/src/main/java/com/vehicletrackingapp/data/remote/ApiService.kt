package com.vehicletrackingapp.data.remote

import com.vehicletrackingapp.data.model.Driver
import com.vehicletrackingapp.data.model.MaintenanceRecord
import com.vehicletrackingapp.data.model.TripEntry
import com.vehicletrackingapp.data.model.Vehicle
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("api/auth/register")
    suspend fun signUp(@Body request: RegisterRequest): Response<ApiResponse<AuthResponse>>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>

    @POST("api/auth/refresh")
    suspend fun refresh(@Body request: RefreshRequest): Response<ApiResponse<AuthResponse>>

    // User/Driver Profile
    @GET("api/user/profile")
    suspend fun getProfile(): Response<ApiResponse<UserDto>>

    // Admin Users/Drivers
    @GET("api/users")
    suspend fun getAllUsers(): Response<ApiResponse<List<UserDto>>>

    @PUT("api/users/{id}")
    suspend fun updateUser(@Path("id") id: String, @Body user: UserDto): Response<ApiResponse<Boolean>>

    @DELETE("api/users/{id}")
    suspend fun deleteUser(@Path("id") id: String): Response<ApiResponse<Boolean>>

    // Vehicles
    @GET("api/vehicles")
    suspend fun getVehicles(): Response<ApiResponse<List<Vehicle>>>

    @POST("api/vehicles")
    suspend fun saveVehicle(@Body vehicle: Vehicle): Response<ApiResponse<Vehicle>>
    
    @DELETE("api/vehicles/{id}")
    suspend fun deleteVehicle(@Path("id") id: String): Response<ApiResponse<Boolean>>
    
    @PUT("api/vehicles/{id}")
    suspend fun updateVehicle(@Path("id") id: String, @Body vehicle: Vehicle): Response<ApiResponse<Boolean>>

    // Trips
    @GET("api/trips/my")
    suspend fun getMyTrips(): Response<ApiResponse<List<TripEntry>>>

    @GET("api/trips")
    suspend fun getAllTrips(): Response<ApiResponse<List<TripEntry>>>

    @POST("api/trips")
    suspend fun createTrip(@Body trip: TripEntry): Response<ApiResponse<TripEntry>>
    
    @PUT("api/trips/{id}")
    suspend fun updateTrip(@Path("id") id: String, @Body trip: TripEntry): Response<ApiResponse<Boolean>>

    @DELETE("api/trips/{id}")
    suspend fun deleteTrip(@Path("id") id: String): Response<ApiResponse<Boolean>>

    // Maintenance
    @GET("api/maintenance/my")
    suspend fun getMyMaintenance(): Response<ApiResponse<List<MaintenanceRecord>>>

    @GET("api/maintenance")
    suspend fun getAllMaintenance(): Response<ApiResponse<List<MaintenanceRecord>>>

    @POST("api/maintenance")
    suspend fun createMaintenance(@Body record: MaintenanceRecord): Response<ApiResponse<MaintenanceRecord>>
    
    @PUT("api/maintenance/{id}")
    suspend fun updateMaintenance(@Path("id") id: String, @Body record: MaintenanceRecord): Response<ApiResponse<Boolean>>
}

// DTOs matching Backend
data class RegisterRequest(val id: String, val name: String, val email: String?, val phone: String, val password: String, val licenseNumber: String? = null, val photoUri: String? = null)
data class LoginRequest(val identity: String, val password: String)
data class RefreshRequest(val refreshToken: String)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T? = null
)

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserDto
)

data class UserDto(
    val id: String,
    val name: String,
    val email: String?,
    val phone: String,
    val licenseNumber: String? = null,
    val photoUri: String? = null,
    val password: String? = null
)
