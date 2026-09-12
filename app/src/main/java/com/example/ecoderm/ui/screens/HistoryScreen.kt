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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ecoderm.data.model.ScanRecord
import com.example.ecoderm.ui.components.RiskBadge
import com.example.ecoderm.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HistoryScreen(
    scans: List<ScanRecord>,
    onSelectScan: (String) -> Unit,
    onDeleteScan: (String) -> Unit,
    onNavigateToScan: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var scanToDelete by remember { mutableStateOf<ScanRecord?>(null) }

    val filteredScans = remember(scans, searchQuery) {
        if (searchQuery.isBlank()) scans
        else {
            scans.filter {
                it.condition.contains(searchQuery, ignoreCase = true) ||
                it.environmentalFactors.locationName.contains(searchQuery, ignoreCase = true) ||
                it.stage.contains(searchQuery, ignoreCase = true)
            }
        }
    }

    if (scanToDelete != null) {
        AlertDialog(
            onDismissRequest = { scanToDelete = null },
            title = { Text("Delete Screening Record?", color = EcoTextPrimary) },
            text = {
                Text(
                    "Are you sure you want to delete the record for ${scanToDelete?.condition}? This action cannot be undone.",
                    color = EcoTextSecondary
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        scanToDelete?.let { onDeleteScan(it.id) }
                        scanToDelete = null
                    }
                ) {
                    Text("Delete", color = RiskCritical, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { scanToDelete = null }) {
                    Text("Cancel", color = EcoTextSecondary)
                }
            },
            containerColor = EcoSurface,
            shape = RoundedCornerShape(16.dp)
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EcoBackground)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Scan History",
            style = MaterialTheme.typography.headlineMedium,
            color = EcoTextPrimary,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Review all previous skin screening assessments and environmental markers.",
            style = MaterialTheme.typography.bodyMedium,
            color = EcoTextSecondary
        )

        Spacer(modifier = Modifier.height(14.dp))

        if (scans.isNotEmpty()) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by condition, stage, or city…") },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null, tint = EcoTextMuted)
                },
                trailingIcon = {
                    if (searchQuery.isNotBlank()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", tint = EcoTextMuted)
                        }
                    }
                },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("history_search_input"),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = EcoMint,
                    unfocusedBorderColor = EcoSurfaceBorder,
                    focusedTextColor = EcoTextPrimary,
                    unfocusedTextColor = EcoTextPrimary
                )
            )

            Spacer(modifier = Modifier.height(14.dp))
        }

        if (filteredScans.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 96.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(24.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(EcoSurfaceVariant),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.HistoryEdu,
                            contentDescription = null,
                            tint = EcoMint,
                            modifier = Modifier.size(32.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = if (searchQuery.isNotBlank()) "No matching assessments" else "No skin scans recorded yet",
                        style = MaterialTheme.typography.titleMedium,
                        color = EcoTextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )

                    Text(
                        text = if (searchQuery.isNotBlank()) "Try searching for a different condition name." else "Perform your first skin screening to evaluate lesions under live UV and air quality conditions.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = EcoTextSecondary,
                        modifier = Modifier.padding(top = 6.dp)
                    )

                    if (searchQuery.isBlank()) {
                        Spacer(modifier = Modifier.height(20.dp))
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
                            Text("Start First Scan", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filteredScans, key = { it.id }) { scan ->
                    HistoryItemCard(
                        scan = scan,
                        onOpen = { onSelectScan(scan.id) },
                        onDelete = { scanToDelete = scan }
                    )
                }
            }
        }
    }
}

@Composable
fun HistoryItemCard(
    scan: ScanRecord,
    onOpen: () -> Unit,
    onDelete: () -> Unit
) {
    val dateStr = SimpleDateFormat("MMM d, yyyy • h:mm a", Locale.getDefault())
        .format(Date(scan.timestamp))

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(EcoSurface)
            .border(1.dp, EcoSurfaceBorder, RoundedCornerShape(16.dp))
            .clickable { onOpen() }
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = scan.condition,
                style = MaterialTheme.typography.titleMedium,
                color = EcoTextPrimary,
                fontWeight = FontWeight.Bold
            )
            RiskBadge(riskLevel = scan.riskLevel)
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "$dateStr • ${scan.environmentalFactors.locationName}",
            style = MaterialTheme.typography.bodySmall,
            color = EcoTextMuted
        )

        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(
                    color = EcoSurfaceVariant,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "UV: ${scan.environmentalFactors.uvIndex}",
                        color = UvColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                Surface(
                    color = EcoSurfaceVariant,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "AQI: ${scan.environmentalFactors.airQualityIndex.toInt()}",
                        color = AqiColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                Surface(
                    color = EcoSurfaceVariant,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "Risk: ${scan.riskScore}%",
                        color = EcoTextPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            IconButton(
                onClick = onDelete,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.DeleteOutline,
                    contentDescription = "Delete scan",
                    tint = EcoTextMuted,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
