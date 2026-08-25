package com.vehicletrackingapp.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.util.Log
import android.widget.Toast
import com.vehicletrackingapp.data.model.*
import com.vehicletrackingapp.ui.screens.admin.MonthlySummaryData
import java.util.Date
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.Calendar

object ExportUtils {

    /**
     * Professional Master Excel Report v3.2.
     * Fully automated with HMR logic, auto-captured time, and dual analytic tables.
     */
    fun exportTripsToExcel(
        context: Context,
        trips: List<TripEntry>,
        maintenance: List<MaintenanceRecord>,
        drivers: List<Driver>,
        vehicles: List<Vehicle>,
        summary: MonthlySummaryData? = null
    ): Uri? {
        return try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmm", Locale.getDefault()).format(Date())
            val fileName = "Fleet_Travel_Dossier_$timestamp.csv"
            val csv = StringBuilder()
            
            // SECTION 1: MISSION TRAVEL LOGS
            csv.append("--- MISSION TRAVEL LOGS ---\n")
            csv.append("DATE,DAY,SHIFT,OPERATOR,VEHICLE,START_KM,END_KM,START_HMR,END_HMR,HMR_WORKED,WORKING_STATUS,MAINTENANCE_DETAILS,EVIDENCE_LINKS\n")
            
            trips.forEach { trip ->
                val driver = drivers.find { it.id == trip.driverId }?.name ?: "Unknown"
                val vehicle = vehicles.find { it.id == trip.vehicleId }?.number ?: "Unknown"
                val workingStatus = if (trip.isBreakdown) "BREAKDOWN" else "YES"
                
                val sHmr = trip.getHmrStart()
                val eHmr = trip.getHmrEnd()
                val hmrWorked = String.format(Locale.US, "%.1f", trip.getHmrWorked())

                val relatedMaint = maintenance.filter { it.tripId == trip.id }
                val maintDetails = if (relatedMaint.isEmpty()) "None" else {
                    relatedMaint.joinToString(" | ") { m ->
                        "${m.maintenanceType}: INR ${m.cost} (${m.description.replace(",", ";")})"
                    }
                }

                val gallery = mutableListOf<String>()
                trip.startOdometerPhotoUri?.let { gallery.add("START_ODO: $it") }
                trip.endOdometerPhotoUri?.let { gallery.add("END_ODO: $it") }
                relatedMaint.forEach { m -> 
                    m.billImageUri?.let { gallery.add("${m.maintenanceType}_BILL: $it") }
                }
                
                val galleryEscaped = "\"" + gallery.joinToString(" | ") + "\""
                val maintEscaped = "\"" + maintDetails + "\""
                
                csv.append("\"=\"\"${trip.startDate}\"\"\",")
                csv.append("${trip.day},")
                csv.append("${trip.shift},")
                csv.append("\"$driver\",")
                csv.append("\"$vehicle\",")
                csv.append("${trip.startOdometer},")
                csv.append("${trip.endOdometer},")
                csv.append("${String.format(Locale.US, "%.1f", sHmr)},")
                csv.append("${String.format(Locale.US, "%.1f", eHmr)},")
                csv.append("$hmrWorked,")
                csv.append("$workingStatus,")
                csv.append("$maintEscaped,")
                csv.append("$galleryEscaped\n")
            }

            summary?.let { data ->
                csv.append("\n\n--- MONTHLY PERFORMANCE SUMMARY ---\n")
                csv.append("METRIC,VALUE\n")
                csv.append("TOTAL UNIQUE WORKING DAYS,${data.totalDays}\n")
                csv.append("TOTAL BREAKDOWNS REPORTED,${data.breakdowns}\n")
                csv.append("DAY SHIFTS COMPLETED,${data.dayWorks}\n")
                csv.append("NIGHT SHIFTS COMPLETED,${data.nightWorks}\n")
                csv.append("SUNDAY MISSIONS COUNT,${data.sundays}\n")
                csv.append("TOTAL BILLING DAYS (MISSIONS - BREAKDOWNS),${data.billingDays}\n")
                
                csv.append("\n--- DRIVER PERFORMANCE ANALYTICS TABLE ---\n")
                csv.append("OPERATOR NAME,TOTAL MISSIONS,WORKING DAYS,DAY SHIFTS,NIGHT SHIFTS,SUNDAY SESSIONS,BREAKDOWNS,BILLING_DAYS\n")
                data.driverStats.forEach { stat ->
                    csv.append("\"${stat.name}\",")
                    csv.append("${stat.totalMissions},")
                    csv.append("${stat.uniqueDays},")
                    csv.append("${stat.dayShifts},")
                    csv.append("${stat.nightShifts},")
                    csv.append("${stat.sundays},")
                    csv.append("${stat.breakdowns},")
                    csv.append("${stat.billingDays}\n")
                }
            }

            val savedUri = saveFileToDownloads(context, csv.toString(), fileName, "text/csv")
            if (savedUri != null) {
                Toast.makeText(context, "Report saved — opening spreadsheet...", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(context, "Report saved to Downloads folder", Toast.LENGTH_LONG).show()
            }
            savedUri
        } catch (e: Exception) {
            Log.e("ExportUtils", "MASTER_EXPORT_FAILURE", e)
            Toast.makeText(context, "EXPORT ERROR: ${e.message}", Toast.LENGTH_SHORT).show()
            null
        }
    }

