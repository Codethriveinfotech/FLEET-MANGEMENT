import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Prisma doesn't have an easy "updateMany" that returns the updated record, 
    // so we updateMany and check the count to ensure the user owns it.
    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });

    if (notification.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Error updating notification' });
  }
};

// Utility function to be called from other controllers
export const createNotification = async (userId: string, title: string, message: string, type: string = 'INFO') => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
