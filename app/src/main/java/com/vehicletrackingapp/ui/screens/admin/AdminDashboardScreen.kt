package com.vehicletrackingapp.ui.screens.admin

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.ui.components.SpatialBackground
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*
import com.vehicletrackingapp.data.repo.AppRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Locale

private data class AdminMenuItem(
    val labelRes: Int,
    val icon: ImageVector,
    val tabIndex: Int
)

@Composable
fun AdminDashboardScreen(onLogout: () -> Unit) {
    var selectedTab by remember { mutableIntStateOf(1) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val connectivity by AppRepository.isConnected.collectAsState(initial = true)

    LaunchedEffect(Unit) {
        AppRepository.syncPendingData()
    }

    val menuItems = listOf(
        AdminMenuItem(R.string.reports, Icons.AutoMirrored.Filled.Assignment, 0),
        AdminMenuItem(R.string.admin_dashboard, Icons.Default.Dashboard, 1),
        AdminMenuItem(R.string.vehicle_management, Icons.Default.Settings, 2),
        AdminMenuItem(R.string.driver_management, Icons.Default.Group, 3),
        AdminMenuItem(R.string.vehicle_list, Icons.AutoMirrored.Filled.List, 4),
        AdminMenuItem(R.string.maintenance, Icons.Default.Build, 5),
        AdminMenuItem(R.string.profile, Icons.Default.Person, 6)
    )

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
                                    .size(64.dp)
                                    .clip(RoundedCornerShape(18.dp))
                                    .background(BrandYellow.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.logo),
                                    contentDescription = null,
                                    modifier = Modifier.size(48.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Column {
                                Text(stringResource(R.string.admin_login), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = BrandDark)
                                Text(stringResource(R.string.system_executive), style = MaterialTheme.typography.labelSmall, color = BrandYellow, fontWeight = FontWeight.Black)
                            }
                        }
                        Spacer(modifier = Modifier.height(32.dp))
                        HorizontalDivider(color = Color.Black.copy(alpha = 0.05f))
                        Spacer(modifier = Modifier.height(16.dp))

                        menuItems.forEach { item ->
                            NavigationDrawerItem(
                                label = { Text(stringResource(item.labelRes), fontWeight = FontWeight.Bold) },
                                selected = selectedTab == item.tabIndex,
                                onClick = {
                                    selectedTab = item.tabIndex
                                    scope.launch { drawerState.close() }
                                },
                                icon = { Icon(item.icon, contentDescription = null) },
                                shape = RoundedCornerShape(16.dp),
                                colors = NavigationDrawerItemDefaults.colors(
                                    selectedContainerColor = BrandYellow.copy(alpha = 0.12f),
                                    selectedIconColor = BrandYellow,
                                    unselectedContainerColor = Color.Transparent
                                ),
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }

                        Spacer(modifier = Modifier.weight(1f))
                        NavigationDrawerItem(
                            label = { Text("LOGOUT", fontWeight = FontWeight.Black) },
                            selected = false,
                            onClick = onLogout,
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
                            Text(stringResource(menuItems.find { it.tabIndex == selectedTab }?.labelRes ?: R.string.admin_dashboard).uppercase(), fontWeight = FontWeight.Black, letterSpacing = 1.sp, color = BrandDark, fontSize = 16.sp) 
                        },
                        navigationIcon = {
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Box(modifier = Modifier.size(38.dp).clip(CircleShape).background(BrandDark.copy(alpha = 0.05f)), contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Menu, contentDescription = "Menu", tint = BrandDark, modifier = Modifier.size(20.dp))
                                }
                            }
                        },
                        actions = {
                            // Technical status beacons removed as requested
                            Spacer(modifier = Modifier.width(16.dp))
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
                            val footerItems = listOf(
                                Triple(Icons.Default.Dashboard, 1, "HUB"),
                                Triple(Icons.AutoMirrored.Filled.Assignment, 0, "REPORTS"),
                                Triple(Icons.Default.Group, 3, "FLEET"),
                                Triple(Icons.Default.Build, 5, "MAINT")
                            )
                            
                            footerItems.forEach { (icon, tab, label) ->
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
                                if (targetState > initialState) {
                                    (slideInHorizontally { it / 2 } + fadeIn()).togetherWith(slideOutHorizontally { -it / 2 } + fadeOut())
                                } else {
                                    (slideInHorizontally { -it / 2 } + fadeIn()).togetherWith(slideOutHorizontally { it / 2 } + fadeOut())
                                }.using(SizeTransform(clip = false))
                            },
                            label = "admin_tab_anim"
                        ) { tabIndex ->
                            when (tabIndex) {
                                0 -> ReportsTab()
                                1 -> AdminSummaryScreen()
                                2 -> VehicleManagementTab()
                                3 -> DriverManagementTab()
                                4 -> VehicleListTab()
                                5 -> MaintenanceHistoryScreen()
                                6 -> AdminProfileTab()
                            }
                        }
                    }
                    CodeThriveInternalFooter()
                }
            }
        }
    }
}

