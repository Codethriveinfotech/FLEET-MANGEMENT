package com.vehicletrackingapp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.vehicletrackingapp.ui.theme.*

/**
 * Enterprise Elite Foundation - High-Stability Version.
 * Uses premium static gradients to ensure 100% hardware compatibility.
 */
@Composable
fun SpatialBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    0.0f to BrandLightYellow,
                    0.6f to BrandWhite,
                    1.0f to BrandLightGrey
                )
            )
    ) { 
        // Additional Soft Layer for depth
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Transparent, BrandYellow.copy(alpha = 0.03f))
                    )
                )
        )
        content()
    }
}
