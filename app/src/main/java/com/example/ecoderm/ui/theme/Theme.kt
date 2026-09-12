package com.example.ecoderm.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = EcoMint,
    onPrimary = EcoBackground,
    primaryContainer = EcoEmeraldDark,
    onPrimaryContainer = EcoMint,
    secondary = EcoEmerald,
    onSecondary = EcoTextPrimary,
    background = EcoBackground,
    surface = EcoSurface,
    surfaceVariant = EcoSurfaceVariant,
    onBackground = EcoTextPrimary,
    onSurface = EcoTextPrimary,
    onSurfaceVariant = EcoTextSecondary,
    outline = EcoSurfaceBorder
)

@Composable
fun EcoDermTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
