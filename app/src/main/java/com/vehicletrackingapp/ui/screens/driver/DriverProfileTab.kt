package com.vehicletrackingapp.ui.screens.driver

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.screens.common.*
import kotlinx.coroutines.launch
import androidx.compose.ui.text.font.FontWeight
import com.vehicletrackingapp.ui.theme.*

@Composable
fun DriverProfileTab(driverId: String) {
    val drivers by AppRepository.getAllDrivers().collectAsState(initial = emptyList())
    val driver = drivers.firstOrNull { it.id == driverId }
    val scope = rememberCoroutineScope()

    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var license by remember { mutableStateOf("") }
    var oldPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var photoUri by remember { mutableStateOf<android.net.Uri?>(null) }
    var saved by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(driver) {
        driver?.let {
            name = it.name
            phone = it.phone
            license = it.licenseNumber
            photoUri = it.photoUri?.let { uri -> android.net.Uri.parse(uri) }
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        SectionTitle(stringResource(R.string.profile).uppercase())

        UltraGlassCard {
            CameraGalleryPicker(
                label = stringResource(R.string.upload_driver_photo),
                imageUri = photoUri,
                onImageSelected = { photoUri = it }
            )
            Spacer(modifier = Modifier.height(32.dp))
            FuturisticTextField(value = name, onValueChange = { name = it; saved = false; errorMessage = null }, label = stringResource(R.string.driver_name), leadingIcon = Icons.Default.Person)
            Spacer(modifier = Modifier.height(20.dp))
            FuturisticTextField(value = phone, onValueChange = { phone = it; saved = false; errorMessage = null }, label = stringResource(R.string.phone_number), leadingIcon = Icons.Default.Phone, keyboardType = androidx.compose.ui.text.input.KeyboardType.Phone)
            Spacer(modifier = Modifier.height(20.dp))
            FuturisticTextField(value = license, onValueChange = { license = it; saved = false; errorMessage = null }, label = stringResource(R.string.driving_license_number), leadingIcon = Icons.Default.Badge)
            Spacer(modifier = Modifier.height(20.dp))
            FuturisticTextField(value = oldPassword, onValueChange = { oldPassword = it; saved = false; errorMessage = null }, label = "Old Password", leadingIcon = Icons.Default.Lock, isPassword = true)
            Spacer(modifier = Modifier.height(20.dp))
            FuturisticTextField(value = newPassword, onValueChange = { newPassword = it; saved = false; errorMessage = null }, label = "New Password", leadingIcon = Icons.Default.Lock, isPassword = true)
            
            Spacer(modifier = Modifier.height(40.dp))
            GradientButton(text = stringResource(R.string.save).uppercase()) {
                if (driver != null) {
                    if (name.isBlank() || phone.isBlank()) {
                        errorMessage = "Name and phone cannot be empty"
                        return@GradientButton
                    }
                    if (newPassword.isNotEmpty()) {
                        if (oldPassword != driver.password) {
                            errorMessage = "Incorrect old password"
                            return@GradientButton
                        }
                    }
                    val targetPassword = if (newPassword.isNotEmpty()) newPassword else driver.password
                    
                    scope.launch {
                        AppRepository.updateDriver(driver.copy(
                            name = name,
                            phone = phone,
                            licenseNumber = license,
                            password = targetPassword,
                            photoUri = photoUri?.toString()
                        ))
                        saved = true
                        oldPassword = ""
                        newPassword = ""
                    }
                }
            }
            if (saved) {
                Spacer(modifier = Modifier.height(16.dp))
                Text("✓ " + stringResource(R.string.submitted_to_admin), color = SuccessEmerald, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 8.dp))
            }
            errorMessage?.let { error ->
                Spacer(modifier = Modifier.height(16.dp))
                Text(error, color = androidx.compose.ui.graphics.Color.Red, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp))
            }
        }
    }
}
