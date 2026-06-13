import express, { Request, Response } from 'express';
import prisma from '../config/prisma';

const router = express.Router();

// 1. Sync Clerk user to Neon DB uniquely by email
router.post('/sync', async (req: Request, res: Response): Promise<any> => {
  const { email, name } = req.body;
  const clerkUserId = (req as any).auth?.userId;

  if (!clerkUserId || !email) {
    return res.status(400).json({ error: 'Missing required clerkUserId (from token) or email' });
  }

  try {
    // Check if user already exists by clerkUserId
    let user = await prisma.user.findUnique({
      where: { clerkUserId }
    });

    if (user) {
      // Check if details are in sync
      if (user.email !== email || user.name !== name) {
        user = await prisma.user.update({
          where: { clerkUserId },
          data: { email, name: name || "" }
        });
      }
      return res.status(200).json({ success: true, data: user });
    }

    // Check if user exists by email (to associate previously created record or email invitation)
    const existingEmailUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmailUser) {
      // Bind clerkUserId to this record
      user = await prisma.user.update({
        where: { email },
        data: { clerkUserId, name: name || existingEmailUser.name }
      });
      return res.status(200).json({ success: true, data: user });
    }

    // Create a brand new user with FREE plan
    user = await prisma.user.create({
      data: {
        id: clerkUserId,
        clerkUserId,
        name: name || "",
        email,
        plan: 'FREE',
        reportsUsed: 0
      }
    });

    console.log(`[UserSync] Successfully created new user: ${email} (${clerkUserId})`);
    return res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    console.error('[UserSync] Failed to sync user:', error);
    return res.status(500).json({ error: 'Failed to sync user details', details: error.message });
  }
});

// 2. Fetch User Profile/Plans
router.get('/profile/:clerkUserId', async (req: Request, res: Response): Promise<any> => {
  // Use the requested param, but ensure they can only fetch their own profile
  const clerkUserId = req.params.clerkUserId as string;
  const authenticatedUserId = (req as any).auth?.userId;
  
  if (clerkUserId !== authenticatedUserId) {
    return res.status(403).json({ error: 'Forbidden: You can only access your own profile' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('[UserProfile] Failed to fetch profile:', error);
    return res.status(500).json({ error: 'Failed to retrieve user profile', details: error.message });
  }
});

// 3. Increment reportsUsed count
router.post('/increment-reports', async (req: Request, res: Response): Promise<any> => {
  const clerkUserId = (req as any).auth?.userId;

  if (!clerkUserId) {
    return res.status(400).json({ error: 'Missing authentication token' });
  }

  try {
    const user = await prisma.user.update({
      where: { clerkUserId },
      data: {
        reportsUsed: {
          increment: 1
        }
      }
    });

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('[UserReports] Failed to increment reports count:', error);
    return res.status(500).json({ error: 'Failed to update report usage count', details: error.message });
  }
});

// 4. Update/Upgrade plan
router.post('/update-plan', async (req: Request, res: Response): Promise<any> => {
  const { plan } = req.body;
  const clerkUserId = (req as any).auth?.userId;

  if (!clerkUserId || !plan) {
    return res.status(400).json({ error: 'Missing required authentication or plan in request body' });
  }

  const validPlans = ['FREE', 'STANDARD', 'PREMIUM'];
  const formattedPlan = plan.toUpperCase();

  if (!validPlans.includes(formattedPlan)) {
    return res.status(400).json({ error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` });
  }

  try {
    const user = await prisma.user.update({
      where: { clerkUserId },
      data: {
        plan: formattedPlan,
        // Reset reports limit upon upgrading/changing plans
        reportsUsed: 0
      }
    });

    console.log(`[UserPlan] Upgraded user ${clerkUserId} to ${formattedPlan}`);
    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('[UserPlan] Failed to update user plan:', error);
    return res.status(500).json({ error: 'Failed to update plan', details: error.message });
  }
});

export default router;
