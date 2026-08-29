package com.vehicletrackingapp.ui.screens.driver

import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.model.MaintenanceRecord
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.util.PickerUtils
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import com.vehicletrackingapp.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MaintenanceTab(driverId: String) {
    val draftTrip by AppRepository.getDraftTrip(driverId).collectAsState(initial = null)
    val draftMainFlow = AppRepository.getDraftMaintenance(driverId).collectAsState(initial = null)
    val isLocked = draftMainFlow.value?.status == "submitted"
    val vehicles by AppRepository.getAllVehicles().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    var selectedTabIndex by remember { mutableStateOf(0) }

    var recordId by remember { mutableStateOf("") }
    
    // Form fields
    var selectedType by remember { mutableStateOf("") }
    var customType by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }
    var time by remember { mutableStateOf("") }
    var cost by remember { mutableStateOf("") }
    var billUri by remember { mutableStateOf<Uri?>(null) }
    var saved by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    
    var typeMenuExpanded by remember { mutableStateOf(false) }
    var isInitialized by remember { mutableStateOf(false) }

    var selectedVehicleId by remember { mutableStateOf<String?>(null) }
    var vehicleMenuExpanded by remember { mutableStateOf(false) }

    // Live update for system date/time
    LaunchedEffect(isLocked, saved, isInitialized) {
        if (!isInitialized) return@LaunchedEffect
        val sdfD = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        val sdfT = SimpleDateFormat("hh:mm a", Locale.getDefault())
        
        while (!isLocked && !saved) {
            val now = Date()
            date = sdfD.format(now)
            time = sdfT.format(now)
            delay(1000)
        }
    }

    fun resetForm() {
        recordId = AppRepository.newId()
        selectedType = if (selectedTabIndex == 0) "Breakdown" else if (selectedTabIndex == 1) "Diesel" else "Service"
        customType = ""
        description = ""
        cost = ""
        billUri = null
        error = null
        saved = false
    }

    val linkedVehicleId = draftTrip?.vehicleId
    val effectiveVehicleId = selectedVehicleId ?: linkedVehicleId
    val vehicle = effectiveVehicleId?.let { id -> vehicles.find { it.id == id } }

    fun persistDraft() {
        if (isLocked) return
        scope.launch {
            if (vehicle == null) return@launch
            val finalType = when (selectedTabIndex) {
                0 -> "Breakdown"
                1 -> selectedType
                else -> if (selectedType == "Other") customType else selectedType
            }
            val record = MaintenanceRecord(
                id = recordId, vehicleId = vehicle.id, driverId = driverId,
                tripId = draftTrip?.id,
                maintenanceType = finalType, description = description,
                date = date, time = time, cost = if (selectedTabIndex == 0) "0" else cost,
                billImageUri = billUri?.toString(), status = "draft",
                isBreakdownReport = selectedTabIndex == 0
            )
            AppRepository.upsertMaintenance(record)
        }
    }

    // Switch tab defaults
    LaunchedEffect(selectedTabIndex) {
        if (!isInitialized) return@LaunchedEffect
        if (selectedTabIndex == 0) {
            selectedType = "Breakdown"
        } else if (selectedTabIndex == 1) {
            selectedType = "Diesel"
        } else {
            selectedType = "Service"
        }
        persistDraft()
    }

    LaunchedEffect(draftMainFlow.value) {
        val draft = draftMainFlow.value
        if (draft != null && !isInitialized) {
            recordId = draft.id
            selectedType = draft.maintenanceType
            if (draft.isBreakdownReport) {
                selectedTabIndex = 0
            } else if (draft.maintenanceType == "Petrol" || draft.maintenanceType == "Diesel" || draft.maintenanceType == "CNG") {
                selectedTabIndex = 1
            } else {
                selectedTabIndex = 2
                if (draft.maintenanceType != "Battery" && draft.maintenanceType != "Wheel" && draft.maintenanceType != "Service") {
                    selectedType = "Other"
                    customType = draft.maintenanceType
                }
            }
            description = draft.description
            date = draft.date
            time = draft.time
            cost = draft.cost
            billUri = draft.billImageUri?.let { Uri.parse(it) }
            selectedVehicleId = draft.vehicleId
            isInitialized = true
        } else if (draft == null && !isInitialized) {
            recordId = AppRepository.newId()
            selectedType = "Breakdown"
            isInitialized = true
        }
    }


    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        SectionTitle("MAINTENANCE DEPLOYMENT")
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(16.dp))
        
        if (isLocked) {
            Box(modifier = Modifier.fillMaxWidth().background(SuccessEmerald.copy(alpha = 0.1f), RoundedCornerShape(12.dp)).padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Verified, null, tint = SuccessEmerald, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("RECORD SECURED: Data transmitted to Administration.", color = SuccessEmerald, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // Auto-Asset / Selection Card
        StaggeredItem(visible, 0) {
            UltraGlassCard(glowColor = BrandYellow) {
                Text("SERVICE ASSET IDENTIFICATION", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 1.sp)
                Spacer(modifier = Modifier.height(16.dp))
                
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = vehicle?.let { "${it.number} (${it.model})" } ?: "SELECT VEHICLE",
                        onValueChange = {},
                        readOnly = true,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Active Fleet Asset", fontWeight = FontWeight.Bold) },
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                        shape = RoundedCornerShape(20.dp),
                        enabled = !isLocked,
                        colors = OutlinedTextFieldDefaults.colors(disabledTextColor = if (isLocked) BrandGrey else BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint)
                    )
                    if (!isLocked) {
                        Box(modifier = Modifier.matchParentSize().background(Color.Transparent).clickable { vehicleMenuExpanded = true })
                        DropdownMenu(expanded = vehicleMenuExpanded, onDismissRequest = { vehicleMenuExpanded = false }) {
                            vehicles.forEach { v ->
                                DropdownMenuItem(
                                    text = { Text("${v.number} - ${v.model}", fontWeight = FontWeight.Black) },
                                    onClick = {
                                        selectedVehicleId = v.id
                                        vehicleMenuExpanded = false
                                        persistDraft()
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Premium Navigation Segment Tabs Row
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = Color.Transparent,
            contentColor = BrandYellow,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                    color = if (selectedTabIndex == 0) DangerCrimson else BrandYellow
                )
            },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
        ) {
            Tab(
                selected = selectedTabIndex == 0,
                onClick = { if (!isLocked) selectedTabIndex = 0 },
                text = { Text("BREAKDOWN", fontWeight = FontWeight.Black, fontSize = 11.sp) },
                icon = { Icon(Icons.Default.ReportProblem, null, tint = if (selectedTabIndex == 0) DangerCrimson else BrandGrey) }
            )
            Tab(
                selected = selectedTabIndex == 1,
                onClick = { if (!isLocked) selectedTabIndex = 1 },
                text = { Text("FUEL", fontWeight = FontWeight.Black, fontSize = 11.sp) },
                icon = { Icon(Icons.Default.LocalGasStation, null, tint = if (selectedTabIndex == 1) BrandYellow else BrandGrey) }
            )
            Tab(
                selected = selectedTabIndex == 2,
                onClick = { if (!isLocked) selectedTabIndex = 2 },
                text = { Text("SERVICE", fontWeight = FontWeight.Black, fontSize = 11.sp) },
                icon = { Icon(Icons.Default.Build, null, tint = if (selectedTabIndex == 2) BrandYellow else BrandGrey) }
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        when (selectedTabIndex) {
            0 -> {
                // Section 1: Breakdown Form
                StaggeredItem(visible, 2) {
                    UltraGlassCard(glowColor = DangerCrimson) {
                        Text("BREAKDOWN REPORT DETAILS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = DangerCrimson, letterSpacing = 1.5.sp)
                        Spacer(modifier = Modifier.height(20.dp))
                        
                        Row(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = if (date.isBlank()) "PENDING..." else date, 
                                onValueChange = {}, readOnly = true, enabled = false,
                                label = { Text("Event Date", color = TextHint) },
                                colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                                modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(16.dp),
                                leadingIcon = { Icon(Icons.Default.CalendarToday, null, tint = DangerCrimson) }
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            OutlinedTextField(
                                value = if (time.isBlank()) "PENDING..." else time, 
                                onValueChange = {}, readOnly = true, enabled = false,
                                label = { Text("Event Time", color = TextHint) },
                                colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                                modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(16.dp),
                                leadingIcon = { Icon(Icons.Default.Schedule, null, tint = DangerCrimson) }
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        EliteTextField(value = description, onValueChange = { description = it; persistDraft() }, label = "Breakdown Reason / Situation", leadingIcon = Icons.Default.Warning, enabled = !isLocked)
                    }
                }
            }
            1 -> {
                // Section 2: Fuel Form
                StaggeredItem(visible, 2) {
                    UltraGlassCard {
                        Text("FUEL PURCHASE DETAILS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 1.5.sp)
                        Spacer(modifier = Modifier.height(20.dp))

                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = selectedType.ifBlank { "SELECT FUEL TYPE" },
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth(),
                                label = { Text("Fuel Classification", fontWeight = FontWeight.Bold) },
                                trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                                shape = RoundedCornerShape(20.dp),
                                enabled = !isLocked,
                                colors = OutlinedTextFieldDefaults.colors(disabledTextColor = if (isLocked) BrandGrey else BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint)
                            )
                            if (!isLocked) {
                                Box(modifier = Modifier.matchParentSize().background(Color.Transparent).clickable { typeMenuExpanded = true })
                                DropdownMenu(expanded = typeMenuExpanded, onDismissRequest = { typeMenuExpanded = false }) {
                                    listOf("Diesel", "Petrol", "CNG").forEach { fuelType ->
                                        DropdownMenuItem(
                                            text = { Text(fuelType, fontWeight = FontWeight.Black) },
                                            onClick = {
                                                selectedType = fuelType
                                                typeMenuExpanded = false
                                                persistDraft()
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        EliteTextField(value = description, onValueChange = { description = it; persistDraft() }, label = "Litre Quantity / Notes", leadingIcon = Icons.Default.LocalGasStation, enabled = !isLocked)
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = if (date.isBlank()) "PENDING..." else date, 
                                onValueChange = {}, readOnly = true, enabled = false,
                                label = { Text("System Date", color = TextHint) },
                                colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                                modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(16.dp),
                                leadingIcon = { Icon(Icons.Default.CalendarToday, null, tint = BrandYellow) }
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            OutlinedTextField(
                                value = if (time.isBlank()) "PENDING..." else time, 
                                onValueChange = {}, readOnly = true, enabled = false,
                                label = { Text("System Time", color = TextHint) },
                                colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                                modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(16.dp),
                                leadingIcon = { Icon(Icons.Default.Schedule, null, tint = BrandYellow) }
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        EliteTextField(value = cost, onValueChange = { cost = it; persistDraft() }, label = "Fuel Cost (INR)", keyboardType = androidx.compose.ui.text.input.KeyboardType.Number, leadingIcon = Icons.Default.CurrencyRupee, enabled = !isLocked)
                        
                        Spacer(modifier = Modifier.height(20.dp))
                        CameraOnlyPicker(label = "FUEL RECEIPT EVIDENCE", imageUri = billUri, onImageSelected = { if (!isLocked) { billUri = it; persistDraft() } }, enabled = !isLocked)
                    }
                }
            }
            2 -> {
                // Section 3: Other Maintenance
                StaggeredItem(visible, 2) {
                    UltraGlassCard {
                        Text(stringResource(R.string.expense_details).uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 1.5.sp)
                        Spacer(modifier = Modifier.height(20.dp))
                        
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = if (selectedType == "Other") "Other: $customType" else selectedType.ifBlank { "SELECT CATEGORY" },
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth(),
                                label = { Text("Service Classification", fontWeight = FontWeight.Bold) },
                                trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                                shape = RoundedCornerShape(20.dp),
                                enabled = !isLocked,
                                colors = OutlinedTextFieldDefaults.colors(disabledTextColor = if (isLocked) BrandGrey else BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint)
                            )
                            if (!isLocked) {
                                Box(modifier = Modifier.matchParentSize().background(Color.Transparent).clickable { typeMenuExpanded = true })
                                DropdownMenu(expanded = typeMenuExpanded, onDismissRequest = { typeMenuExpanded = false }) {
                                    listOf("Service", "Battery", "Wheel", "Other").forEach { cat ->
                                        DropdownMenuItem(
                                            text = { Text(cat, fontWeight = FontWeight.Black) },
                                            onClick = {
                                                selectedType = cat
                                                typeMenuExpanded = false
                                                persistDraft()
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        if (selectedType == "Other") {
                            Spacer(modifier = Modifier.height(16.dp))
                            EliteTextField(value = customType, onValueChange = { customType = it; persistDraft() }, label = "Specify Service Type", leadingIcon = Icons.Default.Edit, enabled = !isLocked)
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        EliteTextField(value = description, onValueChange = { description = it; persistDraft() }, label = stringResource(R.string.maintenance_description), leadingIcon = Icons.Default.Description, enabled = !isLocked)
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = if (date.isBlank()) "PENDING..." else date, 
                                onValueChange = {}, readOnly = true, enabled = false,
                                label = { Text("System Date", color = TextHint) },
                                colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                                modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(16.dp),
                                leadingIcon = { Icon(Icons.Default.CalendarToday, null, tint = BrandYellow) }
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            OutlinedTextField(
                                value = if (time.isBlank()) "PENDING..." else time, 
                                onValueChange = {}, readOnly = true, enabled = false,
                                label = { Text("System Time", color = TextHint) },
                                colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                                modifier = Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(16.dp),
                                leadingIcon = { Icon(Icons.Default.Schedule, null, tint = BrandYellow) }
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        EliteTextField(value = cost, onValueChange = { cost = it; persistDraft() }, label = stringResource(R.string.maintenance_cost), keyboardType = androidx.compose.ui.text.input.KeyboardType.Number, leadingIcon = Icons.Default.CurrencyRupee, enabled = !isLocked)
                        
                        Spacer(modifier = Modifier.height(20.dp))
                        CameraOnlyPicker(label = "SERVICE BILL EVIDENCE", imageUri = billUri, onImageSelected = { if (!isLocked) { billUri = it; persistDraft() } }, enabled = !isLocked)
                    }
                }
            }
        }

        error?.let {
            Spacer(modifier = Modifier.height(20.dp))
            Text(it, color = DangerCrimson, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 12.dp))
        }

        Spacer(modifier = Modifier.height(32.dp))
        
        if (!isLocked) {
            StaggeredItem(visible, 5) {
                GradientButton(
                    text = if (selectedTabIndex == 0) "REPORT BREAKDOWN" else if (selectedTabIndex == 1) "SUBMIT FUEL BILL" else stringResource(R.string.submit_bill),
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {
                        if (vehicle == null) {
                            error = "ERROR: Asset not identified."
                        } else {
                            if (selectedTabIndex == 0) {
                                if (description.isBlank()) {
                                    error = "ERROR: Breakdown details required."
                                } else {
                                    scope.launch {
                                        val success = AppRepository.upsertMaintenance(
                                            MaintenanceRecord(
                                                id = recordId, vehicleId = vehicle.id, driverId = driverId,
                                                tripId = draftTrip?.id,
                                                maintenanceType = "Breakdown", description = description,
                                                date = date, time = time, cost = "0",
                                                status = "submitted", isBreakdownReport = true
                                            )
                                        )
                                        if (success) {
                                            saved = true
                                            error = null
                                            isInitialized = false
                                            // Update the active trip to breakdown status if exists
                                            draftTrip?.let { 
                                                AppRepository.upsertTrip(it.copy(isBreakdown = true))
                                            }
                                            delay(1500)
                                            resetForm()
                                        } else {
                                            error = "DATABASE ERROR: Failed to save breakdown locally."
                                        }
                                    }
                                }
                            } else if (selectedTabIndex == 1) {
                                if (selectedType.isBlank() || description.isBlank() || cost.isBlank() || billUri == null) {
                                    error = "ERROR: Complete all fuel fields (Type, Litres/Notes, Cost, Receipt Photo)."
                                } else {
                                    scope.launch {
                                        val success = AppRepository.upsertMaintenance(
                                            MaintenanceRecord(
                                                id = recordId, vehicleId = vehicle.id, driverId = driverId,
                                                tripId = draftTrip?.id,
                                                maintenanceType = selectedType, description = description,
                                                date = date, time = time, cost = cost,
                                                billImageUri = billUri?.toString(), status = "submitted",
                                                isBreakdownReport = false
                                            )
                                        )
                                        if (success) {
                                            saved = true
                                            error = null
                                            isInitialized = false
                                            delay(1500)
                                            resetForm()
                                        } else {
                                            error = "DATABASE ERROR: Failed to save fuel record locally."
                                        }
                                    }
                                }
                            } else {
                                if (selectedType.isBlank() || (selectedType == "Other" && customType.isBlank()) || description.isBlank() || cost.isBlank() || billUri == null) {
                                    error = "ERROR: Complete all service fields (Category, Description, Cost, Bill Photo)."
                                } else {
                                    scope.launch {
                                        val finalType = if (selectedType == "Other") customType else selectedType
                                        val success = AppRepository.upsertMaintenance(
                                            MaintenanceRecord(
                                                id = recordId, vehicleId = vehicle.id, driverId = driverId,
                                                tripId = draftTrip?.id,
                                                maintenanceType = finalType, description = description,
                                                date = date, time = time, cost = cost,
                                                billImageUri = billUri?.toString(), status = "submitted",
                                                isBreakdownReport = false
                                            )
                                        )
                                        if (success) {
                                            saved = true
                                            error = null
                                            isInitialized = false
                                            delay(1500)
                                            resetForm()
                                        } else {
                                            error = "DATABASE ERROR: Failed to save maintenance record locally."
                                        }
                                    }
                                }
                            }
                        }
                    }
                )
            }
        }
        
        if (saved || isLocked) {
            Spacer(modifier = Modifier.height(16.dp))
            Text("✓ RECORD SYNCHRONIZED", color = SuccessEmerald, fontWeight = FontWeight.Black, modifier = Modifier.align(Alignment.CenterHorizontally), letterSpacing = 1.2.sp)
        }

        Spacer(modifier = Modifier.height(60.dp))
    }
}
