package com.vehicletrackingapp.backend.routes

import com.vehicletrackingapp.backend.dto.ApiResponse
import com.vehicletrackingapp.backend.models.Maintenance
import com.vehicletrackingapp.backend.repository.MaintenanceRepository
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.maintenanceRoutes(maintenanceRepository: MaintenanceRepository) {
    authenticate("auth-jwt") {
        route("/maintenance") {
            get {
                val records = maintenanceRepository.getAllRecords()
                call.respond(ApiResponse.success(records))
            }

            get("/my") {
                val principal = call.principal<JWTPrincipal>()
                val driverId = principal?.payload?.subject ?: ""
                val records = maintenanceRepository.getRecordsByDriver(driverId)
                call.respond(ApiResponse.success(records))
            }

            get("/vehicle/{vehicleId}") {
                val vehicleId = call.parameters["vehicleId"] ?: return@get call.respond(ApiResponse.error("Missing vehicleId"))
                val records = maintenanceRepository.getRecordsByVehicle(vehicleId)
                call.respond(ApiResponse.success(records))
            }

            post {
                val record = call.receive<Maintenance>()
                val created = maintenanceRepository.createRecord(record)
                if (created != null) {
                    call.respond(ApiResponse.success(created))
                } else {
                    call.respond(ApiResponse.error("Failed to create maintenance record"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"] ?: return@put call.respond(ApiResponse.error("Missing id"))
                val record = call.receive<Maintenance>().copy(id = id)
                if (maintenanceRepository.updateRecord(record)) {
                    call.respond(ApiResponse.success(true, "Maintenance record updated"))
                } else {
                    call.respond(ApiResponse.error("Failed to update record"))
                }
            }
        }
    }
}
