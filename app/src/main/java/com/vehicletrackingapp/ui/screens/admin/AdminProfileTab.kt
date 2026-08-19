package com.vehicletrackingapp.ui.screens.admin

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun AdminProfileTab() {
    var currentUsername by remember { mutableStateOf("admin") }
    var username by remember { mutableStateOf("admin") }
    var oldPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var saved by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        try {
            val response = AppRepository.api.getProfile()
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()?.data?.phone?.let {
                    currentUsername = it
                    username = it
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        SectionTitle(stringResource(R.string.admin_profile).uppercase())
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(24.dp))
        PremiumGlassCard {
            FuturisticTextField(value = username, onValueChange = { username = it; saved = false; errorMessage = null }, label = stringResource(R.string.username))
            Spacer(modifier = Modifier.height(16.dp))
            FuturisticTextField(value = oldPassword, onValueChange = { oldPassword = it; saved = false; errorMessage = null }, label = "Old Password", isPassword = true)
            Spacer(modifier = Modifier.height(16.dp))
            FuturisticTextField(value = newPassword, onValueChange = { newPassword = it; saved = false; errorMessage = null }, label = "New Password", isPassword = true)
            Spacer(modifier = Modifier.height(32.dp))
            GradientButton(text = stringResource(R.string.save)) {
                if (username.isBlank()) {
                    errorMessage = "Username cannot be empty"
                    return@GradientButton
                }
                if (oldPassword.isBlank()) {
                    errorMessage = "Old password is required to verify identity"
                    return@GradientButton
                }
                if (newPassword.isBlank()) {
                    errorMessage = "New password cannot be empty"
                    return@GradientButton
                }
                scope.launch {
                    val loginRes = try {
                        AppRepository.api.login(com.vehicletrackingapp.data.remote.LoginRequest(currentUsername, oldPassword))
                    } catch (e: Exception) {
                        null
                    }
                    if (loginRes == null || !loginRes.isSuccessful || loginRes.body()?.success != true) {
                        errorMessage = "Incorrect old password"
                        return@launch
                    }

                    val success = AppRepository.updateAdminCredentials(username, newPassword)
                    if (success) {
                        saved = true
                        currentUsername = username
                        oldPassword = ""
                        newPassword = ""
                    } else {
                        errorMessage = "Failed to update admin credentials"
                    }
                }
            }
            if (saved) {
                Spacer(modifier = Modifier.height(12.dp))
                Text("Admin credentials updated ✓", color = com.vehicletrackingapp.ui.theme.SuccessEmerald, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
            }
            errorMessage?.let { error ->
                Spacer(modifier = Modifier.height(12.dp))
                Text(error, color = androidx.compose.ui.graphics.Color.Red, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
            }
        }
    }
}
