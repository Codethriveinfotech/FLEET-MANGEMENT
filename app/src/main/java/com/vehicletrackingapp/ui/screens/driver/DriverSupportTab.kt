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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.ui.screens.common.*
import com.vehicletrackingapp.ui.theme.*

@Composable
fun DriverSupportTab() {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    val context = LocalContext.current
    var queryText by remember { mutableStateOf("") }
    var querySent by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(bottom = 100.dp)
    ) {
        SectionTitle(stringResource(R.string.help_support).uppercase())
        AttractiveHorizontalDivider()
        Spacer(modifier = Modifier.height(24.dp))

        StaggeredItem(visible, 0) {
            UltraGlassCard(glowColor = BrandYellow) {
                Text("SUBMIT A QUERY TO ADMIN", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint)
                Spacer(modifier = Modifier.height(16.dp))
                
                FuturisticTextField(
                    value = queryText, 
                    onValueChange = { queryText = it }, 
                    label = "Type your issue here...",
                    leadingIcon = Icons.Default.ChatBubble
                )
                
                Spacer(modifier = Modifier.height(20.dp))
                
                GradientButton(
                    text = "SEND TO ADMIN",
                    enabled = queryText.isNotBlank() && !querySent
                ) {
                    querySent = true
                    queryText = ""
                    android.widget.Toast.makeText(context, "Query dispatched to System Executive.", android.widget.Toast.LENGTH_SHORT).show()
                }
                
                if (querySent) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("✓ Message sent to depot office.", color = SuccessEmerald, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Text("COMMON TROUBLESHOOTING", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = TextHint, letterSpacing = 1.sp)
        Spacer(modifier = Modifier.height(16.dp))

        val faqs = listOf(
            "Odometer photo is blurry?" to "If the camera doesn't focus, try moving the phone slightly back and ensuring good lighting. You can retake the photo before submitting.",
            "Vehicle not listed?" to "Only assigned vehicles appear in your list. Contact your Admin at the depot to update your fleet assignment.",
            "Emergency breakdown?" to "Log the issue above immediately with your location. Then log the maintenance in the 'Service' tab.",
            "Malpractice Warning" to "Once a trip is submitted, all data is locked. Attempting to bypass this is against company policy."
        )

        faqs.forEachIndexed { index, (q, a) ->
            StaggeredItem(visible, index + 1) {
                FaqItem(question = q, answer = a)
                Spacer(modifier = Modifier.height(12.dp))
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}

@Composable
fun FaqItem(question: String, answer: String) {
    var expanded by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { expanded = !expanded },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.6f))
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = question, 
                    modifier = Modifier.weight(1f), 
                    style = MaterialTheme.typography.bodyMedium, 
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = BrandYellow
                )
            }
            AnimatedVisibility(visible = expanded) {
                Column {
                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider(color = Color.Black.copy(alpha = 0.05f))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = answer, style = MaterialTheme.typography.bodySmall, color = TextBody)
                }
            }
        }
    }
}