    /**
     * Exports ALL trips for a driver or vehicle with BOTH Odometer and HMR columns
     * in a single file — no filter required.
     */
    fun exportCustomReport(
        context: Context,
        trips: List<TripEntry>,
        drivers: List<Driver>,
        vehicles: List<Vehicle>,
        selectedDriverId: String?,
        selectedVehicleId: String?,
        readingType: String = "Both", // kept for API compatibility, ignored — always exports both
        monthFilter: String? = "All Time"
    ): Uri? {
        return exportCombinedReadingsReport(
            context = context,
            trips = trips,
            drivers = drivers,
            vehicles = vehicles,
            selectedDriverId = selectedDriverId,
            selectedVehicleId = selectedVehicleId,
            monthFilter = monthFilter
        )
    }

    /**
     * Exports ALL trips (all drivers, all vehicles) with BOTH Odometer + HMR columns
     * in one file — called directly from the EXPORT FILE button, no dialog shown.
     */
    fun exportAllInOne(
        context: Context,
        trips: List<TripEntry>,
        maintenance: List<MaintenanceRecord>,
        drivers: List<Driver>,
        vehicles: List<Vehicle>
    ): Uri? {
        return exportCombinedReadingsReport(
            context = context,
            trips = trips,
            drivers = drivers,
            vehicles = vehicles,
            maintenance = maintenance,
            selectedDriverId = null,
            selectedVehicleId = null,
            monthFilter = "All Time"
        )
    }

    /**
     * Core export: produces one CSV with both Odometer AND HMR columns.
     * Columns: S.No, Date, Day, Shift, Operator, Vehicle,
     *          Start KM, End KM, KM Diff, Start HMR, End HMR, HMR Worked, Status, Maintenance
     */
    private fun exportCombinedReadingsReport(
        context: Context,
        trips: List<TripEntry>,
        drivers: List<Driver>,
        vehicles: List<Vehicle>,
        maintenance: List<MaintenanceRecord> = emptyList(),
        selectedDriverId: String?,
        selectedVehicleId: String?,
        monthFilter: String?
    ): Uri? {
        return try {
            var filtered = trips
            if (selectedDriverId != null) {
                filtered = filtered.filter { it.driverId == selectedDriverId }
            }
            if (selectedVehicleId != null) {
                filtered = filtered.filter { it.vehicleId == selectedVehicleId }
            }

            val inputFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
            val monthFormat = SimpleDateFormat("MMMM yyyy", Locale.getDefault())

            if (!monthFilter.isNullOrBlank() && monthFilter != "All Time") {
                filtered = filtered.filter { trip ->
                    try {
                        val date = inputFormat.parse(trip.startDate)
                        date != null && monthFormat.format(date).equals(monthFilter, ignoreCase = true)
                    } catch (e: Exception) {
                        trip.startDate.contains(monthFilter, ignoreCase = true)
                    }
                }
            }

            if (filtered.isEmpty()) {
                Toast.makeText(context, "No missions found for the selected criteria", Toast.LENGTH_SHORT).show()
                return null
            }

            val sortedTrips = filtered.sortedWith { t1, t2 ->
                val d1 = try { inputFormat.parse(t1.startDate) } catch (e: Exception) { null }
                val d2 = try { inputFormat.parse(t2.startDate) } catch (e: Exception) { null }
                if (d1 != null && d2 != null) {
                    val cmp = d1.compareTo(d2)
                    if (cmp == 0) t1.startTime.compareTo(t2.startTime) else cmp
                } else {
                    t1.startDate.compareTo(t2.startDate)
                }
            }

            val csv = StringBuilder()
            // Header with BOTH Odometer and HMR
            csv.append("S.No,Date,Day,Shift,Operator,Vehicle,Start KM,End KM,KM Diff,Start HMR,End HMR,HMR Worked (Hrs),Status,Maintenance Details\n")

            var serialNo = 1
            sortedTrips.forEach { trip ->
                val driver  = drivers.find { it.id == trip.driverId }?.name ?: "Unknown"
                val vehicle = vehicles.find { it.id == trip.vehicleId }?.number ?: "Unknown"
                val status  = if (trip.isBreakdown) "BREAKDOWN" else "Working"

                val sOdo = trip.startOdometer.toDoubleOrNull() ?: 0.0
                val eOdo = trip.endOdometer.toDoubleOrNull() ?: sOdo
                val odoDiff = if (eOdo >= sOdo) eOdo - sOdo else 0.0

                val sHmr = trip.getHmrStart()
                val eHmr = trip.getHmrEnd()
                val hmrWorked = trip.getHmrWorked()

                val relMaint = maintenance.filter { it.tripId == trip.id }
                val maintStr = if (relMaint.isEmpty()) "None" else
                    relMaint.joinToString(" | ") { m -> "${m.maintenanceType}: INR ${m.cost} (${m.description.replace(",", ";")})" }

                csv.append("$serialNo,")
                csv.append("\"=\"\"${trip.startDate}\"\"\",")
                csv.append("${trip.day},")
                csv.append("${trip.shift},")
                csv.append("\"$driver\",")
                csv.append("\"$vehicle\",")
                csv.append("${String.format(Locale.US, "%.1f", sOdo)},")
                csv.append("${String.format(Locale.US, "%.1f", eOdo)},")
                csv.append("${String.format(Locale.US, "%.1f", odoDiff)},")
                csv.append("${String.format(Locale.US, "%.1f", sHmr)},")
                csv.append("${String.format(Locale.US, "%.1f", eHmr)},")
                csv.append("${String.format(Locale.US, "%.1f", hmrWorked)},")
                csv.append("$status,")
                csv.append("\"$maintStr\"\n")

                serialNo++
            }

            // Summary footer
            val totalOdoDiff = sortedTrips.sumOf {
                val s = it.startOdometer.toDoubleOrNull() ?: 0.0
                val e = it.endOdometer.toDoubleOrNull() ?: 0.0
                if (e >= s) e - s else 0.0
            }
            val totalHmrWorked = sortedTrips.sumOf { it.getHmrWorked() }
            csv.append("\n")
            csv.append("TOTAL TRIPS,${sortedTrips.size},,,,,,")
            csv.append("TOTAL KM,${String.format(Locale.US, "%.1f", totalOdoDiff)},,")
            csv.append("TOTAL HMR,${String.format(Locale.US, "%.1f", totalHmrWorked)}\n")

            val entityName = when {
                selectedDriverId  != null -> drivers.find { it.id == selectedDriverId }?.name?.replace(" ", "_") ?: "Driver"
                selectedVehicleId != null -> vehicles.find { it.id == selectedVehicleId }?.number?.replace(" ", "_") ?: "Car"
                else -> "AllFleet"
            }
            val periodName = monthFilter?.replace(" ", "_") ?: "All_Time"
            val timestamp  = SimpleDateFormat("yyyyMMdd_HHmm", Locale.getDefault()).format(Date())
            val fileName   = "${entityName}_Fleet_Report_${periodName}_$timestamp.csv"

            val savedUri = saveFileToDownloads(context, csv.toString(), fileName, "text/csv")
            if (savedUri != null) {
                Toast.makeText(context, "✅ Report saved: $fileName", Toast.LENGTH_SHORT).show()
            }
            savedUri
        } catch (e: Exception) {
            Log.e("ExportUtils", "COMBINED_EXPORT_FAILURE", e)
            Toast.makeText(context, "EXPORT ERROR: ${e.message}", Toast.LENGTH_SHORT).show()
            null
        }
    }

