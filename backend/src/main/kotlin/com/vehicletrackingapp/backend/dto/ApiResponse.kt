package com.vehicletrackingapp.backend.dto

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T? = null
) {
    companion object {
        fun <T> success(data: T, message: String = "Success") = ApiResponse(true, message, data)
        fun error(message: String) = ApiResponse<Unit>(false, message, null)
    }
}
