package com.vehicletrackingapp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = BrandYellow,
    secondary = BrandDark,
    tertiary = BrandYellow,
    background = BgLuxury,
    surface = SurfaceLuxury,
    onPrimary = Color.White,
    onBackground = TextTitle,
    onSurface = TextTitle,
    error = DangerCrimson
)

private val DarkColorScheme = darkColorScheme(
    primary = BrandYellow,
    secondary = BrandLightGrey,
    tertiary = BrandYellow,
    background = BgLuxuryDark,
    surface = SurfaceLuxuryDark,
    onPrimary = Color.Black,
    onBackground = TextTitleDark,
    onSurface = TextTitleDark,
    error = DangerCrimson
)

@Composable
fun VehicleTrackingAppTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}
