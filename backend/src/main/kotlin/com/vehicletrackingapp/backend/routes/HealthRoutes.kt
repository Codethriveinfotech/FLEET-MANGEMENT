package com.vehicletrackingapp.backend.routes

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*

fun Route.healthRoutes() {
    get("/") {
        call.respondText(
            """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Smart Fleet - Enterprise Control</title>
                <style>
                    body { background: #1F232B; color: #F4B000; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                    .container { padding: 20px; border: 1px solid #F4B000; border-radius: 10px; background: rgba(255,255,255,0.05); }
                    h1 { letter-spacing: 5px; margin-bottom: 10px; }
                    p { color: #5F6368; letter-spacing: 2px; font-weight: bold; }
                    .status { margin-top: 20px; font-size: 0.8em; color: #24D164; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>SMART FLEET</h1>
                    <p>ENTERPRISE CONTROL CENTER</p>
                    <div class="status">SYSTEM CORE: ONLINE</div>
                </div>
            </body>
            </html>
            """.trimIndent(),
            ContentType.Text.Html
        )
    }

    get("/health") {
        call.respond(mapOf("status" to "OK", "timestamp" to System.currentTimeMillis()))
    }
}
