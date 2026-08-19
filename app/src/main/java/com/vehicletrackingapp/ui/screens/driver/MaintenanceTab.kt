package com.vehicletrackingapp.ui.screens.driver

import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.material3.*
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

    var recordId by remember { mutableStateOf("") }
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

    var isBreakdown by remember { mutableStateOf(false) }

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
        selectedType = ""
        customType = ""
        description = ""
        cost = ""
        billUri = null
        isBreakdown = false
        error = null
        saved = false
    }

    val categories = listOf("Petrol", "Diesel", "Battery", "Wheel", "Service", "Breakdown")

    val linkedVehicleId = draftTrip?.vehicleId
    val effectiveVehicleId = selectedVehicleId ?: linkedVehicleId
    val vehicle = effectiveVehicleId?.let { id -> vehicles.find { it.id == id } }

    LaunchedEffect(draftMainFlow.value) {
        val draft = draftMainFlow.value
        if (draft != null && !isInitialized) {
            recordId = draft.id
            if (categories.contains(draft.maintenanceType)) {
                selectedType = draft.maintenanceType
            } else {
                selectedType = "Other"
                customType = draft.maintenanceType
            }
            description = draft.description
            date = draft.date
            time = draft.time
            cost = draft.cost
            billUri = draft.billImageUri?.let { Uri.parse(it) }
            selectedVehicleId = draft.vehicleId
            isBreakdown = draft.isBreakdownReport
            isInitialized = true
        } else if (draft == null && !isInitialized) {
            recordId = AppRepository.newId()
            isInitialized = true
        }
    }

    fun persistDraft() {
        if (isLocked) return
        scope.launch {
            if (vehicle == null) return@launch
            val finalType = if (isBreakdown) "Breakdown" else (if (selectedType == "Other") customType else selectedType)
            val record = MaintenanceRecord(
                id = recordId, vehicleId = vehicle.id, driverId = driverId,
                tripId = draftTrip?.id,
                maintenanceType = finalType, description = description,
                date = date, time = time, cost = cost,
                billImageUri = billUri?.toString(), status = "draft",
                isBreakdownReport = isBreakdown
            )
            AppRepository.upsertMaintenance(record)
        }
    }

    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        SectionTitle(stringResource(R.string.service_registry).uppercase())
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(24.dp))
        
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
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandYellow, unfocusedBorderColor = Color.Black.copy(alpha = 0.08f), disabledTextColor = if (isLocked) BrandGrey else BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint)
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

        Spacer(modifier = Modifier.height(24.dp))

        // Breakdown Toggle
        StaggeredItem(visible, 1) {
            UltraGlassCard(glowColor = if (isBreakdown) DangerCrimson else Color.Transparent) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.ReportProblem, null, tint = if (isBreakdown) DangerCrimson else BrandGrey, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("VEHICLE BREAKDOWN", fontWeight = FontWeight.Black, color = if (isBreakdown) DangerCrimson else BrandDark)
                        Text("Immediate mission suspension", style = MaterialTheme.typography.labelSmall, color = TextHint)
                    }
                    Switch(
                        checked = isBreakdown, 
                        onCheckedChange = { isBreakdown = it; if(it) selectedType = "Breakdown"; persistDraft() },
                        colors = SwitchDefaults.colors(checkedThumbColor = DangerCrimson, checkedTrackColor = DangerCrimson.copy(alpha = 0.4f)),
                        enabled = !isLocked
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (!isBreakdown) {
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
                                categories.filter { it != "Breakdown" }.forEach { cat ->
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
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            StaggeredItem(visible, 3) {
                UltraGlassCard {
                    Text(stringResource(R.string.valuation).uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 1.5.sp)
                    Spacer(modifier = Modifier.height(20.dp))
                    
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
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            StaggeredItem(visible, 4) {
                UltraGlassCard {
                    Text(stringResource(R.string.documentation).uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 1.5.sp)
                    Spacer(modifier = Modifier.height(20.dp))
                    CameraOnlyPicker(label = "BILL INVOICE EVIDENCE", imageUri = billUri, onImageSelected = { if (!isLocked) { billUri = it; persistDraft() } }, enabled = !isLocked)
                }
            }
        } else {
            // Breakdown Form
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

        error?.let {
            Spacer(modifier = Modifier.height(20.dp))
            Text(it, color = DangerCrimson, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 12.dp))
        }

        Spacer(modifier = Modifier.height(32.dp))
        
        if (!isLocked) {
            StaggeredItem(visible, 5) {
                GradientButton(
                    text = if (isBreakdown) "REPORT BREAKDOWN" else stringResource(R.string.submit_bill),
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {
                        if (vehicle == null) {
                            error = "ERROR: Asset not identified."
                        } else {
                            if (isBreakdown) {
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
                                            // Also update the active trip to breakdown status if exists
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
                            } else {
                                if (selectedType.isBlank() || (selectedType == "Other" && customType.isBlank()) || description.isBlank() || cost.isBlank() || billUri == null) {
                                    error = "ERROR: Complete all verification fields (Category, Description, Cost, Photo)."
                                } else {
                                    scope.launch {
                                        val finalType = if (selectedType == "Other") customType else selectedType
                                        val success = AppRepository.upsertMaintenance(
                                            MaintenanceRecord(
                                                id = recordId, vehicleId = vehicle.id, driverId = driverId,
                                                tripId = draftTrip?.id,
                                                maintenanceType = finalType, description = description,
                                                date = date, time = time, cost = cost,
                                                billImageUri = billUri?.toString(), status = "submitted"
                                            )
                                        )
                                        if (success) {
                                            saved = true
                                            error = null
                                            isInitialized = false
                                            delay(1500)
                                            resetForm()
                                        } else {
                                            error = "DATABASE ERROR: Failed to save maintenance locally."
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
