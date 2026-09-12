package com.example.ecoderm.data.repository

import android.content.Context
import android.graphics.Bitmap
import com.example.ecoderm.data.local.AppDatabase
import com.example.ecoderm.data.local.ScanEntity
import com.example.ecoderm.data.model.ConditionProgress
import com.example.ecoderm.data.model.ScanRecord
import com.example.ecoderm.data.model.TrendStatus
import com.example.ecoderm.data.remote.EnvironmentService
import com.example.ecoderm.data.remote.GeminiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

class ScanRepository(private val context: Context) {
    private val database = AppDatabase.getDatabase(context)
    private val dao = database.scanDao()
    private val environmentService = EnvironmentService()
    private val geminiService = GeminiService()

    fun getAllScans(): Flow<List<ScanRecord>> {
        return dao.getAllScans().map { list ->
            list.map { it.toScanRecord() }
        }
    }

    suspend fun getScanById(id: String): ScanRecord? = withContext(Dispatchers.IO) {
        dao.getScanById(id)?.toScanRecord()
    }

    suspend fun deleteScan(id: String) = withContext(Dispatchers.IO) {
        dao.deleteScanById(id)
    }

    suspend fun saveScan(scan: ScanRecord) = withContext(Dispatchers.IO) {
        dao.insertScan(ScanEntity.fromScanRecord(scan))
    }

    fun getConditionProgress(): Flow<List<ConditionProgress>> {
        return getAllScans().map { scans ->
            if (scans.isEmpty()) return@map emptyList()

            // Group scans by condition name (case-insensitive)
            val grouped = scans.groupBy { it.condition.trim() }

            grouped.map { (conditionName, conditionScans) ->
                // Sort chronologically (oldest to newest)
                val sorted = conditionScans.sortedBy { it.timestamp }
                val initial = sorted.first()
                val latest = sorted.last()

                val delta = latest.riskScore - initial.riskScore
                val pctChange = if (initial.riskScore > 0) {
                    ((delta.toDouble() / initial.riskScore.toDouble()) * 100).toInt()
                } else 0

                val trend = when {
                    delta <= -5 -> TrendStatus.IMPROVING
                    delta >= 5 -> TrendStatus.INCREASED_RISK
                    else -> TrendStatus.STABLE
                }

                ConditionProgress(
                    condition = conditionName,
                    initialRisk = initial.riskScore,
                    latestRisk = latest.riskScore,
                    percentageChange = pctChange,
                    status = trend,
                    scanCount = sorted.size,
                    history = sorted
                )
            }.sortedByDescending { it.scanCount }
        }
    }

    suspend fun performScanAndAnalysis(
        bitmap: Bitmap,
        lat: Double,
        lon: Double,
        customLocation: String?,
        notes: String
    ): ScanRecord = withContext(Dispatchers.IO) {
        // 1. Fetch live environmental conditions
        val env = environmentService.fetchEnvironmentalData(lat, lon, customLocation)

        // 2. Perform Gemini multimodal AI screening
        val result = geminiService.analyzeSkin(bitmap, env, notes)

        // 3. Save skin image to local files directory
        val filename = "skin_scan_${System.currentTimeMillis()}.jpg"
        val file = File(context.filesDir, filename)
        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
        }
        val imageUri = file.absolutePath

        // 4. Create ScanRecord
        val record = ScanRecord(
            id = UUID.randomUUID().toString(),
            timestamp = System.currentTimeMillis(),
            imageUri = imageUri,
            condition = result.condition,
            riskScore = result.riskScore,
            riskLevel = result.riskLevel,
            stage = result.stage,
            confidence = result.confidence,
            summary = result.summary,
            environmentalImpact = result.environmentalImpact,
            likelyCauses = result.likelyCauses,
            careAdvice = result.careAdvice,
            dermatologistRecommendation = result.dermatologistRecommendation,
            environmentalFactors = env,
            userNotes = notes
        )

        // 5. Store in Room database
        dao.insertScan(ScanEntity.fromScanRecord(record))

        record
    }
}
