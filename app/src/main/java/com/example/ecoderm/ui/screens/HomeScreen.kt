package com.example.ecoderm.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ecoderm.data.model.EnvironmentalFactors
import com.example.ecoderm.data.model.ScanRecord
import com.example.ecoderm.ui.components.EnvironmentalFactorsGrid
import com.example.ecoderm.ui.components.RiskBadge
import com.example.ecoderm.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(
    env: EnvironmentalFactors,
    recentScans: List<ScanRecord>,
    onNavigateToScan: () -> Unit,
    onNavigateToHistory: () -> Unit,
    onNavigateToDetail: (String) -> Unit,
    onRefreshEnv: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(EcoBackground)
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Hero Header
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(EcoSurfaceVariant, EcoSurface)
                        )
                    )
                    .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(20.dp))
                    .padding(20.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(EcoMint.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = EcoMint,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "ECODERM AI",
                        style = MaterialTheme.typography.labelLarge,
                        color = EcoMint,
                        letterSpacing = 1.2.sp
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Environmental Skin Health Intelligence",
                    style = MaterialTheme.typography.headlineMedium,
                    color = EcoTextPrimary,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Dermatological photo screening analyzed alongside real-time UV radiation, air pollution particulates, humidity, and heat stress.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = EcoTextSecondary,
                    lineHeight = 20.sp
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onNavigateToScan,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = EcoMint,
                            contentColor = EcoBackground
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("start_scan_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "New Scan",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    OutlinedButton(
                        onClick = onNavigateToHistory,
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = EcoTextPrimary
                        ),
                        border = ButtonDefaults.outlinedButtonBorder.copy(
                            brush = Brush.horizontalGradient(listOf(EcoSurfaceBorder, EcoMint.copy(alpha = 0.5f)))
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("view_history_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.History,
                            contentDescription = null,
                            tint = EcoMint,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "History",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }

        // Live Environmental Factors Grid
        item {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Real-Time Telemetry",
                        style = MaterialTheme.typography.titleMedium,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                    IconButton(
                        onClick = onRefreshEnv,
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh weather",
                            tint = EcoTextMuted,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                EnvironmentalFactorsGrid(factors = env)
            }
        }

        // Recent Scans Section (if available)
        if (recentScans.isNotEmpty()) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent Screenings",
                        style = MaterialTheme.typography.titleMedium,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "View all (${recentScans.size})",
                        style = MaterialTheme.typography.labelMedium,
                        color = EcoMint,
                        modifier = Modifier.clickable { onNavigateToHistory() }
                    )
                }
            }

            items(recentScans.take(3)) { scan ->
                RecentScanCard(scan = scan, onClick = { onNavigateToDetail(scan.id) })
            }
        }

        // Workflow / Education Section
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(EcoSurface)
                    .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(16.dp))
                    .padding(18.dp)
            ) {
                Text(
                    text = "Clinical Workflow",
                    style = MaterialTheme.typography.titleMedium,
                    color = EcoTextPrimary,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(14.dp))

                WorkflowStep(
                    stepNumber = "1",
                    title = "Photo & Atmospheric Telemetry",
                    description = "Capture skin lesion while geolocation pulls live UV index, air quality, humidity, and heat stress indices."
                )
                Spacer(modifier = Modifier.height(12.dp))
                WorkflowStep(
                    stepNumber = "2",
                    title = "Multimodal Gemini Intelligence",
                    description = "Clinical AI analyzes visual skin patterns, assessing stratum corneum erythema against current atmospheric pollutants."
                )
                Spacer(modifier = Modifier.height(12.dp))
                WorkflowStep(
                    stepNumber = "3",
                    title = "Targeted Care & Provider Referral",
                    description = "Receive personalized barrier repair guidance, sunscreen regimens, and instant connection to nearby licensed dermatologists."
                )
            }
        }

        // Medical Disclaimer
        item {
            Text(
                text = "Disclaimer: EcoDerm AI is an environmental skin health screening intelligence tool for educational and supportive tracking. It does not provide definitive medical diagnoses. Consult a board-certified dermatologist for clinical treatment.",
                style = MaterialTheme.typography.bodySmall,
                color = EcoTextMuted,
                fontSize = 11.sp,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
fun RecentScanCard(
    scan: ScanRecord,
    onClick: () -> Unit
) {
    val dateStr = SimpleDateFormat("MMM d, yyyy • h:mm a", Locale.getDefault())
        .format(Date(scan.timestamp))

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(EcoSurface)
            .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = scan.condition,
                    style = MaterialTheme.typography.titleMedium,
                    color = EcoTextPrimary,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.width(8.dp))
                RiskBadge(riskLevel = scan.riskLevel)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "$dateStr • Risk: ${scan.riskScore}%",
                style = MaterialTheme.typography.bodySmall,
                color = EcoTextMuted
            )
        }

        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = "View report",
            tint = EcoTextMuted
        )
    }
}

@Composable
fun WorkflowStep(
    stepNumber: String,
    title: String,
    description: String
) {
    Row(verticalAlignment = Alignment.Top) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(CircleShape)
                .background(EcoMint.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = stepNumber,
                color = EcoMint,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                color = EcoTextPrimary,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = EcoTextSecondary,
                lineHeight = 16.sp
            )
        }
    }
}
