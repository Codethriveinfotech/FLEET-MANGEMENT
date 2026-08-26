package com.vehicletrackingapp.ui.screens.common

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.widget.Toast
import com.vehicletrackingapp.util.ImageWatermarkUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.vehicletrackingapp.ui.theme.*
import java.io.File

/**
 * Enterprise Elite Button - Premium Yellow Gradient.
 */
@Composable
fun GradientButton(
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    
    // Idle Pulse Animation
    val infiniteTransition = rememberInfiniteTransition(label = "btn_pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.02f,
        animationSpec = infiniteRepeatable(tween(1500, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse"
    )
    
    val scale by animateFloatAsState(
        if (isPressed) 0.96f else if (!loading && enabled) pulseScale else 1f, 
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
        label = "bounce"
    )

    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier
            .fillMaxWidth()
            .height(64.dp)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .shadow(
                elevation = if (isPressed) 6.dp else 16.dp, 
                shape = RoundedCornerShape(22.dp), 
                ambientColor = BrandYellow.copy(alpha = 0.5f),
                spotColor = BrandYellow.copy(alpha = 0.3f)
            )
            .background(
                brush = Brush.horizontalGradient(PremiumGradient),
                shape = RoundedCornerShape(22.dp)
            ),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, disabledContainerColor = Color.Transparent),
        shape = RoundedCornerShape(22.dp),
        contentPadding = PaddingValues(),
        interactionSource = interactionSource
    ) {
        if (loading) {
            CircularProgressIndicator(color = BrandDark, modifier = Modifier.size(26.dp), strokeWidth = 3.dp)
        } else {
            Text(
                text = text.uppercase(), 
                fontWeight = FontWeight.Black, 
                fontSize = 16.sp, 
                letterSpacing = 2.sp,
                color = BrandDark
            )
        }
    }
}

/**
 * Modern Glass Card with 20px corners and edge glow.
 */
@Composable
fun UltraGlassCard(
    modifier: Modifier = Modifier,
    glowColor: Color = Color.Transparent,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation = 16.dp,
                shape = RoundedCornerShape(22.dp),
                clip = false,
                spotColor = if (glowColor == Color.Transparent) Color.Black.copy(alpha = 0.08f) else glowColor.collectGlow()
            ),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.96f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Box {
            // High-Gloss Highlight (Top-Left)
            Canvas(modifier = Modifier.matchParentSize()) {
                drawRect(
                    brush = Brush.linearGradient(
                        0.0f to Color.White.copy(alpha = 0.12f),
                        0.4f to Color.Transparent,
                        start = Offset(0f, 0f),
                        end = Offset(size.width, size.height)
                    )
                )
            }
            
            Column(
                modifier = Modifier
                    .background(Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.04f), Color.Transparent)))
                    .border(
                        width = 1.dp,
                        brush = Brush.linearGradient(
                            0.0f to Color.White.copy(alpha = 0.6f),
                            0.5f to Color.Transparent,
                            1.0f to Color.Black.copy(alpha = 0.02f)
                        ),
                        shape = RoundedCornerShape(22.dp)
                    )
                    .padding(16.dp),
                content = content
            )
        }
    }
}

private fun Color.collectGlow(): Color = this.copy(alpha = 0.4f)

@Composable
fun PremiumGlassCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) = UltraGlassCard(modifier, content = content)
@Composable
fun GlassCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) = UltraGlassCard(modifier, content = content)

typealias ColumnScope = androidx.compose.foundation.layout.ColumnScope

/**
 * Enterprise Text Field with keyboard avoidance and auto-focus support.
 */
