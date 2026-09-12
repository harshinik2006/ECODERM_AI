package com.example.ecoderm.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ecoderm.ui.theme.RiskCritical
import com.example.ecoderm.ui.theme.RiskHigh
import com.example.ecoderm.ui.theme.RiskLow
import com.example.ecoderm.ui.theme.RiskModerate

@Composable
fun RiskBadge(
    riskLevel: String,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor) = when (riskLevel.lowercase()) {
        "low" -> Pair(RiskLow.copy(alpha = 0.18f), RiskLow)
        "moderate" -> Pair(RiskModerate.copy(alpha = 0.18f), RiskModerate)
        "high" -> Pair(RiskHigh.copy(alpha = 0.18f), RiskHigh)
        "critical" -> Pair(RiskCritical.copy(alpha = 0.22f), RiskCritical)
        else -> Pair(RiskModerate.copy(alpha = 0.18f), RiskModerate)
    }

    Text(
        text = riskLevel.uppercase(),
        color = textColor,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}
