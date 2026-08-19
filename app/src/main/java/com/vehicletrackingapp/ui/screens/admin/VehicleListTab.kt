package com.vehicletrackingapp.ui.screens.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.model.Vehicle
import com.vehicletrackingapp.data.repo.AppRepository
import androidx.compose.ui.text.font.FontWeight
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*

@Composable
fun VehicleListTab() {
    val vehicles by AppRepository.getAllVehicles().collectAsState(initial = emptyList())
    var selectedVehicle by remember { mutableStateOf<Vehicle?>(null) }

    if (selectedVehicle == null) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            SectionTitle(stringResource(R.string.vehicle_list).uppercase())
            AttractiveHorizontalDivider()
            Spacer(modifier = Modifier.height(24.dp))
            LazyColumn {
                items(vehicles, key = { it.id }) { vehicle ->
                    PremiumGlassCard(
                        modifier = Modifier
                            .padding(vertical = 8.dp)
                            .clickable { selectedVehicle = vehicle }
                    ) {
                        androidx.compose.foundation.layout.Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(vehicle.number, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Text(vehicle.model, color = TextHint, style = MaterialTheme.typography.bodyMedium)
                            }
                            Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }
    } else {
        VehicleDetailView(vehicle = selectedVehicle!!, onBack = { selectedVehicle = null })
    }
}

@Composable
private fun VehicleDetailView(vehicle: Vehicle, onBack: () -> Unit) {
    val drivers by AppRepository.getAllDrivers().collectAsState(initial = emptyList())
    val maintenanceList by AppRepository.getAllMaintenance().collectAsState(initial = emptyList())
    
    val driver = drivers.firstOrNull { it.id == vehicle.assignedDriverId }
    val maintenance = maintenanceList.filter { it.vehicleId == vehicle.id }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        androidx.compose.foundation.layout.Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, contentDescription = stringResource(R.string.back), tint = MaterialTheme.colorScheme.primary) }
            Text(vehicle.number, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
        }
        Spacer(modifier = Modifier.height(16.dp))

        PremiumGlassCard(modifier = Modifier.padding(vertical = 8.dp)) {
            Text(stringResource(R.string.vehicle_details), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Spacer(modifier = Modifier.height(8.dp))
            Text("${stringResource(R.string.vehicle_model)}: ${vehicle.model}", color = TextHint, fontWeight = FontWeight.Medium)
        }

        PremiumGlassCard(modifier = Modifier.padding(vertical = 8.dp)) {
            Text(stringResource(R.string.driver_details), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Spacer(modifier = Modifier.height(8.dp))
            if (driver != null) {
                Text("${stringResource(R.string.driver_name)}: ${driver.name}", color = TextHint, fontWeight = FontWeight.Medium)
                Text("${stringResource(R.string.phone_number)}: ${driver.phone}", color = TextHint, fontWeight = FontWeight.Medium)
            } else {
                Text(stringResource(R.string.no_data), color = TextHint)
            }
        }

        PremiumGlassCard(modifier = Modifier.padding(vertical = 8.dp)) {
            Text(stringResource(R.string.maintenance_history), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Spacer(modifier = Modifier.height(8.dp))
            if (maintenance.isEmpty()) {
                Text(stringResource(R.string.no_data), color = TextHint)
            } else {
                maintenance.forEach { record ->
                    Text("${record.date} — ${record.description} — ₹${record.cost}", color = TextHint, modifier = Modifier.padding(vertical = 4.dp))
                }
            }
        }
    }
}
