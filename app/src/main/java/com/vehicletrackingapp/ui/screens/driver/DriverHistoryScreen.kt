package com.vehicletrackingapp.ui.screens.driver

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vehicletrackingapp.data.model.TripEntry
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Route

@Composable
fun DriverHistoryScreen(driverId: String) {
    val allSubmittedTrips by AppRepository.getAllTrips().collectAsState(initial = emptyList())
    val submittedMaintenance by AppRepository.getAllMaintenance().collectAsState(initial = emptyList())
    val driverTrips = allSubmittedTrips.filter { it.driverId == driverId }
    val vehicles by AppRepository.getAllVehicles().collectAsState(initial = emptyList())
    val drivers by AppRepository.getAllDrivers().collectAsState(initial = emptyList())
    
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    var selectedTrip by remember { mutableStateOf<TripEntry?>(null) }
    val activeTrip = driverTrips.find { it.id == selectedTrip?.id }

    if (activeTrip != null) {
        com.vehicletrackingapp.ui.screens.admin.ReportDetailDialog(
            trip = activeTrip,
            maintenance = submittedMaintenance.filter { it.tripId == activeTrip.id },
            driver = drivers.find { it.id == activeTrip.driverId },
            vehicle = vehicles.find { it.id == activeTrip.vehicleId },
            onDismiss = { selectedTrip = null }
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {
        SectionTitle("PAST TRIP LOGS")
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(24.dp))
        
        if (driverTrips.isEmpty()) {
            Spacer(modifier = Modifier.height(24.dp))
            UltraGlassCard {
                Text("No past missions found for your profile.", color = TextHint, style = MaterialTheme.typography.bodyMedium)
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(driverTrips, key = { it.id }) { trip ->
                    val vehicle = vehicles.find { it.id == trip.vehicleId }
                    StaggeredItem(visible, 2) {
                        UltraGlassCard(
                            modifier = Modifier.clickable { selectedTrip = trip }
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(trip.startDate, style = MaterialTheme.typography.labelSmall, color = TextHint, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("${trip.day} • ${trip.shift}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                                        if (trip.isBreakdown) {
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Box(modifier = Modifier.background(DangerCrimson.copy(alpha = 0.1f), CircleShape).padding(horizontal = 8.dp, vertical = 2.dp)) {
                                                Text("BREAKDOWN", color = DangerCrimson, fontWeight = FontWeight.Black, fontSize = 8.sp)
                                            }
                                        }
                                    }
                                    Text(vehicle?.number ?: "Unassigned Vehicle", style = MaterialTheme.typography.bodySmall, color = BrandBlue, fontWeight = FontWeight.Bold)
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("${trip.endOdometer.ifBlank { trip.startOdometer }} KM", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = Color.Black)
                                    Text("FINAL", style = MaterialTheme.typography.labelSmall, color = TextHint)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
