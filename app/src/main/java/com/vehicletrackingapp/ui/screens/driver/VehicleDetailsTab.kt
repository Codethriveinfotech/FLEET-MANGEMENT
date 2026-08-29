package com.vehicletrackingapp.ui.screens.driver

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.model.Vehicle
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun VehicleDetailsTab(driverId: String) {
    val allVehicles by AppRepository.getAllVehicles().collectAsState(initial = emptyList())
    val myVehicle = allVehicles.find { it.assignedDriverId == driverId }
    var selectedVehicle by remember { mutableStateOf<Vehicle?>(null) }
    val scope = rememberCoroutineScope()
    
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    if (selectedVehicle != null) {
        VehicleAssetDossier(vehicle = selectedVehicle!!, onDismiss = { selectedVehicle = null })
    }

    Column(modifier = Modifier.fillMaxSize()) {
        SectionTitle(stringResource(R.string.vehicle_details).uppercase())
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(24.dp))

        if (allVehicles.isEmpty()) {
            UltraGlassCard {
                Text("FLEET STATUS: SYNCHRONIZING WITH CENTRAL COMMAND...", color = TextHint, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(bottom = 120.dp)
            ) {
                myVehicle?.let { vehicle ->
                    item {
                        StaggeredItem(visible, 0) {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedVehicle = vehicle },
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = BrandYellow.copy(alpha = 0.08f)),
                                border = androidx.compose.foundation.BorderStroke(2.dp, BrandYellow)
                            ) {
                                Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier.size(80.dp).clip(RoundedCornerShape(16.dp)).background(BrandYellow),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (vehicle.imageUri != null) {
                                            AsyncImage(model = com.vehicletrackingapp.util.ImageWatermarkUtils.parseImageModel(vehicle.imageUri), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                        } else {
                                            Icon(Icons.Default.LocalShipping, null, tint = BrandDark, modifier = Modifier.size(40.dp))
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(20.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("ASSIGNED OPERATIONAL ASSET", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = SuccessEmerald)
                                        Text(vehicle.number, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = BrandDark)
                                        Text("${vehicle.model} • ${vehicle.type.uppercase()}", style = MaterialTheme.typography.bodySmall, color = BrandGrey, fontWeight = FontWeight.Bold)
                                    }
                                    Icon(Icons.Default.ChevronRight, null, tint = BrandGrey, modifier = Modifier.size(24.dp))
                                }
                            }
                        }

                        // Breakdown alert card — shown when vehicle is in Breakdown status
                        if (vehicle.status.equals("Breakdown", ignoreCase = true)) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = DangerCrimson.copy(alpha = 0.08f)),
                                border = androidx.compose.foundation.BorderStroke(1.5.dp, DangerCrimson)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.ReportProblem, null, tint = DangerCrimson, modifier = Modifier.size(20.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("VEHICLE IN BREAKDOWN STATUS", color = DangerCrimson, fontWeight = FontWeight.Black, fontSize = 12.sp, letterSpacing = 1.sp)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("This vehicle has been marked as broken down. Once repaired, tap below to restore operational status.", color = DangerCrimson.copy(alpha = 0.8f), fontSize = 11.sp)
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Button(
                                        onClick = {
                                            scope.launch {
                                                AppRepository.updateVehicle(vehicle.copy(status = "Active"))
                                            }
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = SuccessEmerald)
                                    ) {
                                        Icon(Icons.Default.CheckCircle, null, tint = Color.White, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("MARK AS ACTIVE", color = Color.White, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                                    }
                                }
                            }
                        }
                    }
                }

                items(allVehicles.filter { it.id != myVehicle?.id }) { vehicle ->
                    StaggeredItem(visible, 2) {
                        Card(
                            modifier = Modifier.fillMaxWidth().clickable { selectedVehicle = vehicle },
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BrandLightGrey)
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier.size(60.dp).clip(RoundedCornerShape(14.dp)).background(BrandLightGrey),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (vehicle.imageUri != null) {
                                        AsyncImage(model = com.vehicletrackingapp.util.ImageWatermarkUtils.parseImageModel(vehicle.imageUri), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                    } else {
                                        Icon(Icons.Default.DirectionsCar, null, tint = BrandGrey)
                                    }
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(vehicle.number, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black, color = BrandDark)
                                    Text(vehicle.model, style = MaterialTheme.typography.bodySmall, color = BrandGrey, fontWeight = FontWeight.Bold)
                                }
                                EliteStatusBadge(status = vehicle.status)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EliteStatusBadge(status: String) {
    val color = if (status.equals("Active", true)) SuccessEmerald else WarningSunset
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.12f), CircleShape)
            .padding(horizontal = 12.dp, vertical = 5.dp)
    ) {
        Text(status.uppercase(), color = color, fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
    }
}

@Composable
fun VehicleAssetDossier(vehicle: Vehicle, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = { TextButton(onClick = onDismiss) { Text("DISMISS", fontWeight = FontWeight.Black, color = BrandDark) } },
        title = {
            Column {
                Text("FLEET ASSET INTELLIGENCE", style = MaterialTheme.typography.labelSmall, color = BrandYellow, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                Text(vehicle.number, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = BrandDark)
            }
        },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item {
                    AssetInfoRow(label = "REGISTRATION", value = vehicle.registrationNumber, icon = Icons.Default.Badge)
                    AssetInfoRow(label = "INSURANCE STATUS", value = vehicle.insuranceStatus.uppercase(), icon = Icons.Default.Security, color = SuccessEmerald)
                    AssetInfoRow(label = "FUEL SYSTEM", value = vehicle.fuelType, icon = Icons.Default.LocalGasStation)
                    AssetInfoRow(label = "ESTIMATED MILEAGE", value = "${vehicle.mileage} KM/L", icon = Icons.Default.Speed)
                    
                    Spacer(modifier = Modifier.height(20.dp))
                    Text("REGULATORY DOCUMENTATION", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                    Row(modifier = Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        RegulatoryCard(label = "RC BOOK", icon = Icons.Default.Description)
                        RegulatoryCard(label = "PERMIT", icon = Icons.Default.VerifiedUser)
                    }
                }
            }
        },
        containerColor = Color.White,
        shape = RoundedCornerShape(32.dp)
    )
}

@Composable
fun AssetInfoRow(label: String, value: String, icon: ImageVector, color: Color = BrandDark) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = BrandLightGrey.copy(alpha = 0.5f))
    ) {
        Row(modifier = Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(36.dp).clip(CircleShape).background(BrandYellow.copy(alpha = 0.15f)), contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = BrandYellow, modifier = Modifier.size(18.dp))
            }
            Spacer(modifier = Modifier.width(18.dp))
            Column {
                Text(label, style = MaterialTheme.typography.labelSmall, color = TextHint, fontWeight = FontWeight.Black, fontSize = 9.sp)
                Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black, color = color)
            }
        }
    }
}

@Composable
fun RegulatoryCard(label: String, icon: ImageVector) {
    Box(
        modifier = Modifier
            .height(90.dp)
            .fillMaxWidth(0.5f)
            .clip(RoundedCornerShape(16.dp))
            .background(BrandLightGrey)
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, null, tint = BrandGrey, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(8.dp))
            Text(label, fontSize = 10.sp, fontWeight = FontWeight.Black, color = BrandDark)
        }
    }
}
