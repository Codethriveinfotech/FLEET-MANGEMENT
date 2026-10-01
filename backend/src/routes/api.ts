import { Router } from 'express';
import prisma from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

// Helper to format responses
const sendSuccess = (res: any, data: any, message = 'Success') => {
  res.json({ success: true, message, data });
};

const sendError = (res: any, error: any, message = 'Error') => {
  console.error(error);
  res.status(500).json({ success: false, message, error: error.message });
};

// Field mapper: DB -> Frontend shape
const mapVehicle = (v: any) => ({
  ...v,
  number: v.plateNumber,       // frontend uses v.number
  type: v.make || 'Vehicle',   // frontend uses v.type
});

const mapUser = (u: any) => ({
  ...u,
  name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
  phone: u.phoneNumber || '',
});

const toDateStr = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const toTimeStr = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const mapTrip = (t: any) => ({
  ...t,
  startDate: toDateStr(t.startTime),
  startTime: toTimeStr(t.startTime),
  endDate: t.endTime ? toDateStr(t.endTime) : null,
  endTime: t.endTime ? toTimeStr(t.endTime) : null,
  startOdometer: t.startMileage != null ? String(t.startMileage) : '',
  endOdometer: t.endMileage != null ? String(t.endMileage) : null,
  status: t.status === 'COMPLETED' ? 'submitted' : t.status === 'ACTIVE' ? 'started' : t.status,
});

// ================= VEHICLES =================
// Use raw SQL to get ALL columns including legacy ones (place, type, number, assigned_user_id)
router.get('/vehicles', async (req, res) => {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM vehicles`);
    const vehicles = rows.map((v: any) => ({
      id: v.id,
      number: v.number || v.plateNumber || v.plate_number || '',
      plateNumber: v.plate_number || v.plateNumber || v.number || '',
      model: v.model || '',
      make: v.make || '',
      type: v.type || v.make || 'Vehicle',
      status: v.status || 'Active',
      fuelType: v.fuel_type || v.fuelType || 'Diesel',
      mileage: v.mileage || v.currentMileage || '0',
      insuranceStatus: v.insurance_status || v.insuranceStatus || 'Valid',
      place: v.place || '',
      assignedUserId: v.assigned_user_id || v.assignedUserId || null,
      registrationNumber: v.registration_number || v.registrationNumber || '',
      imageUri: v.image_uri || v.imageUri || null,
    }));
    sendSuccess(res, vehicles);
  } catch (e) { sendError(res, e); }
});

router.post('/vehicles', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    sendSuccess(res, vehicle);
  } catch (e) { sendError(res, e); }
});

router.put('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, vehicle);
  } catch (e) { sendError(res, e); }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    sendSuccess(res, true);
  } catch (e) { sendError(res, e); }
});

// ================= USERS (DRIVERS) =================
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    sendSuccess(res, users.map(mapUser));
  } catch (e) { sendError(res, e); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, true);
  } catch (e) { sendError(res, e); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    sendSuccess(res, true);
  } catch (e) { sendError(res, e); }
});

// ================= TRIPS =================
// NOTE: Android app saves to "trips" table (not "driver_logs").
// We read directly from it with raw SQL to avoid schema mismatch.
router.get('/trips', async (req, res) => {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM trips ORDER BY start_date DESC, start_time DESC`
    );
    const trips = rows.map((t: any) => ({
      id: t.id,
      driverId: t.driver_id,
      vehicleId: t.vehicle_id,
      startDate: t.start_date || '',
      startTime: t.start_time || '',
      endDate: t.end_date || '',
      endTime: t.end_time || '',
      startOdometer: t.start_odometer || '',
      endOdometer: t.end_odometer || '',
      startHmr: t.start_hmr || '',
      endHmr: t.end_hmr || '',
      sourceLocation: t.source_location || '',
      destinationLocation: t.destination_location || '',
      notes: t.notes || '',
      status: t.status || 'draft',
      shift: t.shift || '',
      day: t.day || '',
      tripPurpose: t.trip_purpose || '',
      startOdometerPhotoUri: t.start_odometer_photo_uri ? 'has_image' : null,
      startVehiclePlatePhotoUri: t.start_vehicle_plate_photo_uri ? 'has_image' : null,
      endOdometerPhotoUri: t.end_odometer_photo_uri ? 'has_image' : null,
      sheetPhotoUri: t.sheet_photo_uri ? 'has_image' : null,
      isBreakdown: !!t.is_breakdown
    }));
    sendSuccess(res, trips);
  } catch (e) { sendError(res, e); }
});