@Composable
fun EliteTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    isPassword: Boolean = false,
    leadingIcon: ImageVector? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    enabled: Boolean = true
) {
    var passwordVisible by remember { mutableStateOf(false) }
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val borderColor by animateColorAsState(
        targetValue = if (isFocused) BrandYellow else Color.Transparent,
        animationSpec = tween(200), label = "border"
    )
    val glowAlpha by animateFloatAsState(
        targetValue = if (isFocused) 0.08f else 0f,
        animationSpec = tween(300), label = "glow"
    )
    val labelOffset by animateDpAsState(
        targetValue = if (isFocused || value.isNotEmpty()) (-22).dp else 0.dp,
        label = "labelOffset"
    )

    Column(modifier = modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .shadow(
                    elevation = if (isFocused) 6.dp else 0.dp,
                    shape = RoundedCornerShape(14.dp),
                    clip = false,
                    spotColor = BrandYellow.copy(alpha = glowAlpha)
                )
                .background(BrandLightGrey.copy(alpha = 0.75f), RoundedCornerShape(14.dp))
                .border(1.dp, borderColor, RoundedCornerShape(14.dp))
                .padding(horizontal = 16.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (leadingIcon != null) {
                    Icon(
                        imageVector = leadingIcon,
                        contentDescription = null,
                        tint = if (isFocused) BrandYellow else BrandGrey,
                        modifier = Modifier.size(26.dp)
                    )
                    Spacer(modifier = Modifier.width(18.dp))
                }

                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
                    Text(
                        text = label,
                        color = if (isFocused) BrandYellow else BrandGrey,
                        fontSize = if (isFocused || value.isNotEmpty()) 12.sp else 16.sp,
                        fontWeight = if (isFocused || value.isNotEmpty()) FontWeight.Black else FontWeight.Medium,
                        modifier = Modifier.offset(y = labelOffset)
                    )

                    BasicTextField(
                        value = value,
                        onValueChange = onValueChange,
                        modifier = Modifier.fillMaxWidth().padding(top = if (value.isNotEmpty() || isFocused) 20.dp else 0.dp),
                        enabled = enabled,
                        textStyle = TextStyle(
                            color = if (enabled) BrandText else BrandGrey,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.SemiBold
                        ),
                        visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
                        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
                        keyboardActions = keyboardActions,
                        interactionSource = interactionSource,
                        cursorBrush = Brush.verticalGradient(listOf(BrandYellow, BrandYellow))
                    )
                }

                if (isPassword) {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            contentDescription = null,
                            tint = BrandGrey,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun FuturisticTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    isPassword: Boolean = false,
    leadingIcon: ImageVector? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    enabled: Boolean = true
) = EliteTextField(value, onValueChange, label, modifier, isPassword, leadingIcon, keyboardType, imeAction, keyboardActions, enabled)

@Composable
fun AppTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    isPassword: Boolean = false,
    leadingIcon: ImageVector? = null,
    keyboardType: KeyboardType = KeyboardType.Text
) = EliteTextField(value, onValueChange, label, modifier, isPassword, leadingIcon, keyboardType)

@Composable
fun CameraGalleryPicker(
    label: String,
    imageUri: Uri?,
    onImageSelected: (Uri) -> Unit
) {
    val context = LocalContext.current
    var pendingUri by remember { mutableStateOf<Uri?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    
    var showFullscreen by remember { mutableStateOf(false) }
    var metadata by remember(imageUri) { mutableStateOf<Pair<String, String>?>(null) }
    LaunchedEffect(imageUri) {
        if (imageUri != null) {
            coroutineScope.launch(Dispatchers.IO) {
                val data = ImageWatermarkUtils.getPhotoMetadata(context, imageUri)
                withContext(Dispatchers.Main) {
                    metadata = data
                }
            }
        } else {
            metadata = null
        }
    }
    
    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success && pendingUri != null) {
            isProcessing = true
            coroutineScope.launch(Dispatchers.IO) {
                val base64Str = ImageWatermarkUtils.watermarkAndConvertToBase64(context, pendingUri!!)
                withContext(Dispatchers.Main) {
                    isProcessing = false
                    val finalUri = base64Str?.let { Uri.parse(it) } ?: pendingUri!!
                    onImageSelected(finalUri)
                }
            }
        }
    }
    
    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            isProcessing = true
            coroutineScope.launch(Dispatchers.IO) {
                val base64Str = ImageWatermarkUtils.watermarkAndConvertToBase64(context, uri)
                withContext(Dispatchers.Main) {
                    isProcessing = false
                    val finalUri = base64Str?.let { Uri.parse(it) } ?: uri
                    onImageSelected(finalUri)
                }
            }
        }
    }

    val permissionsLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        if (cameraGranted) {
            launchCamera(context) { pendingUri = it; cameraLauncher.launch(it) }
        } else {
            Toast.makeText(context, "Camera permission denied", Toast.LENGTH_SHORT).show()
        }
    }


    Column {
        Text(label, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black, color = BrandText)
        Spacer(modifier = Modifier.height(14.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(BrandLightGrey)
                    .clickable(enabled = imageUri != null) { showFullscreen = true },
                contentAlignment = Alignment.Center
            ) {
                if (imageUri != null) {
                    AsyncImage(
                        model = coil.request.ImageRequest.Builder(context)
                            .data(ImageWatermarkUtils.parseImageModel(imageUri))
                            .memoryCachePolicy(coil.request.CachePolicy.DISABLED)
                            .diskCachePolicy(coil.request.CachePolicy.DISABLED)
                            .build(),
                        contentDescription = null, 
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Icon(Icons.Default.DirectionsCar, contentDescription = null, tint = BrandGrey.copy(alpha = 0.3f), modifier = Modifier.size(40.dp))
                }
            }
            Spacer(modifier = Modifier.width(28.dp))
            if (isProcessing) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.height(110.dp)
                ) {
                    CircularProgressIndicator(color = BrandYellow, modifier = Modifier.size(28.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("WATERMARKING...", fontSize = 10.sp, color = BrandYellow, fontWeight = FontWeight.Black)
                }
            } else {
                Column {
                    OutlinedButton(
                        onClick = {
                            val hasCamera = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                            if (hasCamera) {
                                launchCamera(context) { pendingUri = it; cameraLauncher.launch(it) }
                            } else {
                                permissionsLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.CAMERA,
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        },
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(20.dp))
                        Text(" CAMERA", fontWeight = FontWeight.Black, fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(
                        onClick = { galleryLauncher.launch("image/*") },
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Photo, contentDescription = null, modifier = Modifier.size(20.dp))
                        Text(" GALLERY", fontWeight = FontWeight.Black, fontSize = 12.sp)
                    }
                }
            }
        }
        metadata?.let { meta ->
            Spacer(modifier = Modifier.height(8.dp))
            Column(modifier = Modifier.padding(start = 4.dp)) {
                Text("📅 ${meta.first}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BrandDark)
                Text("📍 ${meta.second}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BrandDark)
            }
        }
    }
    if (showFullscreen && imageUri != null) {
        FullscreenImageViewer(imageUri = imageUri, onDismiss = { showFullscreen = false })
    }
}

@Composable
fun CameraOnlyPicker(
    label: String,
    imageUri: Uri?,
    onImageSelected: (Uri?) -> Unit,
    enabled: Boolean = true
) {
    val context = LocalContext.current
    var pendingUri by remember { mutableStateOf<Uri?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    
    var showFullscreen by remember { mutableStateOf(false) }
    var metadata by remember(imageUri) { mutableStateOf<Pair<String, String>?>(null) }
    LaunchedEffect(imageUri) {
        if (imageUri != null) {
            coroutineScope.launch(Dispatchers.IO) {
                val data = ImageWatermarkUtils.getPhotoMetadata(context, imageUri)
                withContext(Dispatchers.Main) {
                    metadata = data
                }
            }
        } else {
            metadata = null
        }
    }
    
    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success && pendingUri != null) {
            isProcessing = true
            coroutineScope.launch(Dispatchers.IO) {
                val base64Str = ImageWatermarkUtils.watermarkAndConvertToBase64(context, pendingUri!!)
                withContext(Dispatchers.Main) {
                    isProcessing = false
                    val finalUri = base64Str?.let { Uri.parse(it) } ?: pendingUri!!
                    onImageSelected(finalUri)
                }
            }
        }
    }

    val permissionsLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        if (cameraGranted) {
            launchCamera(context) { pendingUri = it; cameraLauncher.launch(it) }
        } else {
            Toast.makeText(context, "Camera permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    Column {
        Text(label, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = BrandGrey)
        Spacer(modifier = Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(130.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(BrandLightGrey)
                    .clickable(enabled = !isProcessing) {
                        if (imageUri != null) {
                            showFullscreen = true
                        } else if (enabled) {
                            val hasCamera = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                            if (hasCamera) {
                                launchCamera(context) { pendingUri = it; cameraLauncher.launch(it) }
                            } else {
                                permissionsLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.CAMERA,
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                if (isProcessing) {
                    CircularProgressIndicator(color = BrandYellow, modifier = Modifier.size(36.dp))
                } else if (imageUri != null) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        AsyncImage(
                            model = coil.request.ImageRequest.Builder(context)
                                .data(ImageWatermarkUtils.parseImageModel(imageUri))
                                .memoryCachePolicy(coil.request.CachePolicy.DISABLED)
                                .diskCachePolicy(coil.request.CachePolicy.DISABLED)
                                .build(),
                            contentDescription = null, 
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                        // Explicit Remove Icon - only if enabled
                        if (enabled) {
                            IconButton(
                                onClick = { onImageSelected(null) },
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(6.dp)
                                    .size(32.dp)
                                    .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                            ) {
                                Icon(Icons.Default.Close, null, tint = Color.White, modifier = Modifier.size(18.dp))
                            }
                        }
                    }
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, tint = if (enabled) BrandYellow else BrandGrey, modifier = Modifier.size(44.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("VERIFY", fontSize = 12.sp, color = if (enabled) BrandYellow else BrandGrey, fontWeight = FontWeight.Black)
                    }
                }
            }
            Spacer(modifier = Modifier.width(24.dp))
            Column {
                Text(
                    text = if (isProcessing) "PROCESSING..." else if (imageUri != null) "CAPTURED ✓" else "SECURE CAPTURE",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black,
                    color = if (isProcessing) BrandYellow else if (imageUri != null) SuccessEmerald else if (enabled) BrandYellow else BrandGrey
                )
                Text(
                    text = if (isProcessing) "Applying location & time..." else if (imageUri != null) (if (enabled) "Tap image to view / retake" else "Submission locked") else "Live photo only",
                    fontSize = 12.sp,
                    color = BrandGrey
                )
                metadata?.let { meta ->
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("📅 ${meta.first}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BrandDark)
                    Text("📍 ${meta.second}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BrandDark)
                }
            }
        }
    }
    if (showFullscreen && imageUri != null) {
        FullscreenImageViewer(imageUri = imageUri, onDismiss = { showFullscreen = false })
    }
}

private fun launchCamera(context: Context, onUriReady: (Uri) -> Unit) {
    try {
        val directory = File(context.filesDir, "images")
        if (!directory.exists()) directory.mkdirs()
        val file = File(directory, "img_${System.currentTimeMillis()}.jpg")
        val authority = "com.vehicletrackingapp.fileprovider"
        val uri = FileProvider.getUriForFile(context, authority, file)
        onUriReady(uri)
    } catch (e: Exception) {
        e.printStackTrace()
        Toast.makeText(context, "Camera Error: ${e.message}", Toast.LENGTH_LONG).show()
    }
}

@Composable
fun FullscreenImageViewer(imageUri: Uri, onDismiss: () -> Unit) {
    val context = LocalContext.current
    var metadata by remember { mutableStateOf<Pair<String, String>?>(null) }

    LaunchedEffect(imageUri) {
        val data = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            ImageWatermarkUtils.getPhotoMetadata(context, imageUri)
        }
        metadata = data
    }

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onDismiss,
        properties = androidx.compose.ui.window.DialogProperties(
            usePlatformDefaultWidth = false,
            dismissOnClickOutside = true,
            dismissOnBackPress = true
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
                .clickable { onDismiss() }
        ) {
            AsyncImage(
                model = coil.request.ImageRequest.Builder(context)
                    .data(ImageWatermarkUtils.parseImageModel(imageUri))
                    .memoryCachePolicy(coil.request.CachePolicy.DISABLED)
                    .diskCachePolicy(coil.request.CachePolicy.DISABLED)
                    .build(),
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .wrapContentHeight()
                    .align(Alignment.Center),
                contentScale = ContentScale.Fit
            )

            // Top close button
            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp)
                    .size(44.dp)
                    .background(Color.Black.copy(alpha = 0.55f), CircleShape)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
            }

            // Bottom metadata panel
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f))
                        )
                    )
                    .padding(horizontal = 24.dp, vertical = 20.dp)
            ) {
                metadata?.let { meta ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Schedule,
                            contentDescription = null,
                            tint = Color(0xFFFFD700),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = meta.first,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = Color(0xFFFFD700),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = meta.second,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                } ?: run {
                    Text(
                        text = "Reading metadata...",
                        color = Color.White.copy(alpha = 0.5f),
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}


@Composable
fun SectionTitle(text: String) {
    Text(
        text = text, 
        style = MaterialTheme.typography.titleMedium.copy(
            brush = Brush.linearGradient(listOf(BrandYellow, BrandGrey)),
            fontWeight = FontWeight.Black
        ),
        modifier = Modifier.padding(vertical = 28.dp),
        letterSpacing = 2.sp
    )
}

@Composable
fun BentoTile(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    trend: String? = null
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = spring(dampingRatio = 0.7f, stiffness = 400f),
        label = "bounce"
    )

    Card(
        modifier = modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .shadow(
                elevation = if (isPressed) 6.dp else 12.dp, 
                shape = RoundedCornerShape(22.dp), 
                ambientColor = color.copy(alpha = 0.2f),
                spotColor = color.copy(alpha = 0.1f)
            )
            .clickable(interactionSource = interactionSource, indication = null) { },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Box {
            // Internal Gloss Shine
            Canvas(modifier = Modifier.matchParentSize()) {
                drawCircle(
                    brush = Brush.radialGradient(
                        listOf(color.copy(alpha = 0.04f), Color.Transparent),
                        center = Offset(0f, 0f),
                        radius = size.width * 1.5f
                    ),
                    radius = size.width * 1.5f,
                    center = Offset(0f, 0f)
                )
            }

            Column(modifier = Modifier.padding(20.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(color.copy(alpha = 0.08f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
                    }
                    
                    if (trend != null) {
                        Text(
                            text = trend,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Black,
                            color = SuccessEmerald,
                            modifier = Modifier
                                .background(SuccessEmerald.copy(alpha = 0.08f), CircleShape)
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(20.dp))
                
                Text(
                    text = value, 
                    style = MaterialTheme.typography.headlineMedium, 
                    fontWeight = FontWeight.Black, 
                    color = BrandDark,
                    letterSpacing = (-0.5).sp
                )
                Text(
                    text = title, 
                    style = MaterialTheme.typography.labelSmall, 
                    fontWeight = FontWeight.Bold, 
                    color = BrandGrey, 
                    letterSpacing = 0.5.sp
                )
            }
        }
    }
}

@Composable
fun StaggeredItem(visible: Boolean, index: Int, content: @Composable () -> Unit) {
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(600, delayMillis = index * 80)) + 
                slideInVertically(
                    animationSpec = spring(dampingRatio = 0.75f, stiffness = Spring.StiffnessMedium),
                    initialOffsetY = { it / 6 }
                ) +
                scaleIn(
                    animationSpec = spring(dampingRatio = 0.75f, stiffness = Spring.StiffnessMedium),
                    initialScale = 0.97f,
                    transformOrigin = TransformOrigin(0.5f, 0f)
                )
    ) {
        content()
    }
}

@Composable
fun ConnectionBeacon(isConnected: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "beacon")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse),
        label = "alpha"
    )

    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.8f))
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(12.dp)
                .graphicsLayer { this.alpha = alpha }
                .background(if (isConnected) SuccessEmerald else DangerCrimson, CircleShape)
                .shadow(if (isConnected) 8.dp else 0.dp, CircleShape, spotColor = SuccessEmerald)
        )
        if (isConnected) {
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = androidx.compose.ui.res.stringResource(com.vehicletrackingapp.R.string.backend_live).uppercase(),
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Black,
                color = SuccessEmerald,
                letterSpacing = 1.2.sp
            )
        }
    }
}

