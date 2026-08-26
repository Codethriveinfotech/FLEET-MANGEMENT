package com.vehicletrackingapp.ui.screens.driver

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.vehicletrackingapp.R
import com.vehicletrackingapp.data.model.AppLanguage
import com.vehicletrackingapp.data.repo.AppRepository
import com.vehicletrackingapp.ui.components.SpatialBackground
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import com.vehicletrackingapp.util.LocaleHelper
import kotlinx.coroutines.launch

import androidx.compose.foundation.interaction.MutableInteractionSource

@Composable
fun DriverDashboardScreen(driverId: String, onLogout: () -> Unit) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val connectivity by AppRepository.isConnected.collectAsState(initial = true)
    val drivers by AppRepository.getAllDrivers().collectAsState(initial = emptyList())
    val driver = drivers.firstOrNull { it.id == driverId }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    LaunchedEffect(Unit) {
        AppRepository.syncPendingData()
    }

    var showLogoutDialog by remember { mutableStateOf(false) }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text(stringResource(R.string.logout).uppercase(), fontWeight = FontWeight.Black) },
            text = { Text("Terminate current session and return to gate?") },
            confirmButton = {
                TextButton(onClick = onLogout) {
                    Text(stringResource(R.string.logout).uppercase(), color = DangerCrimson, fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text(stringResource(R.string.cancel).uppercase(), fontWeight = FontWeight.Black, color = BrandDark)
                }
            },
            containerColor = BrandWhite,
            shape = RoundedCornerShape(24.dp)
        )
    }

    SpatialBackground {
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet(
                    modifier = Modifier.width(320.dp),
                    drawerContainerColor = BrandWhite.copy(alpha = 0.98f),
                    drawerShape = RoundedCornerShape(topEnd = 32.dp, bottomEnd = 32.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Spacer(modifier = Modifier.height(56.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(BrandYellow.copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                if (driver?.photoUri != null) {
                                    AsyncImage(model = com.vehicletrackingapp.util.ImageWatermarkUtils.parseImageModel(driver.photoUri), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                } else {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = BrandYellow, modifier = Modifier.size(36.dp))
                                }
                            }
                            Spacer(modifier = Modifier.width(20.dp))
                            Column {
                                Text(driver?.name ?: "Operator", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = BrandDark)
                                Text("ID: ${driver?.id ?: ""}", style = MaterialTheme.typography.labelSmall, color = BrandGrey, fontWeight = FontWeight.Bold)
                            }
                        }
                        Spacer(modifier = Modifier.height(32.dp))
                        HorizontalDivider(color = Color.Black.copy(alpha = 0.05f))
                        Spacer(modifier = Modifier.height(24.dp))

                        val items = listOf(
                            Triple(stringResource(R.string.trip_details), Icons.Default.Description, 0),
                            Triple(stringResource(R.string.trip_history), Icons.Default.History, 2),
                            Triple(stringResource(R.string.settings), Icons.Default.Settings, 4),
                            Triple(stringResource(R.string.help_support), Icons.AutoMirrored.Filled.Help, 5)
                        )

                        items.forEach { (label, icon, tab) ->
                            NavigationDrawerItem(
                                label = { Text(label, fontWeight = FontWeight.Bold) },
                                selected = selectedTab == tab,
                                onClick = { 
                                    selectedTab = tab
                                    scope.launch { drawerState.close() }
                                },
                                icon = { Icon(icon, contentDescription = null) },
                                shape = RoundedCornerShape(16.dp),
                                colors = NavigationDrawerItemDefaults.colors(
                                    selectedContainerColor = BrandYellow.copy(alpha = 0.12f),
                                    selectedIconColor = BrandYellow,
                                    selectedTextColor = BrandDark,
                                    unselectedContainerColor = Color.Transparent
                                ),
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.weight(1f))
                        NavigationDrawerItem(
                            label = { Text("LOGOUT", fontWeight = FontWeight.Black) },
                            selected = false,
                            onClick = { showLogoutDialog = true },
                            icon = { Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null) },
                            colors = NavigationDrawerItemDefaults.colors(unselectedTextColor = DangerCrimson, unselectedIconColor = DangerCrimson),
                            modifier = Modifier.padding(bottom = 32.dp)
                        )
                    }
                }
            }
        ) {
            Scaffold(
                containerColor = Color.Transparent,
                topBar = {
                    TopAppBar(
                        title = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Image(
                                    painter = painterResource(id = R.drawable.logo),
                                    contentDescription = null,
                                    modifier = Modifier.size(38.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    stringResource(R.string.app_name).uppercase(),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 1.2.sp,
                                    color = BrandDark
                                )
                            }
                        },
                        actions = {
                            // ConnectionBeacon removed as requested
                            Spacer(modifier = Modifier.width(12.dp))
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(BrandDark.copy(alpha = 0.05f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Menu, contentDescription = "Menu", tint = BrandDark, modifier = Modifier.size(22.dp))
                                }
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = BrandWhite.copy(alpha = 0.8f))
                    )
                },
                bottomBar = {
                    // Modern Social-App Elite Navigation (Facebook/Instagram Grade)
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp, start = 8.dp, end = 8.dp)
                            .height(84.dp)
                            .shadow(24.dp, RoundedCornerShape(28.dp), spotColor = BrandDark.copy(alpha = 0.4f)),
                        shape = RoundedCornerShape(28.dp),
                        color = Color.White,
                        border = androidx.compose.foundation.BorderStroke(1.dp, BrandLightGrey)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            val navItems = listOf(
                                Triple(Icons.Default.Route, 0, "TRIP"),
                                Triple(Icons.Default.DirectionsCar, 1, "FLEET"),
                                Triple(Icons.Default.History, 2, "LOGS"),
                                Triple(Icons.Default.Build, 3, "MAINT")
                            )
                            
                            navItems.forEach { (icon, tab, label) ->
                                val active = selectedTab == tab
                                val scale by animateFloatAsState(if (active) 1.25f else 1f, label = "icon_scale")
                                val color by animateColorAsState(if (active) BrandYellow else BrandGrey.copy(alpha = 0.6f), label = "icon_color")
                                
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center,
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight()
                                        .clickable(
                                            interactionSource = remember { MutableInteractionSource() },
                                            indication = null
                                        ) { selectedTab = tab }
                                ) {
                                    Icon(
                                        icon, null, 
                                        tint = color,
                                        modifier = Modifier.size(28.dp).graphicsLayer {
                                            scaleX = scale; scaleY = scale
                                        }
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = if (active) FontWeight.Black else FontWeight.Bold,
                                        color = color,
                                        fontSize = 10.sp,
                                        letterSpacing = 0.5.sp
                                    )
                                    if (active) {
                                        Box(modifier = Modifier.padding(top = 4.dp).size(4.dp).background(BrandYellow, CircleShape))
                                    }
                                }
                            }
                        }
                    }
                }
            ) { padding ->
                Column(modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())) {
                    Box(modifier = Modifier.weight(1f).padding(horizontal = 20.dp)) {
                        AnimatedContent(
                            targetState = selectedTab,
                            transitionSpec = {
                                slideInHorizontally { it / 4 } + fadeIn() togetherWith slideOutHorizontally { -it / 4 } + fadeOut()
                            },
                            label = "driver_tab_anim"
                        ) { tabIndex ->
                            when (tabIndex) {
                                0 -> TripDetailsTab(driverId)
                                1 -> VehicleDetailsTab(driverId)
                                2 -> DriverHistoryScreen(driverId)
                                3 -> MaintenanceTab(driverId)
                                4 -> DriverSettingsTab(driverId)
                                5 -> DriverSupportTab()
                            }
                        }
                    }
                    CodeThriveInternalFooter()
                }
            }
        }
    }
}
