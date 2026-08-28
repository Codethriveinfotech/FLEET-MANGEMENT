package com.vehicletrackingapp.backend.dto

import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(
    val id: String,
    val name: String,
    val email: String?,
    val phone: String,
    val password: String,
    val licenseNumber: String? = null,
    val photoUri: String? = null,
    val role: String? = "DRIVER"
)

@Serializable
data class LoginRequest(
    val identity: String, // email or phone
    val password: String
)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserDto
)

@Serializable
data class UserDto(
    val id: String,
    val name: String,
    val email: String?,
    val phone: String,
    val licenseNumber: String? = null,
    val photoUri: String? = null,
    val role: String,
    val password: String? = null
)

@Serializable
data class RefreshRequest(
    val refreshToken: String
)