fun Modifier.shineEffect(): Modifier = this.composed {
    val transition = rememberInfiniteTransition(label = "shine")
    val translateAnim by transition.animateFloat(
        initialValue = -1200f,
        targetValue = 1200f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shineTranslate"
    )

    val shineColors = listOf(
        Color.White.copy(alpha = 0f),
        Color.White.copy(alpha = 0.4f),
        Color.White.copy(alpha = 0.7f),
        Color.White.copy(alpha = 0.4f),
        Color.White.copy(alpha = 0f),
    )

    val brush = Brush.linearGradient(
        colors = shineColors,
        start = Offset(translateAnim, translateAnim),
        end = Offset(translateAnim + 350f, translateAnim + 350f)
    )
    this.background(brush)
}

@Composable
fun EliteLoginFooter() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        HorizontalDivider(modifier = Modifier.width(60.dp).padding(bottom = 24.dp), color = BrandYellow.copy(alpha = 0.4f))
        Text(
            text = "DEVELOPED BY",
            style = MaterialTheme.typography.labelSmall,
            color = BrandGrey,
            fontSize = 9.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 2.sp
        )
        Spacer(modifier = Modifier.height(16.dp))
        Image(
            painter = painterResource(id = com.vehicletrackingapp.R.drawable.codethrive),
            contentDescription = null,
            modifier = Modifier.height(40.dp).graphicsLayer { alpha = 0.95f },
            contentScale = ContentScale.Fit
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "CODETHRIVE INFOTECH",
            style = MaterialTheme.typography.labelLarge,
            color = BrandDark,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp
        )
        Text(
            text = "REL_V1.0.5",
            style = MaterialTheme.typography.labelSmall,
            color = BrandGrey.copy(alpha = 0.5f),
            fontSize = 8.sp,
            modifier = Modifier.padding(top = 4.dp),
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun CodeThriveInternalFooter() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 32.dp, horizontal = 20.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.height(1.dp).weight(1f).background(Brush.horizontalGradient(listOf(Color.Transparent, BrandYellow.copy(alpha = 0.25f)))))
        Spacer(modifier = Modifier.width(16.dp))
        Image(
            painter = painterResource(id = com.vehicletrackingapp.R.drawable.codethrive),
            contentDescription = null,
            modifier = Modifier.height(20.dp),
            contentScale = ContentScale.Fit
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = "DEVELOPED BY CODETHRIVE INFOTECH",
            style = MaterialTheme.typography.labelSmall,
            color = BrandGrey.copy(alpha = 0.8f),
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp,
            fontSize = 9.sp
        )
        Spacer(modifier = Modifier.width(16.dp))
        Box(modifier = Modifier.height(1.dp).weight(1f).background(Brush.horizontalGradient(listOf(BrandYellow.copy(alpha = 0.25f), Color.Transparent))))
    }
}

@Composable
fun AttractiveHorizontalDivider() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(2.dp)
            .background(Brush.horizontalGradient(listOf(Color.Transparent, BrandYellow.copy(alpha = 0.3f), Color.Transparent)))
    )
}
