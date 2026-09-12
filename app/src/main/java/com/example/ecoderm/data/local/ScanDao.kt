package com.example.ecoderm.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ScanDao {
    @Query("SELECT * FROM skin_scans ORDER BY timestamp DESC")
    fun getAllScans(): Flow<List<ScanEntity>>

    @Query("SELECT * FROM skin_scans WHERE id = :id LIMIT 1")
    suspend fun getScanById(id: String): ScanEntity?

    @Query("SELECT * FROM skin_scans WHERE condition = :condition ORDER BY timestamp ASC")
    fun getScansByCondition(condition: String): Flow<List<ScanEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScan(scan: ScanEntity)

    @Query("DELETE FROM skin_scans WHERE id = :id")
    suspend fun deleteScanById(id: String)

    @Query("DELETE FROM skin_scans")
    suspend fun clearAllScans()
}
