package com.vehicletrackingapp.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.model.AppLanguage
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.components.SpatialBackground
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import com.vehicletrackingapp.util.LocaleHelper
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun DriverLoginScreen(
    onLoginSuccess: (driverId: String) -> Unit,
    onGoToSignUp: () -> Unit,
    onGoToAdminLogin: () -> Unit,
    onLanguageChanged: () -> Unit
) {
    var identity by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    var langMenuExpanded by remember { mutableStateOf(false) }
    var visible by remember { mutableStateOf(false) }
    
    val passwordFocusRequester = remember { FocusRequester() }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) { visible = true }

    SpatialBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding() 
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(100.dp))
            
            AnimatedVisibility(visible = visible, enter = fadeIn(tween(1000)) + scaleIn(initialScale = 0.8f)) {
                Image(
                    painter = painterResource(id = R.drawable.logo),
                    contentDescription = null,
                    modifier = Modifier.size(150.dp).shineEffect()
                )
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            StaggeredItem(visible, 1) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(stringResource(R.string.business_name).uppercase(), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = BrandDark, letterSpacing = 2.sp)
                    Text(stringResource(R.string.tagline), color = BrandGrey, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                }
            }

            Spacer(modifier = Modifier.height(60.dp))

            AnimatedVisibility(visible = visible, enter = fadeIn(tween(1200, delayMillis = 300)) + slideInVertically(initialOffsetY = { 80 })) {
                UltraGlassCard(glowColor = BrandYellow) {
                    Text(
                        stringResource(R.string.driver_login).uppercase(), 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Black,
                        color = BrandDark,
                        letterSpacing = 1.5.sp
                    )
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    EliteTextField(
                        value = identity, 
                        onValueChange = { identity = it }, 
                        label = stringResource(R.string.driver_id_placeholder),
                        leadingIcon = Icons.Default.Person,
                        imeAction = ImeAction.Next,
                        keyboardActions = KeyboardActions(onNext = { passwordFocusRequester.requestFocus() })
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    EliteTextField(
                        value = password, 
                        onValueChange = { password = it }, 
                        label = stringResource(R.string.password), 
                        isPassword = true,
                        leadingIcon = Icons.Default.Lock,
                        modifier = Modifier.focusRequester(passwordFocusRequester),
                        imeAction = ImeAction.Done,
                        keyboardActions = KeyboardActions(onDone = { 
                            if (identity.isNotBlank() && password.isNotBlank()) {
                                loading = true
                                scope.launch {
                                    val driver = AppRepository.findDriver(identity, password)
                                    delay(600) 
                                    if (driver != null) {
                                        error = null
                                        onLoginSuccess(driver.id)
                                    } else {
                                        error = context.getString(R.string.invalid_credentials)
                                        loading = false
                                    }
                                }
                            }
                        })
                    )

                    error?.let {
                        Spacer(modifier = Modifier.height(20.dp))
                        Text(it, color = DangerCrimson, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(56.dp))
                    GradientButton(
                        text = stringResource(R.string.login),
                        loading = loading,
                        onClick = {
                            if (identity.isNotBlank() && password.isNotBlank()) {
                                loading = true
                                scope.launch {
                                    val driver = AppRepository.findDriver(identity, password)
                                    delay(600) 
                                    if (driver != null) {
                                        error = null
                                        onLoginSuccess(driver.id)
                                    } else {
                                        error = context.getString(R.string.invalid_credentials)
                                        loading = false
                                    }
                                }
                            } else {
                                error = "Credentials required for fleet access"
                            }
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(60.dp))
            EliteLoginFooter()
            Spacer(modifier = Modifier.height(40.dp))
        }

        // Action Overlay
        Box(modifier = Modifier.fillMaxSize().padding(top = 56.dp, start = 24.dp, end = 24.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Box {
                    TextButton(
                        onClick = { langMenuExpanded = true },
                        modifier = Modifier.background(Color.White.copy(alpha = 0.8f), RoundedCornerShape(14.dp))
                    ) {
                        Icon(Icons.Filled.Language, contentDescription = null, modifier = Modifier.size(18.dp), tint = BrandYellow)
                        Text("  " + LocaleHelper.currentLanguage.value.label, fontWeight = FontWeight.Black, color = BrandDark)
                    }
                    DropdownMenu(expanded = langMenuExpanded, onDismissRequest = { langMenuExpanded = false }) {
                        AppLanguage.entries.forEach { lang ->
                            DropdownMenuItem(
                                text = { Text(lang.label, fontWeight = FontWeight.Bold) },
                                onClick = {
                                    LocaleHelper.setLocale(context, lang)
                                    langMenuExpanded = false
                                    onLanguageChanged()
                                    (context as? android.app.Activity)?.recreate()
                                }
                            )
                        }
                    }
                }
                IconButton(
                    onClick = onGoToAdminLogin,
                    modifier = Modifier.background(BrandDark.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
                ) {
                    Icon(Icons.Filled.AdminPanelSettings, contentDescription = stringResource(R.string.admin_login), tint = BrandYellow)
                }
            }
        }
    }
}
