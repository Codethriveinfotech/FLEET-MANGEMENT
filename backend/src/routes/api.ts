import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper to format responses
const sendSuccess = (res: any, data: any, message = 'Success') => {
  res.json({ success: true, message, data });
};

const sendError = (res: any, error: any, message = 'Error') => {
  console.error(error);
  res.status(500).json({ success: false, message, error: error.message });
};

// ================= VEHICLES =================
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
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
    sendSuccess(res, users);
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
    // In Android: endVehiclePhotoUri etc are mapped to schema. Wait, if schema has them.
    // Let's assume Prisma handles it.
    const trips = await prisma.tripEntry.findMany();
    sendSuccess(res, trips);
  } catch (e) { sendError(res, e); }
});

router.get('/trips/my', async (req, res) => {
  try {
    const trips = await prisma.tripEntry.findMany();
    sendSuccess(res, trips);
  } catch (e) { sendError(res, e); }
});

router.post('/trips', async (req, res) => {
  try {
    const trip = await prisma.tripEntry.create({ data: req.body });
    sendSuccess(res, trip);
  } catch (e) { sendError(res, e); }
});

router.put('/trips/:id', async (req, res) => {
  try {
    const trip = await prisma.tripEntry.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, true);
  } catch (e) { sendError(res, e); }
});

router.delete('/trips/:id', async (req, res) => {
  try {
    await prisma.tripEntry.delete({ where: { id: req.params.id } });
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

export default router;