@Composable
fun AdminSummaryScreen() {
    val vehicles by AppRepository.getAllVehicles().collectAsState(initial = emptyList())
    val trips by AppRepository.getAllTrips().collectAsState(initial = emptyList())
    val drivers by AppRepository.getAllDrivers().collectAsState(initial = emptyList())
    val maintenance by AppRepository.getAllMaintenance().collectAsState(initial = emptyList())

    var startAnims by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { delay(100); startAnims = true }

    val activeVehiclesCount by animateIntAsState(if (startAnims) vehicles.size else 0, tween(1200))
    val onTripCount by animateIntAsState(if (startAnims) trips.count { it.endTime.isBlank() || it.status.equals("draft", ignoreCase = true) } else 0, tween(1200))
    val totalDriversCount by animateIntAsState(if (startAnims) drivers.size else 0, tween(1200))
    val maintenanceCount by animateIntAsState(if (startAnims) maintenance.size else 0, tween(1200))

    Column(modifier = Modifier.fillMaxSize().padding(vertical = 16.dp)) {
        StaggeredItem(visible = startAnims, index = 0) {
            Column {
                SectionTitle(stringResource(R.string.fleet_overview))
                AttractiveHorizontalDivider()
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // LiveTelemetryTicker removed as requested
        
        Row(modifier = Modifier.fillMaxWidth()) {
            BentoTile(
                title = stringResource(R.string.vehicle_list).uppercase(),
                value = String.format(Locale.getDefault(), "%02d", activeVehiclesCount),
                icon = Icons.Default.DirectionsCar,
                color = BrandYellow,
                trend = "+2",
                modifier = Modifier.weight(1f).graphicsLayer { translationY = if (startAnims) 0f else 40f }
            )
            Spacer(modifier = Modifier.width(16.dp))
            BentoTile(
                title = "ON-TRIP",
                value = String.format(Locale.getDefault(), "%02d", onTripCount),
                icon = Icons.Default.Route,
                color = SuccessEmerald,
                trend = null,
                modifier = Modifier.weight(1f).graphicsLayer { translationY = if (startAnims) 0f else 60f }
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(modifier = Modifier.fillMaxWidth()) {
            BentoTile(
                title = stringResource(R.string.maintenance).uppercase(),
                value = String.format(Locale.getDefault(), "%02d", maintenanceCount),
                icon = Icons.Default.Build,
                color = WarningSunset,
                trend = "NEW",
                modifier = Modifier.weight(1f).graphicsLayer { translationY = if (startAnims) 0f else 80f }
            )
            Spacer(modifier = Modifier.width(16.dp))
            BentoTile(
                title = stringResource(R.string.driver_management).uppercase(),
                value = String.format(Locale.getDefault(), "%02d", totalDriversCount),
                icon = Icons.Default.Group,
                color = BrandIndigo,
                trend = "+1",
                modifier = Modifier.weight(1f).graphicsLayer { translationY = if (startAnims) 0f else 100f }
            )
        }
        

    }
}

@Composable
fun LiveSignalWave() {
    val infiniteTransition = rememberInfiniteTransition(label = "wave")
    val phase by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 2 * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(tween(3000, easing = LinearEasing), RepeatMode.Restart),
        label = "phase"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(140.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(BrandDark)
            .border(1.dp, BrandWhite.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
            .padding(20.dp)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height
            val centerY = height / 2
            val points = 60
            val path = androidx.compose.ui.graphics.Path()
            
            for (i in 0..points) {
                val x = (i.toFloat() / points) * width
                val wave1 = Math.sin((i.toDouble() / 10) + phase).toFloat() * 20f
                val wave2 = Math.sin((i.toDouble() / 5) - phase * 1.5).toFloat() * 10f
                val y = centerY + wave1 + wave2
                
                if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
            }
            
            drawPath(
                path = path,
                brush = Brush.horizontalGradient(listOf(BrandYellow.copy(alpha = 0.1f), BrandYellow, BrandYellow.copy(alpha = 0.1f))),
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.dp.toPx(), cap = androidx.compose.ui.graphics.StrokeCap.Round)
            )
            
            // Grid Lines
            for (j in 1..3) {
                val h = (height / 4) * j
                drawLine(Color.White.copy(alpha = 0.03f), Offset(0f, h), Offset(width, h), strokeWidth = 1.dp.toPx())
            }
        }
        
        Column(modifier = Modifier.align(Alignment.TopEnd), horizontalAlignment = Alignment.End) {
            Text("SYNC: 99.8%", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = SuccessEmerald, fontSize = 9.sp)
            Text("LATENCY: 12MS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = BrandYellow, fontSize = 9.sp)
        }
        
        Text("REAL-TIME ENGINE DATA", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = Color.White.copy(alpha = 0.3f), modifier = Modifier.align(Alignment.BottomStart))
    }
}

@Composable
fun LiveTelemetryTicker() {
    val infiniteTransition = rememberInfiniteTransition(label = "ticker")
    val offset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -1500f,
        animationSpec = infiniteRepeatable(tween(35000, easing = LinearEasing), RepeatMode.Restart),
        label = "offset"
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(44.dp)
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, BrandYellow.copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
        color = BrandDark.copy(alpha = 0.95f)
    ) {
        Row(modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(SuccessEmerald, CircleShape)
                    .shadow(8.dp, CircleShape, spotColor = SuccessEmerald)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text("TERMINAL", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = SuccessEmerald, fontFamily = FontFamily.Monospace)
            Spacer(modifier = Modifier.width(12.dp))
            VerticalDivider(color = BrandWhite.copy(alpha = 0.1f), modifier = Modifier.height(16.dp))
            Spacer(modifier = Modifier.width(12.dp))
            
            Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
                Row(modifier = Modifier.offset(x = offset.dp)) {
                    repeat(20) {
                        StatusCode(text = "OK", color = SuccessEmerald)
                        TickerText("SECURE_TUNNEL_ESTABLISHED")
                        StatusCode(text = "WARN", color = WarningSunset)
                        TickerText("NODE_LATENCY_SPIKE_DETECTION")
                        StatusCode(text = "INFO", color = BrandYellow)
                        TickerText("SYNCING_FLEET_DATABASE_V4")
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusCode(text: String, color: Color) {
    Text(
        " [$text] ", 
        color = color, 
        style = MaterialTheme.typography.labelSmall, 
        fontWeight = FontWeight.Bold, 
        fontFamily = FontFamily.Monospace
    )
}

@Composable
private fun TickerText(text: String) {
    Text(
        "$text • ", 
        color = BrandWhite.copy(alpha = 0.6f), 
        style = MaterialTheme.typography.labelSmall, 
        fontWeight = FontWeight.Medium, 
        fontFamily = FontFamily.Monospace,
        letterSpacing = 0.5.sp
    )
}

@Composable
fun MaintenanceHistoryScreen() {
    val maintenanceList by AppRepository.getAllMaintenance().collectAsState(initial = emptyList())
    val vehicles by AppRepository.getAllVehicles().collectAsState(initial = emptyList())
    val drivers by AppRepository.getAllDrivers().collectAsState(initial = emptyList())
    val context = androidx.compose.ui.platform.LocalContext.current
    
    var filterVehicleId by remember { mutableStateOf<String?>(null) }
    var filterType by remember { mutableStateOf<String?>(null) }
    var filterDate by remember { mutableStateOf<String?>(null) }
    
    var vehicleMenuExpanded by remember { mutableStateOf(false) }
    var typeMenuExpanded by remember { mutableStateOf(false) }

    val filteredMaintenance = maintenanceList.filter { main ->
        (filterVehicleId == null || main.vehicleId == filterVehicleId) &&
        (filterType == null || main.maintenanceType.equals(filterType, ignoreCase = true)) &&
        (filterDate == null || main.date == filterDate)
    }
    
    val allTypes = maintenanceList.map { it.maintenanceType }.distinct()

    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        SectionTitle("MAINTENANCE LOGS")
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(16.dp))
        
        // Filters
        UltraGlassCard {
            Text("FILTER INTELLIGENCE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 1.sp)
            Spacer(modifier = Modifier.height(16.dp))
            
            // Vehicle Filter
            Box(modifier = Modifier.fillMaxWidth()) {
                val selectedVehicle = vehicles.find { it.id == filterVehicleId }
                OutlinedTextField(
                    value = selectedVehicle?.let { "${it.number} (${it.model})" } ?: "All Vehicles",
                    onValueChange = {}, readOnly = true, modifier = Modifier.fillMaxWidth(),
                    label = { Text("Filter by Asset", color = TextHint) },
                    trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                    enabled = false
                )
                Box(modifier = Modifier.matchParentSize().background(Color.Transparent).clickable { vehicleMenuExpanded = true })
                DropdownMenu(expanded = vehicleMenuExpanded, onDismissRequest = { vehicleMenuExpanded = false }) {
                    DropdownMenuItem(text = { Text("All Vehicles", fontWeight = FontWeight.Bold) }, onClick = { filterVehicleId = null; filterType = null; filterDate = null; vehicleMenuExpanded = false })
                    vehicles.forEach { v ->
                        DropdownMenuItem(
                            text = { Text("${v.number} - ${v.model}", fontWeight = FontWeight.Black) },
                            onClick = { filterVehicleId = v.id; filterType = null; filterDate = null; vehicleMenuExpanded = false }
                        )
                    }
                }
            }
            
            if (filterVehicleId != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    // Type Filter
                    Box(modifier = Modifier.weight(1f)) {
                        OutlinedTextField(
                            value = filterType ?: "All Types",
                            onValueChange = {}, readOnly = true, modifier = Modifier.fillMaxWidth(),
                            label = { Text("Service Type", color = TextHint) },
                            trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, tint = BrandYellow) },
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                            enabled = false
                        )
                        Box(modifier = Modifier.matchParentSize().background(Color.Transparent).clickable { typeMenuExpanded = true })
                        DropdownMenu(expanded = typeMenuExpanded, onDismissRequest = { typeMenuExpanded = false }) {
                            DropdownMenuItem(text = { Text("All Types", fontWeight = FontWeight.Bold) }, onClick = { filterType = null; typeMenuExpanded = false })
                            allTypes.forEach { t ->
                                DropdownMenuItem(
                                    text = { Text(t.uppercase(), fontWeight = FontWeight.Black) },
                                    onClick = { filterType = t; typeMenuExpanded = false }
                                )
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.width(12.dp))
                    
                    // Date Filter
                    Box(modifier = Modifier.weight(1f).clickable {
                        com.vehicletrackingapp.util.PickerUtils.showDatePicker(context) { date -> filterDate = date }
                    }) {
                        OutlinedTextField(
                            value = filterDate ?: "All Dates",
                            onValueChange = {}, readOnly = true, enabled = false,
                            label = { Text("Service Date", color = TextHint) },
                            colors = OutlinedTextFieldDefaults.colors(disabledTextColor = BrandDark, disabledBorderColor = Color.Black.copy(alpha = 0.08f), disabledLabelColor = TextHint),
                            modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                            leadingIcon = { Icon(Icons.Default.CalendarToday, null, tint = BrandYellow) }
                        )
                        if (filterDate != null) {
                            IconButton(onClick = { filterDate = null }, modifier = Modifier.align(Alignment.CenterEnd)) {
                                Icon(Icons.Default.Clear, null, tint = BrandGrey)
                            }
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        if (filteredMaintenance.isEmpty()) {
            Text("No maintenance records found for the selected filters.", color = TextHint, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(16.dp))
        } else {
            filteredMaintenance.forEach { main ->
                val vehicle = vehicles.find { it.id == main.vehicleId }
                val driver = drivers.find { it.id == main.driverId }
                
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = WarningSunset.copy(alpha = 0.05f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, WarningSunset.copy(alpha = 0.15f))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Build, null, tint = WarningSunset, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(main.maintenanceType.uppercase(), fontWeight = FontWeight.Black, color = WarningSunset, fontSize = 16.sp)
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Text("VALUATION: INR ${main.cost}", fontWeight = FontWeight.Black, fontSize = 22.sp, color = BrandDark)
                        Spacer(modifier = Modifier.height(16.dp))
                        AttractiveHorizontalDivider()
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("ASSET IDENTIFICATION", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                                Text(vehicle?.let { "${it.number} (${it.model})" } ?: "UNKNOWN", fontWeight = FontWeight.Bold, color = BrandDark)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("OPERATOR", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                                Text(driver?.name ?: "UNKNOWN", fontWeight = FontWeight.Bold, color = BrandDark)
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("DATE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                                Text(main.date, fontWeight = FontWeight.Bold, color = BrandDark)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("TIME", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                                Text(main.time, fontWeight = FontWeight.Bold, color = BrandDark)
                            }
                        }
                        
                        if (main.description.isNotBlank()) {
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("SERVICE NOTES", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                            Text(main.description, style = MaterialTheme.typography.bodyMedium, color = BrandDark)
                        }
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(60.dp))
    }
}
