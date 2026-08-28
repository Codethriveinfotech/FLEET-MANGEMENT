package com.vehicletrackingapp.backend

import com.vehicletrackingapp.backend.auth.JwtConfig
import com.vehicletrackingapp.backend.config.DatabaseConfig
import com.vehicletrackingapp.backend.plugins.*
import com.vehicletrackingapp.backend.repository.*
import com.vehicletrackingapp.backend.routes.*
import com.vehicletrackingapp.backend.services.*
import io.ktor.server.application.*
import io.ktor.server.routing.*

fun Application.module() {
    // 1. Configuration
    DatabaseConfig.init(environment.config)
    val jwtConfig = JwtConfig(environment.config)

    // 2. Dependencies (Manual DI for simplicity, could use Koin)
    val userRepository: UserRepository = UserRepositoryImpl()
    val tokenRepository: RefreshTokenRepository = RefreshTokenRepositoryImpl()
    val vehicleRepository: VehicleRepository = VehicleRepositoryImpl()
    val tripRepository: TripRepository = TripRepositoryImpl()
    val maintenanceRepository: MaintenanceRepository = MaintenanceRepositoryImpl()
    val fuelRepository: FuelRepository = FuelRepositoryImpl()
    
    val authService = AuthService(userRepository, tokenRepository, jwtConfig)

    // 3. Plugins
    configureSerialization()
    configureSecurity(jwtConfig)
    configureStatusPages()
    configureCORS()
    configureMonitoring()
    configureHTTP()

    // 4. Routing
    routing {
        healthRoutes()
        route("/api") {
            authRoutes(authService)
            userRoutes(userRepository)
            vehicleRoutes(vehicleRepository)
            tripRoutes(tripRepository)
            maintenanceRoutes(maintenanceRepository)
            fuelRoutes(fuelRepository)
        }
    }
}
