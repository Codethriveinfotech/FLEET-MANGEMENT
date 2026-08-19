package com.vehicletrackingapp.backend.routes

import com.vehicletrackingapp.backend.dto.ApiResponse
import com.vehicletrackingapp.backend.models.Vehicle
import com.vehicletrackingapp.backend.repository.VehicleRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.vehicleRoutes(vehicleRepository: VehicleRepository) {
    authenticate("auth-jwt") {
        route("/vehicles") {
            get {
                val vehicles = vehicleRepository.getAllVehicles()
                call.respond(ApiResponse.success(vehicles))
            }
            
            get("/{id}") {
                val id = call.parameters["id"] ?: return@get call.respond(ApiResponse.error("Missing id"))
                val vehicle = vehicleRepository.findById(id)
                if (vehicle != null) {
                    call.respond(ApiResponse.success(vehicle))
                } else {
                    call.respond(ApiResponse.error("Vehicle not found"))
                }
            }

            post {
                val vehicle = call.receive<Vehicle>()
                val created = vehicleRepository.createVehicle(vehicle)
                if (created != null) {
                    call.respond(ApiResponse.success(created))
                } else {
                    call.respond(ApiResponse.error("Failed to create vehicle"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"] ?: return@put call.respond(ApiResponse.error("Missing id"))
                val vehicle = call.receive<Vehicle>().copy(id = id)
                if (vehicleRepository.updateVehicle(vehicle)) {
                    call.respond(ApiResponse.success(true, "Vehicle updated"))
                } else {
                    call.respond(ApiResponse.error("Failed to update vehicle"))
                }
            }

            delete("/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(ApiResponse.error("Missing id"))
                if (vehicleRepository.deleteVehicle(id)) {
                    call.respond(ApiResponse.success(true, "Vehicle deleted"))
                } else {
                    call.respond(ApiResponse.error("Failed to delete vehicle"))
                }
            }
        }
    }
}
