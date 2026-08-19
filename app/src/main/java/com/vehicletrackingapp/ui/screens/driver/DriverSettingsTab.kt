package com.vehicletrackingapp.ui.screens.driver

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.local.SessionManager
import com.vehicletrackingapp.data.model.AppLanguage
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import com.vehicletrackingapp.util.LocaleHelper
import kotlinx.coroutines.launch

@Composable
fun DriverSettingsTab(driverId: String) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }
    val isDark by sessionManager.isDarkMode.collectAsState(initial = false)

    var expandedProfile by remember { mutableStateOf(false) }
    var expandedCompany by remember { mutableStateOf(false) }
    var expandedPrivacy by remember { mutableStateOf(false) }
    
    var langMenuExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(bottom = 100.dp)
    ) {
        SectionTitle(stringResource(R.string.settings).uppercase())
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(24.dp))

        StaggeredItem(visible, 0) {
            UltraGlassCard(glowColor = BrandYellow) {
                Text("ENTERPRISE PROFILE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                Spacer(modifier = Modifier.height(16.dp))
                
                ExpandableSettingRow(
                    icon = Icons.Default.Badge, 
                    title = "Driver Identification", 
                    subtitle = "ID: $driverId",
                    isExpanded = expandedProfile,
                    onToggle = { expandedProfile = !expandedProfile }
                ) {
                    Text("Current authenticated driver session. All telemetry is linked to this ID for regulatory compliance.", style = MaterialTheme.typography.bodySmall, color = TextHint)
                }

                Spacer(modifier = Modifier.height(12.dp))
                
                ExpandableSettingRow(
                    icon = Icons.Default.Business, 
                    title = "Company Details", 
                    subtitle = "Logistics Fleet Hub",
                    isExpanded = expandedCompany,
                    onToggle = { expandedCompany = !expandedCompany }
                ) {
                    Text("Fleet Headquarters: 123 Enterprise Way. Global logistics and tracking monitoring systems active.", style = MaterialTheme.typography.bodySmall, color = TextHint)
                }

                Spacer(modifier = Modifier.height(12.dp))

                ExpandableSettingRow(
                    icon = Icons.Default.Security, 
                    title = "Privacy & Data", 
                    subtitle = "GDPR Compliant",
                    isExpanded = expandedPrivacy,
                    onToggle = { expandedPrivacy = !expandedPrivacy }
                ) {
                    Text("Your data is encrypted using AES-256. We only track location and vehicle telemetry during active trips.", style = MaterialTheme.typography.bodySmall, color = TextHint)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        StaggeredItem(visible, 1) {
            UltraGlassCard {
                Text("SYSTEM PREFERENCES", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                Spacer(modifier = Modifier.height(16.dp))
                
                var isKm by remember { mutableStateOf(true) }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Straighten, null, tint = BrandYellow, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Measurement Units", fontWeight = FontWeight.Bold)
                        Text(if (isKm) "Kilometers (KM)" else "Miles (MI)", style = MaterialTheme.typography.labelSmall, color = TextHint)
                    }
                    TextButton(onClick = { isKm = !isKm }) {
                        Text(if (isKm) "KM" else "MI", fontWeight = FontWeight.Black, color = BrandYellow)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.DarkMode, null, tint = BrandYellow, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("OLED Dark Mode", fontWeight = FontWeight.Bold)
                        Text("Optimized for night routes", style = MaterialTheme.typography.labelSmall, color = TextHint)
                    }
                    Switch(
                        checked = isDark, 
                        onCheckedChange = { scope.launch { sessionManager.setDarkMode(it) } }, 
                        colors = SwitchDefaults.colors(checkedThumbColor = BrandYellow, checkedTrackColor = BrandYellow.copy(alpha = 0.5f))
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Box {
                    SettingRow(
                        icon = Icons.Default.Language, 
                        title = stringResource(R.string.select_language), 
                        subtitle = "Current: ${LocaleHelper.currentLanguage.value.label}",
                        onClick = { langMenuExpanded = true }
                    )
                    
                    DropdownMenu(expanded = langMenuExpanded, onDismissRequest = { langMenuExpanded = false }) {
                        AppLanguage.entries.forEach { lang ->
                            DropdownMenuItem(
                                text = { Text(lang.label, fontWeight = FontWeight.Bold) },
                                onClick = {
                                    LocaleHelper.setLocale(context, lang)
                                    langMenuExpanded = false
                                    (context as? android.app.Activity)?.recreate()
                                }
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
        
        DriverProfileTab(driverId = driverId)
    }
}

@Composable
fun ExpandableSettingRow(
    icon: ImageVector, 
    title: String, 
    subtitle: String, 
    isExpanded: Boolean,
    onToggle: () -> Unit,
    details: @Composable () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .clickable { onToggle() }
                .padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(BrandYellow.copy(alpha = 0.08f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = BrandYellow, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Black, color = BrandDark)
                Text(subtitle, style = MaterialTheme.typography.labelSmall, color = TextHint)
            }
            Icon(
                if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown, 
                null, tint = TextHint, modifier = Modifier.size(24.dp)
            )
        }
        
        AnimatedVisibility(visible = isExpanded) {
            Box(modifier = Modifier.padding(start = 58.dp, bottom = 12.dp)) {
                details()
            }
        }
    }
}

@Composable
fun SettingRow(icon: ImageVector, title: String, subtitle: String, onClick: () -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(CircleShape)
                .background(BrandYellow.copy(alpha = 0.08f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = BrandYellow, modifier = Modifier.size(20.dp))
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Black, color = BrandDark)
            Text(subtitle, style = MaterialTheme.typography.labelSmall, color = TextHint)
        }
        Icon(Icons.Default.ChevronRight, null, tint = TextHint, modifier = Modifier.size(20.dp))
    }
}
