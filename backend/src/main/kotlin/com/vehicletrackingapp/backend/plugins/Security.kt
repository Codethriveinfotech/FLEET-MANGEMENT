package com.vehicletrackingapp.backend.plugins

import com.vehicletrackingapp.backend.auth.JwtConfig
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

fun Application.configureSecurity(jwtConfig: JwtConfig) {
    val realm = environment.config.property("jwt.realm").getString()
    authentication {
        jwt("auth-jwt") {
            this@jwt.realm = realm
            verifier(jwtConfig.verifier)
            validate { credential ->
                if (credential.payload.subject != null) {
                    JWTPrincipal(credential.payload)
                } else {
                    null
                }
            }
        }
    }
}
