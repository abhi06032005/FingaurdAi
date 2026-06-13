"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const express_1 = require("@clerk/express");
// Middleware to protect routes. It will throw an error if the user is not authenticated.
// The error will be caught by the global error handler.
exports.authenticate = (0, express_1.requireAuth)();
