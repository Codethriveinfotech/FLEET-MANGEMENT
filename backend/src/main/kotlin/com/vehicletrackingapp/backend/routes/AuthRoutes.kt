package com.vehicletrackingapp.backend.routes

import com.vehicletrackingapp.backend.dto.*
import com.vehicletrackingapp.backend.services.AuthService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.authRoutes(authService: AuthService) {
    route("/auth") {
        post("/register") {
            val request = call.receive<RegisterRequest>()
            val response = authService.register(request)
            if (response != null) {
                call.respond(HttpStatusCode.Created, ApiResponse.success(response, "User registered successfully"))
            } else {
                call.respond(HttpStatusCode.BadRequest, ApiResponse.error("Registration failed. Phone or Email already exists."))
            }
        }

        post("/login") {
            val request = call.receive<LoginRequest>()
            val response = authService.login(request)
            if (response != null) {
                call.respond(ApiResponse.success(response, "Login successful"))
            } else {
                call.respond(HttpStatusCode.Unauthorized, ApiResponse.error("Invalid credentials"))
            }
        }

        post("/refresh") {
            val request = call.receive<RefreshRequest>()
            val response = authService.refresh(request.refreshToken)
            if (response != null) {
                call.respond(ApiResponse.success(response, "Token refreshed successfully"))
            } else {
                call.respond(HttpStatusCode.Unauthorized, ApiResponse.error("Invalid refresh token"))
            }
        }

        post("/logout") {
            val request = call.receive<RefreshRequest>()
            authService.logout(request.refreshToken)
            call.respond(ApiResponse.success(Unit, "Logged out successfully"))
        }
    }
}
