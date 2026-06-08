"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const user_repository_1 = require("../repositories/user.repository");
const AppError_1 = require("../utils/AppError");
class AuthController {
    static async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            res.status(201).json(ApiResponse_1.ApiResponse.success(result));
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            res.status(200).json(ApiResponse_1.ApiResponse.success(result));
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            // For JWT, logout is typically handled client-side by deleting the token.
            // If we implement refresh tokens/blacklisting later, handle it here.
            res.status(200).json(ApiResponse_1.ApiResponse.success({ message: 'Logged out successfully' }));
        }
        catch (error) {
            next(error);
        }
    }
    static async getMe(req, res, next) {
        try {
            const userId = req.user.id;
            const user = await user_repository_1.UserRepository.findById(userId);
            if (!user)
                throw new AppError_1.AppError('User not found', 404);
            const { password, ...userWithoutPassword } = user;
            res.status(200).json(ApiResponse_1.ApiResponse.success({ user: userWithoutPassword }));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
