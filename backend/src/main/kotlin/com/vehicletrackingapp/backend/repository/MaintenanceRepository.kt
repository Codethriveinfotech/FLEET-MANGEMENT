package com.vehicletrackingapp.backend.repository

import com.vehicletrackingapp.backend.database.Maintenance
import com.vehicletrackingapp.backend.models.Maintenance as MaintenanceModel
import com.vehicletrackingapp.backend.utils.dbQuery
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq

interface MaintenanceRepository {
    suspend fun createRecord(record: MaintenanceModel): MaintenanceModel?
    suspend fun findById(id: String): MaintenanceModel?
    suspend fun getRecordsByVehicle(vehicleId: String): List<MaintenanceModel>
    suspend fun getRecordsByDriver(driverId: String): List<MaintenanceModel>
    suspend fun updateRecord(record: MaintenanceModel): Boolean
    suspend fun deleteRecord(id: String): Boolean
    suspend fun getAllRecords(): List<MaintenanceModel>
}

class MaintenanceRepositoryImpl : MaintenanceRepository {
    private fun resultRowToMaintenance(row: ResultRow) = MaintenanceModel(
        id = row[Maintenance.id],
        vehicleId = row[Maintenance.vehicleId],
        driverId = row[Maintenance.driverId],
        tripId = row[Maintenance.tripId],
        maintenanceType = row[Maintenance.maintenanceType],
        description = row[Maintenance.description],
        date = row[Maintenance.date],
        time = row[Maintenance.time],
        cost = row[Maintenance.cost],
        serviceNotes = row[Maintenance.serviceNotes],
        billImageUri = row[Maintenance.billImageUri],
        status = row[Maintenance.status],
        oilChangeDone = row[Maintenance.oilChangeDone],
        tyreStatusOk = row[Maintenance.tyreStatusOk],
        batteryStatusOk = row[Maintenance.batteryStatusOk],
        isBreakdownReport = row[Maintenance.isBreakdownReport]
    )

    private fun resultRowToMaintenanceSummary(row: ResultRow) = MaintenanceModel(
        id = row[Maintenance.id],
        vehicleId = row[Maintenance.vehicleId],
        driverId = row[Maintenance.driverId],
        tripId = row[Maintenance.tripId],
        maintenanceType = row[Maintenance.maintenanceType],
        description = row[Maintenance.description],
        date = row[Maintenance.date],
        time = row[Maintenance.time],
        cost = row[Maintenance.cost],
        serviceNotes = row[Maintenance.serviceNotes],
        billImageUri = if (row[Maintenance.billImageUri].isNullOrBlank()) null else "has_image",
        status = row[Maintenance.status],
        oilChangeDone = row[Maintenance.oilChangeDone],
        tyreStatusOk = row[Maintenance.tyreStatusOk],
        batteryStatusOk = row[Maintenance.batteryStatusOk],
        isBreakdownReport = row[Maintenance.isBreakdownReport]
    )

    override suspend fun createRecord(record: MaintenanceModel): MaintenanceModel? = dbQuery {
        val insertStatement = Maintenance.insert {
            it[id] = record.id
            it[vehicleId] = record.vehicleId
            it[driverId] = record.driverId
            it[tripId] = record.tripId
            it[maintenanceType] = record.maintenanceType
            it[description] = record.description
            it[date] = record.date
            it[time] = record.time
            it[cost] = record.cost
            it[serviceNotes] = record.serviceNotes
            it[billImageUri] = record.billImageUri
            it[status] = record.status
            it[oilChangeDone] = record.oilChangeDone
            it[tyreStatusOk] = record.tyreStatusOk
            it[batteryStatusOk] = record.batteryStatusOk
            it[isBreakdownReport] = record.isBreakdownReport
        }
        insertStatement.resultedValues?.singleOrNull()?.let(::resultRowToMaintenance)
    }

    override suspend fun findById(id: String): MaintenanceModel? = dbQuery {
        Maintenance.select { Maintenance.id eq id }
            .map(::resultRowToMaintenance)
            .singleOrNull()
    }

    override suspend fun getRecordsByVehicle(vehicleId: String): List<MaintenanceModel> = dbQuery {
        Maintenance.select { Maintenance.vehicleId eq vehicleId }
            .map(::resultRowToMaintenanceSummary)
    }

    override suspend fun getRecordsByDriver(driverId: String): List<MaintenanceModel> = dbQuery {
        Maintenance.select { Maintenance.driverId eq driverId }
            .map(::resultRowToMaintenanceSummary)
    }

    override suspend fun updateRecord(record: MaintenanceModel): Boolean = dbQuery {
        Maintenance.update({ Maintenance.id eq record.id }) {
            it[vehicleId] = record.vehicleId
            it[tripId] = record.tripId
            it[maintenanceType] = record.maintenanceType
            it[description] = record.description
            it[date] = record.date
            it[time] = record.time
            it[cost] = record.cost
            it[serviceNotes] = record.serviceNotes
            it[billImageUri] = record.billImageUri
            it[status] = record.status
            it[oilChangeDone] = record.oilChangeDone
            it[tyreStatusOk] = record.tyreStatusOk
            it[batteryStatusOk] = record.batteryStatusOk
            it[isBreakdownReport] = record.isBreakdownReport
        } > 0
    }

    override suspend fun deleteRecord(id: String): Boolean = dbQuery {
        Maintenance.deleteWhere { Maintenance.id eq id } > 0
    }

    override suspend fun getAllRecords(): List<MaintenanceModel> = dbQuery {
        Maintenance.selectAll().map(::resultRowToMaintenanceSummary)
    }
}
