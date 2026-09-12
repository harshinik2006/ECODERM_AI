package com.example.ecoderm.ui.viewmodel

import android.app.Application
import android.graphics.Bitmap
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.ecoderm.data.model.ConditionProgress
import com.example.ecoderm.data.model.EnvironmentalFactors
import com.example.ecoderm.data.model.ScanRecord
import com.example.ecoderm.data.remote.EnvironmentService
import com.example.ecoderm.data.repository.ScanRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface ScanUiState {
    object Idle : ScanUiState
    data class Analyzing(val step: String) : ScanUiState
    data class Success(val record: ScanRecord) : ScanUiState
    data class Error(val message: String) : ScanUiState
}

class EcoDermViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = ScanRepository(application)
    private val environmentService = EnvironmentService()

    val allScans: StateFlow<List<ScanRecord>> = repository.getAllScans()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val conditionProgress: StateFlow<List<ConditionProgress>> = repository.getConditionProgress()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _currentEnv = MutableStateFlow(EnvironmentalFactors())
    val currentEnv: StateFlow<EnvironmentalFactors> = _currentEnv.asStateFlow()

    private val _scanState = MutableStateFlow<ScanUiState>(ScanUiState.Idle)
    val scanState: StateFlow<ScanUiState> = _scanState.asStateFlow()

    init {
        // Load default environmental readings for standard coordinates (e.g. San Francisco or user location)
        refreshEnvironmentalFactors(37.7749, -122.4194, "San Francisco, CA")
    }

    fun refreshEnvironmentalFactors(lat: Double, lon: Double, locationName: String? = null) {
        viewModelScope.launch {
            try {
                val data = environmentService.fetchEnvironmentalData(lat, lon, locationName)
                _currentEnv.value = data
            } catch (_: Exception) {}
        }
    }

    fun analyzeSkin(
        bitmap: Bitmap,
        lat: Double,
        lon: Double,
        customLocation: String?,
        notes: String,
        onComplete: (ScanRecord) -> Unit
    ) {
        viewModelScope.launch {
            _scanState.value = ScanUiState.Analyzing("Fetching live environmental skin stress markers…")
            try {
                val record = repository.performScanAndAnalysis(bitmap, lat, lon, customLocation, notes)
                _scanState.value = ScanUiState.Success(record)
                onComplete(record)
            } catch (e: Exception) {
                _scanState.value = ScanUiState.Error(e.message ?: "Screening analysis failed")
            }
        }
    }

    fun resetScanState() {
        _scanState.value = ScanUiState.Idle
    }

    fun deleteScan(id: String) {
        viewModelScope.launch {
            repository.deleteScan(id)
        }
    }
}
