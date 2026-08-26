package com.vehicletrackingapp.ui.screens.admin

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.vehicletrackingapp.R
import android.net.Uri
import kotlinx.coroutines.launch
import com.vehicletrackingapp.data.model.*
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import com.vehicletrackingapp.util.ExportUtils
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ReportsTab() {
    val submittedTrips by AppRepository.getAllTrips().collectAsState(initial = emptyList())
    val submittedMaintenance by AppRepository.getAllMaintenance().collectAsState(initial = emptyList())
    val drivers by AppRepository.getAllDrivers().collectAsState(initial = emptyList())
    val vehicles by AppRepository.getAllVehicles().collectAsState(initial = emptyList())
    val context = LocalContext.current
    
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    var selectedTrip by remember { mutableStateOf<TripEntry?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var periodTab by remember { mutableIntStateOf(0) }
    val periods = listOf("ALL", "TODAY", "YESTERDAY", "WEEK", "MONTH", "YEAR")

    var showDownloadDialog by remember { mutableStateOf(false) }
    var showSpreadsheetViewer by remember { mutableStateOf(false) }

    var exportReportType by remember { mutableStateOf("Total Report") }
    var selectedExportDriverId by remember { mutableStateOf<String?>(null) }
    var selectedExportVehicleId by remember { mutableStateOf<String?>(null) }
    var exportPeriod by remember { mutableStateOf("All Time") }

    var reportTypeDropdownExpanded by remember { mutableStateOf(false) }
    var driverDropdownExpanded by remember { mutableStateOf(false) }
    var vehicleDropdownExpanded by remember { mutableStateOf(false) }
    var periodDropdownExpanded by remember { mutableStateOf(false) }

    val filteredTrips = submittedTrips.filter { trip ->
        val driverName = drivers.find { it.id == trip.driverId }?.name ?: ""
        val vehicleNum = vehicles.find { it.id == trip.vehicleId }?.number ?: ""
        
        val matchesSearch = driverName.contains(searchQuery, ignoreCase = true) || 
                          vehicleNum.contains(searchQuery, ignoreCase = true) ||
                          trip.startDate.contains(searchQuery, ignoreCase = true) ||
                          trip.id.contains(searchQuery, ignoreCase = true)
        
        val sdf = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        val tripDate = try { sdf.parse(trip.startDate) } catch(e: Exception) { null } ?: Date()
        val tripCal = Calendar.getInstance().apply { time = tripDate }
        
        val matchesPeriod = when(periodTab) {
            1 -> trip.startDate == sdf.format(Date())
            2 -> {
                val cal = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -1) }
                trip.startDate == sdf.format(cal.time)
            }
            3 -> {
                val cal = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -7) }
                tripCal.after(cal)
            }
            4 -> {
                val cal = Calendar.getInstance().apply { add(Calendar.MONTH, -1) }
                tripCal.after(cal)
            }
            5 -> {
                val now = Calendar.getInstance()
                tripCal.get(Calendar.YEAR) == now.get(Calendar.YEAR)
            }
            else -> true 
        }
        matchesSearch && matchesPeriod
    }.sortedByDescending { it.startDate }

    // Enhanced Monthly Analytics Logic
    val summary = remember(filteredTrips, periodTab, drivers) {
        if (filteredTrips.isEmpty() || (periodTab != 4 && periodTab != 0 && periodTab != 5)) null 
        else {
            val totalTrips = filteredTrips.size
            val breakdowns = filteredTrips.count { it.isBreakdown }
            val nightShifts = filteredTrips.count { it.shift.contains("Night", ignoreCase = true) }
            val dayShifts = filteredTrips.count { it.shift.contains("Day", ignoreCase = true) }
            
            val sdf = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
            val sundayTrips = filteredTrips.count { trip ->
                try {
                    val d = sdf.parse(trip.startDate)
                    val cal = Calendar.getInstance()
                    if (d != null) {
                        cal.time = d
                        cal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY
                    } else false
                } catch(e: Exception) { false }
            }

            // Billing Days Logic
            val workingDaysSet = filteredTrips.map { it.startDate }.distinct()
            val breakdownDaysSet = filteredTrips.filter { it.isBreakdown }.map { it.startDate }.toSet()
            val billingDays = workingDaysSet.size - breakdownDaysSet.size

            val driverStats = filteredTrips.groupBy { it.driverId }.map { (id, trips) ->
                val name = drivers.find { it.id == id }?.name ?: "Unknown"
                val totalDays = trips.map { it.startDate }.distinct().size
                val driverNight = trips.count { it.shift.contains("Night", ignoreCase = true) }
                val driverDay = trips.count { it.shift.contains("Day", ignoreCase = true) }
                val driverBreak = trips.count { it.isBreakdown }
                
                val sundays = trips.count { trip ->
                    try {
                        val d = sdf.parse(trip.startDate)
                        val cal = Calendar.getInstance()
                        if (d != null) {
                            cal.time = d
                            cal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY
                        } else false
                    } catch(e: Exception) { false }
                }
                DriverReport(
                    name = name, 
                    totalMissions = trips.size,
                    uniqueDays = totalDays,
                    dayShifts = driverDay,
                    nightShifts = driverNight,
                    sundays = sundays,
                    breakdowns = driverBreak,
                    billingDays = trips.size - driverBreak
                )
            }

            MonthlySummaryData(
                totalDays = workingDaysSet.size,
                breakdowns = breakdowns,
                nightWorks = nightShifts,
                dayWorks = dayShifts,
                sundays = sundayTrips,
                billingDays = if (billingDays < 0) 0 else billingDays,
                driverStats = driverStats
            )
        }
    }

    val monthFormat = SimpleDateFormat("MMMM yyyy", Locale.getDefault())
    val inputFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
    
    val groupedByMonth = remember(filteredTrips) {
        filteredTrips.groupBy { trip ->
            try {
                val date = inputFormat.parse(trip.startDate)
                if (date != null) monthFormat.format(date) else "Unknown Month"
            } catch (e: Exception) {
                "Unknown Month"
            }
        }
    }

    val groupedByDriver = remember(filteredTrips) {
        filteredTrips.groupBy { it.driverId }
    }

    val groupedByVehicle = remember(filteredTrips) {
        filteredTrips.groupBy { it.vehicleId }
    }

    var selectedReportType by remember { mutableStateOf("TOTAL") }
    val reportTypes = listOf("TOTAL", "DRIVER-WISE", "CAR-WISE")
    var expandedMonth by remember { mutableStateOf<String?>(null) }
    var expandedDriver by remember { mutableStateOf<String?>(null) }
    var expandedVehicle by remember { mutableStateOf<String?>(null) }
    var showExportTypeDialog by remember { mutableStateOf(false) }

    val availableMonths = remember(submittedTrips) {
        submittedTrips.mapNotNull { trip ->
            try {
                val date = inputFormat.parse(trip.startDate)
                if (date != null) monthFormat.format(date) else null
            } catch (e: Exception) { null }
        }.distinct()
    }

    if (showExportTypeDialog) {
        ExcelReportSelectionDialog(
            trips = submittedTrips,
            maintenance = submittedMaintenance,
            drivers = drivers,
            vehicles = vehicles,
            months = availableMonths,
            onDismiss = { showExportTypeDialog = false },
            onExport = { reportType, selDriverId, selVehicleId, selMonth ->
                val uri = when (reportType) {
                    "ALL" -> ExportUtils.exportAllInOne(
                        context, submittedTrips, submittedMaintenance, drivers, vehicles
                    )
                    "DRIVER" -> ExportUtils.exportCustomReport(
                        context = context,
                        trips = submittedTrips,
                        drivers = drivers,
                        vehicles = vehicles,
                        selectedDriverId = selDriverId,
                        selectedVehicleId = null,
                        monthFilter = "All Time"
                    )
                    "VEHICLE" -> ExportUtils.exportCustomReport(
                        context = context,
                        trips = submittedTrips,
                        drivers = drivers,
                        vehicles = vehicles,
                        selectedDriverId = null,
                        selectedVehicleId = selVehicleId,
                        monthFilter = "All Time"
                    )
                    "MONTH" -> ExportUtils.exportCustomReport(
                        context = context,
                        trips = submittedTrips,
                        drivers = drivers,
                        vehicles = vehicles,
                        selectedDriverId = null,
                        selectedVehicleId = null,
                        monthFilter = selMonth ?: "All Time"
                    )
                    "BREAKDOWN" -> {
                        val breakdownTrips = submittedTrips.filter { it.isBreakdown }
                        ExportUtils.exportTripsToExcel(
                            context = context,
                            trips = if (breakdownTrips.isNotEmpty()) breakdownTrips else submittedTrips,
                            maintenance = submittedMaintenance,
                            drivers = drivers,
                            vehicles = vehicles,
                            summary = summary
                        )
                    }
                    else -> ExportUtils.exportAllInOne(
                        context, submittedTrips, submittedMaintenance, drivers, vehicles
                    )
                }
                uri?.let { ExportUtils.openInSpreadsheetApp(context, it) }
            }
        )
    }

    val activeTrip = submittedTrips.find { it.id == selectedTrip?.id }
    if (activeTrip != null) {
        ReportDetailDialog(
            trip = activeTrip,
            maintenance = submittedMaintenance.filter { it.tripId == activeTrip.id },
            driver = drivers.find { it.id == activeTrip.driverId },
            vehicle = vehicles.find { it.id == activeTrip.vehicleId },
            onDismiss = { selectedTrip = null }
        )
    }

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            SectionTitle(stringResource(R.string.executive_reports).uppercase())
            
            Surface(
                onClick = { showExportTypeDialog = true },
                shape = RoundedCornerShape(12.dp),
                color = SuccessEmerald,
                shadowElevation = 3.dp
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.TableChart, contentDescription = "Excel", tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("EXPORT EXCEL", color = Color.White, fontWeight = FontWeight.Black, fontSize = 11.sp)
                }
            }
        }
        AttractiveHorizontalDivider()
        
        Spacer(modifier = Modifier.height(16.dp))

        // Report Type Selector Tabs Row
        LazyRow(
            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(reportTypes) { type ->
                FilterChip(
                    selected = selectedReportType == type,
                    onClick = { selectedReportType = type },
                    label = { Text(type, fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrandYellow,
                        selectedLabelColor = BrandDark,
                        containerColor = BrandYellow.copy(alpha = 0.08f),
                        labelColor = BrandGrey
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))

        // Persistent Search Header
        EliteTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            label = "Search Mission (Operator, Vehicle, Date)",
            leadingIcon = Icons.Default.Troubleshoot
        )

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp)
        ) {
            item {
                LazyRow(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(periods.size) { idx ->
                        FilterChip(
                            selected = periodTab == idx,
                            onClick = { periodTab = idx },
                            label = { Text(periods[idx], fontWeight = FontWeight.Black, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(selectedContainerColor = BrandYellow, selectedLabelColor = BrandDark, containerColor = BrandYellow.copy(alpha = 0.08f), labelColor = BrandGrey),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }
            }

            when (selectedReportType) {
                "TOTAL" -> {
                    item {
                        Text("EXCEL REPORT OF TRAVELS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 2.sp)
                    }

                    if (filteredTrips.isEmpty()) {
                        item {
                            UltraGlassCard {
                                Text("NO RECORDS FOUND IN MISSION DATABASE.", color = TextHint, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                            }
                        }
                    } else {
                        item {
                            // Enterprise Grid Table Header
                            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = BrandDark)) {
                                Row(modifier = Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text("IDENTIFIER", modifier = Modifier.weight(1.2f), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = BrandYellow)
                                    Text("OPERATOR / ASSET", modifier = Modifier.weight(2f), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = BrandYellow)
                                    Text("DEPLOYMENT", modifier = Modifier.weight(2f), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = BrandYellow)
                                    Text("INTEL", modifier = Modifier.weight(0.6f), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = BrandYellow, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                                }
                            }
                        }

                        items(filteredTrips, key = { it.id }) { trip ->
                            val driver = drivers.firstOrNull { it.id == trip.driverId }
                            val vehicle = vehicles.find { it.id == trip.vehicleId }
                            val maintenanceCount = submittedMaintenance.count { it.tripId == trip.id }
                            
                            val sHmr = trip.getHmrStart()
                            val eHmr = trip.getHmrEnd()
                            val hmrWorked = trip.getHmrWorked()

                            val sOdo = trip.startOdometer.toDoubleOrNull() ?: 0.0
                            val eOdo = trip.endOdometer.toDoubleOrNull() ?: sOdo
                            val kmDiff = if (eOdo >= sOdo) eOdo - sOdo else 0.0

                            StaggeredItem(visible, 2) {
                                Card(
                                    modifier = Modifier.fillMaxWidth().clickable { selectedTrip = trip },
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    border = androidx.compose.foundation.BorderStroke(1.5.dp, BrandLightGrey)
                                ) {
                                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Column(modifier = Modifier.weight(1.2f)) {
                                            Text(trip.startDate, fontWeight = FontWeight.Black, color = BrandDark, fontSize = 13.sp)
                                            Text("#${trip.id.uppercase()}", color = TextHint, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Column(modifier = Modifier.weight(2f)) {
                                            Text(driver?.name ?: "Unknown", fontWeight = FontWeight.Black, color = BrandDark, fontSize = 14.sp)
                                            Text("${trip.day} • ${trip.shift}", color = TextHint, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 2.dp)) {
                                                Icon(Icons.Default.DirectionsCar, null, tint = BrandYellow, modifier = Modifier.size(10.dp))
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text(vehicle?.number ?: "NO ASSET", color = BrandGrey, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                                            }
                                        }
                                        Column(modifier = Modifier.weight(2.2f)) {
                                            Text("KM: ${trip.startOdometer} ➔ ${trip.endOdometer} (${String.format(Locale.US, "%.0f", kmDiff)} KM)", fontWeight = FontWeight.SemiBold, color = BrandGrey, fontSize = 11.sp)
                                            Text("HMR: ${String.format(Locale.US, "%.1f", sHmr)} ➔ ${String.format(Locale.US, "%.1f", eHmr)} (${String.format(Locale.US, "%.1f", hmrWorked)} H)", fontWeight = FontWeight.Black, color = BrandBlue, fontSize = 11.sp)
                                            if (maintenanceCount > 0) {
                                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 2.dp)) {
                                                    Box(modifier = Modifier.size(6.dp).background(WarningSunset, CircleShape))
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text("$maintenanceCount MAINT LOGS", color = WarningSunset, fontSize = 10.sp, fontWeight = FontWeight.Black)
                                                }
                                            }
                                        }
                                        Box(modifier = Modifier.weight(0.5f), contentAlignment = Alignment.Center) {
                                            Icon(Icons.AutoMirrored.Filled.OpenInNew, null, tint = BrandYellow, modifier = Modifier.size(18.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(modifier = Modifier.fillMaxWidth()) {
                            GradientButton(text = "VIEW SPREADSHEET", modifier = Modifier.weight(1f)) {
                                showSpreadsheetViewer = true
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            GradientButton(text = "EXPORT EXCEL", modifier = Modifier.weight(1f)) {
                                showExportTypeDialog = true
                            }
                        }
                    }

                    summary?.let { data ->
                        item {
                            Spacer(modifier = Modifier.height(32.dp))
                            Text("MISSION ANALYTICS COMMAND", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = BrandYellow, letterSpacing = 2.sp)
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                        
                        item {
                            Row(modifier = Modifier.fillMaxWidth()) {
                                MiniSummaryCard("WORKING DAYS", "${data.totalDays}", SuccessEmerald, Modifier.weight(1f))
                                Spacer(modifier = Modifier.width(12.dp))
                                MiniSummaryCard("BREAKDOWNS", "${data.breakdowns}", DangerCrimson, Modifier.weight(1f))
                            }
                        }
                        item {
                            Row(modifier = Modifier.fillMaxWidth().padding(top = 12.dp)) {
                                MiniSummaryCard("DAY SHIFTS", "${data.dayWorks}", BrandYellow, Modifier.weight(1f))
                                Spacer(modifier = Modifier.width(12.dp))
                                MiniSummaryCard("NIGHT SHIFTS", "${data.nightWorks}", BrandDark, Modifier.weight(1f))
                            }
                        }
                        item {
                            Row(modifier = Modifier.fillMaxWidth().padding(top = 12.dp)) {
                                MiniSummaryCard("SUNDAY WORK", "${data.sundays}", BrandIndigo, Modifier.weight(1f))
                                Spacer(modifier = Modifier.width(12.dp))
                                MiniSummaryCard("BILLING DAYS", "${data.billingDays}", SuccessEmerald, Modifier.weight(1f))
                            }
                        }
                        
                        item {
                            Spacer(modifier = Modifier.height(32.dp))
                            Text("OPERATOR PERFORMANCE LEADERBOARD", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        items(data.driverStats) { stat ->
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = androidx.compose.foundation.BorderStroke(1.dp, BrandLightGrey)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                        Text(stat.name, fontWeight = FontWeight.Black, color = BrandDark)
                                        Row {
                                            Text("${stat.uniqueDays} DAYS", fontWeight = FontWeight.Bold, color = BrandGrey, fontSize = 12.sp)
                                            if (stat.sundays > 0) {
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text("(${stat.sundays} SUNDAYS)", fontWeight = FontWeight.Black, color = SuccessEmerald, fontSize = 11.sp)
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        DriverStatChip("DAY: ${stat.dayShifts}", BrandYellow)
                                        DriverStatChip("NIGHT: ${stat.nightShifts}", BrandDark)
                                        if (stat.breakdowns > 0) {
                                            DriverStatChip("BREAKDOWN: ${stat.breakdowns}", DangerCrimson)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                "__REMOVED__" -> {
                    item {
                        Text("MONTHLY SUMMARY BREAKDOWN", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 2.sp)
                    }

                    if (groupedByMonth.isEmpty()) {
                        item {
                            UltraGlassCard {
                                Text("NO RECORDS FOUND FOR MONTHLY ANALYSIS.", color = TextHint, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                            }
                        }
                    } else {
                        groupedByMonth.forEach { (month, tripsInMonth) ->
                            val isExpanded = expandedMonth == month
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth().clickable { expandedMonth = if (isExpanded) null else month },
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    border = androidx.compose.foundation.BorderStroke(1.5.dp, BrandLightGrey)
                                ) {
                                    Column(modifier = Modifier.padding(18.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(month.uppercase(), fontWeight = FontWeight.Black, color = BrandDark, fontSize = 16.sp)
                                                Text("${tripsInMonth.size} Trips Deployed", color = TextHint, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                            Icon(
                                                imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                                contentDescription = null,
                                                tint = BrandYellow
                                            )
                                        }
                                        
                                        Spacer(modifier = Modifier.height(12.dp))
                                        
                                        val breakdowns = tripsInMonth.count { it.isBreakdown }
                                        val workingDays = tripsInMonth.map { it.startDate }.distinct().size
                                        val billingDays = workingDays - tripsInMonth.filter { it.isBreakdown }.map { it.startDate }.distinct().size
                                        val totalHmr = tripsInMonth.sumOf { it.getHmrWorked() }
                                        
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            DriverStatChip("BILLING: $billingDays DAYS", SuccessEmerald)
                                            DriverStatChip("BREAKDOWN: $breakdowns", DangerCrimson)
                                            DriverStatChip("HMR: ${String.format(Locale.US, "%.1f", totalHmr)} H", BrandBlue)
                                        }
                                        
                                        if (isExpanded) {
                                            Spacer(modifier = Modifier.height(16.dp))
                                            HorizontalDivider(color = BrandLightGrey)
                                            Spacer(modifier = Modifier.height(12.dp))
                                            
                                            tripsInMonth.forEach { trip ->
                                                val driver = drivers.firstOrNull { it.id == trip.driverId }?.name ?: "Unknown"
                                                val vehicle = vehicles.find { it.id == trip.vehicleId }?.number ?: "NO ASSET"
                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .clickable { selectedTrip = trip }
                                                        .padding(vertical = 8.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(trip.startDate, fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                                        Text("#${trip.id.uppercase()} • $driver", color = TextHint, fontSize = 10.sp)
                                                    }
                                                    Text(vehicle, fontWeight = FontWeight.Black, color = BrandBlue, fontSize = 12.sp)
                                                    Spacer(modifier = Modifier.width(12.dp))
                                                    Icon(Icons.AutoMirrored.Filled.OpenInNew, null, tint = BrandYellow, modifier = Modifier.size(14.dp))
                                                }
                                                HorizontalDivider(color = BrandLightGrey.copy(alpha = 0.5f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                            GradientButton(text = "EXPORT REPORT", modifier = Modifier.fillMaxWidth()) {
                                showDownloadDialog = true
                            }
                        }
                    }
                }
                "DRIVER-WISE" -> {
                    item {
                        Text("DRIVER SUMMARY BREAKDOWN", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 2.sp)
                    }

                    if (groupedByDriver.isEmpty()) {
                        item {
                            UltraGlassCard {
                                Text("NO RECORDS FOUND FOR DRIVER ANALYSIS.", color = TextHint, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                            }
                        }
                    } else {
                        groupedByDriver.forEach { (driverId, tripsForDriver) ->
                            val driverName = drivers.firstOrNull { it.id == driverId }?.name ?: "Unknown Operator"
                            val isExpanded = expandedDriver == driverId
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth().clickable { expandedDriver = if (isExpanded) null else driverId },
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    border = androidx.compose.foundation.BorderStroke(1.5.dp, BrandLightGrey)
                                ) {
                                    Column(modifier = Modifier.padding(18.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(driverName.uppercase(), fontWeight = FontWeight.Black, color = BrandDark, fontSize = 16.sp)
                                                Text("${tripsForDriver.size} Missions Completed", color = TextHint, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                            Icon(
                                                imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                                contentDescription = null,
                                                tint = BrandYellow
                                            )
                                        }
                                        
                                        Spacer(modifier = Modifier.height(12.dp))
                                        
                                        val breakdowns = tripsForDriver.count { it.isBreakdown }
                                        val workingDays = tripsForDriver.map { it.startDate }.distinct().size
                                        val billingDays = workingDays - tripsForDriver.filter { it.isBreakdown }.map { it.startDate }.distinct().size
                                        val totalHmr = tripsForDriver.sumOf { it.getHmrWorked() }
                                        
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            DriverStatChip("BILLING: $billingDays DAYS", SuccessEmerald)
                                            DriverStatChip("BREAKDOWN: $breakdowns", DangerCrimson)
                                            DriverStatChip("HMR: ${String.format(Locale.US, "%.1f", totalHmr)} H", BrandBlue)
                                        }
                                        
                                        if (isExpanded) {
                                            Spacer(modifier = Modifier.height(16.dp))
                                            HorizontalDivider(color = BrandLightGrey)
                                            Spacer(modifier = Modifier.height(12.dp))
                                            
                                            tripsForDriver.forEach { trip ->
                                                val vehicle = vehicles.find { it.id == trip.vehicleId }?.number ?: "NO ASSET"
                                                val sHmr = trip.getHmrStart()
                                                val eHmr = trip.getHmrEnd()
                                                val hmrWorked = trip.getHmrWorked()

                                                val sOdo = trip.startOdometer.toDoubleOrNull() ?: 0.0
                                                val eOdo = trip.endOdometer.toDoubleOrNull() ?: sOdo
                                                val kmDiff = if (eOdo >= sOdo) eOdo - sOdo else 0.0

                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .clickable { selectedTrip = trip }
                                                        .padding(vertical = 8.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(trip.startDate, fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                                        Text("#${trip.id.uppercase()} • ${trip.day} • ${trip.shift}", color = TextHint, fontSize = 10.sp)
                                                        Text("HMR: ${String.format(Locale.US, "%.1f", sHmr)} ➔ ${String.format(Locale.US, "%.1f", eHmr)} (${String.format(Locale.US, "%.1f", hmrWorked)} H)", color = BrandBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                    }
                                                    Column(horizontalAlignment = Alignment.End) {
                                                        Text(vehicle, fontWeight = FontWeight.Black, color = BrandDark, fontSize = 12.sp)
                                                        Text("${String.format(Locale.US, "%.0f", kmDiff)} KM", fontWeight = FontWeight.Bold, color = BrandGrey, fontSize = 11.sp)
                                                    }
                                                    Spacer(modifier = Modifier.width(12.dp))
                                                    Icon(Icons.AutoMirrored.Filled.OpenInNew, null, tint = BrandYellow, modifier = Modifier.size(14.dp))
                                                }
                                                HorizontalDivider(color = BrandLightGrey.copy(alpha = 0.5f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                            GradientButton(text = "EXPORT REPORT", modifier = Modifier.fillMaxWidth()) {
                                showDownloadDialog = true
                            }
                        }
                    }
                }
                "CAR-WISE" -> {
                    item {
                        Text("VEHICLE SUMMARY BREAKDOWN", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 2.sp)
                    }

                    if (groupedByVehicle.isEmpty()) {
                        item {
                            UltraGlassCard {
                                Text("NO RECORDS FOUND FOR VEHICLE ANALYSIS.", color = TextHint, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                            }
                        }
                    } else {
                        groupedByVehicle.forEach { (vehicleId, tripsForVehicle) ->
                            val vehicle = vehicles.find { it.id == vehicleId }
                            val vehiclePlate = vehicle?.number ?: "Unknown Asset"
                            val vehicleModel = vehicle?.model ?: "Unknown Model"
                            val isExpanded = expandedVehicle == vehicleId
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth().clickable { expandedVehicle = if (isExpanded) null else vehicleId },
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    border = androidx.compose.foundation.BorderStroke(1.5.dp, BrandLightGrey)
                                ) {
                                    Column(modifier = Modifier.padding(18.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(vehiclePlate.uppercase(), fontWeight = FontWeight.Black, color = BrandDark, fontSize = 16.sp)
                                                Text("$vehicleModel • ${tripsForVehicle.size} Missions Deployed", color = TextHint, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                            Icon(
                                                imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                                contentDescription = null,
                                                tint = BrandYellow
                                            )
                                        }
                                        
                                        Spacer(modifier = Modifier.height(12.dp))
                                        
                                        val breakdowns = tripsForVehicle.count { it.isBreakdown }
                                        val workingDays = tripsForVehicle.map { it.startDate }.distinct().size
                                        val billingDays = workingDays - tripsForVehicle.filter { it.isBreakdown }.map { it.startDate }.distinct().size
                                        val totalHmr = tripsForVehicle.sumOf { it.getHmrWorked() }
                                        val totalDistance = tripsForVehicle.sumOf {
                                            val s = it.startOdometer.toDoubleOrNull() ?: 0.0
                                            val e = it.endOdometer.toDoubleOrNull() ?: s
                                            if (e >= s) e - s else 0.0
                                        }
                                        
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            DriverStatChip("DISTANCE: ${String.format(Locale.US, "%.0f", totalDistance)} KM", SuccessEmerald)
                                            DriverStatChip("BREAKDOWN: $breakdowns", DangerCrimson)
                                            DriverStatChip("HMR: ${String.format(Locale.US, "%.1f", totalHmr)} H", BrandBlue)
                                        }
                                        
                                        if (isExpanded) {
                                            Spacer(modifier = Modifier.height(16.dp))
                                            HorizontalDivider(color = BrandLightGrey)
                                            Spacer(modifier = Modifier.height(12.dp))
                                            
                                            tripsForVehicle.forEach { trip ->
                                                val driver = drivers.firstOrNull { it.id == trip.driverId }?.name ?: "Unknown Operator"
                                                val sHmr = trip.getHmrStart()
                                                val eHmr = trip.getHmrEnd()
                                                val hmrWorked = trip.getHmrWorked()

                                                val sOdo = trip.startOdometer.toDoubleOrNull() ?: 0.0
                                                val eOdo = trip.endOdometer.toDoubleOrNull() ?: sOdo
                                                val diff = if (eOdo >= sOdo) eOdo - sOdo else 0.0

                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .clickable { selectedTrip = trip }
                                                        .padding(vertical = 8.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(trip.startDate, fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                                        Text("#${trip.id.uppercase()} • $driver • ${trip.day} • ${trip.shift}", color = TextHint, fontSize = 10.sp)
                                                        Text("HMR: ${String.format(Locale.US, "%.1f", sHmr)} ➔ ${String.format(Locale.US, "%.1f", eHmr)} (${String.format(Locale.US, "%.1f", hmrWorked)} H)", color = BrandBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                    }
                                                    Text("${String.format(Locale.US, "%.0f", diff)} KM", fontWeight = FontWeight.Black, color = BrandDark, fontSize = 12.sp)
                                                    Spacer(modifier = Modifier.width(12.dp))
                                                    Icon(Icons.AutoMirrored.Filled.OpenInNew, null, tint = BrandYellow, modifier = Modifier.size(14.dp))
                                                }
                                                HorizontalDivider(color = BrandLightGrey.copy(alpha = 0.5f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                            GradientButton(text = "EXPORT REPORT", modifier = Modifier.fillMaxWidth()) {
                                showDownloadDialog = true
                            }
                        }
                    }
                }
            }
        }
    }

    if (showDownloadDialog) {
        val availableMonths = remember(submittedTrips) {
            val months = mutableListOf("All Time")
            val dialogInputFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
            val dialogMonthFormat = SimpleDateFormat("MMMM yyyy", Locale.getDefault())
            submittedTrips.mapNotNull { trip ->
                try {
                    val date = dialogInputFormat.parse(trip.startDate)
                    if (date != null) dialogMonthFormat.format(date) else null
                } catch (e: Exception) {
                    null
                }
            }.distinct().forEach { months.add(it) }
            months
        }

        // Initialize selections if needed
        LaunchedEffect(showDownloadDialog) {
            if (selectedExportDriverId == null && drivers.isNotEmpty()) {
                selectedExportDriverId = drivers.first().id
            }
            if (selectedExportVehicleId == null && vehicles.isNotEmpty()) {
                selectedExportVehicleId = vehicles.first().id
            }
        }

        AlertDialog(
            onDismissRequest = { showDownloadDialog = false },
            title = {
                Text(
                    text = "EXPORT CONFIGURATION",
                    fontWeight = FontWeight.Black,
                    color = BrandDark
                )
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        "Configure the details of the report you wish to export to your device storage.",
                        style = MaterialTheme.typography.bodySmall,
                        color = BrandGrey
                    )

                    // 1. Report Type Dropdown
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = exportReportType,
                            onValueChange = {},
                            readOnly = true,
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Report Type", fontWeight = FontWeight.Bold, color = TextHint) },
                            trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandYellow,
                                unfocusedBorderColor = Color.Black.copy(alpha = 0.1f)
                            )
                        )
                        Box(modifier = Modifier.matchParentSize().clickable { reportTypeDropdownExpanded = true })
                        DropdownMenu(
                            expanded = reportTypeDropdownExpanded,
                            onDismissRequest = { reportTypeDropdownExpanded = false }
                        ) {
                            listOf("Total Report", "Driver-wise Report", "Car-wise Report").forEach { type ->
                                DropdownMenuItem(
                                    text = { Text(type, fontWeight = FontWeight.Black) },
                                    onClick = {
                                        exportReportType = type
                                        reportTypeDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // 2. Driver Selection (if Driver-wise)
                    if (exportReportType == "Driver-wise Report") {
                        Box(modifier = Modifier.fillMaxWidth()) {
                            val currentDriver = drivers.find { it.id == selectedExportDriverId }
                            val driverLabel = currentDriver?.let { "${it.name} (${it.id})" } ?: "Select Driver"
                            OutlinedTextField(
                                value = driverLabel,
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth(),
                                label = { Text("Select Driver", fontWeight = FontWeight.Bold, color = TextHint) },
                                trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                                shape = RoundedCornerShape(16.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = BrandYellow,
                                    unfocusedBorderColor = Color.Black.copy(alpha = 0.1f)
                                )
                            )
                            Box(modifier = Modifier.matchParentSize().clickable { driverDropdownExpanded = true })
                            DropdownMenu(
                                expanded = driverDropdownExpanded,
                                onDismissRequest = { driverDropdownExpanded = false }
                            ) {
                                drivers.forEach { driver ->
                                    DropdownMenuItem(
                                        text = { Text("${driver.name} (${driver.id})", fontWeight = FontWeight.Black) },
                                        onClick = {
                                            selectedExportDriverId = driver.id
                                            driverDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // 3. Vehicle Selection (if Car-wise)
                    if (exportReportType == "Car-wise Report") {
                        Box(modifier = Modifier.fillMaxWidth()) {
                            val currentVehicle = vehicles.find { it.id == selectedExportVehicleId }
                            val vehicleLabel = currentVehicle?.let { "${it.number} (${it.model})" } ?: "Select Car"
                            OutlinedTextField(
                                value = vehicleLabel,
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth(),
                                label = { Text("Select Car / Vehicle", fontWeight = FontWeight.Bold, color = TextHint) },
                                trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                                shape = RoundedCornerShape(16.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = BrandYellow,
                                    unfocusedBorderColor = Color.Black.copy(alpha = 0.1f)
                                )
                            )
                            Box(modifier = Modifier.matchParentSize().clickable { vehicleDropdownExpanded = true })
                            DropdownMenu(
                                expanded = vehicleDropdownExpanded,
                                onDismissRequest = { vehicleDropdownExpanded = false }
                            ) {
                                vehicles.forEach { vehicle ->
                                    DropdownMenuItem(
                                        text = { Text("${vehicle.number} - ${vehicle.model}", fontWeight = FontWeight.Black) },
                                        onClick = {
                                            selectedExportVehicleId = vehicle.id
                                            vehicleDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // 5. Time Period Selection
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = exportPeriod,
                            onValueChange = {},
                            readOnly = true,
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Time Period / Month", fontWeight = FontWeight.Bold, color = TextHint) },
                            trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandYellow,
                                unfocusedBorderColor = Color.Black.copy(alpha = 0.1f)
                            )
                        )
                        Box(modifier = Modifier.matchParentSize().clickable { periodDropdownExpanded = true })
                        DropdownMenu(
                            expanded = periodDropdownExpanded,
                            onDismissRequest = { periodDropdownExpanded = false }
                        ) {
                            availableMonths.forEach { period ->
                                DropdownMenuItem(
                                    text = { Text(period, fontWeight = FontWeight.Black) },
                                    onClick = {
                                        exportPeriod = period
                                        periodDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    showDownloadDialog = false
                    val fileUri = when (exportReportType) {
                        "Total Report" -> ExportUtils.exportCustomReport(
                            context = context,
                            trips = submittedTrips,
                            drivers = drivers,
                            vehicles = vehicles,
                            selectedDriverId = null,
                            selectedVehicleId = null,
                            monthFilter = exportPeriod
                        )
                        "Driver-wise Report" -> ExportUtils.exportCustomReport(
                            context = context,
                            trips = submittedTrips,
                            drivers = drivers,
                            vehicles = vehicles,
                            selectedDriverId = selectedExportDriverId,
                            selectedVehicleId = null,
                            monthFilter = exportPeriod
                        )
                        else -> ExportUtils.exportCustomReport(
                            context = context,
                            trips = submittedTrips,
                            drivers = drivers,
                            vehicles = vehicles,
                            selectedDriverId = null,
                            selectedVehicleId = selectedExportVehicleId,
                            monthFilter = exportPeriod
                        )
                    }
                    fileUri?.let { ExportUtils.openInSpreadsheetApp(context, it) }
                }) {
                    Text("EXPORT", fontWeight = FontWeight.Black, color = BrandYellow)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDownloadDialog = false }) {
                    Text("CANCEL", fontWeight = FontWeight.Bold, color = BrandGrey)
                }
            },
            containerColor = Color.White,
            shape = RoundedCornerShape(28.dp)
        )
    }

    if (showSpreadsheetViewer) {
        SpreadsheetViewerDialog(
            trips = filteredTrips,
            maintenance = submittedMaintenance,
            drivers = drivers,
            vehicles = vehicles,
            summary = summary,
            onDismiss = { showSpreadsheetViewer = false }
        )
    }
}

@Composable
fun SpreadsheetViewerDialog(
    trips: List<TripEntry>,
    maintenance: List<com.vehicletrackingapp.data.model.MaintenanceRecord>,
    drivers: List<com.vehicletrackingapp.data.model.Driver>,
    vehicles: List<com.vehicletrackingapp.data.model.Vehicle>,
    summary: MonthlySummaryData?,
    onDismiss: () -> Unit
) {
    var activeTab by remember { mutableStateOf(0) }
    val tabs = listOf("MISSION TRAVEL LOGS", "OPERATOR PERFORMANCE")

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("CLOSE", fontWeight = FontWeight.Black, color = BrandDark)
            }
        },
        modifier = Modifier.fillMaxWidth().padding(8.dp),
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
        title = {
            Column {
                Text("SPREADSHEET VIEW", style = MaterialTheme.typography.labelSmall, color = BrandYellow, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
                Spacer(modifier = Modifier.height(8.dp))
                TabRow(
                    selectedTabIndex = activeTab,
                    containerColor = Color.Transparent,
                    contentColor = BrandDark,
                    indicator = { tabPositions ->
                        TabRowDefaults.Indicator(
                            Modifier.tabIndicatorOffset(tabPositions[activeTab]),
                            color = BrandYellow
                        )
                    }
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = activeTab == index,
                            onClick = { activeTab = index },
                            text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 12.sp) }
                        )
                    }
                }
            }
        },
        text = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(450.dp)
                    .border(1.dp, BrandLightGrey, RoundedCornerShape(12.dp))
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White)
            ) {
                if (activeTab == 0) {
                    val horizontalScrollState = rememberScrollState()
                    Column(modifier = Modifier.fillMaxSize()) {
                        Row(
                            modifier = Modifier
                                .background(BrandDark)
                                .horizontalScroll(horizontalScrollState)
                                .padding(vertical = 12.dp)
                        ) {
                            SheetHeaderCell("DATE", 100.dp)
                            SheetHeaderCell("DAY", 100.dp)
                            SheetHeaderCell("SHIFT", 80.dp)
                            SheetHeaderCell("OPERATOR", 140.dp)
                            SheetHeaderCell("VEHICLE", 120.dp)
                            SheetHeaderCell("START KM", 100.dp)
                            SheetHeaderCell("END KM", 100.dp)
                            SheetHeaderCell("START HMR", 100.dp)
                            SheetHeaderCell("END HMR", 100.dp)
                            SheetHeaderCell("HMR WORKED", 110.dp)
                            SheetHeaderCell("STATUS", 110.dp)
                            SheetHeaderCell("MAINTENANCE DETAILS", 250.dp)
                        }

                        LazyColumn(modifier = Modifier.fillMaxSize()) {
                            itemsIndexed(trips) { index, trip ->
                                val driver = drivers.find { it.id == trip.driverId }?.name ?: "Unknown"
                                val vehicle = vehicles.find { it.id == trip.vehicleId }?.number ?: "Unknown"
                                val workingStatus = if (trip.isBreakdown) "BREAKDOWN" else "YES"

                                val sHmr = trip.getHmrStart()
                                val eHmr = trip.getHmrEnd()
                                val hmrWorked = String.format(Locale.US, "%.1f", trip.getHmrWorked())

                                val relatedMaint = maintenance.filter { it.tripId == trip.id }
                                val maintDetails = if (relatedMaint.isEmpty()) "None" else {
                                    relatedMaint.joinToString(" | ") { m ->
                                        "${m.maintenanceType}: INR ${m.cost} (${m.description})"
                                    }
                                }

                                val bgColor = if (index % 2 == 0) Color.White else BrandLightGrey.copy(alpha = 0.3f)

                                Row(
                                    modifier = Modifier
                                        .background(bgColor)
                                        .horizontalScroll(horizontalScrollState)
                                        .padding(vertical = 10.dp)
                                ) {
                                    SheetDataCell(trip.startDate, 100.dp)
                                    SheetDataCell(trip.day, 100.dp)
                                    SheetDataCell(trip.shift, 80.dp)
                                    SheetDataCell(driver, 140.dp)
                                    SheetDataCell(vehicle, 120.dp)
                                    SheetDataCell(trip.startOdometer, 100.dp)
                                    SheetDataCell(trip.endOdometer, 100.dp)
                                    SheetDataCell(String.format(Locale.US, "%.1f", sHmr), 100.dp)
                                    SheetDataCell(String.format(Locale.US, "%.1f", eHmr), 100.dp)
                                    SheetDataCell(hmrWorked, 110.dp)
                                    SheetDataCell(
                                        workingStatus, 
                                        110.dp, 
                                        textColor = if (trip.isBreakdown) DangerCrimson else SuccessEmerald
                                    )
                                    SheetDataCell(maintDetails, 250.dp)
                                }
                            }
                        }
                    }
                } else {
                    val horizontalScrollState = rememberScrollState()
                    Column(modifier = Modifier.fillMaxSize()) {
                        Row(
                            modifier = Modifier
                                .background(BrandDark)
                                .horizontalScroll(horizontalScrollState)
                                .padding(vertical = 12.dp)
                        ) {
                            SheetHeaderCell("OPERATOR NAME", 160.dp)
                            SheetHeaderCell("TOTAL MISSIONS", 120.dp)
                            SheetHeaderCell("WORKING DAYS", 120.dp)
                            SheetHeaderCell("DAY SHIFTS", 100.dp)
                            SheetHeaderCell("NIGHT SHIFTS", 100.dp)
                            SheetHeaderCell("SUNDAY SESSIONS", 130.dp)
                            SheetHeaderCell("BREAKDOWNS", 120.dp)
                            SheetHeaderCell("BILLING DAYS", 120.dp)
                        }

                        val driverStats = summary?.driverStats ?: emptyList()
                        LazyColumn(modifier = Modifier.fillMaxSize()) {
                            itemsIndexed(driverStats) { index, stat ->
                                val bgColor = if (index % 2 == 0) Color.White else BrandLightGrey.copy(alpha = 0.3f)

                                Row(
                                    modifier = Modifier
                                        .background(bgColor)
                                        .horizontalScroll(horizontalScrollState)
                                        .padding(vertical = 10.dp)
                                ) {
                                    SheetDataCell(stat.name, 160.dp)
                                    SheetDataCell("${stat.totalMissions}", 120.dp)
                                    SheetDataCell("${stat.uniqueDays}", 120.dp)
                                    SheetDataCell("${stat.dayShifts}", 100.dp)
                                    SheetDataCell("${stat.nightShifts}", 100.dp)
                                    SheetDataCell("${stat.sundays}", 130.dp)
                                    SheetDataCell("${stat.breakdowns}", 120.dp, textColor = if (stat.breakdowns > 0) DangerCrimson else BrandDark)
                                    SheetDataCell("${stat.billingDays}", 120.dp, textColor = SuccessEmerald)
                                }
                            }
                        }
                    }
                }
            }
        },
        containerColor = Color.White,
        shape = RoundedCornerShape(24.dp)
    )
}

@Composable
fun SheetHeaderCell(text: String, width: androidx.compose.ui.unit.Dp) {
    Box(
        modifier = Modifier
            .width(width)
            .padding(horizontal = 8.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        Text(
            text = text,
            fontWeight = FontWeight.Black,
            color = BrandYellow,
            fontSize = 11.sp
        )
    }
}

@Composable
fun SheetDataCell(
    text: String,
    width: androidx.compose.ui.unit.Dp,
    textColor: Color = BrandDark
) {
    Box(
        modifier = Modifier
            .width(width)
            .padding(horizontal = 8.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        Text(
            text = text,
            fontWeight = FontWeight.Bold,
            color = textColor,
            fontSize = 12.sp,
            maxLines = 1,
            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
        )
    }
}

@Composable
fun DriverStatChip(label: String, color: Color) {
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .border(1.dp, color.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(label, color = color, fontSize = 9.sp, fontWeight = FontWeight.Black)
    }
}

data class MonthlySummaryData(
    val totalDays: Int,
    val breakdowns: Int,
    val nightWorks: Int,
    val dayWorks: Int,
    val sundays: Int,
    val billingDays: Int,
    val driverStats: List<DriverReport>
)

data class DriverReport(
    val name: String,
    val totalMissions: Int,
    val uniqueDays: Int,
    val dayShifts: Int,
    val nightShifts: Int,
    val sundays: Int,
    val breakdowns: Int,
    val billingDays: Int
)

@Composable
fun MiniSummaryCard(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.08f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.15f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = color)
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = BrandDark)
        }
    }
}

@Composable
fun ReportDetailDialog(
    trip: TripEntry,
    maintenance: List<com.vehicletrackingapp.data.model.MaintenanceRecord>,
    driver: com.vehicletrackingapp.data.model.Driver?,
    vehicle: com.vehicletrackingapp.data.model.Vehicle?,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("CLOSE DOSSIER", fontWeight = FontWeight.Black, color = BrandDark) }
        },
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
        title = {
            Column {
                Text("MISSION INTELLIGENCE", style = MaterialTheme.typography.labelSmall, color = BrandYellow, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
                Text("#${trip.id.uppercase()}", fontWeight = FontWeight.Black, color = BrandDark, fontSize = 28.sp)
            }
        },
        text = {
            LazyColumn(modifier = Modifier.fillMaxWidth()) {
                item {
                    // Operator Stats
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = BrandLightGrey)
                    ) {
                        Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(64.dp).clip(CircleShape).background(BrandYellow), contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Person, null, tint = BrandDark, modifier = Modifier.size(32.dp))
                            }
                            Spacer(modifier = Modifier.width(20.dp))
                            Column {
                                Text(driver?.name ?: "UNKNOWN OPERATOR", fontWeight = FontWeight.Black, fontSize = 20.sp, color = BrandDark)
                                Text("${trip.day} • ${trip.shift}", fontSize = 12.sp, color = BrandGrey, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // Fleet Asset Info
                    Text("DEPLOYED ASSET", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("${vehicle?.number} — ${vehicle?.model}", fontWeight = FontWeight.Black, color = BrandDark, fontSize = 18.sp, modifier = Modifier.weight(1f))
                        if (trip.isBreakdown) {
                            Box(modifier = Modifier.background(DangerCrimson.copy(alpha = 0.1f), CircleShape).padding(horizontal = 12.dp, vertical = 4.dp)) {
                                Text("BREAKDOWN", color = DangerCrimson, fontWeight = FontWeight.Black, fontSize = 10.sp)
                            }
                        } else {
                            Box(modifier = Modifier.background(SuccessEmerald.copy(alpha = 0.1f), CircleShape).padding(horizontal = 12.dp, vertical = 4.dp)) {
                                Text("WORKING", color = SuccessEmerald, fontWeight = FontWeight.Black, fontSize = 10.sp)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(20.dp))

                    // Trip Data Log Details
                    Text("TRIP LOG DETAILS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                    Spacer(modifier = Modifier.height(8.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = BrandLightGrey)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("START TRIP", style = MaterialTheme.typography.labelSmall, color = TextHint, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Date: ${trip.startDate.ifBlank { "N/A" }}", fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                    Text("Time: ${trip.startTime.ifBlank { "N/A" }}", fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                    Text("Odometer: ${trip.startOdometer.ifBlank { "0" }} KM", fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                    Text("HMR: ${String.format(Locale.US, "%.1f", trip.getHmrStart())}", fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                }
                                Box(modifier = Modifier.width(1.dp).height(90.dp).background(Color.Black.copy(alpha = 0.05f)))
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("END TRIP", style = MaterialTheme.typography.labelSmall, color = TextHint, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Date: ${trip.endDate.ifBlank { "N/A" }}", fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                    Text("Time: ${trip.endTime.ifBlank { "N/A" }}", fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                    Text("Odometer: ${trip.endOdometer.ifBlank { "0" }} KM", fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                    Text("HMR: ${String.format(Locale.US, "%.1f", trip.getHmrEnd())}", fontWeight = FontWeight.Bold, color = BrandDark, fontSize = 12.sp)
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            HorizontalDivider(color = Color.Black.copy(alpha = 0.05f))
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("FUEL LEVEL", style = MaterialTheme.typography.labelSmall, color = TextHint, fontWeight = FontWeight.Bold)
                                    Text(trip.fuelLevel.ifBlank { "N/A" }, fontWeight = FontWeight.Black, color = BrandDark, fontSize = 14.sp)
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("TRIP PURPOSE", style = MaterialTheme.typography.labelSmall, color = TextHint, fontWeight = FontWeight.Bold)
                                    Text(trip.tripPurpose.ifBlank { "N/A" }, fontWeight = FontWeight.Black, color = BrandDark, fontSize = 14.sp)
                                }
                            }
                            if (trip.notes.isNotBlank()) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Text("MISSION NOTES", style = MaterialTheme.typography.labelSmall, color = TextHint, fontWeight = FontWeight.Bold)
                                Text(trip.notes, style = MaterialTheme.typography.bodySmall, color = BrandDark)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(24.dp))

                    // Verification Photos
                    Text("OPERATIONAL EVIDENCE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth()) {
                        EvidenceCard(label = "START ODOMETER", uri = trip.startOdometerPhotoUri, modifier = Modifier.weight(1f))
                        Spacer(modifier = Modifier.width(12.dp))
                        EvidenceCard(label = "END ODOMETER", uri = trip.endOdometerPhotoUri, modifier = Modifier.weight(1f))
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    val scope = rememberCoroutineScope()
                    val sheetImageUri = trip.sheetPhotoUri?.let { Uri.parse(it) }
                    
                    CameraGalleryPicker(
                        label = "END TRIP SHEET PHOTO",
                        imageUri = sheetImageUri,
                        onImageSelected = { uri ->
                            scope.launch {
                                val updatedTrip = trip.copy(sheetPhotoUri = uri.toString())
                                AppRepository.upsertTrip(updatedTrip)
                            }
                        }
                    )
                    
                    if (maintenance.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(32.dp))
                        Text("MAINTENANCE & EXPENSE INTELLIGENCE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = WarningSunset)
                        maintenance.forEach { main ->
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = WarningSunset.copy(alpha = 0.05f)),
                                border = androidx.compose.foundation.BorderStroke(1.dp, WarningSunset.copy(alpha = 0.15f))
                            ) {
                                Column(modifier = Modifier.padding(20.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Build, null, tint = WarningSunset, modifier = Modifier.size(20.dp))
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Text(main.maintenanceType.uppercase(), fontWeight = FontWeight.Black, color = WarningSunset, fontSize = 16.sp)
                                    }
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text("VALUATION: INR ${main.cost}", fontWeight = FontWeight.Black, fontSize = 22.sp, color = BrandDark)
                                    Text(main.description, fontSize = 14.sp, color = BrandGrey, modifier = Modifier.padding(top = 4.dp))
                                    Spacer(modifier = Modifier.height(16.dp))
                                    EvidenceCard(label = "INVOICE PROOF", uri = main.billImageUri, modifier = Modifier.fillMaxWidth().height(200.dp))
                                }
                            }
                        }
                    }
                }
            }
        },
        containerColor = Color.White,
        shape = RoundedCornerShape(32.dp)
    )
}

@Composable
fun EvidenceCard(label: String, uri: String?, modifier: Modifier = Modifier) {
    var showFullscreen by remember { mutableStateOf(false) }
    val imageUri = uri?.let { Uri.parse(it) }

    Column(modifier = modifier) {
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Black, color = TextHint)
        Spacer(modifier = Modifier.height(6.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .clip(RoundedCornerShape(18.dp))
                .border(2.dp, BrandLightGrey, RoundedCornerShape(18.dp))
                .clickable(enabled = imageUri != null) { showFullscreen = true }
        ) {
            if (imageUri != null) {
                AsyncImage(
                    model = coil.request.ImageRequest.Builder(LocalContext.current)
                        .data(com.vehicletrackingapp.util.ImageWatermarkUtils.parseImageModel(uri))
                        .memoryCachePolicy(coil.request.CachePolicy.DISABLED)
                        .diskCachePolicy(coil.request.CachePolicy.DISABLED)
                        .build(),
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                // Tap hint overlay
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth()
                        .background(
                            androidx.compose.ui.graphics.Brush.verticalGradient(
                                colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.5f))
                            )
                        )
                        .padding(vertical = 6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "TAP TO VIEW FULL SCREEN",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = 1.sp
                    )
                }
            } else {
                Box(
                    modifier = Modifier.fillMaxSize().background(BrandLightGrey),
                    contentAlignment = Alignment.Center
                ) {
                    Text("NO PHOTO", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextHint)
                }
            }
        }
    }

    if (showFullscreen && imageUri != null) {
        FullscreenImageViewer(imageUri = imageUri, onDismiss = { showFullscreen = false })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExcelReportSelectionDialog(
    trips: List<TripEntry>,
    maintenance: List<MaintenanceRecord>,
    drivers: List<Driver>,
    vehicles: List<Vehicle>,
    months: List<String>,
    onDismiss: () -> Unit,
    onExport: (reportType: String, selectedDriverId: String?, selectedVehicleId: String?, selectedMonth: String?) -> Unit
) {
    var selectedType by remember { mutableStateOf("ALL") }
    
    var selectedDriverId by remember { mutableStateOf<String?>(null) }
    var selectedVehicleId by remember { mutableStateOf<String?>(null) }
    var selectedMonth by remember { mutableStateOf<String?>(null) }
    
    var driverDropdownExpanded by remember { mutableStateOf(false) }
    var vehicleDropdownExpanded by remember { mutableStateOf(false) }
    var monthDropdownExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(24.dp),
        containerColor = Color.White,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(SuccessEmerald.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.TableChart, contentDescription = null, tint = SuccessEmerald, modifier = Modifier.size(22.dp))
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("Export Excel Report", fontWeight = FontWeight.Black, fontSize = 18.sp, color = BrandDark)
                    Text("Select type of report to download", color = TextHint, fontSize = 12.sp)
                }
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Spacer(modifier = Modifier.height(4.dp))
                
                val options = listOf(
                    Triple("ALL", "📊 Full Report", "Complete readings for all vehicles & operators"),
                    Triple("DRIVER", "👤 Driver Report", "Filter readings by specific driver or all drivers"),
                    Triple("VEHICLE", "🚗 Vehicle Report", "Filter readings by specific vehicle or all vehicles")
                )

                options.forEach { (typeKey, title, subtitle) ->
                    val isSelected = selectedType == typeKey
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clickable { selectedType = typeKey },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) BrandYellow.copy(alpha = 0.15f) else BrandLightGrey.copy(alpha = 0.3f)
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            width = if (isSelected) 2.dp else 1.dp,
                            color = if (isSelected) BrandYellow else BrandLightGrey
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { selectedType = typeKey },
                                colors = RadioButtonDefaults.colors(selectedColor = BrandDark)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(title, fontWeight = FontWeight.Black, fontSize = 14.sp, color = BrandDark)
                                Text(subtitle, fontSize = 11.sp, color = TextHint, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }

                if (selectedType == "DRIVER") {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Select Operator / Driver:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = BrandDark)
                    Spacer(modifier = Modifier.height(4.dp))
                    ExposedDropdownMenuBox(
                        expanded = driverDropdownExpanded,
                        onExpandedChange = { driverDropdownExpanded = !driverDropdownExpanded }
                    ) {
                        val selDriverName = drivers.find { it.id == selectedDriverId }?.name ?: "All Drivers"
                        OutlinedTextField(
                            value = selDriverName,
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = driverDropdownExpanded) },
                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = driverDropdownExpanded,
                            onDismissRequest = { driverDropdownExpanded = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("All Drivers", fontWeight = FontWeight.Bold) },
                                onClick = { selectedDriverId = null; driverDropdownExpanded = false }
                            )
                            drivers.forEach { drv ->
                                DropdownMenuItem(
                                    text = { Text(drv.name) },
                                    onClick = { selectedDriverId = drv.id; driverDropdownExpanded = false }
                                )
                            }
                        }
                    }
                }

                if (selectedType == "VEHICLE") {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Select Vehicle / Asset:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = BrandDark)
                    Spacer(modifier = Modifier.height(4.dp))
                    ExposedDropdownMenuBox(
                        expanded = vehicleDropdownExpanded,
                        onExpandedChange = { vehicleDropdownExpanded = !vehicleDropdownExpanded }
                    ) {
                        val selVehicleNo = vehicles.find { it.id == selectedVehicleId }?.number ?: "All Vehicles"
                        OutlinedTextField(
                            value = selVehicleNo,
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = vehicleDropdownExpanded) },
                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = vehicleDropdownExpanded,
                            onDismissRequest = { vehicleDropdownExpanded = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("All Vehicles", fontWeight = FontWeight.Bold) },
                                onClick = { selectedVehicleId = null; vehicleDropdownExpanded = false }
                            )
                            vehicles.forEach { v ->
                                DropdownMenuItem(
                                    text = { Text("${v.number} (${v.model})") },
                                    onClick = { selectedVehicleId = v.id; vehicleDropdownExpanded = false }
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onExport(selectedType, selectedDriverId, selectedVehicleId, selectedMonth)
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(containerColor = SuccessEmerald),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Download, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("EXPORT EXCEL", fontWeight = FontWeight.Black, color = Color.White)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("CANCEL", fontWeight = FontWeight.Bold, color = BrandGrey)
            }
        }
    )
}
