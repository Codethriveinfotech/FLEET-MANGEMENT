package com.vehicletrackingapp.ui.screens.driver

import android.net.Uri
import android.util.Log
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Notes
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.model.TripEntry
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import com.vehicletrackingapp.util.PickerUtils
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.*
import java.text.SimpleDateFormat

import kotlinx.coroutines.flow.firstOrNull

@Composable
fun TripDetailsTab(driverId: String) {
    val allVehicles by AppRepository.getAllVehicles().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(100)
        visible = true
    }

    var tripId by remember { mutableStateOf("") }
    var selectedVehicleId by remember { mutableStateOf<String?>(null) }
    var dayOfWeek by remember { mutableStateOf("Monday") }
    var shiftType by remember { mutableStateOf("Day Shift") }
    var startHmr by remember { mutableStateOf("") }
    var endHmr by remember { mutableStateOf("") }
    var sourceLocation by remember { mutableStateOf("") }
    var destinationLocation by remember { mutableStateOf("") }
    
    var startDate by remember { mutableStateOf("") }
    var startTime by remember { mutableStateOf("") }
    var startOdo by remember { mutableStateOf("") }
    var startOdoUri by remember { mutableStateOf<Uri?>(null) }
    var startPlateUri by remember { mutableStateOf<Uri?>(null) }
    var endDate by remember { mutableStateOf("") }
    var endTime by remember { mutableStateOf("") }
    var endOdo by remember { mutableStateOf("") }
    var endOdoUri by remember { mutableStateOf<Uri?>(null) }
    var sheetUri by remember { mutableStateOf<Uri?>(null) }
    var fuel by remember { mutableStateOf("") }
    var purpose by remember { mutableStateOf("Delivery") }
    var notes by remember { mutableStateOf("") }
    
    var error by remember { mutableStateOf<String?>(null) }
    var submitted by remember { mutableStateOf(false) }
    var vehicleMenuExpanded by remember { mutableStateOf(false) }
    var dayMenuExpanded by remember { mutableStateOf(false) }
    var shiftMenuExpanded by remember { mutableStateOf(false) }
    var isOcrReadingStart by remember { mutableStateOf(false) }
    var isOcrReadingEnd by remember { mutableStateOf(false) }
    
    var tripStatus by remember { mutableStateOf("draft") }
    var isLocked = tripStatus == "submitted"

    var isInitialized by remember { mutableStateOf(false) }
    var isOdoFetched by remember { mutableStateOf(false) }

    fun reInitializeForm() {
        tripId = UUID.randomUUID().toString().take(8).uppercase()
        selectedVehicleId = null
        dayOfWeek = "Monday"
        shiftType = "Day Shift"
        startHmr = ""
        endHmr = ""
        sourceLocation = ""
        destinationLocation = ""
        startOdo = ""
        endOdo = ""
        fuel = ""
        purpose = "Delivery"
        notes = ""
        startOdoUri = null
        startPlateUri = null
        endOdoUri = null
        sheetUri = null
        tripStatus = "draft"
        submitted = false
        error = null
        isOdoFetched = false
        isOcrReadingStart = false
        isOcrReadingEnd = false
        
        // Refresh Day/Shift
        val now = Date()
        dayOfWeek = SimpleDateFormat("EEEE", Locale.getDefault()).format(now)
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        shiftType = if (hour in 6..17) "Day Shift" else "Night Shift"
    }

    LaunchedEffect(Unit) {
        val draft = AppRepository.getDraftTrip(driverId).firstOrNull()
        if (draft != null) {
            tripId = draft.id
            selectedVehicleId = draft.vehicleId
            dayOfWeek = draft.day
            shiftType = draft.shift
            startHmr = draft.startHmr
            endHmr = draft.endHmr
            sourceLocation = draft.sourceLocation
            destinationLocation = draft.destinationLocation
            startDate = draft.startDate
            startTime = draft.startTime
            startOdo = draft.startOdometer
            startOdoUri = draft.startOdometerPhotoUri?.let { Uri.parse(it) }
            startPlateUri = draft.startVehiclePlatePhotoUri?.let { Uri.parse(it) }
            endDate = draft.endDate
            endTime = draft.endTime
            endOdo = draft.endOdometer
            endOdoUri = draft.endOdometerPhotoUri?.let { Uri.parse(it) }
            sheetUri = draft.sheetPhotoUri?.let { Uri.parse(it) }
            fuel = draft.fuelLevel
            purpose = draft.tripPurpose
            notes = draft.notes
            tripStatus = draft.status
            isOdoFetched = draft.vehicleId != null && draft.startOdometer.isNotBlank()
            isInitialized = true
        } else {
            tripId = UUID.randomUUID().toString().take(8).uppercase()
            tripStatus = "draft"
            
            // Auto-initialize Day and Shift
            val now = Date()
            dayOfWeek = SimpleDateFormat("EEEE", Locale.getDefault()).format(now)
            val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
            shiftType = if (hour in 6..17) "Day Shift" else "Night Shift"
            isInitialized = true
        }
    }

    // Auto-close logic for expired trips (12 hours)
    LaunchedEffect(isInitialized) {
        if (!isInitialized) return@LaunchedEffect
        while(true) {
            val sdf = SimpleDateFormat("dd/MM/yyyy hh:mm a", Locale.getDefault())
            val startedTrips = AppRepository.getAllStartedTrips()
            val now = System.currentTimeMillis()
            val twelveHoursMs = 12 * 60 * 60 * 1000L

            startedTrips.forEach { trip ->
                try {
                    val startDateTime = sdf.parse("${trip.startDate} ${trip.startTime}")
                    if (startDateTime != null && (now - startDateTime.time) > twelveHoursMs) {
                        // Auto-close trip
                        val endCal = Calendar.getInstance().apply { 
                            time = startDateTime
                            add(Calendar.HOUR_OF_DAY, 12) 
                        }
                        val autoEndedTrip = trip.copy(
                            endDate = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(endCal.time),
                            endTime = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(endCal.time),
                            status = "submitted",
                            notes = "${trip.notes} [AUTO_CLOSED]".trim()
                        )
                        AppRepository.upsertTrip(autoEndedTrip)
                        
                        // If this was the active trip in UI, reset it
                        if (trip.id == tripId) {
                            reInitializeForm()
                        }
                    }
                } catch (e: Exception) {
                    Log.e("TripDetailsTab", "Auto-close parsing error", e)
                }
            }
            delay(60000) // Check every minute
        }
    }

    // Live update for system date/time
    LaunchedEffect(tripStatus, isInitialized) {
        if (!isInitialized) return@LaunchedEffect
        val sdfD = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        val sdfT = SimpleDateFormat("hh:mm a", Locale.getDefault())
        
        while (tripStatus == "draft" || tripStatus == "started") {
            val now = Date()
            if (tripStatus == "draft") {
                startDate = sdfD.format(now)
                startTime = sdfT.format(now)
            } else if (tripStatus == "started") {
                endDate = sdfD.format(now)
                endTime = sdfT.format(now)
            }
            delay(1000) // Update every second for precise visual feedback
        }
    }

    // High-Integrity sub-second persistence logic
    fun persistDraft() {
        if (isLocked) return
        scope.launch {
            val trip = TripEntry(
                id = tripId, driverId = driverId, vehicleId = selectedVehicleId,
                day = dayOfWeek, shift = shiftType, startHmr = startHmr, endHmr = endHmr,
                sourceLocation = sourceLocation, destinationLocation = destinationLocation,
                startDate = startDate, startTime = startTime, startOdometer = startOdo,
                startOdometerPhotoUri = startOdoUri?.toString(), startVehiclePlatePhotoUri = startPlateUri?.toString(),
                endDate = endDate, endTime = endTime, endOdometer = endOdo,
                endOdometerPhotoUri = endOdoUri?.toString(), sheetPhotoUri = sheetUri?.toString(), fuelLevel = fuel, tripPurpose = purpose, notes = notes,
                status = tripStatus
            )
            AppRepository.upsertTrip(trip)
        }
    }

    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        SectionTitle(stringResource(R.string.trip_registration).uppercase())
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(24.dp))
        
        val isStarted = tripStatus == "started" || isLocked
        val isStartLocked = isStarted || isLocked

        if (isLocked) {
            Box(modifier = Modifier.fillMaxWidth().background(SuccessEmerald.copy(alpha = 0.15f), RoundedCornerShape(12.dp)).padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Security, null, tint = SuccessEmerald, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("DATA INTEGRITY SECURED: Mission record is now read-only.", color = SuccessEmerald, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        if (!isStartLocked) {
            StaggeredItem(visible, 0) {
                UltraGlassCard(glowColor = BrandYellow) {
                    Text(stringResource(R.string.vehicle_verification).uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 2.sp)
                    Spacer(modifier = Modifier.height(24.dp))
                    CameraOnlyPicker(
                        label = "LICENSE PLATE IDENTIFICATION", 
                        imageUri = startPlateUri, 
                        onImageSelected = { startPlateUri = it; persistDraft() },
                        enabled = true
                    )
                    Spacer(modifier = Modifier.height(32.dp))
                    Box(modifier = Modifier.fillMaxWidth()) {
                        val selectedVehicle = allVehicles.find { it.id == selectedVehicleId }
                        OutlinedTextField(
                            value = selectedVehicle?.let { "${it.number} (${it.model})" } ?: stringResource(R.string.active_fleet_asset),
                            onValueChange = {},
                            readOnly = true,
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text(stringResource(R.string.active_fleet_asset), fontWeight = FontWeight.Bold) },
                            trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                            shape = RoundedCornerShape(20.dp),
                            enabled = true,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandYellow, unfocusedBorderColor = Color.Black.copy(alpha = 0.08f), disabledTextColor = BrandDark)
                        )
                        Box(modifier = Modifier.matchParentSize().background(Color.Transparent).clickable { vehicleMenuExpanded = true })
                        DropdownMenu(expanded = vehicleMenuExpanded, onDismissRequest = { vehicleMenuExpanded = false }) {
                            val activeVehicles = allVehicles.filter { it.status.equals("Active", ignoreCase = true) }
                            if (activeVehicles.isEmpty()) {
                                DropdownMenuItem(
                                    text = { Text("No active vehicles available", color = BrandGrey, fontWeight = FontWeight.Bold) },
                                    onClick = { vehicleMenuExpanded = false }
                                )
                            } else {
                                activeVehicles.forEach { vehicle ->
                                    DropdownMenuItem(
                                        text = { Text("${vehicle.number} - ${vehicle.model}", fontWeight = FontWeight.Black) },
                                        onClick = {
                                            selectedVehicleId = vehicle.id
                                            vehicleMenuExpanded = false
                                            
                                            // Prefill from last trip or vehicle mileage
                                            scope.launch {
                                                val last = AppRepository.getLastTripForVehicle(vehicle.id)
                                                if (last != null) {
                                                    startOdo = if (last.endOdometer.isNotBlank()) last.endOdometer else vehicle.mileage.ifBlank { "0" }
                                                    startHmr = if (last.endHmr.isNotBlank()) last.endHmr else "0"
                                                } else {
                                                    startOdo = vehicle.mileage.ifBlank { "0" }
                                                    startHmr = "0"
                                                }
                                                isOdoFetched = startOdo.isNotBlank()
                                                persistDraft()
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            StaggeredItem(visible, 1) {
                UltraGlassCard {
                    Text(stringResource(R.string.start_trip).uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 2.sp)
                    Spacer(modifier = Modifier.height(20.dp))
                    
                    // Day (Auto-selected & read-only)
                    OutlinedTextField(
                        value = dayOfWeek,
                        onValueChange = {},
                        readOnly = true,
                        enabled = false,
                        label = { Text("Day of Week", color = TextHint) },
                        colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        leadingIcon = { Icon(Icons.Default.CalendarToday, null, tint = BrandYellow) }
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Shift Selector
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = shiftType, onValueChange = {}, readOnly = true, modifier = Modifier.fillMaxWidth(),
                            label = { Text("Shift Selection (Day / Night)", color = TextHint) },
                            trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                            shape = RoundedCornerShape(20.dp),
                            enabled = true,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandYellow, unfocusedBorderColor = Color.Black.copy(alpha = 0.08f), disabledTextColor = BrandDark)
                        )
                        Box(modifier = Modifier.matchParentSize().clickable { shiftMenuExpanded = true })
                        DropdownMenu(expanded = shiftMenuExpanded, onDismissRequest = { shiftMenuExpanded = false }) {
                            listOf("Day Shift", "Night Shift").forEach { s ->
                                DropdownMenuItem(text = { Text(s, fontWeight = FontWeight.Black) }, onClick = { shiftType = s; shiftMenuExpanded = false; persistDraft() })
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = if (startDate.isBlank()) "PENDING..." else startDate, 
                            onValueChange = {}, readOnly = true, enabled = false,
                            label = { Text("System Date", color = TextHint) },
                            colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                            modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(20.dp),
                            leadingIcon = { Icon(Icons.Default.CalendarToday, null, tint = BrandYellow) }
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        OutlinedTextField(
                            value = if (startTime.isBlank()) "PENDING..." else startTime, 
                            onValueChange = {}, readOnly = true, enabled = false,
                            label = { Text("System Time", color = TextHint) },
                            colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                            modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(20.dp),
                            leadingIcon = { Icon(Icons.Default.Schedule, null, tint = BrandYellow) }
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    EliteTextField(
                        value = if (isOcrReadingStart) "Reading from image..." else startOdo, 
                        onValueChange = { if (!isOcrReadingStart) { startOdo = it; persistDraft() } }, 
                        label = stringResource(R.string.odometer_reading), 
                        leadingIcon = if (isOcrReadingStart) Icons.Default.HourglassTop else Icons.Default.Speed, 
                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Number, 
                        enabled = !isLocked && !isOcrReadingStart
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    EliteTextField(
                        value = sourceLocation,
                        onValueChange = { sourceLocation = it; persistDraft() },
                        label = "Source Location",
                        leadingIcon = Icons.Default.LocationOn,
                        enabled = !isLocked
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    EliteTextField(
                        value = destinationLocation,
                        onValueChange = { destinationLocation = it; persistDraft() },
                        label = "Destination Location",
                        leadingIcon = Icons.Default.Place,
                        enabled = !isLocked
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    CameraOnlyPicker(
                        label = "INITIAL ODOMETER EVIDENCE", 
                        imageUri = startOdoUri, 
                        onImageSelected = { uri -> 
                            startOdoUri = uri
                            persistDraft()
                            if (uri != null) {
                                isOcrReadingStart = true
                                com.vehicletrackingapp.util.OcrUtils.extractOdometerValue(context, uri) { extracted ->
                                    isOcrReadingStart = false
                                    if (extracted.isNotBlank()) {
                                        startOdo = extracted
                                        persistDraft()
                                    }
                                }
                            }
                        }, 
                        enabled = true 
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        } else {
            StaggeredItem(visible, 0) {
                UltraGlassCard {
                    Text("START TRIP SUMMARY", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 2.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    val selectedVehicle = allVehicles.find { it.id == selectedVehicleId }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.DirectionsCar, contentDescription = null, tint = BrandYellow, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(selectedVehicle?.let { "${it.number} (${it.model})" } ?: "Unknown Vehicle", fontWeight = FontWeight.Bold, color = BrandDark)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Schedule, contentDescription = null, tint = BrandYellow, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text("$dayOfWeek • $shiftType", fontWeight = FontWeight.Bold, color = BrandDark)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Speed, contentDescription = null, tint = BrandYellow, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text("$startOdo KM / $startHmr HMR", fontWeight = FontWeight.Bold, color = BrandDark)
                    }
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
        }

        if (isStarted) {
            // End Deploy Intelligence
            StaggeredItem(visible, 2) {
                UltraGlassCard {
                    Text(stringResource(R.string.end_trip).uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 2.sp)
                    Spacer(modifier = Modifier.height(20.dp))

                    Row(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = if (endDate.isBlank()) "PENDING..." else endDate, 
                            onValueChange = {}, readOnly = true, enabled = false,
                            label = { Text("System Date", color = TextHint) },
                            colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                            modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(20.dp),
                            leadingIcon = { Icon(Icons.Default.CalendarToday, null, tint = BrandYellow) }
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        OutlinedTextField(
                            value = if (endTime.isBlank()) "PENDING..." else endTime, 
                            onValueChange = {}, readOnly = true, enabled = false,
                            label = { Text("System Time", color = TextHint) },
                            colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                            modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(20.dp),
                            leadingIcon = { Icon(Icons.Default.Schedule, null, tint = BrandYellow) }
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(modifier = Modifier.fillMaxWidth()) {
                        EliteTextField(value = if (isOcrReadingEnd) "Reading from image..." else endOdo, onValueChange = { if (!isOcrReadingEnd) { endOdo = it; persistDraft() } }, label = stringResource(R.string.end_km), leadingIcon = if (isOcrReadingEnd) Icons.Default.HourglassTop else Icons.Default.Speed, keyboardType = androidx.compose.ui.text.input.KeyboardType.Number, enabled = !isLocked && !isOcrReadingEnd, modifier = Modifier.weight(1f))
                        Spacer(modifier = Modifier.width(12.dp))
                        EliteTextField(
                            value = endHmr,
                            onValueChange = { newValue ->
                                endHmr = newValue
                                persistDraft()
                            },
                            label = "End HMR",
                            leadingIcon = Icons.Default.Timer,
                            keyboardType = androidx.compose.ui.text.input.KeyboardType.Number,
                            enabled = !isLocked,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    
                    // HMR Computed Difference with max cap from actual trip time
                    val sHmr = startHmr.toDoubleOrNull()
                    val eHmr = endHmr.toDoubleOrNull()
                    if (sHmr != null && eHmr != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        val hmrDiff = eHmr - sHmr
                        
                        // Calculate max allowed HMR from actual trip start/end times
                        val timeSdf = SimpleDateFormat("hh:mm a", Locale.getDefault())
                        val dateSdf = SimpleDateFormat("dd/MM/yyyy hh:mm a", Locale.getDefault())
                        val maxAllowedHmr: Double? = try {
                            val sdt = dateSdf.parse("$startDate $startTime")
                            val edt = dateSdf.parse("$endDate $endTime")
                            if (sdt != null && edt != null) {
                                val diffMs = edt.time - sdt.time
                                if (diffMs > 0) diffMs / (1000.0 * 60 * 60) else null
                            } else null
                        } catch (e: Exception) { null }

                        val isHmrBelowZero = hmrDiff < 0
                        val isHmrExceedsMax = maxAllowedHmr != null && hmrDiff > maxAllowedHmr
                        val isHmrValid = !isHmrBelowZero && !isHmrExceedsMax

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isHmrValid) SuccessEmerald.copy(alpha = 0.08f) else DangerCrimson.copy(alpha = 0.08f)
                            ),
                            border = androidx.compose.foundation.BorderStroke(1.dp, if (isHmrValid) SuccessEmerald.copy(alpha = 0.4f) else DangerCrimson.copy(alpha = 0.4f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Timer,
                                    contentDescription = null,
                                    tint = if (isHmrValid) SuccessEmerald else DangerCrimson,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    when {
                                        isHmrBelowZero -> Text(
                                            "END HMR CANNOT BE LESS THAN START HMR ($startHmr)",
                                            fontWeight = FontWeight.Black,
                                            color = DangerCrimson,
                                            fontSize = 12.sp
                                        )
                                        isHmrExceedsMax -> Text(
                                            "HMR EXCEEDS TRIP DURATION — MAX ALLOWED: ${String.format(java.util.Locale.US, "%.2f", maxAllowedHmr)} HRS",
                                            fontWeight = FontWeight.Black,
                                            color = DangerCrimson,
                                            fontSize = 12.sp
                                        )
                                        else -> {
                                            Text(
                                                "TOTAL HMR WORKED: ${String.format(java.util.Locale.US, "%.2f", hmrDiff)} HRS",
                                                fontWeight = FontWeight.Black,
                                                color = SuccessEmerald,
                                                fontSize = 12.sp
                                            )
                                            if (maxAllowedHmr != null) {
                                                Text(
                                                    "Max allowed: ${String.format(java.util.Locale.US, "%.2f", maxAllowedHmr)} HRS",
                                                    color = TextHint,
                                                    fontSize = 10.sp
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                    CameraOnlyPicker(
                        label = "FINAL ODOMETER EVIDENCE", 
                        imageUri = endOdoUri, 
                        onImageSelected = { uri -> 
                            if (!isLocked) { 
                                endOdoUri = uri
                                persistDraft()
                                if (uri != null) {
                                    isOcrReadingEnd = true
                                    com.vehicletrackingapp.util.OcrUtils.extractOdometerValue(context, uri) { extracted ->
                                        isOcrReadingEnd = false
                                        if (extracted.isNotBlank()) {
                                            endOdo = extracted
                                            persistDraft()
                                        }
                                    }
                                }
                            } 
                        }, 
                        enabled = !isLocked
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            StaggeredItem(visible, 3) {
                UltraGlassCard {
                    Text(stringResource(R.string.logistics).uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 2.sp)
                    Spacer(modifier = Modifier.height(20.dp))
                    EliteTextField(value = fuel, onValueChange = { fuel = it; persistDraft() }, label = "${stringResource(R.string.fuel_level)} (Litres)", leadingIcon = Icons.Default.LocalGasStation, keyboardType = androidx.compose.ui.text.input.KeyboardType.Number, enabled = !isLocked)
                    Spacer(modifier = Modifier.height(16.dp))
                    EliteTextField(value = purpose, onValueChange = { purpose = it; persistDraft() }, label = stringResource(R.string.trip_purpose), leadingIcon = Icons.Default.Work, enabled = !isLocked)
                    Spacer(modifier = Modifier.height(16.dp))
                    EliteTextField(value = notes, onValueChange = { notes = it; persistDraft() }, label = stringResource(R.string.mission_notes), leadingIcon = Icons.AutoMirrored.Filled.Notes, enabled = !isLocked)
                    Spacer(modifier = Modifier.height(20.dp))
                    CameraOnlyPicker(label = "SHEET", imageUri = sheetUri, onImageSelected = { if (!isLocked) { sheetUri = it; persistDraft() } }, enabled = !isLocked)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }

        error?.let { errText ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = DangerCrimson.copy(alpha = 0.12f)),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, DangerCrimson)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Error, contentDescription = null, tint = DangerCrimson, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(errText, color = DangerCrimson, fontWeight = FontWeight.Black, fontSize = 13.sp)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        Spacer(modifier = Modifier.height(20.dp))
        
        if (!isLocked) {
            if (!isStarted) {
                StaggeredItem(visible, 4) {
                    Column {
                        GradientButton(text = "START TRIP") {
                            if (selectedVehicleId == null || startOdo.isBlank() || startOdoUri == null || startPlateUri == null || sourceLocation.isBlank() || destinationLocation.isBlank()) {
                                error = "ERROR: Complete Start Mission Data Required (Asset, Odometer KM, Source, Destination, Odometer Photo, Plate Photo)."
                            } else {
                                scope.launch {
                                    // Retrospective update for previous auto-ended trip
                                    selectedVehicleId?.let { vId ->
                                        val lastTrip = AppRepository.getLastTripForVehicle(vId)
                                        if (lastTrip != null && lastTrip.notes.contains("AUTO_CLOSED")) {
                                            val updated = lastTrip.copy(
                                                endOdometer = if (lastTrip.endOdometer.isBlank()) startOdo else lastTrip.endOdometer,
                                                endHmr = if (lastTrip.endHmr.isBlank()) startHmr else lastTrip.endHmr,
                                                notes = lastTrip.notes.replace("AUTO_CLOSED", "AUTO_CLOSED_SYNCED")
                                            )
                                            AppRepository.upsertTrip(updated)
                                        }
                                    }
                                    
                                    tripStatus = "started"
                                    persistDraft()
                                    error = null
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedButton(
                            onClick = { 
                                scope.launch {
                                    AppRepository.discardAllDraftTrips(driverId)
                                    // Reset fields to trigger re-initialization
                                    tripId = UUID.randomUUID().toString().take(8).uppercase()
                                    selectedVehicleId = null
                                    dayOfWeek = "Monday"
                                    shiftType = "Day Shift"
                                    startHmr = ""
                                    endHmr = ""
                                    startOdo = ""
                                    endOdo = ""
                                    fuel = ""
                                    purpose = "Delivery"
                                    notes = ""
                                    startOdoUri = null
                                    startPlateUri = null
                                    endOdoUri = null
                                    sheetUri = null
                                    tripStatus = "draft"
                                    isOdoFetched = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(20.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = DangerCrimson),
                            border = androidx.compose.foundation.BorderStroke(1.dp, DangerCrimson)
                        ) {
                            Text("DISCARD DRAFT", fontWeight = FontWeight.Black, letterSpacing = 2.sp)
                        }
                    }
                }
            } else {
                StaggeredItem(visible, 4) {
                    Column {
                        GradientButton(text = stringResource(R.string.validate_submit).uppercase()) {
                            val sOdo = startOdo.toDoubleOrNull() ?: 0.0
                            val eOdo = endOdo.toDoubleOrNull() ?: 0.0
                            val sH = startHmr.toDoubleOrNull()
                            val eH = endHmr.toDoubleOrNull()

                            if ((endOdo.isBlank() && endHmr.isBlank()) || endOdoUri == null || sheetUri == null) {
                                error = "ERROR: Complete End Mission Data Required (KM or HMR, End Odometer Photo, and Sheet Photo)."
                                return@GradientButton
                            }

                            if (endOdo.isNotBlank() && startOdo.isNotBlank() && eOdo < sOdo) {
                                error = "INTEGRITY ERROR: End Odometer ($endOdo KM) lower than Start ($startOdo KM)."
                                return@GradientButton
                            }

                            if (sH != null && eH != null) {
                                val hmrWorked = eH - sH
                                if (hmrWorked < 0) {
                                    error = "HMR ERROR: End HMR ($endHmr) cannot be less than Start HMR ($startHmr)."
                                    return@GradientButton
                                }
                                
                                val dateSdf2 = SimpleDateFormat("dd/MM/yyyy hh:mm a", Locale.getDefault())
                                val maxHmr: Double? = try {
                                    val sdt = dateSdf2.parse("$startDate $startTime")
                                    val edt = dateSdf2.parse("$endDate $endTime")
                                    if (sdt != null && edt != null) {
                                        val diffMs = edt.time - sdt.time
                                        if (diffMs > 0) diffMs / (1000.0 * 60 * 60) else null
                                    } else null
                                } catch (ex: Exception) { null }

                                if (maxHmr != null && hmrWorked > maxHmr) {
                                    error = "HMR ERROR: HMR worked (${String.format(java.util.Locale.US, "%.2f", hmrWorked)} hrs) exceeds trip duration (${String.format(java.util.Locale.US, "%.2f", maxHmr)} hrs max)."
                                    return@GradientButton
                                }
                            }

                            // All validations passed - submit trip:
                            scope.launch {
                                val trip = TripEntry(
                                    id = tripId, driverId = driverId, vehicleId = selectedVehicleId,
                                    day = dayOfWeek, shift = shiftType, startHmr = startHmr, endHmr = endHmr,
                                    sourceLocation = sourceLocation, destinationLocation = destinationLocation,
                                    startDate = startDate, startTime = startTime, startOdometer = startOdo,
                                    startOdometerPhotoUri = startOdoUri?.toString(), startVehiclePlatePhotoUri = startPlateUri?.toString(),
                                    endDate = endDate, endTime = endTime, endOdometer = endOdo, endOdometerPhotoUri = endOdoUri?.toString(),
                                    sheetPhotoUri = sheetUri?.toString(), fuelLevel = fuel, tripPurpose = purpose, notes = notes, status = "submitted"
                                )
                                val success = AppRepository.upsertTrip(trip)
                                if (success) {
                                    submitted = true
                                    error = null
                                    tripStatus = "submitted"
                                    
                                    // Auto-reset after short delay to show success state
                                    delay(2000)
                                    reInitializeForm()
                                } else {
                                    error = "DATABASE ERROR: Failed to save trip locally."
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedButton(
                            onClick = { 
                                scope.launch {
                                    AppRepository.discardAllDraftTrips(driverId)
                                    // Reset fields to trigger re-initialization
                                    tripId = UUID.randomUUID().toString().take(8).uppercase()
                                    selectedVehicleId = null
                                    dayOfWeek = "Monday"
                                    shiftType = "Day Shift"
                                    startHmr = ""
                                    endHmr = ""
                                    sourceLocation = ""
                                    destinationLocation = ""
                                    startOdo = ""
                                    endOdo = ""
                                    fuel = ""
                                    purpose = "Delivery"
                                    notes = ""
                                    startOdoUri = null
                                    startPlateUri = null
                                    endOdoUri = null
                                    sheetUri = null
                                    tripStatus = "draft"
                                    isOdoFetched = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(20.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = DangerCrimson),
                            border = androidx.compose.foundation.BorderStroke(1.dp, DangerCrimson)
                        ) {
                            Text("CANCEL TRIP", fontWeight = FontWeight.Black, letterSpacing = 2.sp)
                        }
                    }
                }
            }
        }
        
        if (submitted || isLocked) {
            Spacer(modifier = Modifier.height(16.dp))
            Text("✓ MISSION SYNCHRONIZED", color = SuccessEmerald, fontWeight = FontWeight.Black, modifier = Modifier.align(Alignment.CenterHorizontally), letterSpacing = 1.2.sp)
        }
        
        Spacer(modifier = Modifier.height(60.dp))
    }
}
