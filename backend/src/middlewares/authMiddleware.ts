import { getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';

// Middleware to protect routes. It will verify token authentication using getAuth.
// The auth context is attached to the request under the auth key.
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token' });
    }
    // Attach authentication context to request object
    (req as any).auth = auth;
    next();
  } catch (error: any) {
    console.error('[authMiddleware] Authentication failure:', error);
    return res.status(401).json({ error: 'Unauthorized: Unable to authenticate request', details: error.message });
  }
};

