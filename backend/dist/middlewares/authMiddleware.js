"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const express_1 = require("@clerk/express");
// Middleware to protect routes. It will verify token authentication using getAuth.
// The auth context is attached to the request under the auth key.
const authenticate = (req, res, next) => {
    try {
        const auth = (0, express_1.getAuth)(req);
        if (!auth || !auth.userId) {
            return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token' });
        }
        // Attach authentication context to request object
        req.auth = auth;
        next();
    }
    catch (error) {
        console.error('[authMiddleware] Authentication failure:', error);
        return res.status(401).json({ error: 'Unauthorized: Unable to authenticate request', details: error.message });
    }
};
exports.authenticate = authenticate;
