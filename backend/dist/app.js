"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler_1 = require("./middlewares/errorHandler");
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const admin_1 = __importDefault(require("./routes/admin"));
const trades_1 = __importDefault(require("./routes/trades"));
const app = (0, express_1.default)();
// Connect to MongoDB
if (process.env.MONGO_URI) {
    mongoose_1.default.connect(process.env.MONGO_URI)
        .then(() => console.log('[app] Connected to MongoDB for Stock Data'))
        .catch(err => console.error('[app] MongoDB connection error:', err));
}
else {
    console.warn('[app] MONGO_URI not found in environment variables. Stock DB will not connect.');
}
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Webhooks
app.use('/webhooks', webhooks_1.default);
app.use(express_1.default.json());
// Mount admin routes
app.use('/admin', admin_1.default);
app.use('/trades', trades_1.default);
// Global Error Handler (MUST BE LAST)
app.use(errorHandler_1.errorHandler);
exports.default = app;
