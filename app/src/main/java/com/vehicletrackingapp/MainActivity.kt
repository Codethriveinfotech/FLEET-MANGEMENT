package com.vehicletrackingapp

import android.content.Context
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.vehicletrackingapp.data.local.SessionManager
import com.vehicletrackingapp.navigation.AppNavGraph
import com.vehicletrackingapp.ui.theme.VehicleTrackingAppTheme
import com.vehicletrackingapp.util.LocaleHelper

class MainActivity : ComponentActivity() {

    override fun attachBaseContext(newBase: Context) {
        Log.d("MainActivity", "attachBaseContext: Triggered")
        try {
            val context = LocaleHelper.applySelectedLocale(newBase)
            super.attachBaseContext(context)
        } catch (e: Exception) {
            Log.e("MainActivity", "attachBaseContext: Error", e)
            super.attachBaseContext(newBase)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sessionManager = SessionManager(this)
        Log.d("MainActivity", "onCreate: System Bootstrap")
        
        try {
            enableEdgeToEdge()
            setContent {
                val isDark by sessionManager.isDarkMode.collectAsState(initial = false)
                
                VehicleTrackingAppTheme(darkTheme = isDark) {
                    Surface(modifier = Modifier.fillMaxSize()) {
                        AppNavGraph()
                    }
                }
            }
        } catch (e: Throwable) {
            Log.e("MainActivity", "FATAL_COMPOSE_ERROR", e)
        }
    }
}