    /** Opens the given URI in any installed spreadsheet app (Google Sheets, WPS, etc.) */
    fun openInSpreadsheetApp(context: Context, fileUri: Uri) {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(fileUri, "text/csv")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val chooser = Intent.createChooser(intent, "Open with Spreadsheet App")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
        } catch (e: Exception) {
            // Fallback: try generic VIEW
            try {
                val fallback = Intent(Intent.ACTION_VIEW).apply {
                    data = fileUri
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(fallback)
            } catch (ex: Exception) {
                Toast.makeText(context, "No spreadsheet app found. File saved to Downloads.", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun saveFileToDownloads(context: Context, content: String, fileName: String, mimeType: String): Uri? {
        val resolver = context.contentResolver
        return try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                val contentValues = android.content.ContentValues().apply {
                    put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(android.provider.MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    put(android.provider.MediaStore.MediaColumns.IS_PENDING, 1)
                }
                val uri = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { outputStream ->
                        outputStream.write(content.toByteArray())
                        outputStream.flush()
                    }
                    contentValues.clear()
                    contentValues.put(android.provider.MediaStore.MediaColumns.IS_PENDING, 0)
                    resolver.update(uri, contentValues, null, null)
                }
                uri
            } else {
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) downloadsDir.mkdirs()
                val file = java.io.File(downloadsDir, fileName)
                java.io.FileOutputStream(file).use { outputStream ->
                    outputStream.write(content.toByteArray())
                    outputStream.flush()
                }
                android.net.Uri.fromFile(file)
            }
        } catch (e: Exception) {
            Log.e("ExportUtils", "SAVE_IO_EXCEPTION: ${e.message}")
            throw e
        }
    }

    fun exportTripsWithMaintenanceToPdf(
        context: Context,
        trips: List<TripEntry>,
        maintenance: List<MaintenanceRecord>,
        drivers: List<Driver>,
        vehicles: List<Vehicle>
    ) {
        exportTripsToExcel(context, trips, maintenance, drivers, vehicles)
    }
}
