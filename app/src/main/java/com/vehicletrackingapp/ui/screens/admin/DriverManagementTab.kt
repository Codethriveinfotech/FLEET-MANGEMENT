package com.vehicletrackingapp.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.model.Driver
import com.vehicletrackingapp.data.repo.AppRepository
import androidx.compose.ui.text.font.FontWeight
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*

@Composable
fun DriverManagementTab() {
    val drivers by AppRepository.getAllDrivers().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var showDialog by remember { mutableStateOf(false) }
    var editingDriver by remember { mutableStateOf<Driver?>(null) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            SectionTitle(stringResource(R.string.driver_management).uppercase())
            IconButton(
                onClick = { editingDriver = null; showDialog = true },
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Icon(Icons.Filled.Add, contentDescription = stringResource(R.string.add_driver), tint = BrandYellow)
            }
        }
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(20.dp))
        LazyColumn {
            items(drivers, key = { it.id }) { driver ->
                PremiumGlassCard(modifier = Modifier.padding(vertical = 8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text(driver.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                            Text("Phone: ${driver.phone}", color = TextHint, style = MaterialTheme.typography.bodyMedium)
                            Text("Pass: ${driver.password}", color = TextHint, style = MaterialTheme.typography.bodySmall)
                        }
                        Row {
                            IconButton(onClick = { editingDriver = driver; showDialog = true }) {
                                Icon(Icons.Filled.Edit, contentDescription = stringResource(R.string.edit_driver), tint = MaterialTheme.colorScheme.primary)
                            }
                            IconButton(onClick = { scope.launch { AppRepository.deleteDriver(driver.id) } }) {
                                Icon(Icons.Filled.Delete, contentDescription = stringResource(R.string.delete_driver), tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showDialog) {
        DriverEditDialog(
            driver = editingDriver,
            onDismiss = { showDialog = false },
            onSave = { d ->
                scope.launch { 
                    if (editingDriver == null) {
                        AppRepository.signUp(d)
                    } else {
                        AppRepository.updateDriver(d)
                    }
                }
                showDialog = false
            }
        )
    }
}

@Composable
private fun DriverEditDialog(driver: Driver?, onDismiss: () -> Unit, onSave: (Driver) -> Unit) {
    var name by remember { mutableStateOf(driver?.name ?: "") }
    var phone by remember { mutableStateOf(driver?.phone ?: "") }
    var license by remember { mutableStateOf(driver?.licenseNumber ?: "") }
    var email by remember { mutableStateOf(driver?.email ?: "") }
    var password by remember { mutableStateOf(driver?.password ?: "1234") }

    AlertDialog(
        onDismissRequest = onDismiss,
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
        title = { Text(stringResource(if (driver == null) R.string.add_driver else R.string.edit_driver), fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .fillMaxHeight(0.75f) // Constrain height to avoid zoom/overflow
                    .verticalScroll(rememberScrollState())
                    .padding(vertical = 4.dp)
            ) {
                FuturisticTextField(value = name, onValueChange = { name = it }, label = stringResource(R.string.driver_name))
                Spacer(modifier = Modifier.height(8.dp))
                FuturisticTextField(value = phone, onValueChange = { phone = it }, label = stringResource(R.string.phone_number), keyboardType = androidx.compose.ui.text.input.KeyboardType.Phone)
                Spacer(modifier = Modifier.height(8.dp))
                FuturisticTextField(value = email, onValueChange = { email = it }, label = "Email Address", keyboardType = androidx.compose.ui.text.input.KeyboardType.Email)
                Spacer(modifier = Modifier.height(8.dp))
                FuturisticTextField(value = license, onValueChange = { license = it }, label = stringResource(R.string.driving_license_number))
                Spacer(modifier = Modifier.height(8.dp))
                FuturisticTextField(value = password, onValueChange = { password = it }, label = "Login Password", isPassword = true)
            }
        },
        confirmButton = {
            GradientButton(
                text = stringResource(R.string.save),
                modifier = Modifier.fillMaxWidth(0.85f).height(50.dp)
            ) {
                if (name.isNotBlank() && phone.isNotBlank() && password.isNotBlank()) {
                    onSave(
                        Driver(
                            id = driver?.id ?: AppRepository.newId(),
                            name = name, 
                            phone = phone, 
                            licenseNumber = license, 
                            password = password,
                            email = email,
                            photoUri = driver?.photoUri
                        )
                    )
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        }
    )
}
