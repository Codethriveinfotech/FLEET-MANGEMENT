package com.vehicletrackingapp.util

import android.content.Context
import android.util.Log
import com.vehicletrackingapp.data.local.AppDatabase
import com.vehicletrackingapp.data.model.Driver
import com.vehicletrackingapp.data.model.MaintenanceRecord
import com.vehicletrackingapp.data.model.TripEntry
import com.vehicletrackingapp.data.model.Vehicle

object DemoSeeder {

    private const val PREF_KEY = "demo_seeded_v1"

    suspend fun seedIfNeeded(context: Context) {
        val prefs = context.getSharedPreferences("fleet_prefs", Context.MODE_PRIVATE)
        if (prefs.getBoolean(PREF_KEY, false)) return

        val dao = AppDatabase.getDatabase(context).dao()

        try {
            // ── DRIVERS ──────────────────────────────────────────────────────
            val drivers = listOf(
                Driver(id = "DRV001", name = "Arun Kumar", phone = "9876543210", licenseNumber = "TN01-20180012345", password = "1234", email = "arun.kumar@fleet.com"),
                Driver(id = "DRV002", name = "Selvam Raj", phone = "9876543211", licenseNumber = "TN01-20160045678", password = "1234", email = "selvam.raj@fleet.com"),
                Driver(id = "DRV003", name = "Murugan P",  phone = "9876543212", licenseNumber = "TN38-20190078901", password = "1234", email = "murugan.p@fleet.com"),
                Driver(id = "DRV004", name = "Karthik S",  phone = "9876543213", licenseNumber = "TN58-20170023456", password = "1234", email = "karthik.s@fleet.com"),
            )
            drivers.forEach { dao.upsertDriver(it) }

            // ── VEHICLES ─────────────────────────────────────────────────────
            val vehicles = listOf(
                Vehicle(id = "VH001", number = "TN 38 AB 1234", model = "TATA Ace Gold", type = "Mini Truck",   registrationNumber = "TN38AB1234", fuelType = "Diesel",  status = "Active",  mileage = "48250", insuranceStatus = "Valid",   assignedDriverId = "DRV001"),
                Vehicle(id = "VH002", number = "TN 58 CD 5678", model = "Ashok Leyland Dost+", type = "Truck", registrationNumber = "TN58CD5678", fuelType = "Diesel",  status = "Active",  mileage = "91430", insuranceStatus = "Valid",   assignedDriverId = "DRV002"),
                Vehicle(id = "VH003", number = "TN 01 EF 9012", model = "Mahindra Bolero",  type = "SUV",       registrationNumber = "TN01EF9012", fuelType = "Diesel",  status = "Active",  mileage = "62100", insuranceStatus = "Valid",   assignedDriverId = "DRV003"),
                Vehicle(id = "VH004", number = "TN 38 GH 3456", model = "Maruti Eeco",      type = "Van",       registrationNumber = "TN38GH3456", fuelType = "Petrol",  status = "Active",  mileage = "34780", insuranceStatus = "Expiring", assignedDriverId = "DRV004"),
            )
            vehicles.forEach { dao.upsertVehicle(it) }

            // ── SUBMITTED TRIPS ──────────────────────────────────────────────
            // Month: August 2026
            val trips = listOf(

                // ARUN KUMAR – VH001 – Week 1
                trip("T001","DRV001","VH001","01/08/2026","06:30 AM","08:15 PM","Monday",   "Day Shift",  "48250","48430","5200","5212","Day mission Madurai → Salem", false),
                trip("T002","DRV001","VH001","02/08/2026","06:45 AM","06:30 PM","Saturday",  "Day Shift",  "48430","48590","5212","5223","Goods delivery – city route",  false),
                trip("T003","DRV001","VH001","04/08/2026","07:00 AM","07:45 PM","Monday",   "Day Shift",  "48590","48740","5223","5233","Factory supply run",            false),
                trip("T004","DRV001","VH001","05/08/2026","08:00 PM","04:30 AM","Tuesday",  "Night Shift","48740","48910","5233","5244","Night logistics – highway run",  false),
                trip("T005","DRV001","VH001","07/08/2026","06:30 AM","07:15 PM","Thursday", "Day Shift",  "48910","49080","5244","5255","Warehouse outbound delivery",   false),
                trip("T006","DRV001","VH001","10/08/2026","06:00 AM","02:00 PM","Sunday",   "Day Shift",  "49080","49210","5255","5263","Sunday special delivery",       false),
                trip("T007","DRV001","VH001","12/08/2026","07:30 AM","08:00 PM","Tuesday",  "Day Shift",  "49210","49390","5263","5275","Coimbatore supply trip",        false),
                trip("T008","DRV001","VH001","14/08/2026","07:00 AM","06:30 PM","Thursday", "Day Shift",  "49390","49540","5275","5285","Return logistics run",          true ),  // breakdown
                trip("T009","DRV001","VH001","18/08/2026","06:45 AM","07:30 PM","Monday",   "Day Shift",  "49540","49700","5285","5296","Goods hauling – industrial zone",false),
                trip("T010","DRV001","VH001","19/08/2026","08:15 PM","05:00 AM","Tuesday",  "Night Shift","49700","49870","5296","5307","Night run – cross district",    false),

                // SELVAM RAJ – VH002 – Week 1 & 2
                trip("T011","DRV002","VH002","01/08/2026","07:00 AM","07:00 PM","Monday",   "Day Shift",  "91430","91630","3100","3112","Heavy load delivery – port",    false),
                trip("T012","DRV002","VH002","03/08/2026","06:30 AM","06:45 PM","Wednesday","Day Shift",  "91630","91820","3112","3123","Cement plant run",              false),
                trip("T013","DRV002","VH002","05/08/2026","09:00 PM","04:15 AM","Tuesday",  "Night Shift","91820","92010","3123","3134","Night hauling – highway",       false),
                trip("T014","DRV002","VH002","07/08/2026","07:00 AM","06:30 PM","Thursday", "Day Shift",  "92010","92200","3134","3145","Steel mill delivery",           false),
                trip("T015","DRV002","VH002","10/08/2026","07:30 AM","07:45 PM","Sunday",   "Day Shift",  "92200","92390","3145","3157","Sunday cargo haul",             false),
                trip("T016","DRV002","VH002","12/08/2026","06:00 AM","06:30 PM","Tuesday",  "Day Shift",  "92390","92560","3157","5168","Quarry material transport",     false),
                trip("T017","DRV002","VH002","14/08/2026","07:00 AM","05:30 PM","Thursday", "Day Shift",  "92560","92720","3168","3178","Construction site supply",      false),
                trip("T018","DRV002","VH002","18/08/2026","08:00 PM","03:30 AM","Monday",   "Night Shift","92720","92910","3178","3190","Night freight – express",        false),
                trip("T019","DRV002","VH002","19/08/2026","07:00 AM","06:00 PM","Tuesday",  "Day Shift",  "92910","93080","3190","3201","Industrial zone delivery",      true ),  // breakdown

                // MURUGAN P – VH003
                trip("T021","DRV003","VH003","02/08/2026","07:00 AM","06:30 PM","Saturday", "Day Shift",  "62100","62280","2100","2110","Officer tour – Madurai city",   false),
                trip("T022","DRV003","VH003","04/08/2026","06:30 AM","07:00 PM","Monday",   "Day Shift",  "62280","62440","2110","2121","Hospital equipment transport",  false),
                trip("T023","DRV003","VH003","06/08/2026","08:00 PM","04:00 AM","Wednesday","Night Shift","62440","62610","2121","2132","Airport pickup duty",           false),
                trip("T024","DRV003","VH003","08/08/2026","06:45 AM","07:30 PM","Friday",   "Day Shift",  "62610","62780","2132","2143","Government office trip",        false),
                trip("T025","DRV003","VH003","11/08/2026","07:00 AM","06:45 PM","Monday",   "Day Shift",  "62780","62950","2143","2154","University supply run",         false),
                trip("T026","DRV003","VH003","13/08/2026","08:30 PM","04:00 AM","Wednesday","Night Shift","62950","63110","2154","2165","Night medical supply",          false),
                trip("T027","DRV003","VH003","15/08/2026","06:30 AM","07:15 PM","Friday",   "Day Shift",  "63110","63280","2165","2176","Independence Day special run",  false),
                trip("T028","DRV003","VH003","18/08/2026","07:00 AM","06:30 PM","Monday",   "Day Shift",  "63280","63440","2176","2186","City logistics – north zone",   false),
                trip("T029","DRV003","VH003","19/08/2026","07:00 AM","06:15 PM","Tuesday",  "Day Shift",  "63440","63600","2186","2196","Corporate supply route",        false),

                // KARTHIK S – VH004
                trip("T031","DRV004","VH004","01/08/2026","07:30 AM","05:30 PM","Monday",   "Day Shift",  "34780","34930","1200","1208","City distribution run",        false),
                trip("T032","DRV004","VH004","03/08/2026","08:00 AM","06:00 PM","Wednesday","Day Shift",  "34930","35070","1208","1217","Grocery supply – markets",     false),
                trip("T033","DRV004","VH004","05/08/2026","08:00 PM","03:30 AM","Tuesday",  "Night Shift","35070","35220","1217","1226","Night distribution",           false),
                trip("T034","DRV004","VH004","07/08/2026","07:00 AM","05:45 PM","Thursday", "Day Shift",  "35220","35360","1226","1235","Pharmacy delivery route",      false),
                trip("T035","DRV004","VH004","10/08/2026","07:00 AM","01:00 PM","Sunday",   "Day Shift",  "35360","35480","1235","1241","Sunday essential supply",      false),
                trip("T036","DRV004","VH004","12/08/2026","07:30 AM","06:00 PM","Tuesday",  "Day Shift",  "35480","35620","1241","1250","Metro area delivery",          false),
                trip("T037","DRV004","VH004","14/08/2026","07:00 AM","06:30 PM","Thursday", "Day Shift",  "35620","35760","1250","1260","Consumer goods run",           false),
                trip("T038","DRV004","VH004","18/08/2026","07:15 AM","06:00 PM","Monday",   "Day Shift",  "35760","35890","1260","1269","Retail store deliveries",      true ),  // breakdown
                trip("T039","DRV004","VH004","19/08/2026","08:00 PM","03:00 AM","Tuesday",  "Night Shift","35890","36030","1269","1278","Night city freight",           false),
            )
            trips.forEach { dao.upsertTrip(it) }

            // ── MAINTENANCE RECORDS ───────────────────────────────────────────
            val maintenance = listOf(
                MaintenanceRecord(id = "MNT001", vehicleId = "VH001", driverId = "DRV001", tripId = "T008",
                    maintenanceType = "Breakdown", description = "Rear tyre burst on highway. Replaced with spare.",
                    date = "14/08/2026", time = "02:30 PM", cost = "2800", serviceNotes = "Replace spare tyre ASAP.",
                    oilChangeDone = false, tyreStatusOk = false, batteryStatusOk = true, isBreakdownReport = true, status = "submitted"),

                MaintenanceRecord(id = "MNT002", vehicleId = "VH002", driverId = "DRV002", tripId = "T019",
                    maintenanceType = "Breakdown", description = "Engine overheating – coolant leak detected.",
                    date = "19/08/2026", time = "03:00 PM", cost = "6500", serviceNotes = "Radiator hose replaced. Coolant refilled.",
                    oilChangeDone = false, tyreStatusOk = true, batteryStatusOk = true, isBreakdownReport = true, status = "submitted"),

                MaintenanceRecord(id = "MNT003", vehicleId = "VH001", driverId = "DRV001", tripId = null,
                    maintenanceType = "Service", description = "Monthly scheduled service – oil change, filter replacement.",
                    date = "05/08/2026", time = "10:00 AM", cost = "3200", serviceNotes = "Next service due at 50000 KM.",
                    oilChangeDone = true, tyreStatusOk = true, batteryStatusOk = true, isBreakdownReport = false, status = "submitted"),

                MaintenanceRecord(id = "MNT004", vehicleId = "VH003", driverId = "DRV003", tripId = null,
                    maintenanceType = "Battery", description = "Battery terminals corroded. Cleaned and tightened.",
                    date = "11/08/2026", time = "08:30 AM", cost = "500", serviceNotes = "Battery voltage 12.4V – healthy.",
                    oilChangeDone = false, tyreStatusOk = true, batteryStatusOk = false, isBreakdownReport = false, status = "submitted"),

                MaintenanceRecord(id = "MNT005", vehicleId = "VH004", driverId = "DRV004", tripId = "T038",
                    maintenanceType = "Breakdown", description = "Clutch plate worn out. Vehicle stalled mid-route.",
                    date = "18/08/2026", time = "11:30 AM", cost = "8500", serviceNotes = "Clutch kit fully replaced.",
                    oilChangeDone = false, tyreStatusOk = true, batteryStatusOk = true, isBreakdownReport = true, status = "submitted"),

                MaintenanceRecord(id = "MNT006", vehicleId = "VH002", driverId = "DRV002", tripId = null,
                    maintenanceType = "Petrol", description = "Fuel top-up – 45 litres diesel.",
                    date = "12/08/2026", time = "09:00 AM", cost = "4500", serviceNotes = "Fuel card used.",
                    oilChangeDone = false, tyreStatusOk = true, batteryStatusOk = true, isBreakdownReport = false, status = "submitted"),
            )
            maintenance.forEach { dao.upsertMaintenance(it) }

            prefs.edit().putBoolean(PREF_KEY, true).apply()
            Log.d("DemoSeeder", "✅ Demo data seeded successfully")

        } catch (e: Exception) {
            Log.e("DemoSeeder", "❌ Demo seeding failed", e)
        }
    }

    private fun trip(
        id: String, driverId: String, vehicleId: String,
        startDate: String, startTime: String, endDate: String,
        day: String, shift: String,
        startOdo: String, endOdo: String,
        startHmr: String, endHmr: String,
        purpose: String, isBreakdown: Boolean
    ) = TripEntry(
        id = id,
        driverId = driverId,
        vehicleId = vehicleId,
        startDate = startDate,
        startTime = startTime,
        endDate = endDate,
        endTime = if (shift.contains("Night")) "05:00 AM" else "06:30 PM",
        startOdometer = startOdo,
        endOdometer = endOdo,
        startHmr = startHmr,
        endHmr = endHmr,
        day = day,
        shift = shift,
        fuelLevel = (30..55).random().toString(),
        tripPurpose = purpose,
        notes = "",
        status = "submitted",
        isBreakdown = isBreakdown
    )
}
