package com.vehicletrackingapp.backend.repository

import com.vehicletrackingapp.backend.database.FuelLogs
import com.vehicletrackingapp.backend.models.FuelLog as FuelLogModel
import com.vehicletrackingapp.backend.utils.dbQuery
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq

interface FuelRepository {
    suspend fun createRecord(record: FuelLogModel): FuelLogModel?
    suspend fun getAllRecords(): List<FuelLogModel>
    suspend fun deleteRecord(id: String): Boolean
}

class FuelRepositoryImpl : FuelRepository {
    private fun resultRowToFuelLog(row: ResultRow) = FuelLogModel(
        id = row[FuelLogs.id],
        vehicleId = row[FuelLogs.vehicleId],
        driverId = row[FuelLogs.driverId],
        date = row[FuelLogs.date],
        time = row[FuelLogs.time],
        liters = row[FuelLogs.liters],
        cost = row[FuelLogs.cost],
        odometerReading = row[FuelLogs.odometerReading]
    )

    override suspend fun createRecord(record: FuelLogModel): FuelLogModel? = dbQuery {
        val insertStatement = FuelLogs.insert {
            it[id] = record.id
            it[vehicleId] = record.vehicleId
            it[driverId] = record.driverId
            it[date] = record.date
            it[time] = record.time
            it[liters] = record.liters
            it[cost] = record.cost
            it[odometerReading] = record.odometerReading
        }
        insertStatement.resultedValues?.singleOrNull()?.let(::resultRowToFuelLog)
    }

    override suspend fun getAllRecords(): List<FuelLogModel> = dbQuery {
        FuelLogs.selectAll().map(::resultRowToFuelLog)
    }

    override suspend fun deleteRecord(id: String): Boolean = dbQuery {
        FuelLogs.deleteWhere { FuelLogs.id eq id } > 0
    }
}
