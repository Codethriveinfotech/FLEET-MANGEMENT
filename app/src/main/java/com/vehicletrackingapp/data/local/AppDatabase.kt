package com.vehicletrackingapp.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.vehicletrackingapp.data.model.Driver
import com.vehicletrackingapp.data.model.MaintenanceRecord
import com.vehicletrackingapp.data.model.TripEntry
import com.vehicletrackingapp.data.model.Vehicle

@Database(entities = [TripEntry::class, MaintenanceRecord::class, Vehicle::class, Driver::class], version = 6, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dao(): AppDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "vehicle_tracking_db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
