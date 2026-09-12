package com.example.ecoderm.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ecoderm.data.model.ConditionProgress
import com.example.ecoderm.data.model.TrendStatus
import com.example.ecoderm.ui.theme.*

@Composable
fun ProgressTrackingScreen(
    progressList: List<ConditionProgress>,
    onNavigateToScan: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(EcoBackground)
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column {
                Text(
                    text = "Condition Progress & Trends",
                    style = MaterialTheme.typography.headlineMedium,
                    color = EcoTextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Longitudinal tracking of lesion severity and healing trajectory across environmental exposures.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = EcoTextSecondary
                )
            }
        }

        if (progressList.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(EcoSurface)
                        .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(16.dp))
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(EcoSurfaceVariant),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.TrendingUp,
                            contentDescription = null,
                            tint = EcoMint,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = "No Progress Trends Available",
                        style = MaterialTheme.typography.titleMedium,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Perform at least two scans for the same skin condition over time to observe risk score changes, healing velocity, and atmospheric correlations.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = EcoTextSecondary
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onNavigateToScan,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = EcoMint,
                            contentColor = EcoBackground
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Scan Skin", fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            items(progressList) { progress ->
                ConditionProgressCard(progress = progress)
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(EcoSurface)
                    .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = EcoMint,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "How Progress is Calculated",
                        style = MaterialTheme.typography.titleSmall,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Risk trends compare the baseline assessment with subsequent screenings. A drop of >= 5% in risk score indicates healing/improvement, while an increase of >= 5% alerts to ongoing inflammation or barrier breakdown.",
                    style = MaterialTheme.typography.bodySmall,
                    color = EcoTextSecondary,
                    lineHeight = 18.sp
                )
            }
        }
    }
}

@Composable
fun ConditionProgressCard(
    progress: ConditionProgress
) {
    val (trendColor, trendLabel, trendIcon) = when (progress.status) {
        TrendStatus.IMPROVING -> Triple(RiskLow, "Improving", Icons.Default.TrendingDown)
        TrendStatus.STABLE -> Triple(Color(0xFF60A5FA), "Stable", Icons.Default.TrendingFlat)
        TrendStatus.INCREASED_RISK -> Triple(RiskHigh, "Increased Risk", Icons.Default.TrendingUp)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(EcoSurface)
            .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(16.dp))
            .padding(18.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = progress.condition,
                    style = MaterialTheme.typography.titleMedium,
                    color = EcoTextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${progress.scanCount} assessments recorded",
                    style = MaterialTheme.typography.labelSmall,
                    color = EcoTextMuted
                )
            }

            Surface(
                color = trendColor.copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = trendIcon,
                        contentDescription = null,
                        tint = trendColor,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = trendLabel,
                        color = trendColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricBox(
                label = "Baseline Risk",
                value = "${progress.initialRisk}%",
                modifier = Modifier.weight(1f)
            )
            MetricBox(
                label = "Latest Risk",
                value = "${progress.latestRisk}%",
                valueColor = trendColor,
                modifier = Modifier.weight(1f)
            )
            MetricBox(
                label = "Change",
                value = if (progress.percentageChange > 0) "+${progress.percentageChange}%" else "${progress.percentageChange}%",
                valueColor = trendColor,
                modifier = Modifier.weight(1f)
            )
        }

        if (progress.history.size >= 2) {
            Spacer(modifier = Modifier.height(18.dp))
            Text(
                text = "Severity Trajectory Over Time",
                style = MaterialTheme.typography.labelMedium,
                color = EcoTextMuted
            )
            Spacer(modifier = Modifier.height(8.dp))

            // Custom Canvas Trend Line Chart
            val scores = progress.history.map { it.riskScore }
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(EcoSurfaceVariant)
                    .padding(8.dp)
            ) {
                val width = size.width
                val height = size.height
                if (scores.size < 2) return@Canvas

                val maxScore = 100f
                val minScore = 0f
                val stepX = width / (scores.size - 1)

                val points = scores.mapIndexed { idx, score ->
                    val x = idx * stepX
                    val y = height - ((score - minScore) / (maxScore - minScore)) * height
                    Offset(x, y.coerceIn(0f, height))
                }

                // Draw connecting path
                val path = Path().apply {
                    moveTo(points.first().x, points.first().y)
                    for (i in 1 until points.size) {
                        lineTo(points[i].x, points[i].y)
                    }
                }

                drawPath(
                    path = path,
                    color = trendColor,
                    style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                )

                // Draw point markers
                points.forEach { pt ->
                    drawCircle(
                        color = EcoBackground,
                        radius = 5.dp.toPx(),
                        center = pt
                    )
                    drawCircle(
                        color = trendColor,
                        radius = 3.5.dp.toPx(),
                        center = pt
                    )
                }
            }
        }
    }
}

@Composable
fun MetricBox(
    label: String,
    value: String,
    valueColor: Color = EcoTextPrimary,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(EcoSurfaceVariant)
            .padding(10.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = EcoTextMuted,
            fontSize = 11.sp
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = valueColor,
            fontWeight = FontWeight.Bold
        )
    }
}
