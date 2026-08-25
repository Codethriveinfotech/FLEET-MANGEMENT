package com.vehicletrackingapp.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.util.Log
import android.widget.Toast
import com.vehicletrackingapp.data.model.TripEntry
import com.vehicletrackingapp.data.model.MaintenanceRecord
import com.vehicletrackingapp.data.model.Driver
import com.vehicletrackingapp.data.model.Vehicle
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
                
                val sHmr = trip.startHmr.toDoubleOrNull() ?: 0.0
                val eHmr = trip.endHmr.toDoubleOrNull() ?: 0.0
                val hmrWorked = String.format(Locale.US, "%.1f", if (eHmr >= sHmr) eHmr - sHmr else 0.0)

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
                
                csv.append("${trip.startDate},")
                csv.append("${trip.day},")
                csv.append("${trip.shift},")
                csv.append("\"$driver\",")
                csv.append("\"$vehicle\",")
                csv.append("${trip.startOdometer},")
                csv.append("${trip.endOdometer},")
                csv.append("${trip.startHmr},")
                csv.append("${trip.endHmr},")
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

    fun exportCustomReport(
        context: Context,
        trips: List<TripEntry>,
        drivers: List<Driver>,
        vehicles: List<Vehicle>,
        selectedDriverId: String?,
        selectedVehicleId: String?,
        readingType: String, // "HMR" or "Odometer"
        monthFilter: String? // e.g. "August 2026", "All Time"
    ): Uri? {
        return try {
            // Filter trips for the selected Driver or Car
            var filtered = trips
            if (selectedDriverId != null) {
                filtered = filtered.filter { it.driverId == selectedDriverId }
            }
            if (selectedVehicleId != null) {
                filtered = filtered.filter { it.vehicleId == selectedVehicleId }
            }

            val inputFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
            val monthFormat = SimpleDateFormat("MMMM yyyy", Locale.getDefault())
            val csvDateFormat = SimpleDateFormat("d-MMM-yy", Locale.getDefault())
            val dayFormat = SimpleDateFormat("EEEE", Locale.getDefault())

            if (monthFilter != null && monthFilter != "All Time") {
                filtered = filtered.filter { trip ->
                    try {
                        val date = inputFormat.parse(trip.startDate)
                        if (date != null) {
                            monthFormat.format(date).equals(monthFilter, ignoreCase = true)
                        } else false
                    } catch (e: Exception) {
                        false
                    }
                }
            }

            if (filtered.isEmpty()) {
                Toast.makeText(context, "No missions found for the selected criteria", Toast.LENGTH_SHORT).show()
                return null
            }

            val startCalendar = Calendar.getInstance()
            val endCalendar = Calendar.getInstance()

            if (monthFilter != null && monthFilter != "All Time") {
                val monthDate = monthFormat.parse(monthFilter) ?: Date()
                startCalendar.time = monthDate
                startCalendar.set(Calendar.DAY_OF_MONTH, 1)

                endCalendar.time = monthDate
                endCalendar.set(Calendar.DAY_OF_MONTH, endCalendar.getActualMaximum(Calendar.DAY_OF_MONTH))
            } else {
                val tripDates = filtered.mapNotNull {
                    try { inputFormat.parse(it.startDate) } catch(e: Exception) { null }
                }.sorted()

                if (tripDates.isEmpty()) {
                    Toast.makeText(context, "No valid dates found in records", Toast.LENGTH_SHORT).show()
                    return null
                }
                startCalendar.time = tripDates.first()
                endCalendar.time = tripDates.last()
            }

            val dateList = mutableListOf<Date>()
            val currentCalendar = startCalendar.clone() as Calendar
            currentCalendar.set(Calendar.HOUR_OF_DAY, 0)
            currentCalendar.set(Calendar.MINUTE, 0)
            currentCalendar.set(Calendar.SECOND, 0)
            currentCalendar.set(Calendar.MILLISECOND, 0)

            val limitCalendar = endCalendar.clone() as Calendar
            limitCalendar.set(Calendar.HOUR_OF_DAY, 0)
            limitCalendar.set(Calendar.MINUTE, 0)
            limitCalendar.set(Calendar.SECOND, 0)
            limitCalendar.set(Calendar.MILLISECOND, 0)

            while (!currentCalendar.after(limitCalendar)) {
                dateList.add(currentCalendar.time)
                currentCalendar.add(Calendar.DAY_OF_YEAR, 1)
            }

            fun getReadings(trip: TripEntry): Pair<Double, Double> {
                return if (readingType.equals("HMR", ignoreCase = true)) {
                    val s = trip.startHmr.toDoubleOrNull() ?: 0.0
                    val e = trip.endHmr.toDoubleOrNull() ?: 0.0
                    Pair(s, e)
                } else {
                    val s = trip.startOdometer.toDoubleOrNull() ?: 0.0
                    val e = trip.endOdometer.toDoubleOrNull() ?: 0.0
                    Pair(s, e)
                }
            }

            val sortedTrips = filtered.sortedWith { t1, t2 ->
                val d1 = try { inputFormat.parse(t1.startDate) } catch (e: Exception) { Date(0) }
                val d2 = try { inputFormat.parse(t2.startDate) } catch (e: Exception) { Date(0) }
                var comp = d1.compareTo(d2)
                if (comp == 0) {
                    comp = t1.startTime.compareTo(t2.startTime)
                }
                comp
            }

            var lastKnownReading = 0.0
            if (sortedTrips.isNotEmpty()) {
                lastKnownReading = getReadings(sortedTrips.first()).first
            }

            val csv = StringBuilder()
            csv.append("S.No,Date,Shift,Start Reading,End Reading,Difference,Day\n")

            var serialNo = 1
            dateList.forEach { date ->
                val dateStr = inputFormat.format(date)
                val tripsOnDay = sortedTrips.filter { it.startDate == dateStr }

                val formattedDate = csvDateFormat.format(date)
                val dayOfWeek = dayFormat.format(date)

                if (tripsOnDay.isNotEmpty()) {
                    tripsOnDay.forEach { trip ->
                        val (start, end) = getReadings(trip)
                        val diff = if (end >= start) end - start else 0.0
                        val shift = if (trip.shift.contains("Night", ignoreCase = true)) "night" else "day"

                        csv.append("$serialNo,")
                        csv.append("$formattedDate,")
                        csv.append("$shift,")
                        csv.append("${String.format(Locale.US, "%.1f", start)},")
                        csv.append("${String.format(Locale.US, "%.1f", end)},")
                        csv.append("${String.format(Locale.US, "%.1f", diff)},")
                        csv.append("$dayOfWeek\n")

                        serialNo++
                        lastKnownReading = end
                    }
                } else {
                    csv.append("$serialNo,")
                    csv.append("$formattedDate,")
                    csv.append("day,")
                    csv.append("${String.format(Locale.US, "%.1f", lastKnownReading)},")
                    csv.append("${String.format(Locale.US, "%.1f", lastKnownReading)},")
                    csv.append("0.0,")
                    csv.append("$dayOfWeek\n")
                    serialNo++
                }
            }

            val entityName = if (selectedDriverId != null) {
                drivers.find { it.id == selectedDriverId }?.name?.replace(" ", "_") ?: "Driver"
            } else {
                vehicles.find { it.id == selectedVehicleId }?.number?.replace(" ", "_") ?: "Car"
            }
            val periodName = monthFilter?.replace(" ", "_") ?: "All_Time"
            val typeSuffix = if (readingType.equals("HMR", ignoreCase = true)) "HMR" else "Odo"
            val fileName = "${entityName}_Report_${periodName}_$typeSuffix.csv"

            val savedUri = saveFileToDownloads(context, csv.toString(), fileName, "text/csv")
            if (savedUri != null) {
                Toast.makeText(context, "Report saved: $fileName", Toast.LENGTH_SHORT).show()
            }
            savedUri
        } catch (e: Exception) {
            Log.e("ExportUtils", "CUSTOM_EXPORT_FAILURE", e)
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
