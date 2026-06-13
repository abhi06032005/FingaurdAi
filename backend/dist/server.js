"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const app_1 = __importDefault(require("./app"));
// Handle uncaught exceptions gracefully
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});
const startServer = () => {
    const server = app_1.default.listen(env_1.env.PORT, () => {
        console.log(`🚀 Server is running on port ${env_1.env.PORT}`);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
        console.error('UNHANDLED REJECTION! 💥 Shutting down...');
        console.error(err.name, err.message, err.stack);
        server.close(() => {
            process.exit(1);
        });
    });
};
startServer();
