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
const newsRoutes_1 = __importDefault(require("./routes/newsRoutes"));
const aiReports_1 = __importDefault(require("./routes/aiReports"));
const stocksRoutes_1 = __importDefault(require("./routes/stocksRoutes"));
const users_1 = __importDefault(require("./routes/users"));
const payments_1 = __importDefault(require("./routes/payments"));
const cronService_1 = require("./services/cronService");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authMiddleware_1 = require("./middlewares/authMiddleware");
const app = (0, express_1.default)();
// Connect to MongoDB
if (process.env.MONGO_URI) {
    mongoose_1.default.connect(process.env.MONGO_URI)
        .then(() => {
        console.log('[app] Connected to MongoDB for Stock Data');
        // Initialize background news fetch & cleanup cron tasks once database is connected
        (0, cronService_1.initCronJobs)();
    })
        .catch(err => console.error('[app] MongoDB connection error:', err));
}
else {
    console.warn('[app] MONGO_URI not found in environment variables. Stock DB will not connect.');
}
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Global Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(limiter);
// Webhooks (supporting both /webhooks/apify and root /apify for compatibility)
app.use('/webhooks', webhooks_1.default);
app.use('/', webhooks_1.default);
app.use(express_1.default.json());
// Mount protected routes with authenticate middleware
app.use('/admin', authMiddleware_1.authenticate, admin_1.default);
app.use('/trades', authMiddleware_1.authenticate, trades_1.default);
app.use('/api/news', newsRoutes_1.default); // Public or protect if needed
app.use('/api/ai-reports', aiReports_1.default);
app.use('/api/stocks', stocksRoutes_1.default); // Usually public
app.use('/api/users', authMiddleware_1.authenticate, users_1.default);
app.use('/api/payments', authMiddleware_1.authenticate, payments_1.default);
// Global Error Handler (MUST BE LAST)
app.use(errorHandler_1.errorHandler);
exports.default = app;
