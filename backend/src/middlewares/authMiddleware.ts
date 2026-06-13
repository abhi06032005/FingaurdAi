import { requireAuth } from '@clerk/express';

// Middleware to protect routes. It will throw an error if the user is not authenticated.
// The error will be caught by the global error handler.
export const authenticate = requireAuth();
