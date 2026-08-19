package com.vehicletrackingapp.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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

import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

@Composable
fun VehicleManagementTab() {
    val vehicles by AppRepository.getAllVehicles().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var showDialog by remember { mutableStateOf(false) }
    var editingVehicle by remember { mutableStateOf<Vehicle?>(null) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            SectionTitle(stringResource(R.string.vehicle_management).uppercase())
            IconButton(onClick = { editingVehicle = null; showDialog = true }) {
                Icon(Icons.Filled.Add, contentDescription = stringResource(R.string.add_vehicle), tint = BrandYellow)
            }
        }
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(20.dp))
        LazyColumn {
            items(vehicles, key = { it.id }) { vehicle ->
                PremiumGlassCard(modifier = Modifier.padding(vertical = 8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text(vehicle.number, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(vehicle.model, color = TextHint, style = MaterialTheme.typography.bodyMedium)
                        }
                        Row {
                            IconButton(onClick = { editingVehicle = vehicle; showDialog = true }) {
                                Icon(Icons.Filled.Edit, contentDescription = stringResource(R.string.edit_vehicle), tint = MaterialTheme.colorScheme.primary)
                            }
                            IconButton(onClick = { scope.launch { AppRepository.deleteVehicle(vehicle.id) } }) {
                                Icon(Icons.Filled.Delete, contentDescription = stringResource(R.string.delete_vehicle), tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showDialog) {
        VehicleEditDialog(
            vehicle = editingVehicle,
            onDismiss = { showDialog = false },
            onSave = { v ->
                scope.launch {
                    AppRepository.addVehicle(v)
                    showDialog = false
                }
            }
        )
    }
}

@Composable
private fun VehicleEditDialog(vehicle: Vehicle?, onDismiss: () -> Unit, onSave: (Vehicle) -> Unit) {
    var number by remember { mutableStateOf(vehicle?.number ?: "") }
    var model by remember { mutableStateOf(vehicle?.model ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(if (vehicle == null) R.string.add_vehicle else R.string.edit_vehicle), fontWeight = FontWeight.Black) },
        text = {
            Column {
                FuturisticTextField(value = number, onValueChange = { number = it }, label = stringResource(R.string.vehicle_number))
                Spacer(modifier = Modifier.height(16.dp))
                FuturisticTextField(value = model, onValueChange = { model = it }, label = stringResource(R.string.vehicle_model))
            }
        },
        confirmButton = {
            GradientButton(text = stringResource(R.string.save)) {
                onSave(
                    Vehicle(
                        id = vehicle?.id ?: AppRepository.newId(),
                        number = number, model = model,
                        assignedDriverId = vehicle?.assignedDriverId
                    )
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        }
    )
}
