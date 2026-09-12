package com.example.ecoderm.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.example.ecoderm.data.model.ScanRecord
import com.example.ecoderm.ui.components.EnvironmentalFactorsGrid
import com.example.ecoderm.ui.components.RiskBadge
import com.example.ecoderm.ui.components.TTSHelper
import com.example.ecoderm.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ReportDetailScreen(
    scan: ScanRecord,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var isSpeaking by remember { mutableStateOf(false) }

    // TTS engine
    val ttsHelper = remember {
        TTSHelper(context)
    }

    DisposableEffect(Unit) {
        onDispose {
            ttsHelper.shutdown()
        }
    }

    val dateFormatted = SimpleDateFormat("MMMM d, yyyy • h:mm a", Locale.getDefault())
        .format(Date(scan.timestamp))

    val riskColor = when (scan.riskLevel.lowercase()) {
        "low" -> RiskLow
        "moderate" -> RiskModerate
        "high" -> RiskHigh
        "critical" -> RiskCritical
        else -> RiskModerate
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(EcoBackground)
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Top Bar / Navigation
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(EcoSurface)
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = EcoTextPrimary
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // TTS Read Aloud button
                    IconButton(
                        onClick = {
                            if (isSpeaking) {
                                ttsHelper.stop()
                                isSpeaking = false
                            } else {
                                val textToRead = """
                                    EcoDerm AI Assessment. Condition: ${scan.condition}. 
                                    Risk Score: ${scan.riskScore} percent, ${scan.riskLevel} risk level. 
                                    Stage: ${scan.stage}. 
                                    Summary: ${scan.summary}. 
                                    Environmental impact: ${scan.environmentalImpact}. 
                                    Care advice: ${scan.careAdvice.joinToString(". ")}. 
                                    Dermatologist recommendation: ${scan.dermatologistRecommendation}.
                                """.trimIndent()
                                ttsHelper.speak(textToRead)
                                isSpeaking = true
                            }
                        },
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (isSpeaking) EcoMint else EcoSurface)
                    ) {
                        Icon(
                            imageVector = if (isSpeaking) Icons.Default.VolumeOff else Icons.Default.VolumeUp,
                            contentDescription = "Read Aloud",
                            tint = if (isSpeaking) EcoBackground else EcoMint
                        )
                    }

                    // Share button
                    IconButton(
                        onClick = {
                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(
                                    Intent.EXTRA_SUBJECT,
                                    "EcoDerm AI Assessment - ${scan.condition}"
                                )
                                putExtra(
                                    Intent.EXTRA_TEXT,
                                    """
                                    🌿 ECODERM AI - CLINICAL SKIN REPORT
                                    Condition: ${scan.condition}
                                    Risk Score: ${scan.riskScore}% (${scan.riskLevel})
                                    Stage: ${scan.stage} | AI Confidence: ${(scan.confidence * 100).toInt()}%
                                    Date: $dateFormatted
                                    Location: ${scan.environmentalFactors.locationName}
                                    
                                    ENVIRONMENTAL TELEMETRY:
                                    UV Index: ${scan.environmentalFactors.uvIndex} | AQI: ${scan.environmentalFactors.airQualityIndex}
                                    Temp: ${scan.environmentalFactors.temperatureC}°C | Humidity: ${scan.environmentalFactors.humidity}%
                                    
                                    SUMMARY:
                                    ${scan.summary}
                                    
                                    ENVIRONMENTAL IMPACT:
                                    ${scan.environmentalImpact}
                                    
                                    CARE ADVICE:
                                    ${scan.careAdvice.joinToString("\n• ", prefix = "• ")}
                                    
                                    DERMATOLOGIST RECOMMENDATION:
                                    ${scan.dermatologistRecommendation}
                                    """.trimIndent()
                                )
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Share Skin Assessment"))
                        },
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(EcoSurface)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Share Report",
                            tint = EcoTextPrimary
                        )
                    }
                }
            }
        }

        // Photo & Primary Result Card
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(EcoSurface)
                    .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                if (scan.imageUri.isNotBlank()) {
                    Image(
                        painter = rememberAsyncImagePainter(model = scan.imageUri),
                        contentDescription = "Skin Lesion Photo",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .clip(RoundedCornerShape(14.dp))
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = scan.condition,
                        style = MaterialTheme.typography.headlineSmall,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    RiskBadge(riskLevel = scan.riskLevel)
                }

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = scan.stage,
                        style = MaterialTheme.typography.labelMedium,
                        color = EcoMint
                    )
                    Text(
                        text = "Confidence: ${(scan.confidence * 100).toInt()}%",
                        style = MaterialTheme.typography.labelMedium,
                        color = EcoTextMuted
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Risk Score Meter
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Text(
                            text = "Risk Severity Score",
                            style = MaterialTheme.typography.bodyMedium,
                            color = EcoTextSecondary
                        )
                        Text(
                            text = "${scan.riskScore}%",
                            style = MaterialTheme.typography.titleLarge,
                            color = riskColor,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    LinearProgressIndicator(
                        progress = { scan.riskScore / 100f },
                        color = riskColor,
                        trackColor = EcoSurfaceBorder,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp)
                            .clip(CircleShape)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = scan.summary,
                    style = MaterialTheme.typography.bodyMedium,
                    color = EcoTextPrimary,
                    lineHeight = 21.sp
                )
            }
        }

        // Environmental Telemetry Grid
        item {
            EnvironmentalFactorsGrid(factors = scan.environmentalFactors)
        }

        // Environmental Impact Narrative
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(EcoSurface)
                    .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(16.dp))
                    .padding(18.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Eco,
                        contentDescription = null,
                        tint = EcoMint,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Environmental Skin Impact",
                        style = MaterialTheme.typography.titleMedium,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = scan.environmentalImpact,
                    style = MaterialTheme.typography.bodyMedium,
                    color = EcoTextSecondary,
                    lineHeight = 20.sp
                )
            }
        }

        // Likely Contributing Causes
        if (scan.likelyCauses.isNotEmpty()) {
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
                        text = "Likely Contributing Causes",
                        style = MaterialTheme.typography.titleMedium,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    scan.likelyCauses.forEach { cause ->
                        Row(
                            modifier = Modifier.padding(vertical = 4.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Icon(
                                imageVector = Icons.Default.FiberManualRecord,
                                contentDescription = null,
                                tint = EcoMint,
                                modifier = Modifier
                                    .padding(top = 5.dp)
                                    .size(8.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = cause,
                                style = MaterialTheme.typography.bodyMedium,
                                color = EcoTextPrimary
                            )
                        }
                    }
                }
            }
        }

        // Recommended Care Guidance
        if (scan.careAdvice.isNotEmpty()) {
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
                        text = "Recommended Care Guidance",
                        style = MaterialTheme.typography.titleMedium,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    scan.careAdvice.forEachIndexed { idx, advice ->
                        Row(
                            modifier = Modifier.padding(vertical = 5.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(20.dp)
                                    .clip(CircleShape)
                                    .background(EcoMint.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${idx + 1}",
                                    color = EcoMint,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = advice,
                                style = MaterialTheme.typography.bodyMedium,
                                color = EcoTextPrimary,
                                lineHeight = 20.sp
                            )
                        }
                    }
                }
            }
        }

        // Dermatologist Consultation & Nearby Provider Search
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(EcoSurfaceVariant, EcoSurface)
                        )
                    )
                    .border(1.dp, EcoMint.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
                    .padding(18.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.LocalHospital,
                        contentDescription = null,
                        tint = EcoMint,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Clinical Consultation Guidance",
                        style = MaterialTheme.typography.titleMedium,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = scan.dermatologistRecommendation,
                    style = MaterialTheme.typography.bodyMedium,
                    color = EcoTextSecondary,
                    lineHeight = 20.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        val loc = scan.environmentalFactors.locationName
                        val gmmIntentUri = Uri.parse("geo:0,0?q=dermatologist+near+$loc")
                        val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri)
                        try {
                            context.startActivity(mapIntent)
                        } catch (_: Exception) {
                            val browserUri = Uri.parse("https://www.google.com/maps/search/dermatologist+near+$loc")
                            context.startActivity(Intent(Intent.ACTION_VIEW, browserUri))
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = EcoMint,
                        contentColor = EcoBackground
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("find_dermatologist_button")
                ) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Find Nearby Dermatologists",
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
