package com.example.ecoderm.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Air
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ecoderm.data.model.EnvironmentalFactors
import com.example.ecoderm.ui.theme.*

@Composable
fun EnvironmentalFactorsGrid(
    factors: EnvironmentalFactors,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(EcoSurface)
            .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Environmental Skin Factors",
                style = MaterialTheme.typography.titleMedium,
                color = EcoTextPrimary,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = factors.locationName,
                style = MaterialTheme.typography.labelMedium,
                color = EcoMint,
                fontWeight = FontWeight.Medium
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            EnvironmentalItem(
                icon = Icons.Default.WbSunny,
                iconColor = UvColor,
                label = "UV Index",
                value = "${factors.uvIndex}",
                subtext = when {
                    factors.uvIndex >= 8 -> "Very High"
                    factors.uvIndex >= 6 -> "High"
                    factors.uvIndex >= 3 -> "Moderate"
                    else -> "Low"
                },
                modifier = Modifier.weight(1f)
            )

            EnvironmentalItem(
                icon = Icons.Default.Air,
                iconColor = AqiColor,
                label = "Air Quality",
                value = "${factors.airQualityIndex.toInt()}",
                subtext = when {
                    factors.airQualityIndex > 150 -> "Unhealthy"
                    factors.airQualityIndex > 100 -> "Sensitive"
                    factors.airQualityIndex > 50 -> "Moderate"
                    else -> "Good"
                },
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            EnvironmentalItem(
                icon = Icons.Default.Thermostat,
                iconColor = TempColor,
                label = "Temperature",
                value = "${factors.temperatureC}°C",
                subtext = if (factors.temperatureC > 30) "Heat Stress" else "Normal",
                modifier = Modifier.weight(1f)
            )

            EnvironmentalItem(
                icon = Icons.Default.WaterDrop,
                iconColor = HumidityColor,
                label = "Humidity",
                value = "${factors.humidity.toInt()}%",
                subtext = if (factors.humidity < 40) "Dry Air" else "Hydrated",
                modifier = Modifier.weight(1f)
            )

            EnvironmentalItem(
                icon = Icons.Default.Cloud,
                iconColor = WindColor,
                label = "Wind",
                value = "${factors.windSpeedKmh.toInt()} km/h",
                subtext = if (factors.windSpeedKmh > 20) "Windburn Risk" else "Calm",
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun EnvironmentalItem(
    icon: ImageVector,
    iconColor: Color,
    label: String,
    value: String,
    subtext: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(EcoSurfaceVariant)
            .border(1.dp, EcoSurfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .padding(10.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = iconColor,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = EcoTextMuted,
                fontSize = 11.sp
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = EcoTextPrimary,
            fontWeight = FontWeight.Bold,
            fontSize = 17.sp
        )
        Text(
            text = subtext,
            style = MaterialTheme.typography.labelMedium,
            color = iconColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}
