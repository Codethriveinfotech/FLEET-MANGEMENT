package com.vehicletrackingapp

import android.app.Application
import android.util.Log
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.util.DemoSeeder
import com.vehicletrackingapp.util.LocaleHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class VehicleTrackingApp : Application() {
    @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
    override fun onCreate() {
        super.onCreate()
        Log.d("VehicleTrackingApp", "APPLICATION_BOOT: System Heartbeat Start")
        
        // Catch-all safety
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("VehicleTrackingApp", "CRITICAL_UNCAUGHT_EXCEPTION in ${thread.name}", throwable)
        }

        try {
            // STEP 1: Core System Initialization (Synchronous for stability)
            LocaleHelper.init(this)
            AppRepository.init(this)
            Log.d("VehicleTrackingApp", "CORE_INIT: Success")

            // STEP 2: Background Operations (Non-blocking)
            GlobalScope.launch(Dispatchers.IO) {
                try {
                    DemoSeeder.cleanDirtyDataIfNeeded(this@VehicleTrackingApp)
                    DemoSeeder.seedIfNeeded(this@VehicleTrackingApp)
                    AppRepository.syncPendingData()
                    Log.d("VehicleTrackingApp", "BACKGROUND_SYNC: Triggered")
                } catch (e: Exception) {
                    Log.e("VehicleTrackingApp", "BACKGROUND_SYNC_ERROR", e)
                }
            }
        } catch (e: Throwable) {
            Log.e("VehicleTrackingApp", "SYSTEM_FATAL_INIT_FAILURE", e)
        }
    }
}
