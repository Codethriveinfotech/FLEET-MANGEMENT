package com.vehicletrackingapp.backend.repository

import com.vehicletrackingapp.backend.database.RefreshTokens
import com.vehicletrackingapp.backend.utils.dbQuery
import kotlinx.datetime.LocalDateTime
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq

interface RefreshTokenRepository {
    suspend fun saveToken(userId: String, token: String, expiresAt: LocalDateTime)
    suspend fun findToken(token: String): String?
    suspend fun deleteToken(token: String)
    suspend fun deleteUserTokens(userId: String)
}

class RefreshTokenRepositoryImpl : RefreshTokenRepository {
    override suspend fun saveToken(userId: String, token: String, expiresAt: LocalDateTime) = dbQuery {
        RefreshTokens.insert {
            it[this.userId] = userId
            it[this.token] = token
            it[this.expiresAt] = expiresAt
        }
        Unit
    }

    override suspend fun findToken(token: String): String? = dbQuery {
        RefreshTokens.select { RefreshTokens.token eq token }
            .map { it[RefreshTokens.userId] }
            .singleOrNull()
    }

    override suspend fun deleteToken(token: String) = dbQuery {
        RefreshTokens.deleteWhere { RefreshTokens.token eq token }
        Unit
    }

    override suspend fun deleteUserTokens(userId: String) = dbQuery {
        RefreshTokens.deleteWhere { RefreshTokens.userId eq userId }
        Unit
    }
}
