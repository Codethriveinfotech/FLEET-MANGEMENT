package com.vehicletrackingapp.backend.routes

import com.vehicletrackingapp.backend.dto.ApiResponse
import com.vehicletrackingapp.backend.models.Trip
import com.vehicletrackingapp.backend.repository.TripRepository
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.tripRoutes(tripRepository: TripRepository) {
    authenticate("auth-jwt") {
        route("/trips") {
            get {
                val trips = tripRepository.getAllTrips()
                call.respond(ApiResponse.success(trips))
            }

            get("/my") {
                val principal = call.principal<JWTPrincipal>()
                val driverId = principal?.payload?.subject ?: ""
                val trips = tripRepository.getTripsByDriver(driverId)
                call.respond(ApiResponse.success(trips))
            }

            get("/{id}") {
                val id = call.parameters["id"] ?: return@get call.respond(ApiResponse.error("Missing id"))
                val trip = tripRepository.findById(id)
                if (trip != null) {
                    call.respond(ApiResponse.success(trip))
                } else {
                    call.respond(ApiResponse.error("Trip not found"))
                }
            }

            post {
                val trip = call.receive<Trip>()
                val created = tripRepository.createTrip(trip)
                if (created != null) {
                    call.respond(ApiResponse.success(created))
                } else {
                    call.respond(ApiResponse.error("Failed to create trip"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"] ?: return@put call.respond(ApiResponse.error("Missing id"))
                val trip = call.receive<Trip>().copy(id = id)
                if (tripRepository.updateTrip(trip)) {
                    call.respond(ApiResponse.success(true, "Trip updated"))
                } else {
                    call.respond(ApiResponse.error("Failed to update trip"))
                }
            }

            delete("/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(ApiResponse.error("Missing id"))
                if (tripRepository.deleteTrip(id)) {
                    call.respond(ApiResponse.success(true, "Trip deleted"))
                } else {
                    call.respond(ApiResponse.error("Failed to delete trip"))
                }
            }
        }
    }
}
