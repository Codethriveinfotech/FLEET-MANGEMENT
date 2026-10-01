import { Router } from 'express';
import prisma from '../config/db';

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
      startDate: t.start_date,
      startTime: t.start_time,
      endDate: t.end_date || null,
      endTime: t.end_time || null,
      startOdometer: t.start_odometer,
      endOdometer: t.end_odometer || null,
      startHmr: t.start_hmr,
      endHmr: t.end_hmr || null,
      sourceLocation: t.source_location,
      destinationLocation: t.destination_location,
      notes: t.notes,
      status: t.status,
      shift: t.shift,
      day: t.day,
      tripPurpose: t.trip_purpose,
      startOdometerPhotoUri: t.start_odometer_photo_uri,
      startVehiclePlatePhotoUri: t.start_vehicle_plate_photo_uri,
      endOdometerPhotoUri: t.end_odometer_photo_uri,
      sheetPhotoUri: t.sheet_photo_uri,
    }));
    sendSuccess(res, trips);
  } catch (e) { sendError(res, e); }
});

router.get('/trips/my', async (req, res) => {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM trips ORDER BY start_date DESC, start_time DESC`
    );
    const trips = rows.map((t: any) => ({
      id: t.id,
      driverId: t.driver_id,
      vehicleId: t.vehicle_id,
      startDate: t.start_date,
      startTime: t.start_time,
      endDate: t.end_date || null,
      endTime: t.end_time || null,
      startOdometer: t.start_odometer,
      endOdometer: t.end_odometer || null,
      startHmr: t.start_hmr,
      endHmr: t.end_hmr || null,
      sourceLocation: t.source_location,
      destinationLocation: t.destination_location,
      notes: t.notes,
      status: t.status,
      shift: t.shift,
      day: t.day,
      tripPurpose: t.trip_purpose,
      startOdometerPhotoUri: t.start_odometer_photo_uri,
      startVehiclePlatePhotoUri: t.start_vehicle_plate_photo_uri,
      endOdometerPhotoUri: t.end_odometer_photo_uri,
      sheetPhotoUri: t.sheet_photo_uri,
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
      startDate: t.start_date,
      startTime: t.start_time,
      endDate: t.end_date || null,
      endTime: t.end_time || null,
      startOdometer: t.start_odometer,
      endOdometer: t.end_odometer || null,
      startHmr: t.start_hmr,
      endHmr: t.end_hmr || null,
      sourceLocation: t.source_location,
      destinationLocation: t.destination_location,
      notes: t.notes,
      status: t.status,
      shift: t.shift,
      day: t.day,
      tripPurpose: t.trip_purpose,
      startOdometerPhotoUri: t.start_odometer_photo_uri,
      startVehiclePlatePhotoUri: t.start_vehicle_plate_photo_uri,
      endOdometerPhotoUri: t.end_odometer_photo_uri,
      sheetPhotoUri: t.sheet_photo_uri,
    });
  } catch (e) { sendError(res, e); }
});

router.put('/trips/:id', async (req, res) => {
  try {
    await prisma.$executeRawUnsafe(`UPDATE trips SET status = $1 WHERE id = $2`, req.body.status || 'submitted', req.params.id);
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

export default router;
