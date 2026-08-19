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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.components.SpatialBackground
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun AdminLoginScreen(onLoginSuccess: () -> Unit, onBack: () -> Unit) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    var visible by remember { mutableStateOf(false) }
    
    val passwordFocusRequester = remember { FocusRequester() }
    val scope = rememberCoroutineScope()
    
    LaunchedEffect(Unit) { visible = true }

    SpatialBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(R.string.admin_login).uppercase(), fontWeight = FontWeight.Black, letterSpacing = 2.sp, fontSize = 16.sp, color = BrandDark) },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = BrandYellow)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White.copy(alpha = 0.8f))
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .imePadding()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(60.dp))
                
                AnimatedVisibility(visible = visible, enter = fadeIn(tween(1000)) + scaleIn(initialScale = 0.8f)) {
                    Image(
                        painter = painterResource(id = R.drawable.logo),
                        contentDescription = null,
                        modifier = Modifier.size(120.dp).shineEffect()
                    )
                }
                
                Spacer(modifier = Modifier.height(40.dp))

                AnimatedVisibility(visible = visible, enter = fadeIn(tween(1200, delayMillis = 300)) + slideInVertically(initialOffsetY = { 80 })) {
                    UltraGlassCard(glowColor = BrandYellow) {
                        Text(
                            stringResource(R.string.system_executive).uppercase(), 
                            style = MaterialTheme.typography.titleMedium, 
                            fontWeight = FontWeight.Black,
                            color = BrandDark,
                            letterSpacing = 1.5.sp
                        )
                        Spacer(modifier = Modifier.height(32.dp))
                        
                        EliteTextField(
                            value = username, 
                            onValueChange = { username = it }, 
                            label = stringResource(R.string.admin_username),
                            leadingIcon = Icons.Default.Person,
                            imeAction = ImeAction.Next,
                            keyboardActions = KeyboardActions(onNext = { passwordFocusRequester.requestFocus() })
                        )
                        
                        Spacer(modifier = Modifier.height(20.dp))
                        
                        EliteTextField(
                            value = password, 
                            onValueChange = { password = it }, 
                            label = stringResource(R.string.secure_password), 
                            isPassword = true,
                            leadingIcon = Icons.Default.Lock,
                            modifier = Modifier.focusRequester(passwordFocusRequester),
                            imeAction = ImeAction.Done,
                            keyboardActions = KeyboardActions(onDone = { 
                                if (username.isNotBlank() && password.isNotBlank()) {
                                    loading = true
                                    scope.launch {
                                        delay(600) 
                                        val repository = AppRepository
                                        if (repository.loginAdmin(username, password)) {
                                            error = null
                                            onLoginSuccess()
                                        } else {
                                            error = "Access Denied: Enterprise Mismatch"
                                            loading = false
                                        }
                                    }
                                }
                            })
                        )

                        error?.let {
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(it, color = DangerCrimson, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(48.dp))
                        GradientButton(
                            text = stringResource(R.string.unlock_dashboard),
                            loading = loading,
                            onClick = {
                                if (username.isNotBlank() && password.isNotBlank()) {
                                    loading = true
                                    scope.launch {
                                        delay(600) 
                                        val repository = AppRepository
                                        if (repository.loginAdmin(username, password)) {
                                            error = null
                                            onLoginSuccess()
                                        } else {
                                            error = "Access Denied: Enterprise Mismatch"
                                            loading = false
                                        }
                                    }
                                } else {
                                    error = "System identity required"
                                }
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(60.dp))
                EliteLoginFooter()
                Spacer(modifier = Modifier.height(40.dp))
            }
        }
    }
}