router.get('/trips/my', requireAuth, async (req: any, res: any) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return sendError(res, new Error("Not authenticated"));
    
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM trips WHERE driver_id = $1 ORDER BY start_date DESC, start_time DESC`,
      driverId
    );
    const trips = rows.map((t: any) => ({
      id: t.id,
      driverId: t.driver_id,
      vehicleId: t.vehicle_id,
      startDate: t.start_date || '',
      startTime: t.start_time || '',
      endDate: t.end_date || '',
      endTime: t.end_time || '',
      startOdometer: t.start_odometer || '',
      endOdometer: t.end_odometer || '',
      startHmr: t.start_hmr || '',
      endHmr: t.end_hmr || '',
      sourceLocation: t.source_location || '',
      destinationLocation: t.destination_location || '',
      notes: t.notes || '',
      status: t.status || 'draft',
      shift: t.shift || '',
      day: t.day || '',
      tripPurpose: t.trip_purpose || '',
      startOdometerPhotoUri: t.start_odometer_photo_uri ? 'has_image' : null,
      startVehiclePlatePhotoUri: t.start_vehicle_plate_photo_uri ? 'has_image' : null,
      endOdometerPhotoUri: t.end_odometer_photo_uri ? 'has_image' : null,
      sheetPhotoUri: t.sheet_photo_uri ? 'has_image' : null,
      isBreakdown: !!t.is_breakdown
    }));
    sendSuccess(res, trips);
  } catch (e) { sendError(res, e); }
});

router.get('/trips/:id', async (req, res) => {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM trips WHERE id = $1`, req.params.id);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Trip not found' });
    const t = rows[0];
    sendSuccess(res, {
      id: t.id,
      driverId: t.driver_id,
      vehicleId: t.vehicle_id,
      startDate: t.start_date || '',
      startTime: t.start_time || '',
      endDate: t.end_date || '',
      endTime: t.end_time || '',
      startOdometer: t.start_odometer || '',
      endOdometer: t.end_odometer || '',
      startHmr: t.start_hmr || '',
      endHmr: t.end_hmr || '',
      sourceLocation: t.source_location || '',
      destinationLocation: t.destination_location || '',
      notes: t.notes || '',
      status: t.status || 'draft',
      shift: t.shift || '',
      day: t.day || '',
      tripPurpose: t.trip_purpose || '',
      startOdometerPhotoUri: t.start_odometer_photo_uri,
      startVehiclePlatePhotoUri: t.start_vehicle_plate_photo_uri,
      endOdometerPhotoUri: t.end_odometer_photo_uri,
      sheetPhotoUri: t.sheet_photo_uri,
      isBreakdown: !!t.is_breakdown
    });
  } catch (e) { sendError(res, e); }
});

router.post('/trips', async (req, res) => {
  try {
    const b = req.body;
    // Insert into the trips table (the one the Android app uses)
    await prisma.$executeRawUnsafe(
      `INSERT INTO trips (id, driver_id, vehicle_id, start_date, start_time, start_odometer,
        start_odometer_photo_uri, start_vehicle_photo_uri, start_vehicle_plate_photo_uri,
        day, shift, start_hmr, end_date, end_time, end_odometer,
        end_odometer_photo_uri, end_vehicle_photo_uri, end_vehicle_plate_photo_uri,
        sheet_photo_uri, end_hmr, source_location, destination_location,
        fuel_level, trip_purpose, notes, status, is_breakdown)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status, end_date = EXCLUDED.end_date, end_time = EXCLUDED.end_time,
         end_odometer = EXCLUDED.end_odometer, end_odometer_photo_uri = EXCLUDED.end_odometer_photo_uri,
         end_vehicle_photo_uri = EXCLUDED.end_vehicle_photo_uri, end_vehicle_plate_photo_uri = EXCLUDED.end_vehicle_plate_photo_uri,
         sheet_photo_uri = EXCLUDED.sheet_photo_uri, end_hmr = EXCLUDED.end_hmr,
         source_location = EXCLUDED.source_location, destination_location = EXCLUDED.destination_location,
         fuel_level = EXCLUDED.fuel_level, notes = EXCLUDED.notes, is_breakdown = EXCLUDED.is_breakdown`,
      b.id, b.driverId, b.vehicleId, b.startDate || '', b.startTime || '', b.startOdometer || '',
      b.startOdometerPhotoUri || null, b.startVehiclePhotoUri || null, b.startVehiclePlatePhotoUri || null,
      b.day || '', b.shift || '', b.startHmr || '',

      b.endDate || '', b.endTime || '', b.endOdometer || '',
      b.endOdometerPhotoUri || null, b.endVehiclePhotoUri || null, b.endVehiclePlatePhotoUri || null,
      b.sheetPhotoUri || null, b.endHmr || '',
      b.sourceLocation || '', b.destinationLocation || '',
      b.fuelLevel || '', b.tripPurpose || '', b.notes || '', b.status || 'draft',
      b.isBreakdown || false
    );

    // Update vehicle status based on trip status (matching old Kotlin backend logic)
    if (b.vehicleId) {
      let newStatus: string | null = null;
      if (b.isBreakdown) newStatus = 'Breakdown';
      else if (b.status === 'started') newStatus = 'Running';
      else if (b.status === 'submitted') newStatus = 'Active';

      if (newStatus) {
        await prisma.$executeRawUnsafe(`UPDATE vehicles SET status = $1 WHERE id = $2`, newStatus, b.vehicleId);
      }
      if (b.status === 'submitted' && b.endOdometer) {
        await prisma.$executeRawUnsafe(`UPDATE vehicles SET mileage = $1 WHERE id = $2`, b.endOdometer, b.vehicleId);
      }
    }

    sendSuccess(res, b);
  } catch (e) { sendError(res, e); }
});

