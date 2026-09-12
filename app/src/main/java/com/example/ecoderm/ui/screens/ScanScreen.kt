package com.example.ecoderm.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.PickVisualMediaRequest
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.ecoderm.data.model.EnvironmentalFactors
import com.example.ecoderm.data.model.ScanRecord
import com.example.ecoderm.ui.components.EnvironmentalFactorsGrid
import com.example.ecoderm.ui.theme.*
import com.example.ecoderm.ui.viewmodel.ScanUiState
import com.google.android.gms.location.LocationServices

@Composable
fun ScanScreen(
    currentEnv: EnvironmentalFactors,
    scanState: ScanUiState,
    onAnalyze: (Bitmap, Double, Double, String?, String) -> Unit,
    onRefreshLocationEnv: (Double, Double, String?) -> Unit,
    onScanSuccess: (ScanRecord) -> Unit
) {
    val context = LocalContext.current
    var selectedBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var locationInput by remember { mutableStateOf(currentEnv.locationName) }
    var notesInput by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Fused Location Provider
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    // Camera launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        if (bitmap != null) {
            selectedBitmap = bitmap
            errorMessage = null
        }
    }

    // Camera Permission Launcher
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            cameraLauncher.launch(null)
        } else {
            errorMessage = "Camera permission is required to capture photos directly."
        }
    }

    // Photo picker launcher (Android Photo Picker)
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                context.contentResolver.openInputStream(uri)?.use { stream ->
                    val bmp = BitmapFactory.decodeStream(stream)
                    selectedBitmap = bmp
                    errorMessage = null
                }
            } catch (e: Exception) {
                errorMessage = "Could not load selected image: ${e.message}"
            }
        }
    }

    // Location Permission Launcher
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            try {
                fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                    if (loc != null) {
                        onRefreshLocationEnv(loc.latitude, loc.longitude, null)
                        locationInput = "Current Location"
                    }
                }
            } catch (_: SecurityException) {}
        }
    }

    val isAnalyzing = scanState is ScanUiState.Analyzing

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EcoBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Spacer(modifier = Modifier.height(6.dp))

        // Title
        Column {
            Text(
                text = "Skin Photo Screening",
                style = MaterialTheme.typography.headlineMedium,
                color = EcoTextPrimary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Capture a clear photo of the skin lesion or rash with live environmental readings.",
                style = MaterialTheme.typography.bodyMedium,
                color = EcoTextSecondary
            )
        }

        // Error Banner
        if (errorMessage != null) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(RiskHigh.copy(alpha = 0.15f))
                    .border(1.dp, RiskHigh.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = RiskHigh,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = errorMessage ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = RiskHigh
                )
            }
        }

        // Image Selection Area
        if (selectedBitmap != null) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(EcoSurface)
                    .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(16.dp))
                    .padding(12.dp)
            ) {
                Image(
                    bitmap = selectedBitmap!!.asImageBitmap(),
                    contentDescription = "Selected skin image",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(240.dp)
                        .clip(RoundedCornerShape(12.dp))
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            val hasCam = ContextCompat.checkSelfPermission(
                                context,
                                Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED
                            if (hasCam) cameraLauncher.launch(null)
                            else cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                        },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Retake", fontSize = 13.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            photoPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Choose Another", fontSize = 13.sp)
                    }
                }
            }
        } else {
            // Upload Prompt Card
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
                        .background(EcoMint.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.AddPhotoAlternate,
                        contentDescription = null,
                        tint = EcoMint,
                        modifier = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Upload or Capture Skin Photo",
                    style = MaterialTheme.typography.titleMedium,
                    color = EcoTextPrimary,
                    fontWeight = FontWeight.SemiBold
                )

                Text(
                    text = "Ensure good lighting and keep the lesion in clear focus.",
                    style = MaterialTheme.typography.bodySmall,
                    color = EcoTextMuted,
                    fontSize = 12.sp
                )

                Spacer(modifier = Modifier.height(18.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = {
                            val hasCam = ContextCompat.checkSelfPermission(
                                context,
                                Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED
                            if (hasCam) cameraLauncher.launch(null)
                            else cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = EcoMint,
                            contentColor = EcoBackground
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp)
                            .testTag("camera_capture_button")
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Take Photo", fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = {
                            photoPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = EcoTextPrimary
                        ),
                        border = ButtonDefaults.outlinedButtonBorder.copy(
                            brush = androidx.compose.ui.graphics.SolidColor(EcoSurfaceBorder)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp)
                            .testTag("gallery_picker_button")
                    ) {
                        Icon(Icons.Default.PhotoLibrary, contentDescription = null, tint = EcoMint, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Gallery", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        // Live Environmental Telemetry for this scan
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Screening Environmental Context",
                    style = MaterialTheme.typography.titleMedium,
                    color = EcoTextPrimary,
                    fontWeight = FontWeight.SemiBold
                )

                TextButton(
                    onClick = {
                        val hasLoc = ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.ACCESS_FINE_LOCATION
                        ) == PackageManager.PERMISSION_GRANTED
                        if (hasLoc) {
                            try {
                                fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                                    if (loc != null) {
                                        onRefreshLocationEnv(loc.latitude, loc.longitude, null)
                                        locationInput = "Current Location"
                                    }
                                }
                            } catch (_: SecurityException) {}
                        } else {
                            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
                        }
                    }
                ) {
                    Icon(Icons.Default.MyLocation, contentDescription = null, tint = EcoMint, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Auto GPS", color = EcoMint, fontSize = 12.sp)
                }
            }

            EnvironmentalFactorsGrid(factors = currentEnv)
        }

        // Location & Notes Inputs
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(EcoSurface)
                .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(16.dp))
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Clinical Context & Notes",
                style = MaterialTheme.typography.titleSmall,
                color = EcoTextPrimary,
                fontWeight = FontWeight.SemiBold
            )

            OutlinedTextField(
                value = locationInput,
                onValueChange = { locationInput = it },
                label = { Text("Location / City Name") },
                placeholder = { Text("e.g. Austin, TX or Mumbai") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = EcoMint,
                    unfocusedBorderColor = EcoSurfaceBorder,
                    focusedTextColor = EcoTextPrimary,
                    unfocusedTextColor = EcoTextPrimary
                )
            )

            OutlinedTextField(
                value = notesInput,
                onValueChange = { notesInput = it },
                label = { Text("Symptoms & Duration (Optional)") },
                placeholder = { Text("e.g. Mild itching for 3 days after sun exposure") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(96.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = EcoMint,
                    unfocusedBorderColor = EcoSurfaceBorder,
                    focusedTextColor = EcoTextPrimary,
                    unfocusedTextColor = EcoTextPrimary
                )
            )
        }

        // Analyze Action Button
        Button(
            onClick = {
                val bmp = selectedBitmap
                if (bmp == null) {
                    errorMessage = "Please capture or select a photo of the skin lesion first."
                } else {
                    onAnalyze(
                        bmp,
                        37.7749,
                        -122.4194,
                        if (locationInput.isNotBlank()) locationInput else null,
                        notesInput
                    )
                }
            },
            enabled = !isAnalyzing,
            colors = ButtonDefaults.buttonColors(
                containerColor = EcoMint,
                contentColor = EcoBackground,
                disabledContainerColor = EcoMint.copy(alpha = 0.4f)
            ),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .testTag("analyze_skin_button")
        ) {
            if (isAnalyzing) {
                CircularProgressIndicator(
                    color = EcoBackground,
                    strokeWidth = 2.dp,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "Analyzing with Gemini AI…",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            } else {
                Icon(Icons.Default.Analytics, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "Run Environmental Skin Screening",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}
