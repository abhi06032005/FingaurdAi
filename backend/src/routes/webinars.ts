import express, { Request, Response } from 'express';
import prisma from '../config/prisma';

const router = express.Router();

// Helper to check if a user is Premium
const checkUserPremium = async (userId: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    return !!(user?.isPremium || user?.plan === 'PREMIUM');
  } catch (error) {
    console.error('[Webinars] Error checking premium status:', error);
    return false;
  }
};

// 1. GET / — Fetch all webinars with registration status for current user
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const userId = (req as any).auth?.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user authentication' });
  }

  try {
    const webinars = await prisma.webinar.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        registrations: {
          where: { userId }
        }
      }
    });

    const isPremiumUser = await checkUserPremium(userId);

    // Map response: hide direct zoomLink in listing for security, flag registered status
    const data = webinars.map(w => {
      const isRegistered = w.registrations.length > 0;
      const { zoomLink, registrations, ...rest } = w;

      // Determine active join state
      const now = new Date();
      const startTimeWithBuffer = new Date(w.startTime.getTime() - 10 * 60 * 1000); // 10 minutes buffer
      const isLive = now >= startTimeWithBuffer && now <= w.endTime;

      return {
        ...rest,
        isRegistered,
        isLive,
        isAccessible: w.type === 'FREE' || isPremiumUser
      };
    });

    return res.status(200).json({ success: true, webinars: data });
  } catch (error: any) {
    console.error('[Webinars] Failed to fetch webinars:', error);
    return res.status(500).json({ error: 'Failed to retrieve webinars', details: error.message });
  }
});

// 2. POST /:id/register — Register user for a webinar (Free or Premium)
router.post('/:id/register', async (req: Request, res: Response): Promise<any> => {
  const webinarId = req.params.id;
  const userId = (req as any).auth?.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user authentication' });
  }

  try {
    // 1. Fetch webinar
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId as string }
    });

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    // 2. Access control check for PREMIUM webinars
    if (webinar.type === 'PREMIUM') {
      const isPremiumUser = await checkUserPremium(userId);
      if (!isPremiumUser) {
        return res.status(403).json({
          error: 'Upgrade required',
          message: 'Premium membership is required to register for this webinar event.'
        });
      }
    }

    // 3. Upsert / create registration
    const registration = await prisma.webinarRegistration.upsert({
      where: {
        webinarId_userId: {
          webinarId: webinarId as string,
          userId
        }
      },
      update: {},
      create: {
        webinarId: webinarId as string,
        userId
      }
    });

    console.log(`[Webinars] Registered user ${userId} for webinar ${webinarId}`);
    return res.status(200).json({ success: true, data: registration });
  } catch (error: any) {
    console.error('[Webinars] Failed to register user:', error);
    return res.status(500).json({ error: 'Failed to register for webinar', details: error.message });
  }
});

// 3. DELETE /:id/unregister — Unregister user from a webinar
router.delete('/:id/unregister', async (req: Request, res: Response): Promise<any> => {
  const webinarId = req.params.id;
  const userId = (req as any).auth?.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user authentication' });
  }

  try {
    await prisma.webinarRegistration.delete({
      where: {
        webinarId_userId: {
          webinarId: webinarId as string,
          userId
        }
      }
    });

    console.log(`[Webinars] Unregistered user ${userId} from webinar ${webinarId}`);
    return res.status(200).json({ success: true, message: 'Successfully unregistered from webinar event' });
  } catch (error: any) {
    console.error('[Webinars] Failed to unregister user:', error);
    return res.status(500).json({ error: 'Failed to unregister from webinar', details: error.message });
  }
});

// 4. GET /:id/join — Fetch Zoom link securely when event is active
router.get('/:id/join', async (req: Request, res: Response): Promise<any> => {
  const webinarId = req.params.id;
  const userId = (req as any).auth?.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user authentication' });
  }

  try {
    // 1. Fetch webinar and verify registration
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId as string },
      include: {
        registrations: {
          where: { userId }
        }
      }
    });

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    if (webinar.registrations.length === 0) {
      return res.status(403).json({ error: 'Registration required', message: 'You must be registered to join this webinar.' });
    }

    // 2. Premium membership verification for premium events
    if (webinar.type === 'PREMIUM') {
      const isPremiumUser = await checkUserPremium(userId);
      if (!isPremiumUser) {
        return res.status(403).json({ error: 'Premium required', message: 'Premium membership is required to join this webinar.' });
      }
    }

    // 3. Time constraint check (starts 10 mins before, ends at endTime)
    const now = new Date();
    const startTimeWithBuffer = new Date(webinar.startTime.getTime() - 10 * 60 * 1000); // 10 minutes buffer
    const isLive = now >= startTimeWithBuffer && now <= webinar.endTime;

    if (!isLive) {
      return res.status(403).json({
        error: 'Webinar not live',
        message: `The webinar is not live. You can join starting 10 minutes before the session starts at ${webinar.startTime.toLocaleTimeString()}.`
      });
    }

    return res.status(200).json({ success: true, zoomLink: webinar.zoomLink });
  } catch (error: any) {
    console.error('[Webinars] Failed to get zoom link:', error);
    return res.status(500).json({ error: 'Failed to fetch join link', details: error.message });
  }
});

export default router;
