package com.example.ecoderm.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.ecoderm.data.model.EnvironmentalFactors
import com.example.ecoderm.data.model.ScanRecord

@Entity(tableName = "skin_scans")
data class ScanEntity(
    @PrimaryKey val id: String,
    val timestamp: Long,
    val imageUri: String,
    val condition: String,
    val riskScore: Int,
    val riskLevel: String,
    val stage: String,
    val confidence: Double,
    val summary: String,
    val environmentalImpact: String,
    val likelyCausesJson: String,
    val careAdviceJson: String,
    val dermatologistRecommendation: String,
    val uvIndex: Double,
    val airQualityIndex: Double,
    val temperatureC: Double,
    val humidity: Double,
    val windSpeedKmh: Double,
    val locationName: String,
    val userNotes: String
) {
    fun toScanRecord(): ScanRecord {
        val causes = likelyCausesJson.split(";;").filter { it.isNotBlank() }
        val advice = careAdviceJson.split(";;").filter { it.isNotBlank() }
        return ScanRecord(
            id = id,
            timestamp = timestamp,
            imageUri = imageUri,
            condition = condition,
            riskScore = riskScore,
            riskLevel = riskLevel,
            stage = stage,
            confidence = confidence,
            summary = summary,
            environmentalImpact = environmentalImpact,
            likelyCauses = causes,
            careAdvice = advice,
            dermatologistRecommendation = dermatologistRecommendation,
            environmentalFactors = EnvironmentalFactors(
                uvIndex = uvIndex,
                airQualityIndex = airQualityIndex,
                temperatureC = temperatureC,
                humidity = humidity,
                windSpeedKmh = windSpeedKmh,
                locationName = locationName
            ),
            userNotes = userNotes
        )
    }

    companion object {
        fun fromScanRecord(record: ScanRecord): ScanEntity {
            return ScanEntity(
                id = record.id,
                timestamp = record.timestamp,
                imageUri = record.imageUri,
                condition = record.condition,
                riskScore = record.riskScore,
                riskLevel = record.riskLevel,
                stage = record.stage,
                confidence = record.confidence,
                summary = record.summary,
                environmentalImpact = record.environmentalImpact,
                likelyCausesJson = record.likelyCauses.joinToString(";;"),
                careAdviceJson = record.careAdvice.joinToString(";;"),
                dermatologistRecommendation = record.dermatologistRecommendation,
                uvIndex = record.environmentalFactors.uvIndex,
                airQualityIndex = record.environmentalFactors.airQualityIndex,
                temperatureC = record.environmentalFactors.temperatureC,
                humidity = record.environmentalFactors.humidity,
                windSpeedKmh = record.environmentalFactors.windSpeedKmh,
                locationName = record.environmentalFactors.locationName,
                userNotes = record.userNotes
            )
        }
    }
}
