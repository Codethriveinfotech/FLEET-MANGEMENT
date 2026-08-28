package com.vehicletrackingapp.backend.routes

import com.vehicletrackingapp.backend.dto.ApiResponse
import com.vehicletrackingapp.backend.models.FuelLog
import com.vehicletrackingapp.backend.repository.FuelRepository
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.fuelRoutes(fuelRepository: FuelRepository) {
    authenticate("auth-jwt") {
        route("/fuel") {
            get {
                val records = fuelRepository.getAllRecords()
                call.respond(ApiResponse.success(records))
            }

            post {
                val record = call.receive<FuelLog>()
                val created = fuelRepository.createRecord(record)
                if (created != null) {
                    call.respond(ApiResponse.success(created))
                } else {
                    call.respond(ApiResponse.error("Failed to create fuel log"))
                }
            }

            delete("/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(ApiResponse.error("Missing id"))
                if (fuelRepository.deleteRecord(id)) {
                    call.respond(ApiResponse.success(true, "Fuel log deleted"))
                } else {
                    call.respond(ApiResponse.error("Failed to delete fuel log"))
                }
            }
        }
    }
}
