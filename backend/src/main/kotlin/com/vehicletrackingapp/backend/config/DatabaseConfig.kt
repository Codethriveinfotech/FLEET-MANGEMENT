package com.vehicletrackingapp.backend.config

import com.vehicletrackingapp.backend.database.*
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.config.*
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import io.github.cdimascio.dotenv.dotenv

object DatabaseConfig {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun init(config: ApplicationConfig) {
        val dotenv = dotenv {
            ignoreIfMissing = true
        }
        val rawUrl = dotenv["DATABASE_URL"] ?: System.getenv("DATABASE_URL") ?: config.property("database.url").getString()
        var url = if (rawUrl.startsWith("jdbc:")) {
            rawUrl
        } else {
            rawUrl.replace("postgresql://", "jdbc:postgresql://")
                  .replace("postgres://", "jdbc:postgresql://")
        }
        if (url.contains("@")) {
            val parts = url.split("://")
            if (parts.size == 2) {
                val protocol = parts[0]
                val remainder = parts[1]
                val atIndex = remainder.indexOf("@")
                if (atIndex != -1) {
                    url = "$protocol://${remainder.substring(atIndex + 1)}"
                }
            }
        }
        val user = dotenv["DATABASE_USER"] ?: System.getenv("DATABASE_USER") ?: config.propertyOrNull("database.user")?.getString() ?: ""
        val password = dotenv["DATABASE_PASSWORD"] ?: System.getenv("DATABASE_PASSWORD") ?: config.propertyOrNull("database.password")?.getString() ?: ""

        val hikariConfig = HikariConfig().apply {
            jdbcUrl = url
            username = user
            this.password = password
            driverClassName = "org.postgresql.Driver"
            maximumPoolSize = 10
            isReadOnly = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }

        val dataSource = HikariDataSource(hikariConfig)
        Database.connect(dataSource)

        transaction {
            SchemaUtils.createMissingTablesAndColumns(Users, RefreshTokens, Vehicles, Trips, Maintenance, FuelLogs)
            logger.info("Database initialized and schema created.")
        }
    }
}
