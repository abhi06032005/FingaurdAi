"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const ApiResponse_1 = require("../utils/ApiResponse");
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json(ApiResponse_1.ApiResponse.failure(err.message));
    }
    if (err instanceof zod_1.ZodError) {
        const message = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json(ApiResponse_1.ApiResponse.failure(`Validation Error: ${message}`));
    }
    console.error('Unexpected error:', err);
    return res.status(500).json(ApiResponse_1.ApiResponse.failure('Internal server error'));
};
exports.errorHandler = errorHandler;
