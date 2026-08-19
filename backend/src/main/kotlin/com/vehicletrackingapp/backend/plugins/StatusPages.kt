package com.vehicletrackingapp.backend.plugins

import com.vehicletrackingapp.backend.dto.ApiResponse
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*

fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respond(
                HttpStatusCode.InternalServerError,
                ApiResponse.error(cause.message ?: "An unexpected error occurred")
            )
        }
    }
}