router.put('/trips/:id', async (req, res) => {
  try {
    const b = req.body;
    // Full update of all trip fields
    const updatedCount = await prisma.$executeRawUnsafe(
      `UPDATE trips SET status = $1, end_date = $2, end_time = $3, end_odometer = $4,
        end_odometer_photo_uri = $5, end_vehicle_photo_uri = $6, end_vehicle_plate_photo_uri = $7,
        sheet_photo_uri = $8, end_hmr = $9, source_location = $10, destination_location = $11,
        fuel_level = $12, notes = $13, is_breakdown = $14
       WHERE id = $15`,
      b.status || 'submitted',
      b.endDate || '', b.endTime || '', b.endOdometer || '',
      b.endOdometerPhotoUri || null, b.endVehiclePhotoUri || null, b.endVehiclePlatePhotoUri || null,
      b.sheetPhotoUri || null, b.endHmr || '',
      b.sourceLocation || '', b.destinationLocation || '',
      b.fuelLevel || '', b.notes || '', b.isBreakdown || false,
      req.params.id
    );

    if (updatedCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Update vehicle status (matching old Kotlin backend logic)
    if (b.vehicleId) {
      let newStatus: string | null = null;
      if (b.isBreakdown) newStatus = 'Breakdown';
      else if (b.status === 'started') newStatus = 'Running';
      else if (b.status === 'submitted') newStatus = 'Active';

      if (newStatus) {
        await prisma.$executeRawUnsafe(`UPDATE vehicles SET status = $1 WHERE id = $2`, newStatus, b.vehicleId);
      }
      if (b.status === 'submitted' && b.endOdometer) {
        await prisma.$executeRawUnsafe(`UPDATE vehicles SET mileage = $1 WHERE id = $2`, b.endOdometer, b.vehicleId);
      }
    }

    sendSuccess(res, true);
  } catch (e) { sendError(res, e); }
});

router.delete('/trips/:id', async (req, res) => {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM trips WHERE id = $1`, req.params.id);
    sendSuccess(res, true);
  } catch (e) { sendError(res, e); }
});

// ================= MAINTENANCE =================
router.get('/maintenance', async (req, res) => {
  try {
    const records = await prisma.maintenanceLog.findMany();
    sendSuccess(res, records);
  } catch (e) { sendError(res, e); }
});

router.get('/maintenance/my', async (req, res) => {
  try {
    const records = await prisma.maintenanceLog.findMany();
    sendSuccess(res, records);
  } catch (e) { sendError(res, e); }
});

router.post('/maintenance', async (req, res) => {
  try {
    const record = await prisma.maintenanceLog.create({ data: req.body });
    sendSuccess(res, record);
  } catch (e) { sendError(res, e); }
});

router.put('/maintenance/:id', async (req, res) => {
  try {
    const record = await prisma.maintenanceLog.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, true);
  } catch (e) { sendError(res, e); }
});

// ================= FUEL =================
router.get('/fuel', async (req, res) => {
  try {
    const records = await prisma.fuelLog.findMany();
    sendSuccess(res, records);
  } catch (e) { sendError(res, e); }
});

router.post('/fuel', async (req, res) => {
  try {
    const record = await prisma.fuelLog.create({ data: req.body });
    sendSuccess(res, record);
  } catch (e) { sendError(res, e); }
});

// ================= NOTIFICATIONS =================
router.get('/v1/notifications', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany();
    sendSuccess(res, notifications);
  } catch (e) { sendError(res, e); }
});

// ================= MAINTENANCE =================
router.get('/maintenance', async (req, res) => {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM maintenance ORDER BY date DESC, time DESC`);
    const records = rows.map((r: any) => ({
      id: r.id,
      vehicleId: r.vehicle_id,
      driverId: r.driver_id,
      tripId: r.trip_id || null,
      maintenanceType: r.maintenance_type,
      description: r.description,
      date: r.date,
      time: r.time,
      cost: r.cost,
      serviceNotes: r.service_notes,
      billImageUri: r.bill_image_uri ? 'has_image' : null,
      status: r.status,
      oilChangeDone: r.oil_change_done,
      tyreStatusOk: r.tyre_status_ok,
      batteryStatusOk: r.battery_status_ok,
      isBreakdownReport: r.is_breakdown_report
    }));
    sendSuccess(res, records);
  } catch (e) { sendError(res, e); }
});

