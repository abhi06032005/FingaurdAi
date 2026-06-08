"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(data) {
        return {
            success: true,
            data,
        };
    }
    static failure(message) {
        return {
            success: false,
            message,
        };
    }
}
exports.ApiResponse = ApiResponse;
