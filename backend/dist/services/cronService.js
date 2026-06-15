"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const payments_1 = require("../routes/payments");
/**
 * Initializes and starts all scheduled background cron jobs.
 */
function initCronJobs() {
    console.log('[CronService] Initializing scheduled tasks...');
    // 3. Reconcile pending payments every 5 minutes
    // Pattern: '*/5 * * * *' (every 5 minutes)
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        console.log('[CronService] Executing scheduled payments reconciliation...');
        try {
            await (0, payments_1.reconcilePendingPayments)();
        }
        catch (err) {
            console.error('[CronService] Cron payments reconciliation failed:', err.message);
        }
    });
    // Run cleanup, sync, and payment reconciliation on startup to ensure fresh data
    (async () => {
        try {
            console.log('[CronService] Executing startup payment reconciliation...');
            await (0, payments_1.reconcilePendingPayments)();
        }
        catch (err) {
            console.error('[CronService] Startup tasks failed:', err.message);
        }
    })();
}
