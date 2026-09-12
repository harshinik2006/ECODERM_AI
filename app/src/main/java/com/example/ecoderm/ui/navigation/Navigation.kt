package com.example.ecoderm.ui.navigation

import android.graphics.Bitmap
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ecoderm.data.model.ScanRecord
import com.example.ecoderm.ui.screens.*
import com.example.ecoderm.ui.theme.*
import com.example.ecoderm.ui.viewmodel.EcoDermViewModel

enum class AppDestination(val title: String, val icon: ImageVector) {
    HOME("Home", Icons.Default.Home),
    SCAN("Scan", Icons.Default.CameraAlt),
    HISTORY("History", Icons.Default.History),
    PROGRESS("Progress", Icons.Default.TrendingUp)
}

@Composable
fun EcoDermApp(viewModel: EcoDermViewModel) {
    var currentDestination by remember { mutableStateOf(AppDestination.HOME) }
    var selectedScanRecord by remember { mutableStateOf<ScanRecord?>(null) }

    val currentEnv by viewModel.currentEnv.collectAsStateWithLifecycle()
    val allScans by viewModel.allScans.collectAsStateWithLifecycle()
    val progressList by viewModel.conditionProgress.collectAsStateWithLifecycle()
    val scanState by viewModel.scanState.collectAsStateWithLifecycle()

    Scaffold(
        containerColor = EcoBackground,
        bottomBar = {
            // Only show bottom bar when not in detail screen
            if (selectedScanRecord == null) {
                NavigationBar(
                    containerColor = EcoSurface,
                    tonalElevation = 0.dp,
                    modifier = Modifier
                        .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                        .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                ) {
                    AppDestination.values().forEach { destination ->
                        val isSelected = currentDestination == destination
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = {
                                currentDestination = destination
                                if (destination == AppDestination.SCAN) {
                                    viewModel.resetScanState()
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = destination.icon,
                                    contentDescription = destination.title,
                                    modifier = Modifier.size(22.dp)
                                )
                            },
                            label = {
                                Text(
                                    text = destination.title,
                                    color = if (isSelected) EcoMint else EcoTextMuted
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = EcoBackground,
                                indicatorColor = EcoMint,
                                unselectedIconColor = EcoTextMuted
                            ),
                            modifier = Modifier.testTag("nav_${destination.name.lowercase()}")
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (selectedScanRecord != null) {
                ReportDetailScreen(
                    scan = selectedScanRecord!!,
                    onBack = { selectedScanRecord = null }
                )
            } else {
                when (currentDestination) {
                    AppDestination.HOME -> {
                        HomeScreen(
                            env = currentEnv,
                            recentScans = allScans,
                            onNavigateToScan = { currentDestination = AppDestination.SCAN },
                            onNavigateToHistory = { currentDestination = AppDestination.HISTORY },
                            onNavigateToDetail = { scanId ->
                                selectedScanRecord = allScans.find { it.id == scanId }
                            },
                            onRefreshEnv = {
                                viewModel.refreshEnvironmentalFactors(37.7749, -122.4194)
                            }
                        )
                    }
                    AppDestination.SCAN -> {
                        ScanScreen(
                            currentEnv = currentEnv,
                            scanState = scanState,
                            onAnalyze = { bitmap, lat, lon, customLoc, notes ->
                                viewModel.analyzeSkin(
                                    bitmap = bitmap,
                                    lat = lat,
                                    lon = lon,
                                    customLocation = customLoc,
                                    notes = notes,
                                    onComplete = { record ->
                                        selectedScanRecord = record
                                    }
                                )
                            },
                            onRefreshLocationEnv = { lat, lon, locName ->
                                viewModel.refreshEnvironmentalFactors(lat, lon, locName)
                            },
                            onScanSuccess = { record ->
                                selectedScanRecord = record
                            }
                        )
                    }
                    AppDestination.HISTORY -> {
                        HistoryScreen(
                            scans = allScans,
                            onSelectScan = { scanId ->
                                selectedScanRecord = allScans.find { it.id == scanId }
                            },
                            onDeleteScan = { scanId ->
                                viewModel.deleteScan(scanId)
                            },
                            onNavigateToScan = { currentDestination = AppDestination.SCAN }
                        )
                    }
                    AppDestination.PROGRESS -> {
                        ProgressTrackingScreen(
                            progressList = progressList,
                            onNavigateToScan = { currentDestination = AppDestination.SCAN }
                        )
                    }
                }
            }
        }
    }
}
