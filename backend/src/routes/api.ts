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
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    sendSuccess(res, vehicles.map(mapVehicle));
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
router.get('/trips', async (req, res) => {
  try {
    const trips = await prisma.driverLog.findMany({ orderBy: { startTime: 'desc' } });
    sendSuccess(res, trips.map(mapTrip));
  } catch (e) { sendError(res, e); }
});

router.get('/trips/my', async (req, res) => {
  try {
    const trips = await prisma.driverLog.findMany({ orderBy: { startTime: 'desc' } });
    sendSuccess(res, trips.map(mapTrip));
  } catch (e) { sendError(res, e); }
});

router.get('/trips/:id', async (req, res) => {
  try {
    const trip = await prisma.driverLog.findUnique({ where: { id: req.params.id } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    sendSuccess(res, mapTrip(trip));
  } catch (e) { sendError(res, e); }
});

router.post('/trips', async (req, res) => {
  try {
    const trip = await prisma.driverLog.create({ data: req.body });
    sendSuccess(res, trip);
  } catch (e) { sendError(res, e); }
});

router.put('/trips/:id', async (req, res) => {
  try {
    const trip = await prisma.driverLog.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, true);
  } catch (e) { sendError(res, e); }
});

router.delete('/trips/:id', async (req, res) => {
  try {
    await prisma.driverLog.delete({ where: { id: req.params.id } });
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
