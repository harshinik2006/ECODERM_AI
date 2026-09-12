package com.example.ecoderm.data.model

import kotlinx.serialization.Serializable

@Serializable
data class EnvironmentalFactors(
    val uvIndex: Double = 0.0,
    val airQualityIndex: Double = 0.0,
    val temperatureC: Double = 22.0,
    val humidity: Double = 50.0,
    val windSpeedKmh: Double = 10.0,
    val locationName: String = "Current Location"
)

@Serializable
data class AnalysisResult(
    val condition: String,
    val riskScore: Int, // 0-100
    val riskLevel: String, // Low, Moderate, High, Critical
    val stage: String,
    val confidence: Double, // 0.0 - 1.0
    val summary: String,
    val environmentalImpact: String,
    val likelyCauses: List<String>,
    val careAdvice: List<String>,
    val dermatologistRecommendation: String
)

@Serializable
data class ScanRecord(
    val id: String,
    val timestamp: Long,
    val imageUri: String,
    val condition: String,
    val riskScore: Int,
    val riskLevel: String,
    val stage: String,
    val confidence: Double,
    val summary: String,
    val environmentalImpact: String,
    val likelyCauses: List<String>,
    val careAdvice: List<String>,
    val dermatologistRecommendation: String,
    val environmentalFactors: EnvironmentalFactors,
    val userNotes: String = ""
)

data class ConditionProgress(
    val condition: String,
    val initialRisk: Int,
    val latestRisk: Int,
    val percentageChange: Int,
    val status: TrendStatus,
    val scanCount: Int,
    val history: List<ScanRecord>
)

enum class TrendStatus {
    IMPROVING,
    STABLE,
    INCREASED_RISK
}
