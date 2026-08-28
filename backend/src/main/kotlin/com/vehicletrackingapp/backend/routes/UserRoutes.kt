package com.vehicletrackingapp.backend.routes

import com.vehicletrackingapp.backend.dto.ApiResponse
import com.vehicletrackingapp.backend.dto.UserDto
import com.vehicletrackingapp.backend.repository.UserRepository
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.mindrot.jbcrypt.BCrypt

fun Route.userRoutes(userRepository: UserRepository) {
    authenticate("auth-jwt") {
        route("/users") {
            get {
                val users = userRepository.getAllUsers().map { 
                    UserDto(it.id, it.name, it.email, it.phone, it.licenseNumber, it.photoUri, it.role) 
                }
                call.respond(ApiResponse.success(users))
            }

            put("/{id}") {
                val id = call.parameters["id"] ?: return@put call.respond(ApiResponse.error("Missing id"))
                val updateReq = call.receive<UserDto>()
                // Fetch existing to retain password and dates
                val existing = userRepository.findById(id) ?: return@put call.respond(ApiResponse.error("User not found"))
                val newHash = if (!updateReq.password.isNullOrBlank()) {
                    BCrypt.hashpw(updateReq.password, BCrypt.gensalt())
                } else {
                    existing.passwordHash
                }
                
                val updatedUser = existing.copy(
                    name = updateReq.name,
                    email = if (updateReq.email.isNullOrBlank()) null else updateReq.email,
                    phone = updateReq.phone,
                    passwordHash = newHash,
                    licenseNumber = updateReq.licenseNumber,
                    photoUri = updateReq.photoUri,
                    role = updateReq.role
                )
                if (userRepository.updateUser(updatedUser)) {
                    call.respond(ApiResponse.success(true, "User updated"))
                } else {
                    call.respond(ApiResponse.error("Failed to update user"))
                }
            }

            delete("/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(ApiResponse.error("Missing id"))
                if (userRepository.deleteUser(id)) {
                    call.respond(ApiResponse.success(true, "User deleted"))
                } else {
                    call.respond(ApiResponse.error("Failed to delete user"))
                }
            }
        }

        route("/user") {
            get("/profile") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.subject ?: ""
                val user = userRepository.findById(userId)
                if (user != null) {
                    call.respond(ApiResponse.success(UserDto(user.id, user.name, user.email, user.phone, user.licenseNumber, user.photoUri, user.role)))
                } else {
                    call.respond(ApiResponse.error("User not found"))
                }
            }
        }
    }
}
