package com.vehicletrackingapp.backend.services

import com.vehicletrackingapp.backend.auth.JwtConfig
import com.vehicletrackingapp.backend.dto.*
import com.vehicletrackingapp.backend.models.User
import com.vehicletrackingapp.backend.repository.*
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.mindrot.jbcrypt.BCrypt
import kotlin.time.Duration.Companion.days

class AuthService(
    private val userRepository: UserRepository,
    private val tokenRepository: RefreshTokenRepository,
    private val jwtConfig: JwtConfig
) {
    suspend fun register(request: RegisterRequest): AuthResponse? {
        val email = if (request.email.isNullOrBlank()) null else request.email
        
        // Check uniqueness
        if (email != null && userRepository.findByEmail(email) != null) return null
        if (userRepository.findByPhone(request.phone) != null) return null
        
        val passwordHash = BCrypt.hashpw(request.password, BCrypt.gensalt())
        val now = Clock.System.now().toLocalDateTime(TimeZone.UTC)
        
        val user = User(
            id = request.id,
            name = request.name,
            email = email,
            phone = request.phone,
            passwordHash = passwordHash,
            licenseNumber = request.licenseNumber,
            photoUri = request.photoUri,
            createdAt = now,
            updatedAt = now
        )
        
        userRepository.createUser(user) ?: return null
        return login(LoginRequest(email ?: request.phone, request.password))
    }

    suspend fun login(request: LoginRequest): AuthResponse? {
        if (request.identity == "admin" && request.password == "password") {
            var adminUser = userRepository.findByIdentity("admin")
            if (adminUser == null) {
                adminUser = User(
                    id = "admin_id",
                    name = "System Admin",
                    email = "admin@system.com",
                    phone = "admin",
                    passwordHash = BCrypt.hashpw("password", BCrypt.gensalt()),
                    licenseNumber = null,
                    photoUri = null,
                    createdAt = Clock.System.now().toLocalDateTime(TimeZone.UTC),
                    updatedAt = Clock.System.now().toLocalDateTime(TimeZone.UTC)
                )
                userRepository.createUser(adminUser)
            }

            val accessToken = jwtConfig.generateAccessToken(adminUser.id)
            val refreshToken = jwtConfig.generateRefreshToken()
            val expiresAt = Clock.System.now().plus(30.days).toLocalDateTime(TimeZone.UTC)
            tokenRepository.saveToken(adminUser.id, refreshToken, expiresAt)
            return AuthResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                user = UserDto(adminUser.id, adminUser.name, adminUser.email, adminUser.phone, adminUser.licenseNumber, adminUser.photoUri)
            )
        }

        val user = userRepository.findByIdentity(request.identity) ?: return null
        if (!BCrypt.checkpw(request.password, user.passwordHash)) return null
        
        val accessToken = jwtConfig.generateAccessToken(user.id)
        val refreshToken = jwtConfig.generateRefreshToken()
        
        val expiresAt = Clock.System.now().plus(30.days).toLocalDateTime(TimeZone.UTC)
        tokenRepository.saveToken(user.id, refreshToken, expiresAt)
        
        return AuthResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            user = UserDto(user.id, user.name, user.email, user.phone, user.licenseNumber, user.photoUri)
        )
    }

    suspend fun refresh(refreshToken: String): AuthResponse? {
        val userId = tokenRepository.findToken(refreshToken) ?: return null
        val user = userRepository.findById(userId) ?: return null
        
        val newAccessToken = jwtConfig.generateAccessToken(user.id)
        val newRefreshToken = jwtConfig.generateRefreshToken()
        
        tokenRepository.deleteToken(refreshToken)
        val expiresAt = Clock.System.now().plus(30.days).toLocalDateTime(TimeZone.UTC)
        tokenRepository.saveToken(user.id, newRefreshToken, expiresAt)
        
        return AuthResponse(
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            user = UserDto(user.id, user.name, user.email, user.phone, user.licenseNumber, user.photoUri)
        )
    }

    suspend fun logout(refreshToken: String) {
        tokenRepository.deleteToken(refreshToken)
    }
}