router.get('/maintenance/my', requireAuth, async (req: any, res: any) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return sendError(res, new Error("Not authenticated"));
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM maintenance WHERE driver_id = $1 ORDER BY date DESC, time DESC`, driverId);
    const records = rows.map((r: any) => ({
      id: r.id,
      vehicleId: r.vehicle_id,
      driverId: r.driver_id,
      tripId: r.trip_id || null,
      maintenanceType: r.maintenance_type,
      description: r.description,
      date: r.date,
      time: r.time,
      cost: r.cost,
      serviceNotes: r.service_notes,
      billImageUri: r.bill_image_uri ? 'has_image' : null,
      status: r.status,
      oilChangeDone: r.oil_change_done,
      tyreStatusOk: r.tyre_status_ok,
      batteryStatusOk: r.battery_status_ok,
      isBreakdownReport: r.is_breakdown_report
    }));
    sendSuccess(res, records);
  } catch (e) { sendError(res, e); }
});

router.get('/maintenance/:id', async (req, res) => {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM maintenance WHERE id = $1`, req.params.id);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Maintenance not found' });
    const r = rows[0];
    sendSuccess(res, {
      id: r.id,
      vehicleId: r.vehicle_id,
      driverId: r.driver_id,
      tripId: r.trip_id || null,
      maintenanceType: r.maintenance_type,
      description: r.description,
      date: r.date,
      time: r.time,
      cost: r.cost,
      serviceNotes: r.service_notes,
      billImageUri: r.bill_image_uri,
      status: r.status,
      oilChangeDone: r.oil_change_done,
      tyreStatusOk: r.tyre_status_ok,
      batteryStatusOk: r.battery_status_ok,
      isBreakdownReport: r.is_breakdown_report
    });
  } catch (e) { sendError(res, e); }
});

router.post('/maintenance', async (req, res) => {
  try {
    const b = req.body;
    await prisma.$executeRawUnsafe(
      `INSERT INTO maintenance (id, vehicle_id, driver_id, trip_id, maintenance_type, description,
        date, time, cost, service_notes, bill_image_uri, status, oil_change_done, tyre_status_ok, battery_status_ok, is_breakdown_report)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO UPDATE SET
         maintenance_type = EXCLUDED.maintenance_type, description = EXCLUDED.description,
         date = EXCLUDED.date, time = EXCLUDED.time, cost = EXCLUDED.cost,
         service_notes = EXCLUDED.service_notes, bill_image_uri = EXCLUDED.bill_image_uri,
         status = EXCLUDED.status, oil_change_done = EXCLUDED.oil_change_done,
         tyre_status_ok = EXCLUDED.tyre_status_ok, battery_status_ok = EXCLUDED.battery_status_ok,
         is_breakdown_report = EXCLUDED.is_breakdown_report`,
      b.id, b.vehicleId, b.driverId, b.tripId || null, b.maintenanceType || '', b.description || '',
      b.date || '', b.time || '', b.cost || '', b.serviceNotes || '', b.billImageUri || null, b.status || 'draft',
      b.oilChangeDone || false, b.tyreStatusOk || false, b.batteryStatusOk || false, b.isBreakdownReport || false
    );
    sendSuccess(res, b);
  } catch (e) { sendError(res, e); }
});

router.put('/maintenance/:id', async (req, res) => {
  try {
    const b = req.body;
    await prisma.$executeRawUnsafe(
      `UPDATE maintenance SET maintenance_type = $1, description = $2, date = $3, time = $4,
        cost = $5, service_notes = $6, bill_image_uri = $7, status = $8,
        oil_change_done = $9, tyre_status_ok = $10, battery_status_ok = $11, is_breakdown_report = $12
       WHERE id = $13`,
      b.maintenanceType || '', b.description || '', b.date || '', b.time || '',
      b.cost || '', b.serviceNotes || '', b.billImageUri || null, b.status || 'draft',
      b.oilChangeDone || false, b.tyreStatusOk || false, b.batteryStatusOk || false, b.isBreakdownReport || false,
      req.params.id
    );
    sendSuccess(res, true);
  } catch (e) { sendError(res, e); }
});

export default router;
